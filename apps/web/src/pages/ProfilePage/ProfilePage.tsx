import {BottomNav} from "@/components/BottomNav/BottomNav.tsx";
import type {IProfilePageProps} from "@spinefit/shared/src/types/pages.ts";
import {Logo} from "@/components/Logo/Logo.tsx";
import {Button} from "@/components/Buttons/Button.tsx";
import {SettingsIcon} from "@/components/Icons/Icons.tsx";
import {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import SelectField from "@/components/SelecteField/SelecteField.tsx";
import InputField from "@/components/InputField/InputField.tsx";
import QuizScrollCalendar from "@/components/Quiz/QuizScrollCalendar.tsx";
import ErrorIcon from "@/assets/ErrorIcon/ErrorIncon.tsx";

function ProfilePage({onNavigateToWorkout, onNavigateToProgress, onNavigateToHistory, onNavigateToProfile, onNavigateToAI, onNavigateToSettings, activePage}: IProfilePageProps) {
    const { t } = useTranslation();

    const [gender, setGender] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [height, setHeight] = useState("");
    const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
    const [weight, setWeight] = useState("");
    const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");

    const [heightError, setHeightError] = useState("")
    const [weightError, setWeightError] = useState("")

    const handleSave = () => {
        if (heightError || weightError) return;

        const stored = localStorage.getItem("quizAnswers");
        const quizData = stored ? JSON.parse(stored) : { answers: {}, units: {}, workoutType: "gym" };

        const bodyProfileData = {
            dateOfBirth,
            gender,
            height,
            weight,
            units: {
                height: heightUnit,
                weight: weightUnit
            }
        };

        localStorage.setItem("bodyProfile", JSON.stringify(bodyProfileData));

        if (!quizData.answers[3]) quizData.answers[3] = {};
        if (!quizData.units[3]) quizData.units[3] = {};

        const answer = quizData.answers[3];
        const units = quizData.units[3];

        answer.gender = gender;
        answer.dateOfBirth = dateOfBirth;
        answer.height = height;
        answer.weight = weight;

        units.height = heightUnit;
        units.weight = weightUnit;

        quizData.timestamp = new Date().toISOString();
        localStorage.setItem("quizAnswers", JSON.stringify(quizData));

        localStorage.removeItem("generatedPlan");
    };

    const validateHeight = useCallback((height: number, unit: "cm" | "ft") => {
        if (!height || String(height).trim() === "") return "";

        if (unit === "cm") {
            if (height > 272 || height < 50) return t("profilePage.errors.height.rangeCm");
        }
        if (unit === "ft") {
            if (height > 9.8 || height < 1.65) return t("profilePage.errors.height.rangeFt");
        }
        return "";
    }, [t]);

    const validateWeight = useCallback((weight: number, unit: "kg" | "lbs") => {
        if (!weight || String(weight).trim() === "") return "";

        if (unit === "kg") {
            if (weight > 300 || weight < 40) return t("profilePage.errors.weight.rangeKg");
        }
        if (unit === "lbs") {
            if (weight > 661 || weight < 85) return t("profilePage.errors.weight.rangeLbs");
        }
        return "";
    }, [t])

    useEffect(() => {
        setHeightError(validateHeight(Number(height), heightUnit));
    }, [height, heightUnit, validateHeight]);

    useEffect(() => {
        setWeightError(validateWeight(Number(weight), weightUnit));
    }, [validateWeight, weight, weightUnit]);

    useEffect(() => {
        const stored = localStorage.getItem("quizAnswers");
        if (!stored) return;

        try {
            const parsed = JSON.parse(stored);
            const answers = parsed.answers?.[3] || {};
            const units = parsed.units?.[3] || {};

            if (answers.gender) setGender(answers.gender);
            if (answers.dateOfBirth) setDateOfBirth(answers.dateOfBirth);
            if (answers.height) setHeight(answers.height);
            if (answers.weight) setWeight(answers.weight);

            if (units.height) setHeightUnit(units.height);
            if (units.weight) setWeightUnit(units.weight);

            const bodyProfileData = { ...answers, units };
            localStorage.setItem("bodyProfile", JSON.stringify(bodyProfileData));

        } catch (error) {
            console.error("Error loading profile data:", error);
        }
    }, []);


    return (
        <div className="bg-background h-screen flex flex-col overflow-hidden">
            <header className="flex items-start justify-between">
                <div>
                    <Logo />
                    <h1 className="mx-2.5 text-3xl font-semibold text-white">{t("profilePage.title")}</h1>
                </div>
                <Button
                    onClick={onNavigateToSettings}
                    className="flex items-center gap-2 rounded-[14px] bg-white/10 mx-4 my-5"
                >
                    <SettingsIcon />
                </Button>
            </header>

            <div className="flex flex-col flex-1 justify-evenly">
                <div className="flex flex-col px-4 space-y-4 gap-2">
                    <SelectField
                        value={gender}
                        options={[t("profilePage.genders.male"), t("profilePage.genders.female"), t("profilePage.genders.other")]}
                        onChange={setGender}
                        placeholder={t("profilePage.placeholders.gender")}
                    />

                    <QuizScrollCalendar
                        value={dateOfBirth}
                        onChange={(newVal: string) => setDateOfBirth(newVal)}
                    />

                    <div className="flex flex-col gap-0.5">
                        <InputField
                            value={height}
                            onChange={setHeight}
                            placeholder={t("profilePage.placeholders.height")}
                            type="number"
                            unit={heightUnit}
                            unitOptions={["cm", "ft"]}
                            onUnitChange={(u) => setHeightUnit(u as "cm" | "ft")}
                        />
                        {!!heightError && (
                            <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
                                <span><ErrorIcon /></span>
                                {heightError}
                            </p>
                        )}
                    </div>

                    <div>
                        <InputField
                            value={weight}
                            onChange={setWeight}
                            placeholder={t("profilePage.placeholders.weight")}
                            type="number"
                            unit={weightUnit}
                            unitOptions={["kg", "lbs"]}
                            onUnitChange={(u) => setWeightUnit(u as "kg" | "lbs")}
                        />
                        {!!weightError && (
                            <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
                                <span><ErrorIcon /></span>
                                {weightError}
                            </p>
                        )}
                    </div>

                </div>

                <div className="p-4">
                    <Button
                        disabled={!!(heightError || weightError)}
                        onClick={handleSave}
                        className={
                            `w-full py-4 rounded-xl text-white font-semibold transition
                            ${heightError || weightError
                                ? "bg-[#b85c00] cursor-not-allowed opacity-70"
                                : "bg-main "
                            }`
                        }
                    >
                        {t("profilePage.saveButton")}
                    </Button>
                </div>
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