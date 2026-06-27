import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  lazy,
  useTransition,
} from "react";
import { useTranslation } from "react-i18next";

// --- LAZY LOADED COMPONENTS ---
// Note: Using .then() to handle named exports from your files
import type { Exercise } from "@/types/exercise";
import type { Page } from "@/types/navigation";
import type {
  ExerciseSetRow,
  FinishedWorkoutSummary,
  SavedProgram,
  TrainingDay,
} from "@/types/workout";
import type { SwapDurationOption } from "@spinefit/shared";
import {
  getPlan,
  getPlanId,
  getPlanSettings,
  hasPlan,
  savePlan,
  fetchPlan,
  resetLocalCache,
} from "@/lib/planService";
import * as workoutHistoryService from "@/lib/workoutHistoryService";
import * as completedWorkoutsService from "@/lib/completedWorkoutsService";
import * as activeWorkoutService from "@/lib/activeWorkoutService";
import type { PersistedActiveWorkout } from "@/storage/activeWorkoutStorage";
import { getNextAvailableWorkout } from "@/utils/workoutQueueManager";
import { getSelectedDayIndex } from "@/storage/selectedDayStorage";
import { copyPlannedSets } from "@/storage/plannedSetsStorage";
import {
  loadActiveWorkout,
  saveActiveWorkout,
  clearActiveWorkout,
  touchActiveWorkoutHeartbeat,
  HEARTBEAT_MS,
} from "@/storage/activeWorkoutStorage";
import "@/utils/testWorkoutHistoryGenerator";
import { trackPageView, trackEvent } from "@/utils/analytics";
import { PageLoader } from "@/components/ui/PageLoader";
import { Toast } from "@/components/ui/Toast";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary/ChunkErrorBoundary";
import { InstallPrompt } from "@/components/InstallPrompt/InstallPrompt";
import { CHUNK_RELOAD_KEY } from "@/constants/chunkReload";
import { useAuth } from "@/hooks/useAuth";
import { retryPendingQuizSync } from "@/lib/quizStorage";
import {
  OAUTH_IN_PROGRESS_KEY,
  GOOGLE_LOGIN_NO_ACCOUNT_KEY,
  GOOGLE_REGISTER_EXISTS_KEY,
  isFreshlyCreatedUser,
  signOut,
  deleteCurrentUserViaEdgeFunction,
} from "@/lib/authService";

const PUBLIC_PAGES: Page[] = ["home", "login", "register", "resetPassword"];

// Pages an authenticated user gets bounced off of after the post-auth route is
// resolved (to /workout, or /home if they have no plan yet). resetPassword is
// deliberately excluded — that flow must run to completion.
const LANDING_PAGES: Page[] = ["home", "login", "register"];

// --- LAZY LOADED COMPONENTS ---
// Note: Using .then() to handle named exports from your files
const HomePage = lazy(() => import("@/pages/HomePage/HomePage"));

const Registration = lazy(
  () => import("@/pages/RegistrationPage/Registration")
);
const Login = lazy(() => import("@/pages/LoginPage/Login"));
const ResetPasswordPage = lazy(
  () => import("@/pages/ResetPasswordPage/ResetPasswordPage")
);
const WorkoutPage = lazy(() => import("@/pages/WorkoutPage/WorkoutPage"));
const ProgressPage = lazy(() => import("@/pages/ProgressPage/ProgressPage"));
const ExerciseSetsPage = lazy(
  () => import("@/pages/WorkoutPage/ExerciseSetsPage")
);
const ExerciseDetails = lazy(() => import("@/pages/WorkoutPage/ExerciseHowTo"));
const ActiveWorkoutPage = lazy(
  () => import("@/pages/WorkoutPage/ActiveWorkoutPage")
);
const HistoryPage = lazy(() => import("@/pages/HistoryPage/HistoryPage"));
const AllExercisePage = lazy(
  () => import("@/pages/AllExercisePage/AllExercisePage")
);
const MyPlanPage = lazy(() => import("@/pages/MyPlanPage/MyPlanPage"));
const AvailableEquipmentPage = lazy(
  () => import("@/pages/MyPlanPage/AvailableEquipmentPage")
);
const ProfilePage = lazy(() => import("@/pages/ProfilePage/ProfilePage"));
const AIPage = lazy(() => import("@/pages/AIPage/AIPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage/SettingsPage"));
const CreateProgramPage = lazy(
  () => import("@/pages/CreateWorkoutPage/CreateWorkoutPage")
);
const ExerciseProgressPage = lazy(
  () => import("@/pages/ProgressPage/ExerciseProgressPage")
);
const GeneratingPlanPage = lazy(
  () => import("@/pages/GeneratingPlanPage/GeneratingPlanPage")
);

const PAGE_TO_PATH: Record<Page, string> = {
  home: "/",
  login: "/login",
  register: "/register",
  workout: "/workout",
  progress: "/progress",
  history: "/history",
  profile: "/profile",
  ai: "/ai",
  exerciseSets: "/workout/exercise-sets",
  exerciseDetails: "/workout/exercise-details",
  activeWorkout: "/workout/active",
  allExercise: "/exercises",
  myPlan: "/my-plan",
  availableEquipment: "/my-plan/equipment",
  settings: "/settings",
  createProgram: "/create-program",
  exerciseProgress: "/progress/exercise",
  generatingPlan: "/generating-plan",
  resetPassword: "/reset-password",
};

const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page as Page])
) as Record<string, Page>;

