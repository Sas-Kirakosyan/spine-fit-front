import {type ChangeEvent, useEffect, useState} from "react";
import { useTranslation } from "react-i18next";
import CalendarIcon from "@/assets/CalendarIcon/CalendarIcon.tsx";
import QuizEmblaCarousel from "@/components/Quiz/QuizEmblaCarousel.tsx";

interface IQuizScrollCalendarProps {
    value: string
    onChange: (value: string) => void
}

function QuizScrollCalendar({ value, onChange }: IQuizScrollCalendarProps) {
    const { t } = useTranslation();
    const [tempDate, setTempDate] = useState({ month: 'Jan', day: 1, year: 1990 });
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const toggleDialog = () => {
        if (!isDialogOpen) {
            const [day, month, year] = value.split('/').map(Number);

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            if (day && month >= 1 && month <= 12 && year >= 1930) {
                setTempDate({
                    month: monthNames[month - 1],
                    day: day,
                    year: year
                });
            } else {
                setTempDate({ month: 'Jan', day: 1, year: 1990 });
            }
        }
        setIsDialogOpen(!isDialogOpen);
    };

    const formatDateInput = (value: string) => {
        let digits = value.replace(/\D/g, '');
        if (digits.length > 8) digits = digits.substring(0, 8);

        let dayStr = digits.substring(0, 2);
        let monthStr = digits.substring(2, 4);
        let yearStr = digits.substring(4, 8);

        let day = parseInt(dayStr) || 0;
        let month = parseInt(monthStr) || 0;
        let year = parseInt(yearStr) || 0;

        if (yearStr.length === 4 && year > 2026) {
            yearStr = '2026';
            year = 2026;
        }

        if (yearStr.length === 4 && year < 1930) {
            yearStr = '1930';
            year = 1930;
        }

        if (monthStr.length === 2 && (month > 12 || month === 0)) {
            monthStr = '12';
            month = 12;
        }

        if (month > 0 && yearStr.length === 4) {
            const maxDays = new Date(year, month, 0).getDate();
            if (day > maxDays) {
                day = maxDays;
                dayStr = maxDays.toString();
            }
        }
        else if (day > 31) {
            day = 31;
            dayStr = '31';
        }

        let formatted = dayStr;
        if (digits.length >= 3) formatted += '/' + monthStr;
        if (digits.length >= 5) formatted += '/' + yearStr;

        return formatted;
    };


    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formatted = formatDateInput(value);
        onChange(formatted);
    };

    const handleConfirm = () => {
        const months: { [key: string]: string } = {
            Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
            Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
        };

        const dayNum = tempDate.day.toString().padStart(2, '0');
        const monthNum = months[tempDate.month];
        const yearNum = tempDate.year.toString();

        onChange(`${dayNum}/${monthNum}/${yearNum}`);
        setIsDialogOpen(false);
    };

    const handleCancel = () => {
        setIsDialogOpen(false);
    };

    useEffect(() => {
        const handleBodyScroll = (isOpen: boolean) => {
            document.body.style.overflow = isOpen ? "hidden" : "";
        };
        if (isDialogOpen) {
            handleBodyScroll(true);
        } else {
            handleBodyScroll(false);
        }
        return () => handleBodyScroll(false);
    }, [isDialogOpen]);

    return (
        <div className="relative flex items-center justify-around w-full">
            <input
                className="w-full bg-background border placeholder-white border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none"
                type="text"
                value={value}
                onChange={handleInputChange}
                placeholder={t("quiz.calendar.placeholder")}
                maxLength={10}
            />
            <button
                type="button"
                onClick={toggleDialog}
                className="ml-2"
            >
                <CalendarIcon />
            </button>

            {isDialogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={handleCancel}
                    />

                    <div className="relative z-[101] w-full max-w-[340px] bg-background rounded-[30px] p-6 shadow-2xl border border-white/5 flex flex-col">
                        <h3 className="text-xl font-bold mb-4 text-white">{t("quiz.calendar.dateOfBirth")}</h3>

                        <div className="h-[150px] w-full flex justify-center items-center overflow-hidden">
                            <QuizEmblaCarousel onChange={(val: any) => setTempDate(val)} initialDate={tempDate}/>
                        </div>

                        <div className="flex justify-end gap-10 mt-6 pr-2">
                            <button
                                onClick={handleCancel}
                                className="text-main font-bold text-lg active:scale-95 transition-transform"
                            >
                                {t("quiz.calendar.cancel")}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="text-main font-bold text-lg active:scale-95 transition-transform"
                            >
                                {t("quiz.calendar.ok")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QuizScrollCalendar;