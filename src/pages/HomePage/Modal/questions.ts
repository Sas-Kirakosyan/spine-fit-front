import type { QuizQuestion } from "@/types/quiz";

export const allTriggers = [
  "squats",
  "deadlifts",
  "long_sitting",
  "running",
  "bending",
  "lifting",
];

export const questions: QuizQuestion[] = [
  {
    id: 1,
    question: "What's your gender?",
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
    question: "What's your height?",
    type: "input",
    inputType: "number",
    placeholder: "Enter height in cm",
  },
  {
    id: 4,
    question: "What's your current weight?",
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
    question: "What's your pain point?",
    type: "checkbox",
    options: ["Spine", "Back", "Legs", "Shoulders", "Other"],
  },
  {
    id: 10,
    question: "What's your pain level?",
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
