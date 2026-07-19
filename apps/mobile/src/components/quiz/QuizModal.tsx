import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { questions } from "@spinefit/shared";
import type { QuizModalProps } from "@spinefit/shared";
import { storage } from "../../storage/storageAdapter";
import { getCurrentUser } from "../../lib/authService";
import {
  saveQuizToSupabase,
  type StoredQuizData,
} from "../../lib/quizStorage";
import {
  RegistrationForm,
  type RegistrationFormData,
  type RegistrationSuccessInfo,
} from "../form/RegistrationForm";
import { GoogleSignInButton } from "../form/GoogleSignInButton";
import { AuthSwitchLink } from "../form/AuthSwitchLink";
import { WarningIcon } from "../icons/Icons";
import { QuizHeader } from "./QuizHeader";
import { QuizProgressBar } from "./QuizProgressBar";
import { QuizRadioOption } from "./QuizRadioOption";
import { QuizImageRadioOption } from "./QuizImageRadioOption";
import { QuizCheckboxOption } from "./QuizCheckboxOption";
import { QuizInputWithUnit } from "./QuizInputWithUnit";
import { QuizSlider } from "./QuizSlider";
import { QuizNavigationButtons } from "./QuizNavigationButtons";
import { QuizMultiField } from "./QuizMultiField";
import { QuizYearSelect } from "./QuizYearSelect";

type QuizMode = "quiz" | "registration" | "confirmEmail";

const goalQuestion = questions.find((q) => q.fieldName === "goal");

