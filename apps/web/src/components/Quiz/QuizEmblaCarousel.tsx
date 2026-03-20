import { IosPickerItem } from './QuizEmblaCarouselIosPickerItem.tsx'
import {useEffect, useMemo, useState, useCallback, useRef} from "react";

interface IQuizEmblaCarouselProps {
    onChange: (date: { month: string; day: number; year: number }) => void
    initialDate?: { month: string; day: number; year: number }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = Array.from({ length: 97 }, (_, i) => 1930 + i);

function QuizEmblaCarousel(props: IQuizEmblaCarouselProps) {
    const { onChange, initialDate } = props;

    const [selectedMonth, setSelectedMonth] = useState(initialDate?.month || 'Jan');
    const [selectedDay, setSelectedDay] = useState(initialDate?. day || 1);
    const [selectedYear, setSelectedYear] = useState(initialDate?.year || 1990);

    const handleMonthSelect = useCallback((val: string | number) => {
        setSelectedMonth(val as string);
    }, []);

    const handleDaySelect = useCallback((val: string | number) => {
        setSelectedDay(val as number);
    }, []);

    const handleYearSelect = useCallback((val: string | number) => {
        setSelectedYear(val as number);
    }, []);

    const currentDays = useMemo(() => {
        const monthIndex = MONTHS.indexOf(selectedMonth);
        const lastDay = new Date(selectedYear, monthIndex + 1, 0).getDate();
        return Array.from({ length: lastDay }, (_, i) => i + 1);
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        if (selectedDay > currentDays.length) {
            setSelectedDay(currentDays.length);
        }
    }, [currentDays, selectedDay]);

    const lastSentDate = useRef("");

    useEffect(() => {
        const dateString = `${selectedMonth}-${selectedDay}-${selectedYear}`;

        if (lastSentDate.current === dateString) return;

        lastSentDate.current = dateString;

        onChange({
            month: selectedMonth,
            day: selectedDay,
            year: selectedYear
        });
    }, [selectedMonth, selectedDay, selectedYear, onChange]);

    return (
        <div className="relative flex w-full h-[96px] max-w-[320px] mx-auto overflow-hidden bg-background">

            <div className="absolute inset-0 z-50 pointer-events-none bg-gradient-to-b from-background via-transparent to-background" />

            <div className="absolute inset-x-0 h-[35px] border-t-2 border-b-2 border-white pointer-events-none top-1/2 -translate-y-1/2 z-60" />

            <div className="flex w-full items-center justify-between relative z-10">
                <div className="flex-1 h-full">
                    <IosPickerItem
                        items={MONTHS}
                        perspective="center"
                        startIndex={MONTHS.indexOf(selectedMonth)}
                        onSelect={handleMonthSelect}
                    />
                </div>

                <div className="flex-1 h-full" key={`days-col-${currentDays.length}`}>
                    <IosPickerItem
                        items={currentDays}
                        perspective="center"
                        startIndex={currentDays.indexOf(selectedDay) === -1 ? 0 : currentDays.indexOf(selectedDay)}
                        onSelect={handleDaySelect}
                    />
                </div>

                <div className="flex-1 h-full">
                    <IosPickerItem
                        items={YEARS}
                        perspective="center"
                        startIndex={YEARS.indexOf(selectedYear)}
                        onSelect={handleYearSelect}
                    />
                </div>
            </div>
        </div>
    );
}

export default QuizEmblaCarousel;