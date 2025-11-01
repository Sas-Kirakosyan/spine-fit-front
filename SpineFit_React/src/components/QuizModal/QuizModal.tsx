import { useState, useEffect } from "react";
import userData from "../../MockData/user.json";

interface QuizQuestion {
  id: number;
  question: string;
  type: "radio" | "checkbox" | "input";
  options?: string[];
  correctAnswer?: number | number[] | string | number;
  inputType?: "number" | "text";
  placeholder?: string;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutType: "home" | "gym";
}

export function QuizModal({ isOpen, onClose, workoutType }: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [answers, setAnswers] = useState<
    Record<number, number | number[] | string>
  >({});

  const allTriggers = [
    "squats",
    "deadlifts",
    "long_sitting",
    "running",
    "bending",
    "lifting",
  ];
  const userTriggers = userData.back_assessments[0]?.triggers || [];

  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: "What is your gender?",
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
      question: "What is your height?",
      type: "input",
      inputType: "number",
      placeholder: "Enter height in cm",
    },
    {
      id: 4,
      question: "What is your current weight?",
      type: "input",
      inputType: "number",
      placeholder: "Enter weight in kg",
    },
    {
      id: 5,
      question: "What is your weight goal?",
      type: "input",
      inputType: "number",
      placeholder: "Enter weight goal in kg",
    },
    {
      id: 6,
      question: "What is your body fat percent?",
      type: "input",
      inputType: "number",
      placeholder: "Enter body fat percent",
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
      question: "What is your pain point?",
      type: "checkbox",
      options: ["Spine", "Back", "Legs", "Shoulders", "Other"],
    },
    {
      id: 10,
      question: "What is your pain level?",
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
      question.id === 9 &&
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

  const handleSubmit = () => {
    if (isAnswerValid()) {
      const question = questions[currentQuestion];
      let currentAnswerValue: number | number[] | string;

      if (question.type === "radio") {
        currentAnswerValue = selectedAnswer!;
      } else if (question.type === "checkbox") {
        currentAnswerValue = selectedCheckboxes;
      } else {
        currentAnswerValue = inputValue;
      }

      const allAnswers = {
        ...answers,
        [question.id]: currentAnswerValue,
      };

      const quizData = {
        workoutType,
        answers: allAnswers,
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
      onClose();
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000080]  p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {workoutType === "home" ? "Home Workout" : "Gym Workout"}
              </h2>
              <p className="text-blue-100 mt-1">
                Question {currentQuestion + 1} / {questions.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {questions[currentQuestion].question}
            </h3>

            {/* Options based on question type */}
            {questions[currentQuestion].type === "radio" && (
              <div className="space-y-3">
                {questions[currentQuestion].options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedAnswer === index
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                          selectedAnswer === index
                            ? "bg-blue-600"
                            : "border-2 border-gray-300"
                        }`}
                      >
                        {selectedAnswer === index && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
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
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedCheckboxes.includes(index)
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded mr-3 flex items-center justify-center ${
                          selectedCheckboxes.includes(index)
                            ? "bg-blue-600"
                            : "border-2 border-gray-300"
                        }`}
                      >
                        {selectedCheckboxes.includes(index) && (
                          <svg
                            className="w-3 h-3 text-white"
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
              <div>
                <input
                  type={questions[currentQuestion].inputType || "text"}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={
                    questions[currentQuestion].placeholder ||
                    "Enter your answer"
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition-colors text-lg"
                  min={
                    questions[currentQuestion].inputType === "number"
                      ? questions[currentQuestion].id === 9
                        ? 0
                        : undefined
                      : undefined
                  }
                  max={
                    questions[currentQuestion].inputType === "number"
                      ? questions[currentQuestion].id === 9
                        ? 10
                        : undefined
                      : undefined
                  }
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              {currentQuestion > 0 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
              )}
              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!isAnswerValid()}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    isAnswerValid()
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!isAnswerValid()}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    isAnswerValid()
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