function App() {
  const auth = useAuth();
  const { t } = useTranslation();
  const [isPagePending, startPageTransition] = useTransition();
  const [autoOpenQuiz, setAutoOpenQuiz] = useState(false);

  // App-level toast: lives above renderPage() so a message triggered right
  // before navigation (plan-generation failures) stays visible on the
  // destination page. showToast clears any pending timer before re-arming so
  // rapid back-to-back toasts don't dismiss each other early.
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback(
    (message: string, variant: "success" | "error") => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast({ message, variant });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, 4000);
    },
    []
  );
  useEffect(
    () => () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    },
    []
  );
  const [oauthError] = useState<string | null>(() => {
    // Surface ?error=... or #error=... that Supabase / Google may bounce back
    // with after a failed OAuth, otherwise the user just lands silently on
    // home and thinks the click did nothing.
    if (typeof window === "undefined") return null;
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(
      window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash
    );
    const err =
      search.get("error_description") ??
      search.get("error") ??
      hash.get("error_description") ??
      hash.get("error");
    if (err) {
      const cleaned = new URL(window.location.href);
      cleaned.searchParams.delete("error");
      cleaned.searchParams.delete("error_description");
      cleaned.searchParams.delete("error_code");
      cleaned.hash = "";
      window.history.replaceState({}, "", cleaned.toString());
      return decodeURIComponent(err.replace(/\+/g, " "));
    }
    return null;
  });
  // Read any in-progress workout from localStorage exactly once, so a reload /
  // tab close / device shutdown returns the user where they left off.
  const [restoredWorkout] = useState(() => loadActiveWorkout());

  // Cross-device sync gating: we don't push to Supabase until we've reconciled
  // local against remote once for this session. Without that, a fresh login on
  // device B would immediately overwrite remote with stale local from device A.
  // The ref mirrors the state so async callbacks (onFocus) read the live value.
  const [reconciledOnce, setReconciledOnce] = useState(false);
  const reconciledOnceRef = useRef(false);
  // Digest of the last content pushed to Supabase. Lets the save effect skip
  // pure timestamp-bump re-pushes that would otherwise cycle on every focus
  // after a hydrate-from-remote.
  const lastSyncedDigestRef = useRef<string | null>(null);

  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const validPages: Page[] = [
      "home",
      "login",
      "register",
      "workout",
      "progress",
      "exerciseSets",
      "exerciseDetails",
      "activeWorkout",
      "history",
      "profile",
      "ai",
      "allExercise",
      "myPlan",
      "availableEquipment",
      "settings",
      "createProgram",
      "exerciseProgress",
      "generatingPlan",
      "resetPassword",
    ];
    // An in-progress workout always wins: navigateToActiveWorkout never
    // syncs the URL, so a reload would otherwise resolve to /workout and
    // strand the user. Resume exactly where they left off.
    if (restoredWorkout) {
      return "activeWorkout";
    }
    const pageFromPath = PATH_TO_PAGE[window.location.pathname] as
      | Page
      | undefined;
    const resolvedPage =
      pageFromPath ??
      (localStorage.getItem("currentPage") as Page | null) ??
      "home";
    const validResolved = validPages.includes(resolvedPage)
      ? resolvedPage
      : "home";
    // Don't strand the user on an empty active workout if the session is gone
    // (finished, discarded, or aged out as stale).
    if (validResolved === "activeWorkout" && !restoredWorkout) {
      return "workout";
    }
    // A returning user with a locally-cached plan resumes straight on the
    // workout page instead of flashing a landing page and then redirecting once
    // the network fetchPlan() resolves. hasPlan() is now synchronously truthy
    // because the plan is hydrated from localStorage on module load. The auth
    // gating effect still bounces them to /login if the session turns out to be
    // gone, and fetchPlan() refreshes the (possibly stale) cached plan in place.
    if (LANDING_PAGES.includes(validResolved) && hasPlan()) {
      return "workout";
    }
    return validResolved;
  });

  // Keeps a single loader up while the post-auth destination is being resolved,
  // instead of painting a landing page (home/login) and then redirecting to
  // /workout once the session + plan load — which reads as a
  // home→loader→workout flicker, most visibly after a Google OAuth round-trip
  // (which reloads the app on "/"). Initialized from the OAuth marker so the
  // very first authenticated render is already gated; the in-app email login
  // path arms it from the auth effect below. Cleared once the route resolves.
  const [resolvingAuthRoute, setResolvingAuthRoute] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem(OAUTH_IN_PROGRESS_KEY) !== null &&
      LANDING_PAGES.includes(currentPage)
    );
  });

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [exerciseSetsMode, setExerciseSetsMode] = useState<
    "preWorkout" | "activeWorkout"
  >("preWorkout");
  const [exerciseSetsOrigin, setExerciseSetsOrigin] = useState<
    "workout" | "activeWorkout"
  >("workout");
  const [exerciseDetailsOrigin, setExerciseDetailsOrigin] = useState<
    "workout" | "activeWorkout"
  >("workout");
  const [completedExerciseIds, setCompletedExerciseIds] = useState<number[]>(
    () => restoredWorkout?.completedExerciseIds ?? []
  );
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(
    () => restoredWorkout?.workoutStartTime ?? null
  );
  const [exerciseLogs, setExerciseLogs] = useState<
    Record<number, ExerciseSetRow[]>
  >(() => restoredWorkout?.exerciseLogs ?? {});
  const [exercisePainLevels, setExercisePainLevels] = useState<
    Record<number, number>
  >(() => restoredWorkout?.exercisePainLevels ?? {});
  // Legacy field, kept only for storage/Supabase round-trip compatibility.
  // The logged duration & calories now use real wall-clock time, so this is no
  // longer subtracted from anything — we simply preserve whatever was persisted.
  const [pausedSeconds, setPausedSeconds] = useState<number>(
    () => restoredWorkout?.pausedSeconds ?? 0
  );

  const [workoutHistory, setWorkoutHistory] = useState<
    FinishedWorkoutSummary[]
  >(() => workoutHistoryService.getHistory());

  useEffect(() => {
    return workoutHistoryService.subscribe(() => {
      setWorkoutHistory(workoutHistoryService.getHistory());
    });
  }, []);

  // App mounted successfully → clear the stale-chunk reload guard so a future
  // redeploy is allowed to trigger its own one-time recovery reload.
  useEffect(() => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  }, []);

  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>(() => {
    const savedExercises = localStorage.getItem("workoutExercises");
    if (!savedExercises) return [];
    try {
      const parsed = JSON.parse(savedExercises);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [completedWorkoutIds, setCompletedWorkoutIdsState] = useState<
    Set<string>
  >(() => completedWorkoutsService.getIds());

  useEffect(() => {
    return completedWorkoutsService.subscribe(() => {
      setCompletedWorkoutIdsState(completedWorkoutsService.getIds());
    });
  }, []);

  const setCompletedWorkoutIds = (ids: Set<string>) => {
    completedWorkoutsService.setIds(ids);
  };

  const [createProgramDays, setCreateProgramDays] = useState<TrainingDay[]>([]);
  const [createProgramName, setCreateProgramName] = useState("");
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [allExerciseReturnPage, setAllExerciseReturnPage] = useState<
    "workout" | "createProgram" | "activeWorkout"
  >("workout");
  const [isCustomWorkoutMode, setIsCustomWorkoutMode] = useState(
    () => restoredWorkout?.isCustomWorkout ?? false
  );
  const [editingProgramId, setEditingProgramId] = useState<
    string | undefined
  >();
  const [selectedExerciseProgressId, setSelectedExerciseProgressId] = useState<
    number | null
  >(null);

  // Sync history.state with the resolved page so popstate handlers work.
  // Do NOT pass a URL: that would strip OAuth callback query params
  // (?code=...) before Supabase's detectSessionInUrl can exchange them for a
  // session. Supabase cleans up the URL itself after a successful exchange.
  useEffect(() => {
    window.history.replaceState({ page: currentPage }, "");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as {
        page: Page;
        exercise?: Exercise;
        mode?: "preWorkout" | "activeWorkout";
        exerciseId?: number;
      } | null;
      if (!state?.page) return;

      setSelectedExercise(state.exercise ?? null);
      if (state.mode) setExerciseSetsMode(state.mode);
      setSelectedExerciseProgressId(state.exerciseId ?? null);

      startPageTransition(() => setCurrentPage(state.page));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Mirrors `currentPage` into a ref so async callbacks (reconcile after
  // fetchRemote) can branch on the live page without stale closure data.
  const currentPageRef = useRef<Page>(currentPage);
  useEffect(() => {
    currentPageRef.current = currentPage;
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  // Auth gating: redirect unauthenticated users away from protected pages
  useEffect(() => {
    if (auth.status !== "unauthenticated") return;
    if (PUBLIC_PAGES.includes(currentPage)) return;
    window.history.replaceState({ page: "login" }, "", PAGE_TO_PATH["login"]);
    startPageTransition(() => setCurrentPage("login"));
  }, [auth.status, currentPage, startPageTransition]);

  // Retry any pending quiz sync whenever the user becomes authenticated
  const authUserId = auth.status === "authenticated" ? auth.user.id : null;
  useEffect(() => {
    if (!authUserId) return;
    retryPendingQuizSync(authUserId);
  }, [authUserId]);

  // Fetch plan from Supabase when user becomes authenticated and on window focus.
  // On logout, clear the in-memory cache so another user on the same device
  // cannot see the previous user's plan.
  const initialRedirectDoneRef = useRef(false);
  useEffect(() => {
    if (auth.status === "unauthenticated") {
      resetLocalCache();
      workoutHistoryService.resetLocalCache();
      completedWorkoutsService.resetLocalCache();
      activeWorkoutService.resetLocalCache();
      // Force next reconcile to run from scratch when a new user signs in on
      // the same device — otherwise the gate would already be open and we'd
      // push the previous user's local state.
      reconciledOnceRef.current = false;
      setReconciledOnce(false);
      lastSyncedDigestRef.current = null;
      initialRedirectDoneRef.current = false;
      // A subsequent login on the same device must re-arm the loader gate from
      // scratch, so drop any leftover "resolving" state here.
      setResolvingAuthRoute(false);
      return;
    }
    if (auth.status !== "authenticated") return;
    const oauthUser = auth.user;

    // Arm the post-auth loader gate for an in-session email/password login, so
    // the user sees one continuous loader through to /workout instead of the
    // login page lingering and then flicking over. The OAuth path already armed
    // it during the initial render via the OAUTH_IN_PROGRESS marker.
    //
    // Deliberately scoped to the login page only — NOT "home". The home page can
    // have the onboarding QuizModal open (email sign-up happens inside it via
    // "Get my plan"), and that flow drives its own navigation to
    // GeneratingPlanPage. Gating home here would swap it for a full-screen
    // loader, unmount the quiz mid-submit, and strand the just-registered user
    // back on home. A no-plan user resolves to "home" anyway, so there is
    // nothing to hide.
    if (
      !initialRedirectDoneRef.current &&
      currentPageRef.current === "login"
    ) {
      setResolvingAuthRoute(true);
    }

    let cancelled = false;

    const digestOfActiveWorkout = (state: PersistedActiveWorkout): string =>
      JSON.stringify({
        workoutStartTime: state.workoutStartTime,
        workoutExercises: state.workoutExercises,
        completedExerciseIds: state.completedExerciseIds,
        exerciseLogs: state.exerciseLogs,
        exercisePainLevels: state.exercisePainLevels,
        isCustomWorkout: state.isCustomWorkout,
        pausedSeconds: state.pausedSeconds,
      });

    const markReconciled = () => {
      reconciledOnceRef.current = true;
      setReconciledOnce(true);
    };

    const hydrateActiveWorkout = (remote: PersistedActiveWorkout): void => {
      // Persist with remote's savedAt/lastActiveAt so future reconciles compare
      // on equal footing (otherwise local would always look newer by ~ms).
      saveActiveWorkout({
        workoutStartTime: remote.workoutStartTime,
        workoutExercises: remote.workoutExercises,
        completedExerciseIds: remote.completedExerciseIds,
        exerciseLogs: remote.exerciseLogs,
        exercisePainLevels: remote.exercisePainLevels,
        isCustomWorkout: remote.isCustomWorkout,
        pausedSeconds: remote.pausedSeconds,
        lastActiveAt: remote.lastActiveAt,
        savedAt: remote.savedAt,
      });
      // Block the upcoming save effect from re-pushing this content back.
      lastSyncedDigestRef.current = digestOfActiveWorkout(remote);
      setWorkoutStartTime(remote.workoutStartTime);
      setWorkoutExercises(remote.workoutExercises);
      setCompletedExerciseIds(remote.completedExerciseIds);
      setExerciseLogs(remote.exerciseLogs);
      setExercisePainLevels(remote.exercisePainLevels);
      setPausedSeconds(remote.pausedSeconds);
      setIsCustomWorkoutMode(remote.isCustomWorkout);
      if (currentPageRef.current !== "activeWorkout") {
        window.history.pushState(
          { page: "activeWorkout" },
          "",
          PAGE_TO_PATH["activeWorkout"]
        );
        startPageTransition(() => setCurrentPage("activeWorkout"));
      }
    };

    const reconcileActiveWorkout = (
      result: activeWorkoutService.FetchRemoteResult
    ): void => {
      if (result.kind !== "ok") return; // skip / error → next focus retries
      const remote = result.remote;
      const local = loadActiveWorkout();
      const wasReconciled = reconciledOnceRef.current;

      if (!local && !remote) {
        markReconciled();
        return;
      }
      if (!local && remote) {
        hydrateActiveWorkout(remote);
        markReconciled();
        return;
      }
      if (local && !remote) {
        // Heartbeat ticks every HEARTBEAT_MS while a workout is active. A
        // recent lastActiveAt means the user is *still training on this
        // device* — so a remote=null isn't "the other device finished us",
        // it's a conflict. In that case re-push local instead of yanking
        // the live session away from the user.
        const localIsLive =
          Date.now() - local.lastActiveAt < HEARTBEAT_MS * 3;
        if (wasReconciled && !localIsLive) {
          // Local is stale (no heartbeat) and remote is gone → another
          // device finished/discarded the session. Mirror that locally.
          resetWorkoutState({ skipRemoteDelete: true });
        } else {
          // Either the first reconcile of the session (no remote row yet),
          // or local is actively training — push local up so the other
          // device picks it up next focus.
          activeWorkoutService.upsertRemote(local);
          void activeWorkoutService.flushPendingUpsert();
          lastSyncedDigestRef.current = digestOfActiveWorkout(local);
        }
        markReconciled();
        return;
      }
      // Both exist — last-writer-wins by savedAt (which maps to remote.updated_at).
      if (remote && local && remote.savedAt > local.savedAt) {
        hydrateActiveWorkout(remote);
      } else if (remote && local && local.savedAt > remote.savedAt) {
        activeWorkoutService.upsertRemote(local);
        void activeWorkoutService.flushPendingUpsert();
        lastSyncedDigestRef.current = digestOfActiveWorkout(local);
      }
      markReconciled();
    };

    const refetch = async () => {
      const [, , , activeResult] = await Promise.all([
        fetchPlan(),
        workoutHistoryService.fetchHistory(),
        completedWorkoutsService.fetchIds(),
        activeWorkoutService.fetchRemote(),
      ]);
      if (cancelled) return;
      reconcileActiveWorkout(activeResult);

      if (!initialRedirectDoneRef.current) {
        initialRedirectDoneRef.current = true;

        const oauthInProgress = localStorage.getItem(OAUTH_IN_PROGRESS_KEY);
        if (oauthInProgress) {
          // The user just returned from a Google OAuth round-trip. Always lands
          // on "/" because redirectTo == window.location.origin.
          localStorage.removeItem(OAUTH_IN_PROGRESS_KEY);

          // Supabase's OAuth sign-in silently creates an account when none
          // exists. If this round-trip was started from the Login page and it
          // ended up creating a brand-new account, the user never registered —
          // reject it: delete the just-created auth.users row via the
          // `delete-self` Edge Function, sign back out, flag the reason, and
          // send them to login. Deletion runs BEFORE signOut() because the
          // function needs the live session JWT to authenticate the caller.
          if (
            oauthInProgress === "login" &&
            isFreshlyCreatedUser(oauthUser)
          ) {
            localStorage.setItem(GOOGLE_LOGIN_NO_ACCOUNT_KEY, "1");
            await deleteCurrentUserViaEdgeFunction();
            await signOut();
            if (cancelled) return;
            window.history.replaceState(
              { page: "login" },
              "",
              PAGE_TO_PATH["login"]
            );
            setResolvingAuthRoute(false);
            setCurrentPage("login");
            return;
          }

          // Mirror case: a "register" round-trip that signed into an account
          // that already existed (Supabase silently logs in instead of
          // creating one). The user picked an already-registered Google
          // account — reject it and tell them to log in instead.
          if (
            oauthInProgress === "register" &&
            !isFreshlyCreatedUser(oauthUser)
          ) {
            localStorage.setItem(GOOGLE_REGISTER_EXISTS_KEY, "1");
            await signOut();
            if (cancelled) return;
            window.history.replaceState(
              { page: "login" },
              "",
              PAGE_TO_PATH["login"]
            );
            setResolvingAuthRoute(false);
            setCurrentPage("login");
            return;
          }

          // If the user took the quiz before signing up with Google, hand off
          // to GeneratingPlanPage so they see the loader + retry UI instead of
          // sitting on HomePage during a silent fetch.
          const pendingQuiz = localStorage.getItem("quizAnswers");
          if (pendingQuiz && !hasPlan()) {
            window.history.replaceState(
              { page: "generatingPlan" },
              "",
              PAGE_TO_PATH["generatingPlan"]
            );
            // Direct setState (not transition) so the navigation can't be
            // interrupted by a higher-priority update before commit.
            setResolvingAuthRoute(false);
            setCurrentPage("generatingPlan");
            return;
          }

          // No plan yet -> tell HomePage to open the onboarding quiz, so a
          // freshly-signed-up Google user isn't stranded on a screen that
          // looks identical to the unauthenticated home page.
          if (!hasPlan()) {
            setAutoOpenQuiz(true);
          }

          const target: Page = hasPlan() ? "workout" : "home";
          if (target !== currentPage) {
            window.history.replaceState(
              { page: target },
              "",
              PAGE_TO_PATH[target]
            );
            setCurrentPage(target);
          }
          setResolvingAuthRoute(false);
          return;
        }

        // Already-authenticated user (existing session) landing on a public
        // auth page. Send them to workout if they have a plan, otherwise home.
        const isAuthLandingPage =
          currentPage === "home" ||
          currentPage === "login" ||
          currentPage === "register";
        if (isAuthLandingPage) {
          const target: Page = hasPlan() ? "workout" : "home";
          if (target !== currentPage) {
            window.history.replaceState(
              { page: target },
              "",
              PAGE_TO_PATH[target]
            );
            startPageTransition(() => setCurrentPage(target));
          }
        }
        setResolvingAuthRoute(false);
      }
    };
    void refetch();

    const onFocus = () => {
      void fetchPlan();
      void workoutHistoryService.fetchHistory();
      void completedWorkoutsService.fetchIds();
      void activeWorkoutService.fetchRemote().then((result) => {
        if (cancelled) return;
        reconcileActiveWorkout(result);
      });
    };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
    // currentPage is intentionally omitted: we only want this to run on auth changes,
    // not on every navigation. The ref guards the one-shot redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status]);

  // Safety net: once we've actually landed on a non-landing page (e.g. /workout
  // or /generating-plan), drop the post-auth loader gate even if some branch
  // forgot to clear it — never leave the user stuck under a permanent loader.
  useEffect(() => {
    if (resolvingAuthRoute && !LANDING_PAGES.includes(currentPage)) {
      setResolvingAuthRoute(false);
    }
  }, [currentPage, resolvingAuthRoute]);

  useEffect(() => {
    trackPageView(currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("workoutExercises", JSON.stringify(workoutExercises));
  }, [workoutExercises]);

  // Persist the in-progress workout on every meaningful change so it survives
  // reload / tab close / device shutdown. Cleared on finish/discard via
  // resetWorkoutState(). lastActiveAt is intentionally left to the default
  // (now) — any state change here is itself a sign of activity. Also mirrors
  // the state to Supabase (debounced) once we've reconciled with remote.
  useEffect(() => {
    if (workoutStartTime === null) return;
    saveActiveWorkout({
      workoutStartTime,
      workoutExercises,
      completedExerciseIds,
      exerciseLogs,
      exercisePainLevels,
      isCustomWorkout: isCustomWorkoutMode,
      pausedSeconds,
    });
    if (!reconciledOnce) return;
    // Content-only digest: skips pure-timestamp re-pushes that would otherwise
    // cycle after a hydrate-from-remote (each focus would advance updated_at).
    const digest = JSON.stringify({
      workoutStartTime,
      workoutExercises,
      completedExerciseIds,
      exerciseLogs,
      exercisePainLevels,
      isCustomWorkout: isCustomWorkoutMode,
      pausedSeconds,
    });
    if (digest === lastSyncedDigestRef.current) return;
    lastSyncedDigestRef.current = digest;
    const persisted = loadActiveWorkout();
    if (persisted) activeWorkoutService.upsertRemote(persisted);
  }, [
    workoutStartTime,
    workoutExercises,
    completedExerciseIds,
    exerciseLogs,
    exercisePainLevels,
    isCustomWorkoutMode,
    pausedSeconds,
    reconciledOnce,
  ]);

  // Heartbeat: refresh `lastActiveAt` every few seconds so reconcile can tell a
  // live session from a stale one, and flush pending state to Supabase when the
  // tab is backgrounded (it may never come back). Robust against power-off /
  // crash because nothing depends on a clean unload event firing.
  useEffect(() => {
    if (workoutStartTime === null) return;
    const intervalId = window.setInterval(
      touchActiveWorkoutHeartbeat,
      HEARTBEAT_MS
    );
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        touchActiveWorkoutHeartbeat();
        // Push any debounced state to Supabase right now — the tab may not
        // come back. Fire-and-forget; the service's queue handles failures.
        void activeWorkoutService.flushPendingUpsert();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [workoutStartTime]);

  const navigateToPage = (
    page: Page,
    historyState: Record<string, unknown> = {}
  ) => {
    window.history.pushState({ page, ...historyState }, "", PAGE_TO_PATH[page]);
    startPageTransition(() => setCurrentPage(page));
  };

  const navigateToHome = () => navigateToPage("home");
  const navigateToLogin = () => navigateToPage("login");
  const resetWorkoutState = (options?: { skipRemoteDelete?: boolean }) => {
    setCompletedExerciseIds([]);
    setExerciseLogs({});
    setExercisePainLevels({});
    setWorkoutStartTime(null);
    setPausedSeconds(0);
    clearActiveWorkout();
    lastSyncedDigestRef.current = null;
    // Skip the remote delete when the reset itself was triggered by reconcile
    // detecting that remote is already gone (another device finished/discarded).
    if (!options?.skipRemoteDelete) {
      activeWorkoutService.deleteRemote();
    }
  };

  const handleAddExercises = (exercises: Exercise[]) => {
    setWorkoutExercises((prev) => {
      const existingIds = new Set(prev.map((ex) => ex.id));
      const newExercises = exercises.filter((ex) => !existingIds.has(ex.id));
      if (newExercises.length > 0) {
        trackEvent("exercises_added", { count: newExercises.length });
      }
      return [...prev, ...newExercises];
    });

    try {
      const plan = getPlan();
      if (plan) {
        // Resolve the target day the same way delete/replace do: prefer the
        // manually selected day, then fall back to the next available workout.
        // Otherwise an "add" could land on a different day than the one shown.
        let workoutIndex = -1;
        const manualIndex = getSelectedDayIndex();
        if (
          manualIndex !== null &&
          manualIndex >= 0 &&
          manualIndex < plan.workoutDays.length
        ) {
          workoutIndex = manualIndex;
        }
        if (workoutIndex === -1) {
          const activeWorkout = getNextAvailableWorkout(
            plan,
            completedWorkoutIds
          );
          if (activeWorkout) {
            workoutIndex = plan.workoutDays.findIndex(
              (day) =>
                day.dayNumber === activeWorkout.dayNumber &&
                day.dayName === activeWorkout.dayName
            );
          }
        }

        if (workoutIndex !== -1) {
          const existingExerciseIds = new Set(
            plan.workoutDays[workoutIndex].exercises.map((ex) => ex.id)
          );
          const newExercisesToAdd = exercises.filter(
            (ex) => !existingExerciseIds.has(ex.id)
          );

          if (newExercisesToAdd.length > 0) {
            plan.workoutDays[workoutIndex].exercises.push(...newExercisesToAdd);
            savePlan(plan);
          }
        }
      }
    } catch (error) {
      console.error("Error updating generated plan:", error);
    }
  };

  const navigateToWorkout = () => {
    resetWorkoutState();
    setIsCustomWorkoutMode(false);
    // replaceState makes workout the "floor" — back button won't go past it
    window.history.replaceState(
      { page: "workout" },
      "",
      PAGE_TO_PATH["workout"]
    );
    startPageTransition(() => setCurrentPage("workout"));
  };
  const navigateToGeneratingPlan = () => {
    window.history.replaceState(
      { page: "generatingPlan" },
      "",
      PAGE_TO_PATH["generatingPlan"]
    );
    startPageTransition(() => setCurrentPage("generatingPlan"));
  };
  // Regenerate failed (from My Plan or Profile): the existing plan is left
  // untouched (both paths save only on success), so just explain why and drop
  // the user back on the workout page with their current plan intact.
  const handleRegenerateFailed = () => {
    showToast(t("toasts.regenerateFailed"), "error");
    navigateToWorkout();
  };
  const navigateToProgress = () => navigateToPage("progress");
  const navigateToHistory = () => navigateToPage("history");
  const navigateToProfile = () => navigateToPage("profile");
  const navigateToAI = () => navigateToPage("ai");
  const navigateToAllExercise = () => {
    setAllExerciseReturnPage("workout");
    navigateToPage("allExercise");
  };
  const navigateToMyPlan = () => navigateToPage("myPlan");

  const navigateToSettings = () => navigateToPage("settings");
  const navigateToExerciseProgress = (exerciseId: number) => {
    setSelectedExerciseProgressId(exerciseId);
    navigateToPage("exerciseProgress", { exerciseId });
  };
  const navigateToCreateProgram = () => {
    setCreateProgramDays([]);
    setCreateProgramName("");
    setEditingProgramId(undefined);
    setActiveDayId(null);
    navigateToPage("createProgram");
  };

  const handleSelectSavedProgram = (program: SavedProgram) => {
    trackEvent("program_selected", { program_id: program.id });
    const plan = {
      id: program.id,
      name: program.name,
      splitType: "CUSTOM",
      weeks: 4,
      createdAt: program.createdAt,
      settings: getPlanSettings(),
      workoutDays: program.days.map((day, i) => ({
        dayNumber: i + 1,
        dayName: day.name,
        muscleGroups: [
          ...new Set(day.exercises.flatMap((ex) => ex.muscle_groups)),
        ],
        exercises: day.exercises,
      })),
      missingMuscleGroups: [],
      alternativeExercises: [],
    };
    savePlan(plan);
    setCompletedWorkoutIds(new Set());
    setIsCustomWorkoutMode(false);
    resetWorkoutState();
    navigateToPage("workout");
  };

  const handleEditSavedProgram = (program: SavedProgram) => {
    trackEvent("program_edit_started", { program_id: program.id });
    setCreateProgramDays(program.days);
    setCreateProgramName(program.name);
    setEditingProgramId(program.id);
    setActiveDayId(null);
    navigateToPage("createProgram");
  };

  const navigateToActiveWorkout = (options?: { resetCompleted?: boolean }) => {
    trackEvent("workout_started");
    if (options?.resetCompleted !== false) {
      setCompletedExerciseIds([]);
      // Keep exerciseLogs empty: it means "sets the user performed" (ExerciseCard
      // display, history payload, Supabase snapshot). Pre-workout set edits are
      // seeded lazily by ExerciseSetsPage from plannedSetsStorage instead.
      setExerciseLogs({});
    }
    setWorkoutStartTime((prevStartTime) => prevStartTime ?? Date.now());
    setExerciseSetsMode("preWorkout");
    // Keep the URL in sync like every other navigate* helper so reload /
    // back/forward resolve to the active workout, not the stale path.
    window.history.pushState(
      { page: "activeWorkout" },
      "",
      PAGE_TO_PATH["activeWorkout"]
    );
    startPageTransition(() => {
      setSelectedExercise(null);
      setCurrentPage("activeWorkout");
    });
  };

  const navigateToExerciseDetails = (
    exercise: Exercise,
    origin: "workout" | "activeWorkout" = "workout"
  ) => {
    setSelectedExercise(exercise);
    setExerciseDetailsOrigin(origin);
    navigateToPage("exerciseDetails", { exercise });
  };

  const navigateToExerciseSets = (
    exercise: Exercise,
    mode: "preWorkout" | "activeWorkout" = "preWorkout"
  ) => {
    setSelectedExercise(exercise);
    setExerciseSetsMode(mode);
    setExerciseSetsOrigin(
      mode === "activeWorkout" ? "activeWorkout" : "workout"
    );
    navigateToPage("exerciseSets", { exercise, mode });
  };

  const backFromExerciseDetails = () => {
    if (exerciseDetailsOrigin === "activeWorkout") {
      window.history.replaceState(
        { page: "activeWorkout" },
        "",
        PAGE_TO_PATH["activeWorkout"]
      );
      startPageTransition(() => setCurrentPage("activeWorkout"));
    } else {
      window.history.back();
    }
  };

  const backFromExerciseSets = () => {
    if (exerciseSetsOrigin === "activeWorkout") {
      window.history.replaceState(
        { page: "activeWorkout" },
        "",
        PAGE_TO_PATH["activeWorkout"]
      );
      startPageTransition(() => setCurrentPage("activeWorkout"));
    } else {
      window.history.back();
    }
  };

  const handleReplaceSelectedExercise = (
    oldExercise: Exercise,
    selectedReplacement: Exercise,
    duration: SwapDurationOption
  ) => {
    const replacement: Exercise = {
      ...selectedReplacement,
      sets: oldExercise.sets,
      reps: oldExercise.reps,
      weight: oldExercise.weight,
      weight_unit: oldExercise.weight_unit,
    };
    const replaceInList = (list: Exercise[]) => {
      if (
        list.some((ex) => ex.id === replacement.id && ex.id !== oldExercise.id)
      ) {
        return list;
      }
      return list.map((ex) => (ex.id === oldExercise.id ? replacement : ex));
    };

    try {
      const plan = getPlan();
      if (plan) {
        if (duration === "plan") {
          plan.workoutDays = plan.workoutDays.map((day) => ({
            ...day,
            exercises: replaceInList(day.exercises as Exercise[]),
          }));
        } else {
          const manualIndex = getSelectedDayIndex();
          let workoutIndex = -1;
          if (
            manualIndex !== null &&
            manualIndex >= 0 &&
            manualIndex < plan.workoutDays.length
          ) {
            workoutIndex = manualIndex;
          }
          if (workoutIndex === -1) {
            const currentWorkout = getNextAvailableWorkout(
              plan,
              completedWorkoutIds
            );
            if (currentWorkout) {
              workoutIndex = plan.workoutDays.findIndex(
                (day) =>
                  day.dayNumber === currentWorkout.dayNumber &&
                  day.dayName === currentWorkout.dayName
              );
            }
          }
          if (workoutIndex !== -1) {
            plan.workoutDays[workoutIndex].exercises = replaceInList(
              plan.workoutDays[workoutIndex].exercises as Exercise[]
            );
          }
        }
        savePlan(plan);
      }
    } catch (error) {
      console.error("Error replacing exercise from sets page:", error);
    }

    setWorkoutExercises((prev) => replaceInList(prev));
    // Carry the user's saved set defaults over to the replacement; a one-off
    // swap keeps the source — the old exercise stays on other plan days.
    copyPlannedSets(getPlanId(), oldExercise.id, replacement.id, {
      removeSource: duration === "plan",
    });
    setSelectedExercise(replacement);
    trackEvent("exercise_replaced", {
      old_id: oldExercise.id,
      new_id: replacement.id,
      duration,
    });
  };

  const markExerciseComplete = (
    exerciseId: number,
    sets: ExerciseSetRow[],
    painLevel: number | undefined
  ) => {
    trackEvent("exercise_completed", { exercise_id: exerciseId });
    const completedSets = sets
      .filter((s) => s.completed)
      .map((s) => ({ ...s }));
    setExerciseLogs((prev) => ({ ...prev, [exerciseId]: completedSets }));
    if (painLevel !== undefined) {
      setExercisePainLevels((prev) => ({ ...prev, [exerciseId]: painLevel }));
    }
    setCompletedExerciseIds((prev) =>
      prev.includes(exerciseId) ? prev : [...prev, exerciseId]
    );
    setExerciseSetsMode("preWorkout");
    startPageTransition(() => {
      setSelectedExercise(null);
      setCurrentPage("activeWorkout");
    });
  };

  const skipExercise = (exerciseId: number) => {
    trackEvent("exercise_skipped", { exercise_id: exerciseId });
    setCompletedExerciseIds((prev) =>
      prev.includes(exerciseId) ? prev : [...prev, exerciseId]
    );
    setExerciseSetsMode("preWorkout");
    startPageTransition(() => {
      setSelectedExercise(null);
      setCurrentPage("activeWorkout");
    });
  };

  const handleFinishWorkout = (summary?: FinishedWorkoutSummary) => {
    trackEvent("workout_finished", { has_summary: !!summary });
    if (summary) {
      workoutHistoryService.addWorkout(summary);
      resetWorkoutState();
      navigateToPage("workout");
      return;
    }
    resetWorkoutState();
    navigateToPage("workout");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            onNavigateToLogin={navigateToLogin}
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToGeneratingPlan={navigateToGeneratingPlan}
            autoOpenQuiz={autoOpenQuiz}
            oauthError={oauthError}
          />
        );
      case "generatingPlan":
        return (
          <GeneratingPlanPage
            onSuccess={navigateToWorkout}
            onFailure={() => {
              showToast(t("toasts.accountCreated"), "success");
              navigateToWorkout();
            }}
          />
        );
      case "login":
        return (
          <Login
            onNavigateToHome={navigateToHome}
            onNavigateToWorkout={navigateToWorkout}
          />
        );
      case "register":
        return (
          <Registration
            onSwitchToLogin={navigateToLogin}
            onNavigateToHome={navigateToHome}
            onNavigateToWorkout={navigateToWorkout}
          />
        );
      case "resetPassword":
        return <ResetPasswordPage onNavigateToLogin={navigateToLogin} />;
      case "workout":
        return (
          <WorkoutPage
            onNavigateToHome={navigateToHome}
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProgress={navigateToProgress}
            onNavigateToHistory={navigateToHistory}
            onNavigateToProfile={navigateToProfile}
            onNavigateToAI={navigateToAI}
            activePage="workout"
            onOpenExerciseDetails={navigateToExerciseDetails}
            onOpenExerciseSets={navigateToExerciseSets}
            onStartWorkoutSession={navigateToActiveWorkout}
            onNavigateToAllExercise={navigateToAllExercise}
            onNavigateToMyPlan={navigateToMyPlan}
            onCreateProgramFromScratch={navigateToCreateProgram}
            onSelectSavedProgram={handleSelectSavedProgram}
            onEditSavedProgram={handleEditSavedProgram}
            exercises={workoutExercises}
            isCustomWorkout={isCustomWorkoutMode}
            onRemoveExercise={(id: number) =>
              setWorkoutExercises((prev) => prev.filter((ex) => ex.id !== id))
            }
            completedWorkoutIds={completedWorkoutIds}
            onPlanGenerationFailed={() =>
              showToast(t("toasts.planGenerationFailed"), "error")
            }
          />
        );
      case "progress":
        return (
          <ProgressPage
            onNavigateToHome={navigateToHome}
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProgress={navigateToProgress}
            onNavigateToHistory={navigateToHistory}
            onNavigateToProfile={navigateToProfile}
            onNavigateToAI={navigateToAI}
            onExerciseClick={navigateToExerciseProgress}
            activePage="progress"
            workoutHistory={workoutHistory}
          />
        );
      case "exerciseSets":
        if (!selectedExercise) {
          navigateToWorkout();
          return null;
        }
        return (
          <ExerciseSetsPage
            exercise={selectedExercise}
            onNavigateBack={backFromExerciseSets}
            onStartWorkoutSession={navigateToActiveWorkout}
            onNavigateToHistory={navigateToHistory}
            onMarkExerciseComplete={markExerciseComplete}
            onSkipExercise={skipExercise}
            isDuringActiveWorkout={exerciseSetsMode === "activeWorkout"}
            exerciseLogs={exerciseLogs}
            workoutHistory={workoutHistory}
            onReplaceExercise={handleReplaceSelectedExercise}
          />
        );
      case "exerciseDetails":
        if (!selectedExercise) {
          navigateToWorkout();
          return null;
        }
        return (
          <ExerciseDetails
            exercise={selectedExercise}
            onNavigateBack={backFromExerciseDetails}
            onStartWorkout={navigateToExerciseSets}
          />
        );
      case "activeWorkout":
        return (
          <ActiveWorkoutPage
            onNavigateBack={navigateToWorkout}
            onOpenExerciseSets={(ex) =>
              navigateToExerciseSets(ex, "activeWorkout")
            }
            onOpenExerciseDetails={(ex) =>
              navigateToExerciseDetails(ex, "activeWorkout")
            }
            onFinishWorkout={handleFinishWorkout}
            completedExerciseIds={completedExerciseIds}
            workoutStartTime={workoutStartTime || undefined}
            exerciseLogs={exerciseLogs}
            exercisePainLevels={exercisePainLevels}
            completedWorkoutIds={completedWorkoutIds}
            setCompletedWorkoutIds={setCompletedWorkoutIds}
            customExercises={isCustomWorkoutMode ? workoutExercises : undefined}
            isCustomWorkout={isCustomWorkoutMode}
            onNavigateToAllExercise={() => {
              setAllExerciseReturnPage("activeWorkout");
              navigateToPage("allExercise");
            }}
          />
        );
      case "history":
        return (
          <HistoryPage
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProgress={navigateToProgress}
            onNavigateToHistory={navigateToHistory}
            onNavigateToProfile={navigateToProfile}
            onNavigateToAI={navigateToAI}
            activePage="history"
            workouts={workoutHistory}
          />
        );
      case "profile":
        return (
          <ProfilePage
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProgress={navigateToProgress}
            onNavigateToHistory={navigateToHistory}
            onNavigateToProfile={navigateToProfile}
            onNavigateToAI={navigateToAI}
            onNavigateToSettings={navigateToSettings}
            onRegenerateFailed={handleRegenerateFailed}
            activePage="profile"
          />
        );
      case "ai":
        return (
          <AIPage
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToProgress={navigateToProgress}
            onNavigateToHistory={navigateToHistory}
            onNavigateToProfile={navigateToProfile}
            onNavigateToAI={navigateToAI}
            activePage="ai"
          />
        );
      case "allExercise":
        return (
          <AllExercisePage
            onClose={() => {
              if (allExerciseReturnPage === "createProgram") {
                navigateToPage("createProgram");
              } else if (allExerciseReturnPage === "activeWorkout") {
                navigateToPage("activeWorkout");
              } else {
                navigateToWorkout();
              }
            }}
            onOpenExerciseDetails={navigateToExerciseDetails}
            onAddExercises={(exercises) => {
              if (allExerciseReturnPage === "createProgram" && activeDayId) {
                setCreateProgramDays((prev) =>
                  prev.map((day) => {
                    if (day.id !== activeDayId) return day;
                    const existingIds = new Set(
                      day.exercises.map((ex) => ex.id)
                    );
                    return {
                      ...day,
                      exercises: [
                        ...day.exercises,
                        ...exercises.filter((ex) => !existingIds.has(ex.id)),
                      ],
                    };
                  })
                );
                setActiveDayId(null);
              } else {
                handleAddExercises(exercises);
              }
            }}
          />
        );
      case "createProgram":
        return (
          <CreateProgramPage
            days={createProgramDays}
            programName={createProgramName}
            onNavigateBack={navigateToWorkout}
            onAddExercise={(dayId) => {
              setActiveDayId(dayId);
              setAllExerciseReturnPage("createProgram");
              navigateToPage("allExercise");
            }}
            onSave={navigateToWorkout}
            onDaysChange={setCreateProgramDays}
            onProgramNameChange={setCreateProgramName}
            editProgramId={editingProgramId}
          />
        );
      case "myPlan":
        return (
          <MyPlanPage
            onNavigateBack={navigateToWorkout}
            onNavigateToProfile={navigateToProfile}
            onRegenerateFailed={handleRegenerateFailed}
          />
        );
      case "availableEquipment":
        return <AvailableEquipmentPage onNavigateBack={navigateToMyPlan} />;
      case "exerciseProgress":
        if (!selectedExerciseProgressId) {
          navigateToProgress();
          return null;
        }
        return (
          <ExerciseProgressPage
            exerciseId={selectedExerciseProgressId}
            onNavigateBack={navigateToProgress}
            workoutHistory={workoutHistory}
          />
        );
      case "settings":
        return <SettingsPage onNavigateBack={navigateToProfile} />;
      default:
        return (
          <HomePage
            onNavigateToLogin={navigateToLogin}
            onNavigateToWorkout={navigateToWorkout}
            onNavigateToGeneratingPlan={() => {}}
          />
        );
    }
  };

  // `resolvingAuthRoute` keeps the loader up across the post-auth redirect so a
  // landing page never flashes between the auth check and the /workout landing.
  if (auth.status === "loading" || resolvingAuthRoute) {
    return <PageLoader />;
  }

  return (
    <>
      {isPagePending ? <PageLoader className="pointer-events-none" /> : null}
      <ChunkErrorBoundary>
        <Suspense fallback={<PageLoader className="pointer-events-none" />}>
          {renderPage()}
        </Suspense>
      </ChunkErrorBoundary>
      {toast && <Toast message={toast.message} variant={toast.variant} />}
      <InstallPrompt />
    </>
  );
}

export default App;
