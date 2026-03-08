import { IosPickerItem } from './QuizEmblaCarouselIosPickerItem.tsx'
import {useEffect, useMemo, useState, useCallback, useRef} from "react";

interface IQuizEmblaCarouselProps {
    onChange: (date: { month: string; day: number; year: number }) => void
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = Array.from({ length: 91 }, (_, i) => 1930 + i);

function QuizEmblaCarousel(props: IQuizEmblaCarouselProps) {
    const { onChange } = props;

    const [selectedMonth, setSelectedMonth] = useState('Jan');
    const [selectedDay, setSelectedDay] = useState(1);
    const [selectedYear, setSelectedYear] = useState(1990);

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
            <div className="absolute top-1/2 left-0 w-full h-10 -translate-y-1/2 border-t border-b border-white/10 pointer-events-none z-10" />

            <div className="flex w-full items-center justify-between relative z-20">
                <div className="flex-1 h-full">
                    <IosPickerItem
                        items={MONTHS}
                        perspective="center"
                        startIndex={MONTHS.indexOf('Jan')}
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
                        startIndex={YEARS.indexOf(1990)}
                        onSelect={handleYearSelect}
                    />
                </div>
            </div>

            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background via-transparent to-background z-[5]" />
        </div>
    );
}

export default QuizEmblaCarousel;