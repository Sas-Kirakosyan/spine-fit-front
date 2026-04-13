import {useRef, useState} from "react";
import {ChevronDownIcon} from "@/components/Icons/Icons.tsx";

interface InputFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    unit?: string;
    unitOptions?: string[];
    onUnitChange?: (unit: string) => void;
}
function InputField({ label, value, onChange, placeholder, type = "text", unit, unitOptions, onUnitChange }: InputFieldProps) {
    const [isUnitOpen, setIsUnitOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);


    const handleButtonClick = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right,
            });
        }
        setIsUnitOpen(!isUnitOpen);
    };

    return (
        <div className="relative">
            <div className="flex items-center rounded-xl border border-gray-700 bg-transparent overflow-hidden">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder || label}
                    className="flex-1 px-4 py-3 bg-transparent text-white placeholder-white  outline-none"
                />
                {unitOptions && unit && onUnitChange && (
                    <div className="relative">
                        <button
                            ref={buttonRef}
                            type="button"
                            onClick={handleButtonClick}
                            className="px-3 py-2 mr-2 rounded-lg bg-white/10 text-white text-sm flex items-center gap-1"
                        >
                            {unit}
                            <ChevronDownIcon className="h-4 w-4" />
                        </button>

                        {isUnitOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-[100]"
                                    onClick={() => setIsUnitOpen(false)}
                                />
                                <div
                                    className="fixed bg-slate-800 rounded-lg border border-white/20 overflow-hidden z-[101] min-w-[60px]"
                                    style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
                                >
                                    {unitOptions.map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUnitChange(opt);
                                                setIsUnitOpen(false);
                                            }}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition ${unit === opt ? "bg-main/20 text-main" : "text-white"
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default InputField;