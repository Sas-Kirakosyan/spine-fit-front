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
    type: "info",
    title: "Let's personalize your plan",
    description:
      "Answer a few quick questions so we can build a safe and effective workout plan tailored to you.",
    buttonText: "Start",
  },

  {
    id: 2,
    question: "What is your main goal?",
    type: "radio",
    options: [
      "Build muscle safely (gym-goer with back or sciatic pain)",
      "Reduce pain and improve back health (rehab-focused user)",
    ],
  },

  {
    id: 3,
    question: "What's your gender?",
    type: "radio",
    options: ["Male", "Female", "Other"],
  },

  {
    id: 4,
    question: "How old are you?",
    type: "input",
    inputType: "number",
    placeholder: "Enter your age",
    min: 12,
    max: 90,
  },

  {
    id: 5,
    question: "What's your height?",
    type: "input",
    inputType: "number",
    placeholder: "Height in cm",
  },

  {
    id: 6,
    question: "What's your current weight?",
    type: "input",
    inputType: "number",
    placeholder: "Weight in kg",
  },

  {
    id: 7,
    question: "What's your training experience?",
    type: "radio",
    options: ["Beginner", "Intermediate", "Advanced"],
  },

  {
    id: 8,
    question: "How many times per week can you train?",
    type: "radio",
    options: ["2", "3", "4", "5+"],
  },
  {
    id: 9,
    question: "Do you currently experience any pain?",
    type: "radio",
    options: ["Yes", "No"],
  },

  {
    id: 10,
    question: "Where do you feel pain?",
    type: "checkbox",
    options: [
      "Lower back (L5–S1)",
      "Middle back",
      "Upper back",
      "Sciatica",
      "Leg",
      "Shoulder",
      "Other",
    ],
    showIf: { questionId: 9, equals: "Yes" },
  },

  {
    id: 11,
    question: "How intense is the pain?",
    type: "slider",
    min: 0,
    max: 10,
    showIf: { questionId: 9, equals: "Yes" },
  },

  {
    id: 12,
    question: "What movements trigger your pain?",
    type: "checkbox",
    options: [
      "Bending forward",
      "Lifting heavy objects",
      "Long sitting",
      "Running or jumping",
      "Deadlifts / squats with weight",
    ],
    showIf: { questionId: 9, equals: "Yes" },
  },

  {
    id: 13,
    question: "Can you perform squats without pain?",
    type: "radio",
    options: ["Yes", "Sometimes", "No", "Haven't tried"],
    showIf: { questionId: 9, equals: "Yes" },
  },

  {
    id: 14,
    question: "Where do you train most often?",
    type: "radio",
    options: ["Gym", "Home"],
  },

  {
    id: 15,
    question: "How long should your workouts be?",
    type: "radio",
    options: ["10–20 min", "20–30 min", "30–45 min", "45–60 min"],
  },
];
