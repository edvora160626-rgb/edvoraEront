import { useEffect, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const PRIMARY = "#A77A95";
const PRIMARY_HOVER = "#8F6580";
const DEFAULT_REFERENCE_DATE = new Date(2000, 0, 1);

const datePickerTheme = createTheme({
  palette: {
    primary: { main: PRIMARY },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: `${PRIMARY} !important`,
          },
        },
        notchedOutline: {
          borderColor: "#D0D5DD",
        },
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: `${PRIMARY} !important`,
            color: "#fff !important",
          },
          "&.MuiPickersDay-today:not(.Mui-selected)": {
            border: `1px solid ${PRIMARY} !important`,
          },
        },
      },
    },
    MuiPickersCalendarHeader: {
      styleOverrides: {
        label: { color: `${PRIMARY} !important` },
        switchViewButton: {
          color: `${PRIMARY} !important`,
        },
        iconButton: { color: `${PRIMARY} !important` },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { color: `${PRIMARY} !important` },
      },
    },
  },
});

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toInputValue = (date) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function CustomDatePicker({
  value = "",
  onChange,
  placeholder = "dd-MM-yyyy",
  maxDate,
  minDate,
  disabled = false,
  openTo = "year",
}) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(null);
  const [view, setView] = useState(openTo);

  const committedDate = parseDate(value);
  const pickerValue = open ? draftDate : committedDate;

  useEffect(() => {
    if (open) {
      setDraftDate(committedDate);
      setView(openTo);
    } else {
      setDraftDate(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setDraftDate(null);
    setView(openTo);
  };

  const handleAccept = (date) => {
    if (!date) return;
    onChange?.(toInputValue(date));
    setOpen(false);
    setDraftDate(null);
    setView(openTo);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ThemeProvider theme={datePickerTheme}>
        <DatePicker
          open={open}
          onOpen={handleOpen}
          onClose={handleClose}
          value={pickerValue}
          onChange={(date) => {
            // Keep draft while moving year -> month -> day; do not close yet
            setDraftDate(date);
          }}
          onAccept={handleAccept}
          onViewChange={setView}
          view={view}
          views={["year", "month", "day"]}
          openTo={openTo}
          closeOnSelect
          referenceDate={committedDate || DEFAULT_REFERENCE_DATE}
          format="dd-MM-yyyy"
          maxDate={parseDate(maxDate) || undefined}
          minDate={parseDate(minDate) || undefined}
          disabled={disabled}
          slotProps={{
            popper: {
              sx: { zIndex: 100050 },
              placement: "bottom-start",
            },
            desktopPaper: {
              sx: { zIndex: 100050 },
            },
            dialog: {
              sx: { zIndex: 100050 },
            },
            textField: {
              size: "small",
              fullWidth: true,
              placeholder,
              onClick: handleOpen,
              inputProps: {
                readOnly: true,
              },
              onKeyDown: (e) => {
                if (e.key !== "Tab") e.preventDefault();
              },
              sx: {
                "& .MuiInputBase-root": {
                  height: "38px !important",
                  borderRadius: "6px",
                  backgroundColor: disabled ? "#f5f5f5" : "white",
                },
                "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: `${PRIMARY} !important`,
                  },
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: `${PRIMARY} !important`,
                  },
                "& .MuiOutlinedInput-root .MuiSvgIcon-root": {
                  color: disabled
                    ? "#ccc !important"
                    : `${PRIMARY} !important`,
                },
                "& input": {
                  padding: "4px 8px !important",
                  fontSize: "14px !important",
                  cursor: disabled ? "not-allowed" : "pointer",
                  color: disabled ? "#9ca3af" : "#344054",
                },
              },
            },
            day: {
              sx: {
                "&.Mui-selected": {
                  backgroundColor: `${PRIMARY} !important`,
                  color: "#fff !important",
                },
                "&.MuiPickersDay-today:not(.Mui-selected)": {
                  border: `1px solid ${PRIMARY} !important`,
                  color: "black !important",
                },
                "&.Mui-disabled": {
                  color: "#ccc !important",
                },
                "&:hover": {
                  backgroundColor: "rgba(167, 122, 149, 0.2) !important",
                },
              },
            },
            openPickerButton: {
              onClick: (e) => {
                e.stopPropagation();
                handleOpen();
              },
              sx: {
                color: `${PRIMARY_HOVER} !important`,
              },
            },
          }}
        />
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default CustomDatePicker;
