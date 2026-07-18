# SpineFit — Competitor Research & Feature Roadmap (July 2026)

Research into the digital back-pain / MSK market, benchmarked against what SpineFit ships today, with a ranked list of features to build.

---

## 1. Executive summary

SpineFit is, functionally, a **very good strength-training app with a spine-safety filter**. The competitors that win in this market are not better gyms — they are better *care loops*. They ask how you feel, they change the plan when you hurt, they teach you why you hurt, and they prove you got better with a number.

SpineFit collects pain data but never acts on it. That is the core strategic gap.

**The three highest-ROI features, in order:**

1. **Make the AI coach actually know the user.** Today `AIPage` sends raw chat to Gemini with zero context — no plan, no pain history, no injury profile. Every competitor's AI is context-aware. This is your cheapest large win, and your `CLAUDE.md` already describes the architecture you never built.
2. **Daily check-in + Flare-Up Mode.** A 15-second "how's your back today?" that *automatically deloads or swaps the workout* when pain spikes. Nobody in the strength-training space does this. It's the feature that makes you a back-pain app rather than a Hevy clone.
3. **A validated recovery score (ODI / STarT Back).** Give users a number that goes down. It's the retention hook, the marketing proof, and the thing that makes the AI coach smart over time.

The "computer vision form check" you may be thinking of (Kaia / Kemtai style) is real and buildable in-browser — but it's **Tier 2**, not Tier 1. It's expensive, it's a demo magnet, and it does not fix your retention loop. Details in §5.4.

---

## 2. What SpineFit has today

Audited from the codebase, not from the docs.

| Area | Status |
|---|---|
| Medical/fitness quiz | Strong. 14 questions: pain status, location (L4-L5/S1, sciatica, glute, calf/foot), 0–10 pain level, 7 pain triggers, squat confidence, experience, frequency, duration, sex, birth year, body type, free-text notes. |
| AI plan generation | Gemini 2.0 Flash, SSE streaming, backend-only, schema-validated (`planSchema.ts`), pain-status-aware prompt dispatch (`promptBuilder.ts`). |
| Exercise library | 349 exercises with `is_back_issue_restrictions` (`l5_s1` etc.), `restriction_level`, per-issue recommendations, `is_back_friendly` flag. This is a genuine asset — most competitors don't have per-exercise, per-diagnosis restriction metadata. |
| Workout logging | Sets/reps/weight, warmup vs working sets, rest timer, time-based exercises, exercise swap (workout or plan scope), volume, calories, 1RM, progressive overload. |
| Pain tracking | **Per-exercise pain level is captured** (`exercisePainLevels`, `averagePainLevel` on each finished workout) and charted (`PainChart`, `getPainDataByPeriod`). |
| Progress | Volume, calories, muscle-group distribution, weekly activity, per-exercise progression, pain over time. |
| AI chat | **Context-free.** `AIPage.tsx` → `sendChatMessage` → Gemini. No profile, no plan, no pain history, no knowledge base. |
| Education | Three static SEO article pages (herniated disc, sciatica, L5-S1) + a LEARN section in Settings. |
| Platform | React 19 / Vite PWA (web), Expo (mobile, auth not wired), Supabase auth + Postgres, i18n ru/en. |

**Biggest structural observation:** you already collect the two inputs (pain level per exercise, pain triggers) that every recommendation below needs. The data is there. Nothing consumes it.

---

## 3. The competitive landscape

### 3.1 Enterprise MSK (the money, the tech benchmark)

**Hinge Health** — IPO'd, raised $437M. Three-part model:
- **TrueMotion** — AI motion tracking (camera-based) that watches the exercise and corrects form.
- **Enso** — an FDA-cleared wearable nerve-stim device for pain relief (this is hardware; ignore it).
- **AI-supported care team** — PTs + coaches, with AI doing ~95% of the work. Recently shipped "Movement Analysis" and "Robin" AI tools.

**Sword Health** — **acquired Kaia Health for $285M in January 2026** and is migrating Kaia's US members onto the Sword platform. Sensor-guided (and now vision-guided) exercise, licensed clinicians, real-time motion tracking, employer reporting.

**Kaia Health** (now inside Sword) — was the closest thing to SpineFit's model: **smartphone-only, no wearables, computer-vision form correction**, $14.99/mo direct-to-consumer, published clinical outcomes, and — critically — **pain science education + behavioral intervention alongside the exercise**. Their positioning was "comprehensive pain management beyond exercise alone."

