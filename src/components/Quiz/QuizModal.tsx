import { useState, useEffect, useCallback, useMemo } from "react";
import type { QuizModalProps } from "@/types/quiz";
import { questions } from "./questions";
import { QuizHeader } from "./QuizHeader";
import { QuizProgressBar } from "./QuizProgressBar";
import { QuizRadioOption } from "./QuizRadioOption";
import { QuizImageRadioOption } from "./QuizImageRadioOption";
import { QuizCheckboxOption } from "./QuizCheckboxOption";
import { QuizInputWithUnit } from "./QuizInputWithUnit";
import { QuizSlider } from "./QuizSlider";
import { QuizNavigationButtons } from "./QuizNavigationButtons";

export function QuizModal({
  isOpen,
  onClose,
  workoutType,
  onQuizComplete,
}: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [answers, setAnswers] = useState<
    Record<number, number | number[] | string>
  >({});
  const [units, setUnits] = useState<
    Record<number, "cm" | "ft" | "kg" | "lbs">
  >({});

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

      if (dependentQuestion.type === "radio") {
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
          return selectedOptions.some((option) => inArray.includes(option as string));
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
      const answerValue = answerIndex;
      setAnswers((prev) => ({
        ...prev,
        [question.id]: answerValue,
      }));

      setTimeout(() => {
        if (currentQuestion < filteredQuestions.length - 1) {
          const nextQuestion = currentQuestion + 1;
          setCurrentQuestion(nextQuestion);
          setTimeout(() => loadAnswerForQuestion(nextQuestion), 0);
        } else {
          handleSubmitWithAnswer(answerValue);
        }
      }, 300);
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
      } else if (question.type === "radio") {
        setSelectedAnswer(
          savedAnswer !== undefined ? (savedAnswer as number) : null
        );
        setSelectedCheckboxes([]);
        setInputValue("");
      } else if (question.type === "checkbox") {
        setSelectedCheckboxes(
          savedAnswer !== undefined ? (savedAnswer as number[]) : []
        );
        setSelectedAnswer(null);
        setInputValue("");
      } else if (question.type === "input" || question.type === "slider") {
        setInputValue(savedAnswer !== undefined ? String(savedAnswer) : "");
        setSelectedAnswer(null);
        setSelectedCheckboxes([]);

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
    let answerValue: number | number[] | string;

    if (question.type === "radio" || question.type === "image_radio") {
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

  const handleSkip = () => {
    const question = filteredQuestions[currentQuestion];
    const updatedAnswers = {
      ...answers,
      [question.id]: "",
    };
    setAnswers(updatedAnswers);

    if (currentQuestion < filteredQuestions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      setTimeout(() => loadAnswerForQuestion(nextQuestion), 0);
    } else {
      const finalUnits = { ...units };
      const quizData = {
        workoutType,
        answers: updatedAnswers,
        units: finalUnits,
        timestamp: new Date().toISOString(),
      };

      const savedQuizzes = JSON.parse(
        localStorage.getItem("quizAnswers") || "[]"
      );
      savedQuizzes.push(quizData);
      localStorage.setItem("quizAnswers", JSON.stringify(savedQuizzes));

      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setSelectedCheckboxes([]);
      setInputValue("");
      setAnswers({});
      setUnits({});
      setHeightUnit("cm");
      setWeightUnit("kg");
      onClose();
      if (onQuizComplete) {
        onQuizComplete();
      }
    }
  };

  const handleSubmitWithAnswer = (answerValue: number | number[] | string) => {
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

    const savedQuizzes = JSON.parse(
      localStorage.getItem("quizAnswers") || "[]"
    );
    savedQuizzes.push(quizData);
    localStorage.setItem("quizAnswers", JSON.stringify(savedQuizzes));

    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setSelectedCheckboxes([]);
    setInputValue("");
    setAnswers({});
    setUnits({});
    setHeightUnit("cm");
    setWeightUnit("kg");
    onClose();
    if (onQuizComplete) {
      onQuizComplete();
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const optionListClass = "space-y-3 max-h-[360px] overflow-y-auto pr-1 -mr-1";

  return (
    <div className="fixed inset-0 z-50 flex h-full w-full md:items-center md:justify-center md:p-4">
      <div className="relative w-full h-full md:max-w-[400px] md:h-auto">
        <div className="absolute inset-0 bg-background" />
        <div className="relative z-10 flex flex-col h-full md:min-h-[700px]">
          <div className="flex flex-col flex-1 justify-between min-h-0">
            <QuizHeader
              currentQuestionNumber={currentQuestionNumber}
              totalQuestions={actualQuestionsCount}
              isInfoScreen={filteredQuestions[currentQuestion].type === "info"}
              onClose={onClose}
            />

            <div className="mt-6 px-2 md:ml-[10px] md:mr-[10px] flex-1 overflow-y-auto">
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
                        {filteredQuestions[currentQuestion].title}
                      </h3>
                      <p className="text-base text-gray-600 leading-relaxed">
                        {filteredQuestions[currentQuestion].description}
                      </p>
                    </div>
                  ) : (
                    <h3 className="text-xl font-semibold">
                      {filteredQuestions[currentQuestion].question}
                    </h3>
                  )}

                  {filteredQuestions[currentQuestion].type === "radio" && (
                    <div className={optionListClass}>
                      {filteredQuestions[currentQuestion].options?.map(
                        (option, index) => (
                          <QuizRadioOption
                            key={index}
                            option={option}
                            index={index}
                            isSelected={selectedAnswer === index}
                            onSelect={handleAnswerSelect}
                          />
                        )
                      )}
                    </div>
                  )}

                  {filteredQuestions[currentQuestion].type ===
                    "image_radio" && (
                    <div className={optionListClass}>
                      {filteredQuestions[currentQuestion].options?.map(
                        (option, index) => (
                          <QuizImageRadioOption
                            key={index}
                            option={
                              option as {
                                value: string;
                                label: string;
                                image: string;
                                description: string;
                              }
                            }
                            index={index}
                            isSelected={selectedAnswer === index}
                            onSelect={handleAnswerSelect}
                          />
                        )
                      )}
                    </div>
                  )}

                  {filteredQuestions[currentQuestion].type === "checkbox" && (
                    <div className={optionListClass}>
                      {filteredQuestions[currentQuestion].options?.map(
                        (option, index) => (
                          <QuizCheckboxOption
                            key={index}
                            option={option}
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
                              ? "Enter height in cm"
                              : "Enter height in ft"
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
                              ? "Enter weight in kg"
                              : "Enter weight in lbs"
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
                              "Enter your answer"
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
                </div>
              </div>
            </div>

            <QuizNavigationButtons
              currentQuestion={currentQuestion}
              totalQuestions={filteredQuestions.length}
              isAnswered={isAnswered()}
              isOptional={filteredQuestions[currentQuestion].optional || false}
              isInfoScreen={filteredQuestions[currentQuestion].type === "info"}
              hideNextButton={
                filteredQuestions[currentQuestion].type === "radio" ||
                filteredQuestions[currentQuestion].type === "image_radio"
              }
              buttonText={filteredQuestions[currentQuestion].buttonText}
              onBack={handleBack}
              onNext={handleNext}
              onSkip={handleSkip}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
