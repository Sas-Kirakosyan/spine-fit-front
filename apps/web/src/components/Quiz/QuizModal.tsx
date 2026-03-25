import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { QuizModalProps } from "@/types/quiz";
import type { GeneratedPlan } from "@spinefit/shared";
import { savePlanToLocalStorage } from "@/storage/planStorage";
import { questions } from "./questions";
import { QuizHeader } from "./QuizHeader";
import { QuizProgressBar } from "./QuizProgressBar";
import { QuizRadioOption } from "./QuizRadioOption";
import { QuizImageRadioOption } from "./QuizImageRadioOption";
import { QuizCheckboxOption } from "./QuizCheckboxOption";
import { QuizInputWithUnit } from "./QuizInputWithUnit";
import { QuizSlider } from "./QuizSlider";
import { QuizNavigationButtons } from "./QuizNavigationButtons";
import { QuizMultiField } from "./QuizMultiField";

export function QuizModal({ isOpen, onClose, onQuizComplete }: QuizModalProps) {
  const { t } = useTranslation();
  const [workoutType] = useState<"home" | "gym">("gym");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
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
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);


  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      if (!question.showIf) return true;

      const { fieldName, equals, in: inArray } = question.showIf;
      const dependentQuestion = questions.find(
        (q) => q.fieldName === fieldName
      );

      if (!dependentQuestion) return true;

      const dependentAnswer = answers[dependentQuestion.id];

      if (dependentAnswer === undefined) return false;

      if (dependentQuestion.type === "multi_field") {
        return true;
      } else if (dependentQuestion.type === "radio") {
        const optionIndex = dependentAnswer as number;
        const selectedOption = dependentQuestion.options?.[optionIndex];

        if (equals !== undefined) {
          return selectedOption === equals;
        }

        if (inArray !== undefined) {
          return inArray.includes(selectedOption as string);
        }
      } else if (dependentQuestion.type === "checkbox") {
        const selectedIndices = dependentAnswer as number[];
        const selectedOptions = selectedIndices.map(
          (i) => dependentQuestion.options?.[i]
        );

        if (equals !== undefined) {
          return selectedOptions.includes(equals as string);
        }

        if (inArray !== undefined) {
          return selectedOptions.some((option) =>
            inArray.includes(option as string)
          );
        }
      } else if (dependentQuestion.type === "input") {
        if (equals !== undefined) {
          return dependentAnswer === equals;
        }

        if (inArray !== undefined) {
          return inArray.includes(dependentAnswer as string);
        }
      }

      return true;
    });
  }, [answers]);

  const actualQuestionsCount = useMemo(() => {
    return filteredQuestions.filter((q) => q.type !== "info").length;
  }, [filteredQuestions]);

  const currentQuestionNumber = useMemo(() => {
    const nonInfoQuestions = filteredQuestions
      .slice(0, currentQuestion + 1)
      .filter((q) => q.type !== "info").length;
    return nonInfoQuestions;
  }, [filteredQuestions, currentQuestion]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);

    const question = filteredQuestions[currentQuestion];
    if (question.type === "radio" || question.type === "image_radio") {
      setAnswers((prev) => ({
        ...prev,
        [question.id]: answerIndex,
      }));
    }
  };

  const handleCheckboxToggle = (index: number) => {
    setSelectedCheckboxes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
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
    if (question.type === "info") {
      return true;
    }
    if (question.optional) {
      return true;
    }
    if (question.type === "multi_field") {
        return true;
    }
    if (question.type === "radio" || question.type === "image_radio") {
      return selectedAnswer !== null;
    } else if (question.type === "checkbox") {
      return selectedCheckboxes.length > 0;
    } else if (question.type === "input" || question.type === "slider") {
      return inputValue.trim() !== "";
    }
    return false;
  };

  const loadAnswerForQuestion = useCallback(
    (questionIndex: number) => {
      const question = filteredQuestions[questionIndex];
      const savedAnswer = answers[question.id];
      const savedUnit = units[question.id];

      if (question.type === "info") {
        setSelectedAnswer(null);
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
          setMultiFieldUnits({
            height: "cm",
            weight: "kg",
          });
        }

        setSelectedAnswer(null);
        setSelectedCheckboxes([]);
        setInputValue("");
      } else if (question.type === "radio") {
        setSelectedAnswer(
          savedAnswer !== undefined ? (savedAnswer as number) : null
        );
        setSelectedCheckboxes([]);
        setInputValue("");
        setMultiFieldValues({});
        setMultiFieldUnits({});
      } else if (question.type === "checkbox") {
        setSelectedCheckboxes(
          savedAnswer !== undefined ? (savedAnswer as number[]) : []
        );
        setSelectedAnswer(null);
        setInputValue("");
        setMultiFieldValues({});
      } else if (question.type === "input" || question.type === "slider") {
        setInputValue(savedAnswer !== undefined ? String(savedAnswer) : "");
        setSelectedAnswer(null);
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
    [answers, units, filteredQuestions]
  );

  const saveCurrentAnswer = () => {
    const question = filteredQuestions[currentQuestion];
    if (question.type === "info") {
      return;
    }
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
    } else if (question.type === "radio" || question.type === "image_radio") {
      answerValue = selectedAnswer!;
    } else if (question.type === "checkbox") {
      answerValue = selectedCheckboxes;
    } else if (question.type === "input" || question.type === "slider") {
      answerValue = inputValue;

      if (question.fieldName === "height") {
        setUnits((prev) => ({
          ...prev,
          [question.id]: heightUnit,
        }));
      } else if (question.fieldName === "weight") {
        setUnits((prev) => ({
          ...prev,
          [question.id]: weightUnit,
        }));
      }
    }

    setAnswers((prev) => ({
      ...prev,
      [question.id]: answerValue,
    }));
  };

  const handleNext = () => {
    if (isAnswered()) {
      saveCurrentAnswer();

      if (currentQuestion < filteredQuestions.length - 1) {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        setTimeout(() => loadAnswerForQuestion(nextQuestion), 0);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      saveCurrentAnswer();
      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
      setTimeout(() => loadAnswerForQuestion(prevQuestion), 0);
    }
  };

  const handleSubmitWithAnswer = async (answerValue: number | number[] | string) => {
    const question = filteredQuestions[currentQuestion];
    const finalUnits = { ...units };

    if (question.fieldName === "height") {
      finalUnits[question.id] = heightUnit;
    } else if (question.fieldName === "weight") {
      finalUnits[question.id] = weightUnit;
    }

    const allAnswers = {
      ...answers,
      [question.id]: answerValue,
    };

    const quizData = {
      workoutType,
      answers: allAnswers,
      units: finalUnits,
      timestamp: new Date().toISOString(),
    };


    localStorage.setItem("quizAnswers", JSON.stringify(quizData));
    localStorage.removeItem("generatedPlan");

    setIsGeneratingPlan(true);
    setApiError(null);

    try {
      const response = await fetch("http://localhost:4000/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const result = await response.json() as { success: boolean; plan: GeneratedPlan };
      if (result.success && result.plan) {
        savePlanToLocalStorage(result.plan);
      }

      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setSelectedCheckboxes([]);
      setInputValue("");
      setAnswers({});
      setUnits({});
      setHeightUnit("cm");
      setWeightUnit("kg");
      setMultiFieldValues({});
      setMultiFieldUnits({});
      onClose();
      if (onQuizComplete) {
        onQuizComplete();
      }
    } catch (err) {
      console.error("Failed to send quiz to API:", err);
      setApiError("Failed to generate your plan. Please check your connection and try again.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSubmit = () => {
    if (isAnswered()) {
      const question = filteredQuestions[currentQuestion];
      let currentAnswerValue: number | number[] | string = "";
      const finalUnits = { ...units };

      if (question.type === "radio" || question.type === "image_radio") {
        currentAnswerValue = selectedAnswer!;
      } else if (question.type === "checkbox") {
        currentAnswerValue = selectedCheckboxes;
      } else if (question.type === "input" || question.type === "slider") {
        currentAnswerValue = inputValue;

        if (question.fieldName === "height") {
          finalUnits[question.id] = heightUnit;
        } else if (question.fieldName === "weight") {
          finalUnits[question.id] = weightUnit;
        }
      }

      handleSubmitWithAnswer(currentAnswerValue);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem("quizAnswers");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const latestQuiz = parsed[parsed.length - 1];
            localStorage.setItem("quizAnswers", JSON.stringify(latestQuiz));
          }
        } catch (error) {
          console.error("Error migrating quiz data:", error);
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadAnswerForQuestion(currentQuestion);
    }
  }, [currentQuestion, isOpen, loadAnswerForQuestion]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setSelectedCheckboxes([]);
      setInputValue("");
      setAnswers({});
      setUnits({});
      setHeightUnit("cm");
      setWeightUnit("kg");
      setMultiFieldValues({});
      setMultiFieldUnits({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const optionListClass =
    "space-y-3 max-h-[50vh] md:max-h-[360px] overflow-y-auto pr-1 -mr-1";
  const question = filteredQuestions[currentQuestion];


  const getDisplayOptions = () => {
    if (question.fieldName === "bodyType" && question.type === "image_radio") {
      const baselineStatsQuestion = questions.find(
        (q) => q.fieldName === "baselineStats"
      );
      if (baselineStatsQuestion) {
        const baselineStats = answers[baselineStatsQuestion.id] as unknown as
          | Record<string, string | number>
          | undefined;
        const gender = baselineStats?.gender;

        if (gender === "Female" && question.optionsFemale) {
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

  if (isGeneratingPlan) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-6">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-lg font-medium text-foreground">Generating your personalized plan…</p>
        <p className="text-sm text-muted-foreground">This may take up to 15 seconds</p>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-6 px-6 text-center">
        <p className="text-lg font-medium text-red-500">{apiError}</p>
        <button
          onClick={() => setApiError(null)}
          className="rounded-lg bg-primary px-6 py-3 text-white font-medium hover:opacity-90 transition"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex h-full w-full md:items-center md:justify-center md:p-4">
      <div className="relative w-full h-full max-w-full md:max-w-[400px] md:h-auto md:max-h-[90vh]">
        <div className="absolute inset-0 bg-background" />
        <div className="relative z-10 flex flex-col h-full md:min-h-[700px] md:max-h-[90vh]">
          <div className="flex flex-col flex-1 justify-beetwen min-h-0">
            <QuizHeader
              currentQuestionNumber={currentQuestionNumber}
              totalQuestions={actualQuestionsCount}
              isInfoScreen={filteredQuestions[currentQuestion].type === "info"}
              onClose={onClose}
            />

            <div className="mt-6 px-2.5 md:ml-[10px] md:mr-[10px] flex-1 overflow-y-auto">
              <div className="rounded-2xl bg-white/95 p-4 md:p-6 text-gray-800 shadow-lg backdrop-blur">
                <QuizProgressBar
                  currentQuestionNumber={currentQuestionNumber}
                  totalQuestions={actualQuestionsCount}
                  isInfoScreen={
                    filteredQuestions[currentQuestion].type === "info"
                  }
                />

                <div className="space-y-6">
                  {filteredQuestions[currentQuestion].type === "info" ? (
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {t(`quiz.questions.${question.id}.title`, { defaultValue: filteredQuestions[currentQuestion].title })}
                      </h3>
                      <p className="text-base text-gray-600 leading-relaxed">
                        {t(`quiz.questions.${question.id}.description`, { defaultValue: filteredQuestions[currentQuestion].description })}
                      </p>
                    </div>
                  ) : (
                    <h3 className="text-xl font-semibold">
                      {t(`quiz.questions.${question.id}.question`, { defaultValue: filteredQuestions[currentQuestion].question })}
                    </h3>
                  )}

                  {filteredQuestions[currentQuestion].type === "radio" && (
                    <div className={optionListClass}>
                      {displayOptions?.map((option, index) => (
                        <QuizRadioOption
                          key={index}
                          option={t(`quiz.questions.${question.id}.options.${index}`, { defaultValue: typeof option === "string" ? option : (option as any).label })}
                          index={index}
                          isSelected={selectedAnswer === index}
                          onSelect={handleAnswerSelect}
                        />
                      ))}
                    </div>
                  )}

                  {filteredQuestions[currentQuestion].type ===
                    "image_radio" && (
                    <div className={optionListClass}>
                      {displayOptions?.map((option, index) => {
                        const imgOption = option as {
                          value: string;
                          label: string;
                          image: string;
                          description: string;
                        };
                        const isFemaleOptions = displayOptions === question.optionsFemale;
                        const optionsKey = isFemaleOptions ? "optionsFemale" : "options";
                        return (
                          <QuizImageRadioOption
                            key={index}
                            option={{
                              ...imgOption,
                              label: t(`quiz.questions.${question.id}.${optionsKey}.${index}.label`, { defaultValue: imgOption.label }),
                              description: t(`quiz.questions.${question.id}.${optionsKey}.${index}.description`, { defaultValue: imgOption.description }),
                            }}
                            index={index}
                            isSelected={selectedAnswer === index}
                            onSelect={handleAnswerSelect}
                          />
                        );
                      })}
                    </div>
                  )}

                  {filteredQuestions[currentQuestion].type === "checkbox" && (
                    <div className={optionListClass}>
                      {filteredQuestions[currentQuestion].options?.map(
                        (option, index) => (
                          <QuizCheckboxOption
                            key={index}
                            option={t(`quiz.questions.${question.id}.options.${index}`, { defaultValue: typeof option === "string" ? option : (option as any).label })}
                            index={index}
                            isSelected={selectedCheckboxes.includes(index)}
                            onToggle={handleCheckboxToggle}
                          />
                        )
                      )}
                    </div>
                  )}

                  {filteredQuestions[currentQuestion].type === "input" && (
                    <div className="space-y-3">
                      {filteredQuestions[currentQuestion].fieldName ===
                        "height" && (
                        <QuizInputWithUnit
                          value={inputValue}
                          unit={heightUnit}
                          unitOptions={["cm", "ft"]}
                          placeholder={
                            heightUnit === "cm"
                              ? t("quiz.input.enterHeightCm")
                              : t("quiz.input.enterHeightFt")
                          }
                          inputType={
                            filteredQuestions[currentQuestion].inputType
                          }
                          onChange={handleInputChange}
                          onUnitChange={(unit) => {
                            setHeightUnit(unit as "cm" | "ft");
                            setUnits((prev) => ({
                              ...prev,
                              [filteredQuestions[currentQuestion].id]: unit as
                                | "cm"
                                | "ft",
                            }));
                          }}
                        />
                      )}

                      {filteredQuestions[currentQuestion].fieldName ===
                        "weight" && (
                        <QuizInputWithUnit
                          value={inputValue}
                          unit={weightUnit}
                          unitOptions={["kg", "lbs"]}
                          placeholder={
                            weightUnit === "kg"
                              ? t("quiz.input.enterWeightKg")
                              : t("quiz.input.enterWeightLbs")
                          }
                          inputType={
                            filteredQuestions[currentQuestion].inputType
                          }
                          onChange={handleInputChange}
                          onUnitChange={(unit) => {
                            setWeightUnit(unit as "kg" | "lbs");
                            setUnits((prev) => ({
                              ...prev,
                              [filteredQuestions[currentQuestion].id]: unit as
                                | "kg"
                                | "lbs",
                            }));
                          }}
                        />
                      )}

                      {filteredQuestions[currentQuestion].fieldName !==
                        "height" &&
                        filteredQuestions[currentQuestion].fieldName !==
                          "weight" && (
                          <input
                            type={
                              filteredQuestions[currentQuestion].inputType ||
                              "text"
                            }
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder={
                              filteredQuestions[currentQuestion].placeholder ||
                              t("quiz.input.enterAnswer")
                            }
                            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg focus:border-main focus:outline-none transition"
                            min={filteredQuestions[currentQuestion].min}
                            max={filteredQuestions[currentQuestion].max}
                          />
                        )}
                    </div>
                  )}

                  {filteredQuestions[currentQuestion].type === "slider" && (
                    <QuizSlider
                      value={inputValue}
                      min={filteredQuestions[currentQuestion].min || 0}
                      max={filteredQuestions[currentQuestion].max || 10}
                      onChange={handleInputChange}
                    />
                  )}

                  {filteredQuestions[currentQuestion].type === "multi_field" &&
                    filteredQuestions[currentQuestion].fields && (
                      <QuizMultiField
                        fields={filteredQuestions[currentQuestion].fields!}
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
                        description={
                          filteredQuestions[currentQuestion].description
                        }
                        questionId={question.id}
                      />
                    )}
                </div>
              </div>
            </div>
            <QuizNavigationButtons
              currentQuestion={currentQuestion}
              totalQuestions={filteredQuestions.length}
              isAnswered={isAnswered()}
              isInfoScreen={filteredQuestions[currentQuestion].type === "info"}
              onBack={handleBack}
              onNext={handleNext}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