> **Takeaway:** the market leader just paid $285M for the *software-only, camera-based, education-inclusive* model. That is the model closest to yours. Their pieces you're missing: form feedback, pain education, and a care loop.

### 3.2 Consumer back-pain apps (your actual competitors)

| App | Model | Price | What they do well | What they lack |
|---|---|---|---|---|
| **[P]rehab** | PT-built program library. 55+ programs, 170+ workouts, 4,000+ exercise videos, a "body scan" assessment that routes you to a program. | **$49.99/mo** | Enormous video content, clinical credibility, program breadth. | Static programs. No adaptive AI, no logging depth, no progression tracking anywhere near yours. |
| **Low Back Ability** | "Your spine isn't fragile" — progressive loading, capacity testing, long-game mindset. Cult following on YouTube/IG. | **Pay-what-you-want, from $3/mo** | *Exactly your philosophy.* Measures real capacity, progresses load. Huge community trust. | It's basically a content membership. No app intelligence, no personalization, no logging. |
| **Curable** | Pain neuroscience education, PRT (pain reprocessing therapy), somatic tracking, expressive writing, guided meditation. No human coach. | ~$15/mo | Best-in-class evidence base. **PRT trial: 66% pain-free/near-pain-free vs 20% placebo, held at 1 year.** Highest-scoring app for evidence-based content. | Zero exercise. Zero strength. Purely psychological. |
| **Bearable** | Symptom/pain journaling + correlation engine. Identifies flare-up triggers and early warning signs. | Freemium | The tracking-and-correlation loop. Users find *their* triggers. | Passive. Doesn't tell you what to do about it. |
| **Back Intelligence** | Content/blog + posture programs. | — | SEO reach. | Not a real product. |

### 3.3 The computer-vision infrastructure players

**Kemtai** — the reference implementation. Turns any camera device into a form-correcting therapist. Tracks **111 body points** including spine/rotation. Real-time audio-visual correction per rep. 2,000+ exercises. Rep- and exercise-level adherence reporting. Offers an API.

**Exer Health** — same category, real-time camera form feedback.

Both are camera-only, no wearables — which proves the browser/phone-camera approach is clinically viable.

---

## 4. Feature gap matrix

| Feature | Hinge | Sword/Kaia | Prehab | LBA | Curable | Bearable | **SpineFit** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Personalized plan from assessment | ✅ | ✅ | ✅ | ➖ | ➖ | ❌ | ✅ **(AI-generated — better)** |
| Progressive overload / load tracking | ➖ | ➖ | ➖ | ✅ | ❌ | ❌ | ✅ **(best in class)** |
| Per-diagnosis exercise restrictions | ✅ | ✅ | ➖ | ➖ | ❌ | ❌ | ✅ **(unique asset)** |
| Pain logged per exercise | ➖ | ✅ | ❌ | ❌ | ➖ | ✅ | ✅ |
| **Plan adapts to pain automatically** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Daily check-in / flare-up mode** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Context-aware AI coach** | ✅ | ✅ | ❌ | ❌ | ➖ | ❌ | ❌ |
| **Validated outcome score (ODI/STarT)** | ✅ | ✅ | ❌ | ❌ | ➖ | ❌ | ❌ |
| **Camera form feedback** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pain-science / brain-retraining education** | ✅ | ✅ | ➖ | ➖ | ✅ | ❌ | ❌ |
| **Adherence engine (reminders/streaks)** | ✅ | ✅ | ✅ | ➖ | ✅ | ✅ | ❌ |
| Exercise video demos | ✅ | ✅ | ✅ | ✅ | — | — | ❌ (`video_url` is empty) |
| Trigger/flare correlation insights | ➖ | ➖ | ❌ | ❌ | ➖ | ✅ | ❌ |
| Wearable / health-data sync | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

✅ = strong · ➖ = partial/weak · ❌ = absent

**Read this way:** you win on training intelligence and lose on the *care loop*. Every ❌ in your column is a loop feature.

---

## 5. Recommended features, ranked

### TIER 1 — Build these first

#### 5.1 Context-aware AI coach (RAG + user context)
**The gap:** `AIPage.tsx` sends the user's message to Gemini with no idea who they are. A user asking "my back hurts after deadlifts, what do I do?" gets a generic web answer — when you *know* they have L5/S1, that "lifting" is a logged trigger, that they did deadlifts on Tuesday and logged pain 6, and that their plan has deadlifts again on Friday.

