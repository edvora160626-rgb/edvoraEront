import Select from "react-select";

const PRIMARY = "#A77A95";
const PRIMARY_HOVER = "#8F6580";
const SECONDARY = "#C3C3D5";
const SECONDARY_SOFT = "#E8E8F0";
const TEXT = "#735366";
const BORDER = "#D0D5DD";

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "38px",
    height: "38px",
    borderRadius: "8px",
    borderColor: state.isFocused ? PRIMARY : BORDER,
    boxShadow: state.isFocused ? `0 0 0 1px ${PRIMARY}` : "none",
    "&:hover": {
      borderColor: PRIMARY,
    },
  }),

  valueContainer: (provided) => ({
    ...provided,
    height: "38px",
    padding: "0 12px",
  }),

  singleValue: (provided) => ({
    ...provided,
    color: TEXT,
  }),

  placeholder: (provided) => ({
    ...provided,
    color: "#98A2B3",
  }),

  input: (provided) => ({
    ...provided,
    margin: "0px",
    color: TEXT,
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),

  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused || state.selectProps.menuIsOpen ? PRIMARY : SECONDARY,
    "&:hover": {
      color: PRIMARY,
    },
  }),

  clearIndicator: (provided) => ({
    ...provided,
    color: SECONDARY,
    "&:hover": {
      color: PRIMARY_HOVER,
    },
  }),

  indicatorsContainer: (provided) => ({
    ...provided,
    height: "38px",
  }),

  menu: (provided) => ({
    ...provided,
    borderRadius: "12px",
    overflow: "hidden",
    border: `1px solid ${SECONDARY}`,
    boxShadow: "0 10px 30px rgba(115, 83, 102, 0.15)",
  }),

  option: (provided, state) => {
    const selected = state.isSelected;
    const hovered = state.isFocused;

    let backgroundColor = "#FFFFFF";
    let color = TEXT;

    if (selected) {
      backgroundColor = PRIMARY;
      color = "#FFFFFF";
    } else if (hovered) {
      backgroundColor = SECONDARY;
      color = TEXT;
    }

    return {
      ...provided,
      backgroundColor,
      color,
      cursor: "pointer",
      transition: "background-color 0.15s ease, color 0.15s ease",
      ":active": {
        backgroundColor: selected ? PRIMARY_HOVER : SECONDARY_SOFT,
        color: selected ? "#FFFFFF" : TEXT,
      },
    };
  },

  multiValue: (provided) => ({
    ...provided,
    backgroundColor: SECONDARY_SOFT,
    borderRadius: "6px",
  }),

  multiValueLabel: (provided) => ({
    ...provided,
    color: TEXT,
  }),

  multiValueRemove: (provided) => ({
    ...provided,
    color: PRIMARY,
    ":hover": {
      backgroundColor: PRIMARY,
      color: "#FFFFFF",
    },
  }),

  menuPortal: (provided) => ({
    ...provided,
    zIndex: 100000,
  }),
};

function CustomSelect(props) {
  return (
    <Select
      styles={customStyles}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuPosition="fixed"
      {...props}
    />
  );
}

export default CustomSelect;
