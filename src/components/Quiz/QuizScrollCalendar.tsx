import {type ChangeEvent, useEffect, useState} from "react";
import CalendarIcon from "@/assets/CalendarIcon/CalendarIcon.tsx";
import QuizEmblaCarousel from "@/components/Quiz/QuizEmblaCarousel.tsx";

function QuizScrollCalendar() {
    const [inputValue, setInputValue] = useState("");
    const [tempDate, setTempDate] = useState({ month: 'Jan', day: 1, year: 1990 });
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const toggleDialog = () => setIsDialogOpen(!isDialogOpen);

    const formatDateInput = (value: string) => {

        const digits = value.replace(/\D/g, '');
        let formatted = '';

        if (digits.length > 0) {
            let month = digits.substring(0, 2);
            if (month.length === 2) {
                const mNum = parseInt(month);
                if (mNum > 12) month = '12';
                if (mNum === 0) month = '01';
            }
            formatted = month;

            if (digits.length >= 3) {
                let day = digits.substring(2, 4);
                if (day.length === 2) {
                    const mNum = parseInt(month);
                    const dNum = parseInt(day);
                    const yearPart = digits.length >= 8 ? parseInt(digits.substring(4, 8)) : 2026;

                    const maxDays = new Date(yearPart, mNum, 0).getDate();

                    if (dNum > maxDays) day = maxDays.toString().padStart(2, '0');
                    if (dNum === 0) day = '01';
                }
                formatted += '/' + day;
            }

            if (digits.length >= 5) {
                formatted += '/' + digits.substring(4, 8);
            }
        }
        return formatted;
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formatted = formatDateInput(value);
        setInputValue(formatted);
    };

    const handleConfirm = () => {
        const months: { [key: string]: string } = {
            Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
            Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
        };

        const monthNum = months[tempDate.month];
        const dayNum = tempDate.day.toString().padStart(2, '0');
        const yearNum = tempDate.year.toString();

        setInputValue(`${monthNum}/${dayNum}/${yearNum}`);
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
                value={inputValue}
                onChange={handleInputChange}
                placeholder="MM/DD/YYYY"
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
                        <h3 className="text-xl font-bold mb-4 text-white">Date of Birth</h3>

                        <div className="h-[150px] w-full flex justify-center items-center overflow-hidden">
                            <QuizEmblaCarousel onChange={(val: any) => setTempDate(val)} />
                        </div>

                        <div className="flex justify-end gap-10 mt-6 pr-2">
                            <button
                                onClick={handleCancel}
                                className="text-main font-bold text-lg active:scale-95 transition-transform"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="text-main font-bold text-lg active:scale-95 transition-transform"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QuizScrollCalendar;