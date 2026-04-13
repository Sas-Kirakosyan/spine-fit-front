import {BottomNav} from "@/components/BottomNav/BottomNav.tsx";
import type {IProfilePageProps} from "@spinefit/shared/src/types/pages.ts";
import {Logo} from "@/components/Logo/Logo.tsx";
import {Button} from "@/components/Buttons/Button.tsx";
import {SettingsIcon} from "@/components/Icons/Icons.tsx";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import SelectField from "@/components/SelecteField/SelecteField.tsx";
import InputField from "@/components/InputField/InputField.tsx";
import QuizScrollCalendar from "@/components/Quiz/QuizScrollCalendar.tsx";




function ProfilePage({onNavigateToWorkout, onNavigateToProgress, onNavigateToHistory, onNavigateToProfile, onNavigateToAI, onNavigateToSettings, activePage}: IProfilePageProps) {
    const { t } = useTranslation();

    const [gender, setGender] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [height, setHeight] = useState("");
    const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
    const [weight, setWeight] = useState("");
    const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");

    const handleSave = () => {
        const stored = localStorage.getItem("quizAnswers");
        const quizData = stored ? JSON.parse(stored) : { answers: {}, units: {}, workoutType: "gym" };
        const answer = quizData.answers[3];
        const unit = quizData.units[3];

        const bodyProfileData = {
            dateOfBirth,
            gender,
            height,
            heightUnit,
            weight,
            weightUnit,
        };
        localStorage.setItem("bodyProfile", JSON.stringify(bodyProfileData));

        const data = localStorage.getItem("bodyProfile");
        if (data) {
            const bodyProfile = JSON.parse(data)

            answer.gender = bodyProfile.gender;
            answer.dateOfBirth = bodyProfile.dateOfBirth
            answer.height = bodyProfile.height
            answer.weight = bodyProfile.weight
            unit.weight = bodyProfile.weightUnit
            unit.height = bodyProfile.heightUnit
        }

        console.log(heightUnit)

        quizData.timestamp = new Date().toISOString();

        localStorage.setItem("quizAnswers", JSON.stringify(quizData));

        localStorage.removeItem("generatedPlan");
    };


    useEffect(() => {
        const stored = localStorage.getItem("quizAnswers");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const answers = parsed.answers[3]
                // const units = parsed.units[3]

                const bodyProfileData = {...answers, heightUnit, weightUnit};

                console.log({bodyProfileData})

                localStorage.setItem("bodyProfile", JSON.stringify(bodyProfileData));

                const bodyProfile = localStorage.getItem("bodyProfile");
                if (bodyProfile) {
                    const profile = JSON.parse(bodyProfile);
                    if (profile.gender) {
                        setGender(profile.gender);
                    }
                    if (profile.dateOfBirth) {
                        setDateOfBirth(profile.dateOfBirth);
                    }
                    if (profile.height) {
                        setHeight(profile.height);
                    }
                    if (profile.weight) {
                        setWeight(profile.weight);
                    }
                    if (profile.weightUnit) {
                        setWeightUnit(profile.weightUnit);
                    }
                    if (profile.heightUnit) {
                        setHeightUnit(profile.heightUnit);
                    }
                }
            } catch (error) {
                console.error("Error loading profile data:", error);
            }
        }
    }, []);


    return (
       <div className="bg-background">
           <header className="flex items-start justify-between">
               <div>
                   <Logo />
                   <h1 className="mx-2.5 text-3xl font-semibold text-white">Profile</h1>
               </div>
               <Button
                   onClick={onNavigateToSettings}
                   className="flex items-center gap-2 rounded-[14px] bg-white/10 mx-4 my-5"
               >
                   <SettingsIcon />
               </Button>
           </header>

           <div className="flex-1 px-4 space-y-4 overflow-y-auto">
               <SelectField
                   label="Gender"
                   value={gender}
                   options={["Male", "Female", "Other"]}
                   onChange={setGender}
                   placeholder="Gender"
               />

                <QuizScrollCalendar
                    value={dateOfBirth}
                    onChange={(newVal: string) => setDateOfBirth(newVal)}
                />

               <InputField
                   label="Height"
                   value={height}
                   onChange={setHeight}
                   placeholder="Height"
                   type="number"
                   unit={heightUnit}
                   unitOptions={["cm", "ft"]}
                   onUnitChange={(u) => setHeightUnit(u as "cm" | "ft")}
               />

               <InputField
                   label="Weight"
                   value={weight}
                   onChange={setWeight}
                   placeholder="Weight"
                   type="number"
                   unit={weightUnit}
                   unitOptions={["kg", "lbs"]}
                   onUnitChange={(u) => setWeightUnit(u as "kg" | "lbs")}
               />
           </div>

           <div className="p-4 mt-auto">
               <Button
                   onClick={handleSave}
                   className="w-full py-4 rounded-xl bg-main text-white font-semibold hover:bg-main/90 transition"
               >
                   Save
               </Button>
           </div>

           <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[440px]">
               <BottomNav
                   activePage={activePage}
                   onWorkoutClick={onNavigateToWorkout}
                   onProgressClick={onNavigateToProgress}
                   onHistoryClick={onNavigateToHistory}
                   onProfileClick={onNavigateToProfile}
                   onAIClick={onNavigateToAI}
               />
           </div>
       </div>
    );
}

export default ProfilePage;