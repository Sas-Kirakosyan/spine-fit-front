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
    fieldName: "intro",
    type: "info",
    title: "Let's personalize your plan",
    description:
      "Answer a few quick questions so we can build a safe and effective workout plan tailored to you.",
    buttonText: "Start",
  },

  {
    id: 2,
    fieldName: "goal",
    question: "What is your main goal?",
    type: "radio",
    options: [
      "Build muscle safely (gym-goer with back or sciatic pain)",
      "Reduce pain and improve back health (rehab-focused user)",
    ],
  },

  {
    id: 3,
    fieldName: "gender",
    question: "What's your gender?",
    type: "radio",
    options: ["Male", "Female", "Other"],
  },

  {
    id: 4,
    fieldName: "age",
    question: "How old are you?",
    type: "input",
    inputType: "number",
    placeholder: "Enter your age",
    min: 12,
    max: 90,
  },

  {
    id: 5,
    fieldName: "height",
    question: "What's your height?",
    type: "input",
    inputType: "number",
    placeholder: "Height in cm",
  },

  {
    id: 6,
    fieldName: "weight",
    question: "What's your current weight?",
    type: "input",
    inputType: "number",
    placeholder: "Weight in kg",
  },
  {
    id: 16,
    fieldName: "bodyType",
    question: "Which body type looks most like you?",
    type: "image_radio",
    options: [
      {
        value: "8-15",
        label: "8–15% (Lean / Athletic)",
        image: "/assets/bodyfat/male_8_15.png",
        description: "Visible muscle definition"
      },
      {
        value: "16-22",
        label: "16–22% (Average)",
        image: "/assets/bodyfat/male_16_22.png",
        description: "Some definition, slight fat around waist"
      },
      {
        value: "23-30",
        label: "23–30% (Overfat)",
        image: "/assets/bodyfat/male_23_30.png",
        description: "Soft midsection, limited muscle definition"
      },
      {
        value: "30+",
        label: "30%+ (High body fat)",
        image: "/assets/bodyfat/male_30_plus.png",
        description: "Higher fat storage around waist and hips"
      }
    ],
    optional: true
  }
  ,

  {
    id: 7,
    fieldName: "experience",
    question: "What's your training experience?",
    type: "radio",
    options: ["Beginner", "Intermediate", "Advanced"],
  },

  {
    id: 8,
    fieldName: "trainingFrequency",
    question: "How many times per week can you train?",
    type: "radio",
    options: ["2", "3", "4", "5+"],
  },
  {
    id: 9,
    fieldName: "hasPain",
    question: "Do you currently experience any pain?",
    type: "radio",
    options: ["Yes", "No"],
  },

  {
    id: 10,
    fieldName: "painLocation",
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
    showIf: { fieldName: "hasPain", equals: "Yes" },
  },

  {
    id: 11,
    fieldName: "painLevel",
    question: "How intense is the pain?",
    type: "slider",
    min: 0,
    max: 10,
    showIf: { fieldName: "hasPain", equals: "Yes" },
  },

  {
    id: 12,
    fieldName: "painTriggers",
    question: "What movements trigger your pain?",
    type: "checkbox",
    options: [
      "Bending forward",
      "Lifting heavy objects",
      "Long sitting",
      "Running or jumping",
      "Deadlifts / squats with weight",
    ],
    showIf: { fieldName: "hasPain", equals: "Yes" },
  },

  {
    id: 13,
    fieldName: "canSquat",
    question: "Can you perform squats without pain?",
    type: "radio",
    options: ["Yes", "Sometimes", "No", "Haven't tried"],
    showIf: { fieldName: "hasPain", equals: "Yes" },
  },

  {
    id: 14,
    fieldName: "trainLocation",
    question: "Where do you train most often?",
    type: "radio",
    options: ["Gym", "Home"],
  },

  {
    id: 15,
    fieldName: "workoutDuration",
    question: "How long should your workouts be?",
    type: "radio",
    options: ["10–20 min", "20–30 min", "30–45 min", "45–60 min"],
  },
];
