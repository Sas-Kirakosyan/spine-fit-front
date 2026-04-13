import {useState} from "react";
import {ChevronDownIcon} from "@/components/Icons/Icons.tsx";

interface SelectFieldProps {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    placeholder?: string;
}
function SelectField({ label, value, options, onChange, placeholder }: SelectFieldProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/20 bg-transparent text-left"
            >
        <span className="text-white">
          {value || placeholder || label}
        </span>
                <ChevronDownIcon className="h-5 w-5 text-white" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 rounded-xl border border-white/20 overflow-hidden z-20">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition ${value === option ? "bg-main/20 text-main" : "text-white"
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default  SelectField