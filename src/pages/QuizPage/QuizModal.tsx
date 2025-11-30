import { useState, useEffect } from "react";
import { PageContainer } from "@/Layout/PageContainer"; // TODO: check if needed
import { Button } from "@/components/Buttons/Button";
import type { QuizQuestion, QuizModalProps } from "@/types/quiz";

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

  const allTriggers = [
    "squats",
    "deadlifts",
    "long_sitting",
    "running",
    "bending",
    "lifting",
  ];

  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: "What’s your gender?",
      type: "radio",
      options: ["Male", "Female", "Other"],
    },
    {
      id: 2,
      question: "How old are you?",
      type: "input",
      inputType: "number",
      placeholder: "Enter your age",
    },
    {
      id: 3,
      question: "What’s your height?",
      type: "input",
      inputType: "number",
      placeholder: "Enter height in cm",
    },
    {
      id: 4,
      question: "What’s your current weight?",
      type: "input",
      inputType: "number",
      placeholder: "Enter weight in kg",
    },
    {
      id: 5,
      question: "What's your weight goal?",
      type: "input",
      inputType: "number",
      placeholder: "Enter weight goal in kg",
      optional: true,
    },
    {
      id: 6,
      question: "What's your body fat percent?",
      type: "input",
      inputType: "number",
      placeholder: "Enter body fat percent",
      optional: true,
    },
    {
      id: 7,
      question: "Your training experience",
      type: "radio",
      options: ["Begginer", "Intermediate", "Advanced"],
    },
    {
      id: 8,
      question: "How many times per week do you train?",
      type: "radio",
      options: ["2", "3", "4"],
      correctAnswer: 1,
    },
    {
      id: 9,
      question: "What’s your pain point?",
      type: "checkbox",
      options: ["Spine", "Back", "Legs", "Shoulders", "Other"],
    },
    {
      id: 10,
      question: "What’s your pain level?",
      type: "input",
      inputType: "number",
      placeholder: "Enter pain level (0-10)",
    },
    {
      id: 11,
      question: "What causes pain?",
      type: "checkbox",
      options: allTriggers.map((trigger) =>
        trigger === "squats"
          ? "Squats"
          : trigger === "deadlifts"
          ? "Deadlifts"
          : trigger === "long_sitting"
          ? "Long sitting"
          : trigger === "running"
          ? "Running"
          : trigger === "bending"
          ? "Bending"
          : trigger === "lifting"
          ? "Lifting"
          : trigger
      ),
    },
    {
      id: 12,
      question: `What type of back pain was recorded?`,
      type: "radio",
      options: ["L4-L5", "L5-S1", "C5-C6", "No pain"],
    },
    {
      id: 13,
      question: `Can you perform squats without pain?`,
      type: "radio",
      options: ["Yes, always", "Sometimes", "No, always pain", "Haven't tried"],
    },
  ];

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleCheckboxToggle = (index: number) => {
    setSelectedCheckboxes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleInputChange = (value: string) => {
    const question = questions[currentQuestion];
    if (
      question.id === 10 &&
      question.type === "input" &&
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

  const isAnswerValid = () => {
    const question = questions[currentQuestion];
    if (question.optional) {
      return true;
    }
    if (question.type === "radio") {
      return selectedAnswer !== null;
    } else if (question.type === "checkbox") {
      return selectedCheckboxes.length > 0;
    } else if (question.type === "input") {
      return inputValue.trim() !== "";
    }
    return false;
  };

  const loadAnswerForQuestion = (questionIndex: number) => {
    const question = questions[questionIndex];
    const savedAnswer = answers[question.id];
    const savedUnit = units[question.id];

    if (question.type === "radio") {
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
    } else if (question.type === "input") {
      setInputValue(savedAnswer !== undefined ? String(savedAnswer) : "");
      setSelectedAnswer(null);
      setSelectedCheckboxes([]);

      if (question.id === 3) {
        setHeightUnit(savedUnit === "ft" ? "ft" : "cm");
      } else if (question.id === 4 || question.id === 5) {
        setWeightUnit(savedUnit === "lbs" ? "lbs" : "kg");
      }
    }
  };

  const saveCurrentAnswer = () => {
    const question = questions[currentQuestion];
    let answerValue: number | number[] | string;

    if (question.type === "radio") {
      answerValue = selectedAnswer!;
    } else if (question.type === "checkbox") {
      answerValue = selectedCheckboxes;
    } else {
      answerValue = inputValue;

      if (question.id === 3) {
        setUnits((prev) => ({
          ...prev,
          [question.id]: heightUnit,
        }));
      } else if (question.id === 4 || question.id === 5) {
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
    if (isAnswerValid()) {
      saveCurrentAnswer();

      if (currentQuestion < questions.length - 1) {
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
    const question = questions[currentQuestion];
    const updatedAnswers = {
      ...answers,
      [question.id]: "",
    };
    setAnswers(updatedAnswers);

    if (currentQuestion < questions.length - 1) {
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

  const handleSubmit = () => {
    if (isAnswerValid()) {
      const question = questions[currentQuestion];
      let currentAnswerValue: number | number[] | string;
      const finalUnits = { ...units };

      if (question.type === "radio") {
        currentAnswerValue = selectedAnswer!;
      } else if (question.type === "checkbox") {
        currentAnswerValue = selectedCheckboxes;
      } else {
        currentAnswerValue = inputValue;

        if (question.id === 3) {
          finalUnits[question.id] = heightUnit;
        } else if (question.id === 4 || question.id === 5) {
          finalUnits[question.id] = weightUnit;
        }
      }

      const allAnswers = {
        ...answers,
        [question.id]: currentAnswerValue,
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
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAnswerForQuestion(currentQuestion);
    }
  }, [currentQuestion, isOpen]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  p-4">
      <PageContainer
        isStandalone={false}
        overlayClassName="bg-black/50"
        minHeightClassName="min-h-[720px]"
        contentClassName="justify-between"
      >
        <div className="flex items-start justify-between   text-white">
          <div>
            <h2 className="text-2xl font-semibold">Personalizing your plan</h2>
            <p className="mt-1 text-sm text-white/80">
              Question {currentQuestion + 1} / {questions.length}
            </p>
          </div>
          <Button
            onClick={onClose}
            className="flex items-center gap-2 rounded-[14px] bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
          >
            Home
          </Button>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto">
          <div className="rounded-2xl bg-white/95 p-6 text-gray-800 shadow-lg backdrop-blur">
            <div className="mb-6">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${
                      ((currentQuestion + 1) / questions.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">
                {questions[currentQuestion].question}
              </h3>

              {questions[currentQuestion].type === "radio" && (
                <div className="space-y-3">
                  {questions[currentQuestion].options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full rounded-lg border-2 p-4 text-left transition ${
                        selectedAnswer === index
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`mr-3 flex h-5 w-5 items-center justify-center rounded-full ${
                            selectedAnswer === index
                              ? "bg-blue-600"
                              : "border-2 border-gray-300"
                          }`}
                        >
                          {selectedAnswer === index && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="font-medium">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {questions[currentQuestion].type === "checkbox" && (
                <div className="space-y-3">
                  {questions[currentQuestion].options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleCheckboxToggle(index)}
                      className={`w-full rounded-lg border-2 p-4 text-left transition ${
                        selectedCheckboxes.includes(index)
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`mr-3 flex h-5 w-5 items-center justify-center rounded ${
                            selectedCheckboxes.includes(index)
                              ? "bg-blue-600"
                              : "border-2 border-gray-300"
                          }`}
                        >
                          {selectedCheckboxes.includes(index) && (
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="font-medium">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {questions[currentQuestion].type === "input" && (
                <div className="space-y-3">
                  {questions[currentQuestion].id === 3 && (
                    <div className="flex gap-3">
                      <input
                        type={questions[currentQuestion].inputType || "text"}
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={
                          heightUnit === "cm"
                            ? "Enter height in cm"
                            : "Enter height in ft"
                        }
                        className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 text-lg focus:border-blue-600 focus:outline-none transition"
                      />
                      <select
                        value={heightUnit}
                        onChange={(e) => {
                          setHeightUnit(e.target.value as "cm" | "ft");
                          setUnits((prev) => ({
                            ...prev,
                            [questions[currentQuestion].id]: e.target.value as
                              | "cm"
                              | "ft",
                          }));
                        }}
                        className="rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-lg focus:border-blue-600 focus:outline-none transition"
                      >
                        <option value="cm">cm</option>
                        <option value="ft">ft</option>
                      </select>
                    </div>
                  )}

                  {(questions[currentQuestion].id === 4 ||
                    questions[currentQuestion].id === 5) && (
                    <div className="flex gap-3">
                      <input
                        type={questions[currentQuestion].inputType || "text"}
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={
                          weightUnit === "kg"
                            ? questions[currentQuestion].id === 4
                              ? "Enter weight in kg"
                              : "Enter weight goal in kg"
                            : questions[currentQuestion].id === 4
                            ? "Enter weight in lbs"
                            : "Enter weight goal in lbs"
                        }
                        className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 text-lg focus:border-blue-600 focus:outline-none transition"
                      />
                      <select
                        value={weightUnit}
                        onChange={(e) => {
                          setWeightUnit(e.target.value as "kg" | "lbs");
                          setUnits((prev) => ({
                            ...prev,
                            [questions[currentQuestion].id]: e.target.value as
                              | "kg"
                              | "lbs",
                          }));
                        }}
                        className="rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-lg focus:border-blue-600 focus:outline-none transition"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                  )}

                  {questions[currentQuestion].id === 6 && (
                    <div className="flex gap-3">
                      <input
                        type={questions[currentQuestion].inputType || "text"}
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={
                          questions[currentQuestion].placeholder ||
                          "Enter your answer"
                        }
                        className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 text-lg focus:border-blue-600 focus:outline-none transition"
                      />
                      <div className="flex items-center rounded-lg border-2 border-gray-300 bg-gray-50 px-4 py-3 text-lg font-medium text-gray-700">
                        %
                      </div>
                    </div>
                  )}

                  {questions[currentQuestion].id !== 3 &&
                    questions[currentQuestion].id !== 4 &&
                    questions[currentQuestion].id !== 5 &&
                    questions[currentQuestion].id !== 6 && (
                      <input
                        type={questions[currentQuestion].inputType || "text"}
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={
                          questions[currentQuestion].placeholder ||
                          "Enter your answer"
                        }
                        className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg focus:border-blue-600 focus:outline-none transition"
                        min={
                          questions[currentQuestion].inputType === "number"
                            ? questions[currentQuestion].id === 10
                              ? 0
                              : undefined
                            : undefined
                        }
                        max={
                          questions[currentQuestion].inputType === "number"
                            ? questions[currentQuestion].id === 10
                              ? 10
                              : undefined
                            : undefined
                        }
                      />
                    )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-white">
          {questions[currentQuestion].optional ? (
            <button
              onClick={handleSkip}
              className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium transition hover:bg-white/20"
            >
              Skip
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            {currentQuestion > 0 && (
              <button
                onClick={handleBack}
                className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium transition hover:bg-white/20"
              >
                Back
              </button>
            )}
            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isAnswerValid()}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                  isAnswerValid()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white/10 text-white/60 cursor-not-allowed"
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isAnswerValid()}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                  isAnswerValid()
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-white/10 text-white/60 cursor-not-allowed"
                }`}
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
