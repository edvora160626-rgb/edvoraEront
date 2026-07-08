import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const parseDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDisplayValue = (value) => {
  const date = parseDate(value);
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function CustomDatePicker({
  value = "",
  onChange,
  placeholder = "mm/dd/yyyy",
  maxDate,
  minDate,
}) {
  const wrapperRef = useRef(null);
  const calendarRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDate(value) || new Date());
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedDate = parseDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const max = maxDate ? parseDate(maxDate) : null;
  const min = minDate ? parseDate(minDate) : null;

  const updatePosition = () => {
    if (!wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const calendarHeight = 360;
    const calendarWidth = Math.min(window.innerWidth - 16, 320);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < calendarHeight && rect.top > calendarHeight;

    let left = rect.left;
    if (left + calendarWidth > window.innerWidth - 8) {
      left = window.innerWidth - calendarWidth - 8;
    }
    left = Math.max(8, left);

    setPosition({
      top: openAbove ? rect.top - calendarHeight - 8 : rect.bottom + 8,
      left,
      width: Math.max(rect.width, calendarWidth),
    });
  };

  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      if (
        wrapperRef.current?.contains(target) ||
        calendarRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (value) {
      const parsed = parseDate(value);
      if (parsed) setViewDate(parsed);
    }
  }, [value]);

  const isDisabled = (date) => {
    if (max && date > max) return true;
    if (min && date < min) return true;
    return false;
  };

  const buildCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = startOffset - 1; i >= 0; i -= 1) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        currentMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push({
        date: new Date(year, month, day),
        currentMonth: true,
      });
    }

    while (days.length % 7 !== 0) {
      const nextDay = days.length - startOffset - daysInMonth + 1;
      days.push({
        date: new Date(year, month + 1, nextDay),
        currentMonth: false,
      });
    }

    return days;
  };

  const handleSelect = (date) => {
    if (isDisabled(date)) return;
    onChange?.(toInputValue(date));
    setOpen(false);
  };

  const handleToday = () => {
    if (isDisabled(today)) return;
    onChange?.(toInputValue(today));
    setViewDate(today);
    setOpen(false);
  };

  const handleClear = () => {
    onChange?.("");
    setOpen(false);
  };

  const calendar = open
    ? createPortal(
        <div
          ref={calendarRef}
          className="fixed z-[100000] w-[min(100vw-1rem,320px)] rounded-xl border border-[#C4B5FD] bg-white shadow-2xl overflow-hidden"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
          }}
        >
          <div className="flex items-center justify-between bg-[#7F56D9] px-3 sm:px-4 py-3 text-white">
            <button
              type="button"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
                )
              }
              className="rounded-lg p-1.5 hover:bg-[#6941C6] transition"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="text-sm sm:text-base font-semibold text-center">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>

            <button
              type="button"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
                )
              }
              className="rounded-lg p-1.5 hover:bg-[#6941C6] transition"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-2 sm:px-3 pt-3 pb-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-[11px] sm:text-xs font-semibold text-[#6941C6]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 px-2 sm:px-3 pb-3">
            {buildCalendarDays().map(({ date, currentMonth }, index) => {
              const selected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);
              const disabled = isDisabled(date);

              return (
                <button
                  key={`${date.toISOString()}-${index}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(date)}
                  className={`h-8 sm:h-9 rounded-lg text-xs sm:text-sm transition ${
                    selected
                      ? "bg-[#7F56D9] text-white font-semibold shadow-sm"
                      : isToday
                      ? "bg-[#F3E8FF] text-[#7F56D9] font-semibold ring-1 ring-[#C4B5FD]"
                      : currentMonth
                      ? "text-[#2E1065] hover:bg-[#F3E8FF] hover:text-[#6941C6]"
                      : "text-[#98A2B3] hover:bg-[#FAF5FF]"
                  } ${disabled ? "opacity-40 cursor-not-allowed hover:bg-transparent" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-[#E9D5FF] bg-[#FAF5FF] px-3 sm:px-4 py-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs sm:text-sm font-medium text-[#6941C6] hover:text-[#7F56D9] transition"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-xs sm:text-sm font-semibold text-[#7F56D9] hover:text-[#6941C6] transition"
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`w-full h-[38px] rounded-md border bg-white px-3 pr-10 text-left text-[14px] outline-none transition ${
            open
              ? "border-[#7F56D9] ring-2 ring-[#C4B5FD]"
              : "border-[#D0D5DD] hover:border-[#8B5CF6] focus:border-[#7F56D9]"
          } ${value ? "text-[#344054]" : "text-[#98A2B3]"}`}
        >
          {value ? toDisplayValue(value) : placeholder}
        </button>

        <Calendar
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7F56D9] pointer-events-none"
        />
      </div>

      {calendar}
    </>
  );
}

export default CustomDatePicker;