**Build:**
- `apps/web/src/lib/coachContext.ts` — deterministic context block injected into **every** message: goal, pain status, pain location, triggers, current plan (day names + exercises), last 3 workouts with volume + pain per exercise, PRs, weeks into program.
- `apps/backend/src/services/knowledgeRetrieval.ts` + Supabase **pgvector** `knowledge_chunks` table — embed your three SEO articles plus new spine-health content; retrieve top-k per question. You already have `embeddingService.ts` open in your editor — finish that path.
- Merge both into one Gemini system prompt in `chatService.ts` (context block is unconditional; RAG chunks are query-dependent).

**Why first:** it's the only Tier-1 item that's mostly *plumbing on top of things you already have* (Supabase, Gemini, quiz answers, workout history). It transforms the app's perceived intelligence for maybe a week of work. And it's the substrate every other feature below plugs into.

**Effort:** M · **Impact:** Very high

---

#### 5.2 Daily check-in + Flare-Up Mode ⭐ *the differentiator*
**The gap:** you record pain and then do nothing with it. If a user logs pain 8 on Tuesday's deadlifts, Friday's plan still says deadlifts, same weight.

**Build:**
1. **Morning check-in (15 sec, one screen):** pain level 0–10, stiffness, sleep quality, "any new symptoms?" — one tap each. Store daily, not just per-workout.
2. **Adaptive rules engine** (deterministic, not AI — you need this to be predictable and safe):
   - Pain ≤ 3 and trending down → normal plan, allow progressive overload.
   - Pain 4–6 → **auto-deload**: −20–30% load, drop the highest-restriction exercises for that user's `issue_type`, keep volume through back-friendly substitutes (you already have `replacementExercises.ts` and `restriction_level` metadata — this is *the* payoff for that data model).
   - Pain 7+ or new radiating/neuro symptoms → **Flare-Up Mode**: swap the whole session for a short decompression/walk/breathing protocol, suppress load progression, and if `calf_or_foot numbness` was ever selected, surface the red-flag "see a clinician" message you already have a TODO for in `questions.ts:59`.
   - Exiting flare-up → graded re-entry over 3 sessions rather than snapping back to prior load.
3. **Post-workout delta:** "You logged pain 6 on Romanian Deadlift. Want me to swap it for the next 2 weeks?" — one tap, uses the existing swap flow.

**Why it wins:** Hinge and Sword do this with a $30k/year enterprise contract and a human PT. Prehab, LBA, and every gym-logging app do not do it at all. It's the single feature that justifies "SpineFit" as a category rather than "Hevy with a filter." It also generates the daily-open habit you currently have no reason to ask for.

**Effort:** M–L · **Impact:** Very high

---

#### 5.3 Validated recovery score (ODI + STarT Back)
**The gap:** users can see their squat go up but have no measure of whether their *back* is better. Neither do you — so you can't market outcomes.

**Build:**
- **STarT Back Screening Tool** (9 binary items, validated) at onboarding → stratifies users into **low / medium / high risk** of persistent disabling pain. Feed the tier into the plan-generation prompt: high-risk users need more education and psychological support, less aggressive loading. This is a 9-question addition to a quiz you already have.
- **Oswestry Disability Index** (the gold standard for low-back function) every 4 weeks → a 0–100% disability score.
- Surface as a **"Back Health Score"** on the Progress page next to volume, with the trend line. Celebrate the drop: *"Your disability score went from 42% (severe) to 18% (minimal) in 12 weeks."*

**Why:** three payoffs at once — (a) retention: a number that improves is the strongest reason to keep going; (b) marketing: "our users reduce ODI by X points" is the claim every competitor leads with; (c) it's the truth signal your AI coach needs to reason about progress.

**Effort:** S–M (questionnaires + scoring are trivial; the value is in the framing) · **Impact:** High

---

### TIER 2 — Strong, build after the loop works

#### 5.4 Camera form check (MediaPipe Pose, in-browser)
This is the "AI computer feature" — Kaia's core tech, Kemtai's whole business, and Hinge's TrueMotion.

**Feasible on your stack:** MediaPipe Pose / TensorFlow.js runs **fully on-device in the browser** — 33 skeletal keypoints, joint angles computed by geometry, rep counting by angle thresholds. No server, no video upload, and therefore **no medical-privacy problem** (a big deal — say "the video never leaves your device" prominently).

**Scope it hard.** Do not attempt 349 exercises. Ship **5–8 movements where spine position is the whole point**:
- Bodyweight squat — lumbar flexion at depth ("butt wink")
- Hip hinge / RDL pattern — neutral spine vs rounding
- Glute bridge — rib flare / overextension
- Bird dog — hip drop, lumbar rotation
- Dead bug — lumbar lift-off from floor
- Plank — hip sag

