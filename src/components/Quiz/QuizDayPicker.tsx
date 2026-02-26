import React, {useEffect, useId, useRef, useState} from "react";
import "react-day-picker/style.css"

import {format, isValid, parse} from "date-fns";
import {DayPicker} from "react-day-picker";
import CalendarIcon from "@/assets/CalendarIcon/CalendarIcon.tsx";

function QuizDayPicker() {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    const dialogRef = useRef<HTMLDialogElement>(null);
    const dialogId = useId();
    const headerId = useId();
    const [month, setMonth] = useState(new Date());

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    const [inputValue, setInputValue] = useState("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const toggleDialog = () => setIsDialogOpen(!isDialogOpen);

    useEffect(() => {
        const handleBodyScroll = (isOpen: boolean) => {
            document.body.style.overflow = isOpen ? "hidden" : "";
        };
        if (!dialogRef.current) return;
        if (isDialogOpen) {
            handleBodyScroll(true);
            dialogRef.current.showModal();
        } else {
            handleBodyScroll(false);
            dialogRef.current.close();
        }
        return () => {
            handleBodyScroll(false);
        };
    }, [isDialogOpen]);

    const handleDayPickerSelect = (date: Date | undefined) => {
        if (!date) {
            setInputValue("");
            setSelectedDate(undefined);
        } else {
            setSelectedDate(date);
            setInputValue(format(date, "MM/dd/yyyy"));
        }
        dialogRef.current?.close();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);

        const parsedDate = parse(e.target.value, "MM/dd/yyyy", new Date());

        if (isValid(parsedDate)) {
            setSelectedDate(parsedDate);
            setMonth(parsedDate);
        } else {
            setSelectedDate(undefined);
        }
    };

    return (
        <div className="relative flex justify-around">
            <label htmlFor="date-input">
            </label>
            <input
                className="w-full bg-background border placeholder-white text-white border-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
                style={{fontSize: "inherit"}}
                id="date-input"
                type="text"
                value={inputValue}
                placeholder="MM/dd/yyyy"
                onChange={handleInputChange}
            />{" "}
            <button
                style={{fontSize: "inherit"}}
                onClick={toggleDialog}
                aria-controls={dialogId}
                aria-haspopup="dialog"
                aria-expanded={isDialogOpen}
                aria-label="Open calendar to choose booking date"
            >
                <CalendarIcon/>
            </button>
            <dialog
                className={`
                    ${isDialogOpen ? "flex" : "hidden"}
                    fixed
                    inset-0
                    m-auto
                    p-0
                    border-none
                    bg-transparent
                    items-center
                    justify-center
                  backdrop:bg-black/50
  `}
                role="dialog"
                ref={dialogRef}
                id={dialogId}
                aria-modal
                aria-labelledby={headerId}
                onClose={() => setIsDialogOpen(false)}
            >
                <div className="bg-[#1e3a5f] p-2 rounded-xl shadow-xl">


                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDayPickerSelect}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        navLayout="after"
                        classNames={{
                            month: "space-y-4 text-white",
                            table: "w-full border-collapse space-y-1 ",
                            day: "font-normal text-center aria-selected:opacity-100 text-white hover:bg-main rounded-md",
                        }}
                    />
                </div>
            </dialog>
        </div>
    );
}

export default QuizDayPicker;



