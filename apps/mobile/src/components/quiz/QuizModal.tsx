import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { questions } from "@spinefit/shared";
import type { QuizModalProps } from "@spinefit/shared";
import { storage } from "../../storage/storageAdapter";
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
  const [workoutType] = useState<"gym">("gym");
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
    () => filteredQuestions.filter((q) => q.type !== "info").length,
    [filteredQuestions],
  );

  const currentQuestionNumber = useMemo(
    () =>
      filteredQuestions
        .slice(0, currentQuestion + 1)
        .filter((q) => q.type !== "info").length,
    [filteredQuestions, currentQuestion],
  );

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    const question = filteredQuestions[currentQuestion];
    if (question.type === "radio" || question.type === "image_radio") {
      setAnswers((prev) => ({ ...prev, [question.id]: answerIndex }));
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
    if (
      question.type === "info" ||
      question.optional ||
      question.type === "multi_field"
    )
      return true;
    if (question.type === "radio" || question.type === "image_radio")
      return selectedAnswer !== null;
    if (question.type === "checkbox") return selectedCheckboxes.length > 0;
    if (question.type === "input" || question.type === "slider")
      return inputValue.trim() !== "";
    return false;
  };

  const loadAnswerForQuestion = useCallback(
    (questionIndex: number) => {
      const question = filteredQuestions[questionIndex];
      const savedAnswer = answers[question.id];

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
          setMultiFieldUnits({ height: "cm", weight: "kg" });
        }
        setSelectedAnswer(null);
        setSelectedCheckboxes([]);
        setInputValue("");
      } else if (question.type === "radio") {
        setSelectedAnswer(
          savedAnswer !== undefined ? (savedAnswer as number) : null,
        );
        setSelectedCheckboxes([]);
        setInputValue("");
        setMultiFieldValues({});
        setMultiFieldUnits({});
      } else if (question.type === "checkbox") {
        setSelectedCheckboxes(
          savedAnswer !== undefined ? (savedAnswer as number[]) : [],
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
        const savedUnit = units[question.id];
        if (question.fieldName === "height")
          setHeightUnit(savedUnit === "ft" ? "ft" : "cm");
        else if (question.fieldName === "weight")
          setWeightUnit(savedUnit === "lbs" ? "lbs" : "kg");
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
    } else if (question.type === "radio" || question.type === "image_radio") {
      answerValue = selectedAnswer!;
    } else if (question.type === "checkbox") {
      answerValue = selectedCheckboxes;
    } else if (question.type === "input" || question.type === "slider") {
      answerValue = inputValue;
      if (question.fieldName === "height")
        setUnits((prev) => ({ ...prev, [question.id]: heightUnit }));
      else if (question.fieldName === "weight")
        setUnits((prev) => ({ ...prev, [question.id]: weightUnit }));
    } else {
      return;
    }

    setAnswers((prev) => ({ ...prev, [question.id]: answerValue }));
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

  const handleSubmit = async () => {
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
        if (question.fieldName === "height")
          finalUnits[question.id] = heightUnit;
        else if (question.fieldName === "weight")
          finalUnits[question.id] = weightUnit;
      }

      const allAnswers = { ...answers, [question.id]: currentAnswerValue };
      const quizData = {
        workoutType,
        answers: allAnswers,
        units: finalUnits,
        timestamp: new Date().toISOString(),
      };

      await storage.setJSON("quizAnswers", quizData);
      await storage.removeItem("generatedPlan");

      resetState();
      onClose();
      onQuizComplete?.();
    }
  };

  const resetState = () => {
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
  };

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
    }
    return question.options;
  };

  const displayOptions = getDisplayOptions();

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView className="flex-1 py-5 bg-[#132f54]">
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
                      {question.title}
                    </Text>
                    <Text className="text-xl text-gray-600 leading-relaxed">
                      {question.description}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-2xl font-semibold text-gray-800">
                    {question.question}
                  </Text>
                )}

                {question.type === "radio" && (
                  <View className="gap-3">
                    {displayOptions?.map((option, index) => (
                      <QuizRadioOption
                        key={index}
                        option={option}
                        index={index}
                        isSelected={selectedAnswer === index}
                        onSelect={handleAnswerSelect}
                      />
                    ))}
                  </View>
                )}

                {question.type === "image_radio" && (
                  <View className="gap-3">
                    {displayOptions?.map((option, index) =>
                      typeof option !== "string" ? (
                        <QuizImageRadioOption
                          key={index}
                          option={option}
                          index={index}
                          isSelected={selectedAnswer === index}
                          onSelect={handleAnswerSelect}
                        />
                      ) : null,
                    )}
                  </View>
                )}

                {question.type === "checkbox" && (
                  <View className="gap-3">
                    {question.options?.map((option, index) => (
                      <QuizCheckboxOption
                        key={index}
                        option={option}
                        index={index}
                        isSelected={selectedCheckboxes.includes(index)}
                        onToggle={handleCheckboxToggle}
                      />
                    ))}
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
                            ? "Enter height in cm"
                            : "Enter height in ft"
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
                            ? "Enter weight in kg"
                            : "Enter weight in lbs"
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
            buttonText={question.buttonText}
            onBack={handleBack}
            onNext={handleNext}
            onSubmit={handleSubmit}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