For each, one or two angle rules and one clear cue ("your lower back is rounding — hinge from the hips"). Plus rep counting and range-of-motion capture.

**Honest assessment:** this is the flashiest feature and the *least* important for retention. It's a demo/marketing weapon and a genuine safety add for a spine app, but it will not make someone open the app on day 40 — the check-in loop will. Build it third, and only after 5.1–5.3 land. Budget realistically: form *detection* is a weekend; form *feedback that isn't annoying and wrong* is a month.

**Effort:** L · **Impact:** Medium (high marketing, medium retention)

---

#### 5.5 Pain-science education & brain retraining
**The evidence is overwhelming and you're leaving it on the floor.** Curable's PRT lessons produced **66% pain-free or near-pain-free at post-treatment vs 20% placebo and 10% usual care, largely maintained at 1 year** — numbers no exercise protocol matches. Meta-analyses confirm pain neuroscience education reduces pain, disability, **kinesiophobia** (fear of movement), and catastrophizing.

Kinesiophobia is *your users' central problem.* Look at your own quiz: "Avoidant — I strictly avoid all squatting movements." You identify the fear and then hand them a barbell program.

**Build:** a **micro-lesson track** — 3–5 min, one per training day, delivered on the workout screen. Topics: hurt ≠ harm; the spine is not fragile; why the disc "slipping" metaphor is wrong; graded exposure; somatic tracking; sleep and stress as pain amplifiers. You already have the SEO article infrastructure and a LEARN section in Settings — this is a content lift more than an engineering lift, and Gemini can draft it against your knowledge base.

**Bonus:** these lessons *are* the RAG corpus for 5.1. Build once, use twice.

**Effort:** S (eng) / M (content) · **Impact:** High

---

#### 5.6 Adherence engine
The unglamorous one that decides whether any of the above matters.

- **Web push notifications** (PWA, you already have the service worker) — workout reminders, check-in nudge, flare-up follow-up ("how's the back today?" 24h after a bad session).
- **Streaks and consistency**, framed for rehab not for gym-bros: reward *showing up*, including on Flare-Up Mode days. Never punish a rest day taken because of pain — that's the behavior you want.
- **Movement snacks / sedentary nudges**: "sitting >20–30 min" is a trigger option *in your quiz*. If a user picked it, offer a 2-minute standing/extension break reminder during work hours. Research consistently finds that **changing posture frequently matters more than holding "good" posture** — that's the message.

**Effort:** M · **Impact:** High (retention multiplier on everything else)

---

#### 5.7 Trigger correlation insights (the Bearable feature)
You already store: workouts, exercises, loads, per-exercise pain, and (with 5.2) daily pain + sleep. Correlate them.

> *"Your pain averages 5.2 in the 48h after sessions with heavy spinal loading, vs 2.1 after other sessions."*
> *"Your 3 worst pain days this month all followed nights with under 6 hours of sleep."*
> *"You've done deadlifts 8 times with no pain increase — your back is handling load better than 3 months ago."*

That last one is a *fear-reduction* message backed by the user's own data. Nothing in this market does that, and it costs you a query and a card component.

**Effort:** S–M · **Impact:** Medium-high

---

### TIER 3 — Later / opportunistic

- **Exercise videos.** Your `video_url` field is empty on all 349 exercises. Prehab's moat is 4,000 videos. You don't need 4,000 — you need the ~60 in a typical generated plan. Even 10-second looping clips would close a visible quality gap.
- **Wearable / health-data sync** (Apple Health, Google Fit) — steps, sleep, HRV as inputs to the flare-up model. Natural fit once the Expo app has auth.
- **Camera-based function tests** — 30-second sit-to-stand, ROM/forward-flexion measurement, single-leg balance. Objective progress markers that pair with 5.3 and reuse 5.4's pose pipeline.
- **Ergonomics & sleep positioning** — desk setup, driving, sleep posture. Cheap content, high perceived value, strong SEO.
- **Community / PT-in-the-loop** — Low Back Ability's real moat is community. A "PT reviews your plan" upsell is the obvious premium tier.

### Explicitly do NOT build
- **Hardware** (an Enso/TENS analog). Regulatory hell, capex, not your business.
- **Live human PT chat** as a core feature. It's Hinge/Sword's cost structure and it's why they need employer contracts. Your edge is that software-only scales to $15/mo.
- **Generic posture-correction content.** Commoditized, weakly evidenced, and it contradicts the "your spine is not fragile" message that should be your brand.