export function QuizModal({
  isOpen,
  onClose,
  onQuizComplete,
  onNavigateToLogin,
}: QuizModalProps) {
  const { t } = useTranslation();
  const [workoutType] = useState<"home" | "gym">("gym");
  const [oauthError, setOauthError] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [answers, setAnswers] = useState<
    Record<number, number | number[] | string | Record<string, string | number>>
  >({});
  const [units, setUnits] = useState<
    Record<number, "cm" | "ft" | "kg" | "lbs" | Record<string, string>>
  >({});
  const [multiFieldValues, setMultiFieldValues] = useState<
    Record<string, string | number>
  >({});
  const [multiFieldUnits, setMultiFieldUnits] = useState<
    Record<string, string>
  >({});
  const [mode, setMode] = useState<QuizMode>("quiz");

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      if (!question.showIf) return true;
      const { fieldName, equals, in: inArray } = question.showIf;
      const dependentQuestion = questions.find(
        (q) => q.fieldName === fieldName,
      );
      if (!dependentQuestion) return true;
      const dependentAnswer = answers[dependentQuestion.id];
      if (dependentAnswer === undefined) return false;

      if (dependentQuestion.type === "multi_field") return true;

      if (dependentQuestion.type === "radio") {
        const optionIndex = dependentAnswer as number;
        const selectedOption = dependentQuestion.options?.[optionIndex];
        if (equals !== undefined) return selectedOption === equals;
        if (inArray !== undefined)
          return inArray.includes(selectedOption as string);
      } else if (dependentQuestion.type === "checkbox") {
        const selectedIndices = dependentAnswer as number[];
        const selectedOptions = selectedIndices.map(
          (i) => dependentQuestion.options?.[i],
        );
        if (equals !== undefined)
          return selectedOptions.includes(equals as string);
        if (inArray !== undefined)
          return selectedOptions.some((o) => inArray.includes(o as string));
      } else if (dependentQuestion.type === "input") {
        if (equals !== undefined) return dependentAnswer === equals;
        if (inArray !== undefined)
          return inArray.includes(dependentAnswer as string);
      }
      return true;
    });
  }, [answers]);

  const actualQuestionsCount = useMemo(
    () => questions.filter((q) => q.type !== "info").length,
    [],
  );

  const currentQuestionNumber = useMemo(() => {
    const question = filteredQuestions[currentQuestion];
    if (!question || question.type === "info") return 0;
    return (question.id as number) - 1;
  }, [filteredQuestions, currentQuestion]);

  const handleAnswerSelect = (answerIndex: number) => {
    const question = filteredQuestions[currentQuestion];
    if (!question) return;

    if (question.type === "radio" || question.type === "image_radio") {
      setAnswers((prev) => {
        const next: typeof prev = { ...prev, [question.id]: answerIndex };
        // Changing painStatus switches the goal question's option set, so a
        // previously picked goal index would point at the wrong option.
        if (
          question.fieldName === "painStatus" &&
          goalQuestion &&
          prev[question.id] !== answerIndex
        ) {
          delete next[goalQuestion.id];
        }
        return next;
      });
    }
  };

  const handleCheckboxToggle = (index: number) => {
    setSelectedCheckboxes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleInputChange = (value: string) => {
    const question = filteredQuestions[currentQuestion];
    if (
      question.fieldName === "painLevel" &&
      question.type === "slider" &&
      question.inputType === "number"
    ) {
      const numValue = parseFloat(value);
      if (
        value === "" ||
        (!isNaN(numValue) && numValue >= 0 && numValue <= 10)
      ) {
        setInputValue(value);
      }
    } else {
      setInputValue(value);
    }
  };

  const isAnswered = () => {
    const question = filteredQuestions[currentQuestion];
    const currentSavedAnswer = answers[question.id];
    if (question.type === "info") return true;
    if (question.optional) return true;
    if (question.type === "multi_field" || question.type === "textarea")
      return true;
    if (question.type === "radio" || question.type === "image_radio")
      return currentSavedAnswer !== undefined && currentSavedAnswer !== null;
    if (question.type === "checkbox") return selectedCheckboxes.length > 0;
    if (question.type === "input" || question.type === "slider")
      return inputValue.trim() !== "";
    return false;
  };

  const loadAnswerForQuestion = useCallback(
    (questionIndex: number) => {
      const question = filteredQuestions[questionIndex];
      const savedAnswer = answers[question.id];
      const savedUnit = units[question.id];

      if (question.type === "info") {
        setSelectedCheckboxes([]);
        setInputValue("");
        setMultiFieldValues({});
        setMultiFieldUnits({});
      } else if (question.type === "multi_field") {
        const saved = savedAnswer as unknown as
          | Record<string, string | number>
          | undefined;
        setMultiFieldValues(saved || {});
        const savedUnits = units[question.id];
        if (typeof savedUnits === "object") {
          setMultiFieldUnits(savedUnits as Record<string, string>);
        } else {
          setMultiFieldUnits({ height: "cm", weight: "kg" });
        }
        setSelectedCheckboxes([]);
        setInputValue("");
      } else if (question.type === "textarea") {
        setInputValue(savedAnswer !== undefined ? String(savedAnswer) : "");
        setSelectedCheckboxes([]);
        setMultiFieldValues({});
        setMultiFieldUnits({});
      } else if (question.type === "radio") {
        setSelectedCheckboxes([]);
        setInputValue("");
        setMultiFieldValues({});
        setMultiFieldUnits({});
      } else if (question.type === "checkbox") {
        setSelectedCheckboxes(
          savedAnswer !== undefined ? (savedAnswer as number[]) : [],
        );
        setInputValue("");
        setMultiFieldValues({});
      } else if (question.type === "input" || question.type === "slider") {
        setInputValue(savedAnswer !== undefined ? String(savedAnswer) : "");
        setSelectedCheckboxes([]);
        setMultiFieldValues({});
        setMultiFieldUnits({});

        if (question.fieldName === "height") {
          setHeightUnit(savedUnit === "ft" ? "ft" : "cm");
        } else if (question.fieldName === "weight") {
          setWeightUnit(savedUnit === "lbs" ? "lbs" : "kg");
        }
      }
    },
    [answers, units, filteredQuestions],
  );

  const saveCurrentAnswer = () => {
    const question = filteredQuestions[currentQuestion];
    if (question.type === "info") return;

    let answerValue:
      | number
      | number[]
      | string
      | Record<string, string | number>;

    if (question.type === "multi_field") {
      answerValue = multiFieldValues;
      if (Object.keys(multiFieldUnits).length > 0) {
        setUnits((prev) => ({
          ...prev,
          [question.id]: multiFieldUnits as any,
        }));
      }
    } else if (question.type === "textarea") {
      answerValue = inputValue;
    } else if (question.type === "radio" || question.type === "image_radio") {
      answerValue = answers[question.id];
    } else if (question.type === "checkbox") {
      answerValue = selectedCheckboxes;
    } else if (question.type === "input" || question.type === "slider") {
      answerValue = inputValue;
      if (question.fieldName === "height") {
        setUnits((prev) => ({ ...prev, [question.id]: heightUnit }));
      } else if (question.fieldName === "weight") {
        setUnits((prev) => ({ ...prev, [question.id]: weightUnit }));
      }
    } else {
      return;
    }

    setAnswers((prev) => ({ ...prev, [question.id]: answerValue }));
  };

  const handleNext = () => {
    if (isAnswered()) {
      saveCurrentAnswer();
      if (currentQuestion < filteredQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      saveCurrentAnswer();
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const buildQuizData = (): StoredQuizData => {
    const question = filteredQuestions[currentQuestion];
    let currentAnswerValue:
      | number
      | number[]
      | string
      | Record<string, string | number> = "";
    const finalUnits = { ...units };

    if (question.type === "radio" || question.type === "image_radio") {
      currentAnswerValue = answers[question.id] as number;
    } else if (question.type === "checkbox") {
      currentAnswerValue = selectedCheckboxes;
    } else if (question.type === "textarea") {
      currentAnswerValue = inputValue;
    } else if (question.type === "multi_field") {
      currentAnswerValue = multiFieldValues;
      if (Object.keys(multiFieldUnits).length > 0) {
        finalUnits[question.id] = multiFieldUnits as Record<string, string>;
      }
    } else if (question.type === "input" || question.type === "slider") {
      currentAnswerValue = inputValue;
      if (question.fieldName === "height") {
        finalUnits[question.id] = heightUnit;
      } else if (question.fieldName === "weight") {
        finalUnits[question.id] = weightUnit;
      }
    }

    return {
      workoutType,
      answers: { ...answers, [question.id]: currentAnswerValue },
      units: finalUnits,
      timestamp: new Date().toISOString(),
    };
  };

  const handleSubmit = async () => {
    if (!isAnswered()) return;
    const quizData = buildQuizData();
    await storage.setJSON("quizAnswers", quizData);
    setMode("registration");
  };

  const finishAndComplete = () => {
    onClose();
    onQuizComplete?.();
  };

  const handleRegistrationSuccess = async (
    _formData: RegistrationFormData,
    info: RegistrationSuccessInfo,
  ) => {
    const quizData = await storage.getJSON<StoredQuizData>("quizAnswers");
    if (!quizData) {
      console.error("Quiz data missing after registration");
      onClose();
      return;
    }

    if (info.requiresEmailConfirmation) {
      // Session is not established yet — stash quiz for retryPendingQuizSync
      // to upload once the user confirms their email, and surface a "check
      // your inbox" screen instead of silently skipping the sync.
      await storage.setJSON("pendingQuizSync", quizData);
      setMode("confirmEmail");
      return;
    }

    if (info.userId) {
      try {
        await saveQuizToSupabase(info.userId, quizData);
      } catch (err) {
        console.error("Failed to persist quiz to Supabase:", err);
      }
    }

    finishAndComplete();
  };

  const handleGoogleSuccess = async () => {
    const quizData = await storage.getJSON<StoredQuizData>("quizAnswers");
    const user = await getCurrentUser();
    if (quizData && user) {
      try {
        await saveQuizToSupabase(user.id, quizData);
      } catch (err) {
        console.error("Failed to persist quiz to Supabase:", err);
      }
    }
    finishAndComplete();
  };

  const resetState = () => {
    setCurrentQuestion(0);
    setSelectedCheckboxes([]);
    setInputValue("");
    setAnswers({});
    setUnits({});
    setHeightUnit("cm");
    setWeightUnit("kg");
    setMultiFieldValues({});
    setMultiFieldUnits({});
    setMode("quiz");
    setOauthError("");
  };

  // Schema v1 guard: Q11 used to be a multi_field object (baselineStats).
  // If the saved answer for id=11 is a plain object, the data is stale —
  // clear it so the user starts fresh with the new question order.
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const quizData = await storage.getJSON<StoredQuizData>("quizAnswers");
      const q11 = quizData?.answers?.[11];
      if (q11 !== null && typeof q11 === "object" && !Array.isArray(q11)) {
        await storage.removeItem("quizAnswers");
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) loadAnswerForQuestion(currentQuestion);
  }, [currentQuestion, isOpen, loadAnswerForQuestion]);

  useEffect(() => {
    if (!isOpen) resetState();
  }, [isOpen]);

  const question = filteredQuestions[currentQuestion];

  const getDisplayOptions = () => {
    if (question.fieldName === "bodyType" && question.type === "image_radio") {
      const baselineStatsQuestion = questions.find(
        (q) => q.fieldName === "baselineStats",
      );
      if (baselineStatsQuestion) {
        const baselineStats = answers[baselineStatsQuestion.id] as unknown as
          | Record<string, string | number>
          | undefined;
        if (baselineStats?.gender === "Female" && question.optionsFemale) {
          return question.optionsFemale;
        }
      }

      const genderQuestion = questions.find((q) => q.fieldName === "gender");
      if (genderQuestion) {
        const genderAnswer = answers[genderQuestion.id];
        if (genderAnswer === 1 && question.optionsFemale) {
          return question.optionsFemale;
        }
      }
    }
    return question.options;
  };

  const displayOptions = getDisplayOptions();

  // Android hardware back mirrors the web browser-back behaviour: step back
  // through the quiz / registration flow before closing the modal.
  const handleRequestClose = () => {
    if (mode === "registration") {
      setMode("quiz");
      return;
    }
    if (mode === "confirmEmail") {
      onClose();
      return;
    }
    if (currentQuestion > 0) {
      handleBack();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleRequestClose}
    >
      <SafeAreaView className="flex-1 py-5 bg-[#132f54]">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {mode === "confirmEmail" && (
            <View className="flex-1 justify-between">
              <QuizHeader
                currentQuestionNumber={actualQuestionsCount}
                totalQuestions={actualQuestionsCount}
                isInfoScreen={false}
                onClose={onClose}
              />
              <ScrollView
                className="flex-1 mt-6 px-2.5"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View className="rounded-2xl bg-white/95 p-6">
                  <Text className="text-xl font-semibold text-gray-900">
                    {t("quiz.nav.confirmEmailTitle")}
                  </Text>
                  <Text className="mt-3 text-sm text-gray-600">
                    {t("quiz.nav.confirmEmailMessage")}
                  </Text>
                </View>
              </ScrollView>
              <View className="mt-6 mx-4 mb-5">
                <Pressable
                  onPress={onClose}
                  className="w-full items-center rounded-full bg-white/10 px-8 py-4"
                >
                  <Text className="text-base font-medium text-white">
                    {t("quiz.nav.confirmEmailDone")}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {mode === "registration" && (
            <View className="flex-1 justify-between">
              <QuizHeader
                currentQuestionNumber={actualQuestionsCount}
                totalQuestions={actualQuestionsCount}
                isInfoScreen={false}
                onClose={onClose}
              />
              <ScrollView
                className="flex-1 mt-6 px-2.5"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View className="rounded-2xl bg-white/95 p-4">
                  <Text className="text-xl font-semibold text-gray-900">
                    {t("quiz.nav.registerStepTitle")}
                  </Text>
                  <Text className="mt-2 text-sm text-gray-600">
                    {t("quiz.nav.registerStepSubtitle")}
                  </Text>

                  <RegistrationForm
                    submitLabel={t("quiz.nav.registerAndGenerate")}
                    onSuccess={handleRegistrationSuccess}
                  />

                  <View className="mt-5 gap-3">
                    {oauthError ? (
                      <Text className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                        {oauthError}
                      </Text>
                    ) : null}
                    <GoogleSignInButton
                      label={t("registrationPage.continueWithGoogle")}
                      onError={setOauthError}
                      onSuccess={handleGoogleSuccess}
                    />
                  </View>

                  <AuthSwitchLink
                    variant="onLight"
                    question={t("registrationPage.haveAccount")}
                    linkText={t("registrationPage.login")}
                    onPress={() => {
                      onClose();
                      onNavigateToLogin?.();
                    }}
                  />
                </View>
              </ScrollView>
              <View className="mt-6 mx-4 mb-5">
                <Pressable
                  onPress={() => setMode("quiz")}
                  className="w-full items-center rounded-full bg-white/10 px-8 py-4"
                >
                  <Text className="text-base font-medium text-white">
                    {t("quiz.nav.backToQuiz")}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {mode === "quiz" && (
            <View className="flex-1 justify-between">
              <QuizHeader
                currentQuestionNumber={currentQuestionNumber}
                totalQuestions={actualQuestionsCount}
                isInfoScreen={question.type === "info"}
                onClose={onClose}
              />

              <ScrollView
                className="flex-1 mt-6 px-2.5"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View className="rounded-2xl bg-white/95 p-4">
                  <QuizProgressBar
                    currentQuestionNumber={currentQuestionNumber}
                    totalQuestions={actualQuestionsCount}
                    isInfoScreen={question.type === "info"}
                  />

                  <View className="gap-6">
                    {question.type === "info" ? (
                      <View className="gap-4">
                        <Text className="text-2xl font-bold text-gray-900">
                          {t(`quiz.questions.${question.id}.title`, {
                            defaultValue: question.title,
                          })}
                        </Text>
                        <Text className="text-base text-gray-600 leading-relaxed">
                          {t(`quiz.questions.${question.id}.description`, {
                            defaultValue: question.description,
                          })}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-xl font-semibold text-gray-800">
                        {t(`quiz.questions.${question.id}.question`, {
                          defaultValue: question.question,
                        })}
                      </Text>
                    )}

                    {question.type === "radio" && (
                      <View className="gap-3">
                        {displayOptions?.map((option, index) => (
                          <QuizRadioOption
                            key={index}
                            option={t(
                              `quiz.questions.${question.id}.options.${index}`,
                              {
                                defaultValue:
                                  typeof option === "string"
                                    ? option
                                    : option.label,
                              },
                            )}
                            index={index}
                            isSelected={answers[question.id] === index}
                            onSelect={handleAnswerSelect}
                          />
                        ))}
                      </View>
                    )}

                    {question.type === "image_radio" && (
                      <View className="gap-3">
                        {displayOptions?.map((option, index) => {
                          if (typeof option === "string") return null;
                          const isFemaleOptions =
                            displayOptions === question.optionsFemale;
                          const optionsKey = isFemaleOptions
                            ? "optionsFemale"
                            : "options";
                          return (
                            <QuizImageRadioOption
                              key={index}
                              option={{
                                ...option,
                                label: t(
                                  `quiz.questions.${question.id}.${optionsKey}.${index}.label`,
                                  { defaultValue: option.label },
                                ),
                                description: t(
                                  `quiz.questions.${question.id}.${optionsKey}.${index}.description`,
                                  { defaultValue: option.description ?? "" },
                                ),
                              }}
                              index={index}
                              isSelected={answers[question.id] === index}
                              onSelect={handleAnswerSelect}
                            />
                          );
                        })}
                      </View>
                    )}

                    {question.type === "checkbox" && (
                      <View>
                        <View className="gap-3">
                          {question.options?.map((option, index) => (
                            <QuizCheckboxOption
                              key={index}
                              option={t(
                                `quiz.questions.${question.id}.options.${index}`,
                                {
                                  defaultValue:
                                    typeof option === "string"
                                      ? option
                                      : option.label,
                                },
                              )}
                              index={index}
                              isSelected={selectedCheckboxes.includes(index)}
                              onToggle={handleCheckboxToggle}
                            />
                          ))}
                        </View>
                        {question.fieldName === "painLocation" &&
                          selectedCheckboxes.includes(3) && (
                            <View
                              accessibilityRole="alert"
                              className="mt-3 flex-row items-start gap-2 rounded-md border-l-4 border-red-500 bg-red-50 px-3 py-2"
                            >
                              <View className="mt-0.5">
                                <WarningIcon size={16} color="#7f1d1d" />
                              </View>
                              <Text className="flex-1 text-sm text-red-900">
                                {t(
                                  `quiz.questions.${question.id}.calfFootWarning`,
                                  {
                                    defaultValue:
                                      "Numbness or tingling in the calf or foot may indicate nerve compression. Please consult a doctor before starting any training program.",
                                  },
                                )}
                              </Text>
                            </View>
                          )}
                      </View>
                    )}

                    {question.type === "input" && (
                      <View className="gap-3">
                        {question.fieldName === "height" && (
                          <QuizInputWithUnit
                            value={inputValue}
                            unit={heightUnit}
                            unitOptions={["cm", "ft"]}
                            placeholder={
                              heightUnit === "cm"
                                ? t("quiz.input.enterHeightCm")
                                : t("quiz.input.enterHeightFt")
                            }
                            inputType={question.inputType}
                            onChange={handleInputChange}
                            onUnitChange={(unit) => {
                              setHeightUnit(unit as "cm" | "ft");
                              setUnits((prev) => ({
                                ...prev,
                                [question.id]: unit as "cm" | "ft",
                              }));
                            }}
                          />
                        )}
                        {question.fieldName === "weight" && (
                          <QuizInputWithUnit
                            value={inputValue}
                            unit={weightUnit}
                            unitOptions={["kg", "lbs"]}
                            placeholder={
                              weightUnit === "kg"
                                ? t("quiz.input.enterWeightKg")
                                : t("quiz.input.enterWeightLbs")
                            }
                            inputType={question.inputType}
                            onChange={handleInputChange}
                            onUnitChange={(unit) => {
                              setWeightUnit(unit as "kg" | "lbs");
                              setUnits((prev) => ({
                                ...prev,
                                [question.id]: unit as "kg" | "lbs",
                              }));
                            }}
                          />
                        )}
                        {question.fieldName === "birthYear" && (
                          <QuizYearSelect
                            value={inputValue}
                            min={question.min}
                            max={question.max}
                            onChange={handleInputChange}
                          />
                        )}
                        {question.fieldName !== "height" &&
                          question.fieldName !== "weight" &&
                          question.fieldName !== "birthYear" && (
                            <TextInput
                              value={inputValue}
                              onChangeText={handleInputChange}
                              placeholder={
                                question.placeholder ||
                                t("quiz.input.enterAnswer")
                              }
                              placeholderTextColor="rgba(0,0,0,0.25)"
                              keyboardType={
                                question.inputType === "number"
                                  ? "numeric"
                                  : "default"
                              }
                              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg text-gray-900"
                            />
                          )}
                      </View>
                    )}

                    {question.type === "slider" && (
                      <QuizSlider
                        value={inputValue}
                        min={question.min || 0}
                        max={question.max || 10}
                        onChange={handleInputChange}
                      />
                    )}

                    {question.type === "textarea" && (
                      <View className="gap-4">
                        <TextInput
                          value={inputValue}
                          onChangeText={handleInputChange}
                          placeholder={t(
                            `quiz.questions.${question.id}.placeholder`,
                            {
                              defaultValue:
                                question.placeholder ||
                                t("quiz.input.enterAnswer"),
                            },
                          )}
                          placeholderTextColor="rgba(0,0,0,0.25)"
                          multiline
                          textAlignVertical="top"
                          style={{ minHeight: 120 }}
                          className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base text-gray-900"
                        />
                        <View className="flex-row flex-wrap gap-2">
                          {(
                            t(`quiz.questions.${question.id}.templates`, {
                              returnObjects: true,
                              defaultValue: [],
                            }) as string[]
                          ).map((templateText, i) => {
                            const isActive = inputValue.includes(templateText);
                            return (
                              <Pressable
                                key={i}
                                onPress={() => {
                                  if (isActive) {
                                    const updated = inputValue
                                      .replace(templateText, "")
                                      .replace(/\n{2,}/g, "\n")
                                      .trim();
                                    handleInputChange(updated);
                                  } else {
                                    handleInputChange(
                                      inputValue
                                        ? `${inputValue}\n${templateText}`
                                        : templateText,
                                    );
                                  }
                                }}
                                className={`flex-row items-center rounded-full border-2 px-4 py-2 ${
                                  isActive
                                    ? "border-main bg-main/10"
                                    : "border-gray-200"
                                }`}
                              >
                                <Text
                                  className={`text-[13px] font-medium ${
                                    isActive ? "text-main" : "text-gray-700"
                                  }`}
                                >
                                  {isActive ? "✓ " : "+ "}
                                  {templateText}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {question.type === "multi_field" && question.fields && (
                      <QuizMultiField
                        fields={question.fields}
                        values={multiFieldValues}
                        units={multiFieldUnits}
                        onValueChange={(fieldName, value) => {
                          setMultiFieldValues((prev) => ({
                            ...prev,
                            [fieldName]: value,
                          }));
                        }}
                        onUnitChange={(fieldName, unit) => {
                          setMultiFieldUnits((prev) => ({
                            ...prev,
                            [fieldName]: unit,
                          }));
                        }}
                        description={question.description}
                      />
                    )}
                  </View>
                </View>
              </ScrollView>

              <QuizNavigationButtons
                currentQuestion={currentQuestion}
                totalQuestions={filteredQuestions.length}
                isAnswered={isAnswered()}
                isInfoScreen={question.type === "info"}
                onBack={handleBack}
                onNext={handleNext}
                onSubmit={handleSubmit}
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
