import type { QuizQuestion } from "../types/quiz";

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
    title: "Build Muscle, Protect Your Spine",
    description:
      "We combine professional coaching logic with spine-safe protocols to help you train hard without the fear of a flare-up. Let's customize your journey.",
    buttonText: "Start My Assessment",
  },
  {
    id: 2,
    fieldName: "goal",
    question: "What is your main goal?",
    type: "radio",
    options: [
      "Muscle Hypertrophy (Build mass safely with back/sciatica history)",
      "Structural Recovery (Reduce pain and restore movement capacity)",
    ],
  },

  {
    id: 3,
    fieldName: "baselineStats",
    question: "Standard Metrics",
    type: "multi_field",
    description: "These stats allow us to calibrate your volume and intensity.",
    optional: true,
    fields: [
      {
        id: 3.1,
        fieldName: "gender",
        label: "Gender",
        type: "radio",
        options: ["Male", "Female", "Other"],
        optional: true,
      },
      {
        id: 3.2,
        fieldName: "dateOfBirth",
        label: "Date of Birth",
        type: "date",
        optional: true,
      },
      {
        id: 3.3,
        fieldName: "height",
        label: "Height",
        type: "input",
        inputType: "number",
        placeholder: "Enter height",
        optional: true,
        unitOptions: ["cm", "ft"],
      },
      {
        id: 3.4,
        fieldName: "weight",
        label: "Weight",
        type: "input",
        inputType: "number",
        placeholder: "Enter weight",
        optional: true,
        unitOptions: ["kg", "lbs"],
      },
    ],
  },

  {
    id: 7,
    fieldName: "bodyType",
    question: "Which physique profile best matches yours?",
    type: "image_radio",
    options: [
      {
        value: "8-15",
        label: "8–15% (Lean / Athletic)",
        image: "/quiz/8-15.png",
        description: "Visible muscle definition",
      },
      {
        value: "16-22",
        label: "16–22% (Average)",
        image: "/quiz/16-22.png",
        description: "Some definition, slight fat around waist",
      },
      {
        value: "23-30",
        label: "23–30% (Overfat)",
        image: "/quiz/23-30.png",
        description: "Soft midsection, limited muscle definition",
      },
      {
        value: "30+",
        label: "30%+ (High body fat)",
        image: "/quiz/30-plus.png",
        description: "Higher fat storage around waist and hips",
      },
    ],
    optionsFemale: [
      {
        value: "18-24",
        label: "18–24% (Lean / Athletic)",
        image: "/quiz/female-18-24.png",
        description: "Visible muscle definition, athletic build",
      },
      {
        value: "25-31",
        label: "25–31% (Fit/Average)",
        image: "/quiz/female-25-31.png",
        description: "Healthy, balanced physique",
      },
      {
        value: "32-38",
        label: "32–38% (Overfat)",
        image: "/quiz/female-32-38.png",
        description: "Soft midsection, limited muscle definition",
      },
      {
        value: "38+",
        label: "38%+ (High body fat)",
        image: "/quiz/female-38-plus.png",
        description: "Higher fat storage around waist and hips",
      },
    ],
    showIf: {
      fieldName: "baselineStats",
      showOptionsBasedOn: true,
    },
    // optional: true,
  },

  {
    id: 8,
    fieldName: "experience",
    question: "What is your resistance training experience?",
    type: "radio",
    options: [
      "Beginner — new to training",
      "Intermediate — 1 to 3 years",
      "Advanced — 3+ years",
    ],
  },

  {
    id: 9,
    fieldName: "trainingFrequency",
    question: "How many times per week can you train?",
    type: "radio",
    options: ["2 Days", "3 Days", "4 Days", "5+ Days"],
  },

  {
    id: 10,
    fieldName: "painStatus",
    question: "What is your current spinal health status?",
    type: "radio",
    options: [
      "Healthy (I am pain-free, but cautious)",
      "Recovered (Past history of pain/injury)",
      "Active Symptoms (Currently experiencing discomfort)",
    ],
  },
  {
    id: 11,
    fieldName: "painLocation",
    question: "Where do you feel or did you feel pain?",
    type: "checkbox",
    options: [
      "Lower Back (L4-L5/S1 area)",         // Core Niche
      "Sciatica (Pain radiating down leg)", // Nerve Niche
      "Glute / Deep Hip discomfort",        // Referred Pain
      "Calf or Foot (Numbness/Tingling)",//here needs to show tostmessage reletaed apply to the doctor
    ],
    showIf: {
      fieldName: "painStatus",
      in: [
        "Recovered (Past history of pain/injury)",
        "Active Symptoms (Currently experiencing discomfort)",
      ],
    },
  },
  {
    id: 12,
    fieldName: "painLevel",
    question: "How intense is the pain currently?",
    type: "slider",
    min: 0,
    max: 10,
    showIf: {
      fieldName: "painStatus",
      equals: "Active Symptoms (Currently experiencing discomfort)",
    },
  },
  {
    id: 13,
    fieldName: "painTriggers",
    question: "Which movements trigger or provoke your symptoms?",
    type: "checkbox",
    options: [
      "Bending forward (e.g., reaching for the floor)",
      "Arching backward (e.g., reaching overhead)",
      "Lifting or carrying heavy objects",
      "Sitting for longer than 20–30 minutes",
      "Impact movements (Running, Jumping)",
      "Rotating or twisting the torso",
      "Straining (Heavy bracing/holding breath)",
    ],
    showIf: {
      fieldName: "painStatus",
      in: ["Recovered (Past history of pain/injury)", "Active Symptoms (Currently experiencing discomfort)"],
    },
  },
  {
    id: 14,
    fieldName: "squatConfidence",
    question: "How do you feel about squatting with extra weight?",
    type: "radio",
    options: [
      "Confident (I squat with weights regularly)",
      "Cautious (I only squat with light weights)",
      "Technical (I can squat bodyweight, but weights trigger pain)",
      "Avoidant (I strictly avoid all squatting movements)",
      "Untested (I haven't tried squatting recently)",
    ],
    showIf: {
      fieldName: "painStatus",
      in: ["Recovered (Past history of pain/injury)", "Active Symptoms (Currently experiencing discomfort)"],
    },
  },
  {
    id: 15,
    fieldName: "workoutDuration",
    question: "How long should your workouts be?",
    type: "radio",
    options: ["10–20 min", "20–30 min", "30–45 min", "45–60 min"],
  },
];