---

## 6. Suggested roadmap

| Phase | Ship | Why now |
|---|---|---|
| **Phase 1 (~2–4 wks)** | 5.1 Context-aware AI coach + RAG | Cheapest transformation of perceived product intelligence. Foundation for everything else. |
| **Phase 2 (~4–6 wks)** | 5.2 Daily check-in + Flare-Up Mode · 5.3 ODI/STarT Back score | The care loop. This is where SpineFit stops being a gym app. Together they create the daily-open habit and the outcome proof. |
| **Phase 3 (~3–4 wks)** | 5.5 Pain-science micro-lessons · 5.6 Adherence engine | Retention and clinical outcomes. Content doubles as the RAG corpus. |
| **Phase 4 (~4–8 wks)** | 5.4 Camera form check (5–8 spine-critical movements) · 5.7 Correlation insights | The marketing weapon, once there's a product worth marketing. |

## 7. Positioning

Nobody currently owns this sentence:

> **"The only strength-training app that adapts to your back pain — and proves it's working."**

Curable has the psychology and no barbell. Prehab has the videos and no intelligence. Low Back Ability has the philosophy and no product. Hinge and Sword have all of it and sell only to employers at enterprise prices. Hevy and Strong have the logging and no idea your L5/S1 exists.

You already have the hardest parts: AI plan generation, a 349-exercise library with per-diagnosis restrictions, real progressive-overload tracking, and per-exercise pain capture. **You have the training brain. Build the care loop around it.**

---

## Sources

- [Hinge Health vs Sword Health vs Lin Health: 2026 Comparison](https://www.lin.health/insights/hinge-health-vs-sword-health-vs-lin-health)
- [The Sword Health–Kaia Health Merger and the Reshaping of European and US Digital MSK Care](https://www.healthcare.digital/single-post/the-sword-health-kaia-health-merger-and-the-reshaping-of-european-and-us-digital-musculoskeletal-car)
- [Sword Health Alternatives for Chronic Pain in 2026](https://www.lin.health/insights/sword-health-alternatives-chronic-pain)
- [Hinge Health — Enso wearable](https://www.hingehealth.com/product/enso/)
- [Hinge Health unveils new AI-powered care tools](https://www.hingehealth.com/resources/press-releases/hinge-health-unveils-new-ai-powered-care-tools/)
- [Hinge Health IPO Raises $437M to Advance AI-Driven MSK Care](https://xtalks.com/hinge-health-ipo-raises-437m-to-advance-ai-driven-musculoskeletal-care-4265/)
- [Kemtai — AI computer-vision rehab platform](https://kemtai.com/product/computer-vision-rehab/)
- [Best AI Physical Therapy Apps for Home Rehab (2026)](https://aitoolsbakery.com/blog/best-ai-physical-therapy-apps/)
- [[P]rehab App](https://landing.theprehabguys.com/)
- [Low Back Ability — pricing & philosophy](https://www.lowbackability.com/price)
- [Curable — What is Pain Reprocessing Therapy (PRT)?](https://www.curablehealth.com/treatments/what-is-pain-reprocessing-therapy-prt)
- [Pain Reprocessing Therapy Apps and Programs in 2026](https://www.lin.health/insights/pain-reprocessing-therapy-apps-programs)
- [Effectiveness of Pain Neuroscience Education in Reducing Pain, Disability, Kinesiophobia and Catastrophizing in Chronic LBP — systematic review & meta-analysis](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12734988/)
- [STarT Back Screening Tool — Physiopedia](https://www.physio-pedia.com/STarT_Back_Screening_Tool)
- [Oswestry Disability Index — Physiopedia](https://www.physio-pedia.com/Oswestry_Disability_Index)
- [Digital MSK Tools: 5 Important Features — Optum](https://business.optum.com/en/insights/digital-msk-tools-features.html)
- [Mobile App–Supported Self-Management for Chronic Low Back Pain: Realist Evaluation (JMIR, 2026)](https://mhealth.jmir.org/2026/1/e66435)
- [7 Chronic Pain Apps in 2026: A Clinical-Grade Comparison](https://www.lin.health/insights/chronic-pain-apps)
- [Bearable — chronic pain tracking](https://bearable.app/chronic-pain-app-journal/)
- [Fitness App Development with Real-Time Posture Detection using MediaPipe and React](https://dev.to/yoshan0921/fitness-app-development-with-real-time-posture-detection-using-mediapipe-38do)
- [MediaPipe Pose — documentation](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/pose.md)
