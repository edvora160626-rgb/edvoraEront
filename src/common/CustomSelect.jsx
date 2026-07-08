import Select from "react-select";

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "38px",
    height: "38px",
    borderRadius: "8px",
    borderColor: state.isFocused
      ? "#8B5CF6"
      : "#D0D5DD",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#8B5CF6",
    },
  }),

  valueContainer: (provided) => ({
    ...provided,
    height: "38px",
    padding: "0 12px",
  }),

  input: (provided) => ({
    ...provided,
    margin: "0px",
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),

  indicatorsContainer: (provided) => ({
    ...provided,
    height: "38px",
  }),

  menu: (provided) => ({
    ...provided,
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.15)",
  }),

  option: (provided, state) => ({
    ...provided,

    backgroundColor: state.isSelected
      ? "#8B5CF6"
      : state.isFocused
      ? "#E9D5FF"
      : "#FFFFFF",

    color: state.isSelected
      ? "#FFFFFF"
      : "#4C1D95",

    cursor: "pointer",
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