import { useEffect, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import CustomSelect from "../common/CustomSelect";
import CustomDatePicker from "../common/CustomDatePicker";
import EdvoraLoader from "../common/EdvoraLoader";
import axios from "axios";
import { openSnackbar } from "../common/snackbar/snackbar";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function RegisterModal({ onClose }) {
  const [userType, setUserType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [formData, setFormData] = useState({
    schoolId: "",
    role: "",

    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    phonecode: "91",

    gender: "",
    dob: "",

    admissionNumber: "",
    rollNumber: "",
    grade: "",
    section: "",
    bloodGroup: "",

    department: "",
    qualification: "",
    subjects: "",

    relationship: "",
    children: "",
    occupation: "",

    schoolName: "",
    designation: "",

    address: "",
  });
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
 const roleMap = {
  student: "STUDENT",
  teacher: "TEACHER",
  parent: "PARENT",
  admin: "SCHOOL_ADMIN",
  principal: "SUPER_ADMIN",
};

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/auth/getAllSchools`);
        const options = (data?.data || []).map((school) => ({
          value: school._id,
          label: school.schoolName,
        }));
        setSchoolOptions(options);
      } catch (error) {
        openSnackbar({
          message:
            error?.response?.data?.message || "Failed to load schools",
          variant: "error",
        });
      }
    };

    loadSchools();
  }, []);

  useEffect(() => {
    const loadClasses = async () => {
      if (!formData.schoolId) {
        setClassOptions([]);
        return;
      }

      try {
        const { data } = await axios.post(
          `${API_BASE}/class/getActiveClassesBySchool`,
          { schoolId: formData.schoolId, status: "ACTIVE" }
        );

        const options = (data?.data || []).map((cls) => ({
          value: String(cls._id),
          label: `${cls.className} - ${cls.section}`,
          section: cls.section || "",
          className: cls.className || "",
        }));
        setClassOptions(options);
      } catch (error) {
        setClassOptions([]);
        openSnackbar({
          message:
            error?.response?.data?.message || "Failed to load classes",
          variant: "error",
        });
      }
    };

    const loadDepartments = async () => {
      if (!formData.schoolId) {
        setDepartmentOptions([]);
        return;
      }

      try {
        const { data } = await axios.post(
          `${API_BASE}/department/getActiveDepartmentsBySchool`,
          { schoolId: formData.schoolId, status: "ACTIVE" }
        );

        const options = (data?.data || []).map((dept) => ({
          value: dept.departmentName,
          label: dept.departmentCode
            ? `${dept.departmentName} (${dept.departmentCode})`
            : dept.departmentName,
        }));
        setDepartmentOptions(options);
      } catch (error) {
        setDepartmentOptions([]);
        openSnackbar({
          message:
            error?.response?.data?.message || "Failed to load departments",
          variant: "error",
        });
      }
    };

    loadClasses();
    loadDepartments();
  }, [formData.schoolId]);

  const handleSubmit = async () => {
    try {
      // Validation
      if (
        !formData.schoolId ||
        !formData.role ||
        !formData.firstName ||
        !formData.email ||
        !formData.phone ||
        !formData.password
      ) {
        return openSnackbar({
          message: "Please fill all required fields, including school",
          variant: "warning",
        });
      }

      if (formData.password !== formData.confirmPassword) {
        return openSnackbar({
          message: "Passwords do not match",
          variant: "warning",
        });
      }

      setSubmitting(true);

      const payload = {
        schoolId: formData.schoolId,
        role: formData.role,

        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),

        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        phonecode: formData.phonecode,

        password: formData.password,
      };

      // Student — grade must be Class ObjectId per Student model
      if (formData.role === "STUDENT") {
        if (
          !formData.admissionNumber ||
          !formData.rollNumber ||
          !formData.grade ||
          !formData.section
        ) {
          return openSnackbar({
            message: "Admission Number, Register Number and Class are required",
            variant: "warning",
          });
        }

        payload.admissionNumber = formData.admissionNumber.trim();
        payload.rollNumber = formData.rollNumber.trim();
        payload.grade = formData.grade;
        payload.section = formData.section;
      }

      // Teacher
      if (formData.role === "TEACHER") {
        if (
          !formData.department ||
          !formData.qualification?.trim()
        ) {
          return openSnackbar({
            message: "Department and Qualification are required",
            variant: "warning",
          });
        }

        payload.department = formData.department;
        payload.qualification = formData.qualification.trim();
        payload.subjects = formData.subjects;
      }

      // Parent — send children as admission numbers (API resolves to Student IDs)
      if (formData.role === "PARENT") {
        if (!formData.relationship) {
          return openSnackbar({
            message: "Relationship is required",
            variant: "warning",
          });
        }

        const childrenValues = String(formData.children || "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);

        if (childrenValues.length === 0) {
          return openSnackbar({
            message: "Enter at least one child admission number",
            variant: "warning",
          });
        }

        payload.relationship = formData.relationship;
        payload.children = childrenValues;
      }

      const response = await axios.post(`${API_BASE}/auth/register`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        const approvalMessage =
          formData.role === "SCHOOL_ADMIN"
            ? "Your school admin request has been sent to the Principal for approval."
            : response.data.message;

        openSnackbar({
          message: approvalMessage,
          variant: "success",
        });

        setUserType("");
        setFormData({
          schoolId: "",
          role: "",

          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          phonecode: "91",

          gender: "",
          dob: "",

          admissionNumber: "",
          rollNumber: "",
          grade: "",
          section: "",

          department: "",
          qualification: "",
          subjects: "",

          relationship: "",
          children: "",

          schoolName: "",
          designation: "",

          address: "",
        });

        onClose();
      }
    } catch (error) {
      console.error("Registration Error:", error);

      openSnackbar({
        message:
          error?.response?.data?.message || "Registration Failed",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const inputClass =
    "w-full h-[38px] rounded-md border border-[#D0D5DD] bg-white px-3 text-[14px] text-[#344054] outline-none focus:border-[#A77A95]";

  const labelClass =
    "block text-[13px] font-semibold text-[#667085] mb-2";

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];
  const relationshipOptions = [
    { value: "Father", label: "Father" },
    { value: "Mother", label: "Mother" },
    { value: "Guardian", label: "Guardian" },
  ];
  const userTypeOptions = [
    { value: "student", label: "Student" },
    { value: "teacher", label: "Teacher" },
    { value: "parent", label: "Parent" },
    { value: "admin", label: "School Admin" },
    { value: "principal", label: "Principal (Super Admin)" },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-[1024px] max-h-[90dvh] bg-white rounded-[14px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 shrink-0">
          <h2 className="text-base sm:text-[18px] font-semibold text-[#111827] truncate pr-2">
            Create Your Account
          </h2>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-6">

          {/* Row 1 */}
          <div className="grid grid-cols-1 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 gap-4 sm:gap-6">

            <div>
              <label className={labelClass}>
                First Name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Last Name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Email <span className="text-red-500">*</span>
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                className={inputClass}
              />
            </div>

            {/* Row 2 */}

            <div>
              <label className={labelClass}>
                Mobile Number <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Mobile Number"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Gender
              </label>

              <CustomSelect
                options={genderOptions}
                placeholder="Select Gender"
                isSearchable={false}
                value={
                  genderOptions.find(
                    (option) => option.value === formData.gender
                  ) || null
                }
                onChange={(option) =>
                  setFormData((prev) => ({
                    ...prev,
                    gender: option?.value || "",
                  }))
                }
              />
            </div>

            <div>
              <label className={labelClass}>
                Date Of Birth
              </label>

              <CustomDatePicker
                value={formData.dob}
                placeholder="dd-MM-yyyy"
                maxDate={new Date().toISOString().split("T")[0]}
                onChange={(dateValue) =>
                  setFormData((prev) => ({
                    ...prev,
                    dob: dateValue,
                  }))
                }
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-4 gap-4 sm:gap-6 mt-4 sm:mt-6">

            <div>
              <label className={labelClass}>
                Create Password <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className={inputClass}
                />

                <button
                  type="button"
                  className="absolute right-3 top-2"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Confirm Password
              </label>

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                School <span className="text-red-500">*</span>
              </label>

              <CustomSelect
                options={schoolOptions}
                placeholder={
                  schoolOptions.length
                    ? "Select school"
                    : "Loading schools..."
                }
                isSearchable
                value={
                  schoolOptions.find(
                    (option) => option.value === formData.schoolId
                  ) || null
                }
                onChange={(option) =>
                  setFormData((prev) => ({
                    ...prev,
                    schoolId: option?.value || "",
                    grade: "",
                    section: "",
                    department: "",
                  }))
                }
              />
            </div>

            <div>
              <label className={labelClass}>
                User Type <span className="text-red-500">*</span>
              </label>

              <CustomSelect
                options={userTypeOptions}
                placeholder="Select User Type"
                isSearchable={false}
                value={
                  userTypeOptions.find(
                    (option) => option.value === userType
                  ) || null
                }
                onChange={(option) => {
                  const value = option?.value || "";

                  setUserType(value);

                  setFormData((prev) => ({
                    ...prev,
                    role: roleMap[value],
                  }));
                }}
              />
            </div>
          </div>

          {/* Dynamic Fields */}

          {userType === "student" && (
            <div className="grid grid-cols-1 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">

              <div>
                <label className={labelClass}>
                  Admission Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="admissionNumber"
                  value={formData.admissionNumber}
                  onChange={handleChange}
                  placeholder="Admission Number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Register Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  placeholder="Register Number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Class <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  options={classOptions}
                  placeholder={
                    !formData.schoolId
                      ? "Select school first"
                      : classOptions.length
                        ? "Select class"
                        : "No classes for this school"
                  }
                  isSearchable
                  isDisabled={!formData.schoolId || classOptions.length === 0}
                  value={
                    classOptions.find(
                      (option) => option.value === formData.grade
                    ) || null
                  }
                  onChange={(option) =>
                    setFormData((prev) => ({
                      ...prev,
                      grade: option?.value || "",
                      section: option?.section || "",
                    }))
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Section
                </label>
                <input
                  name="section"
                  value={formData.section}
                  readOnly
                  placeholder="Filled from class"
                  className={`${inputClass} bg-[#F9FAFB]`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Blood Group
                </label>
                <input
                  placeholder="Blood Group"
                  className={inputClass}
                />
              </div>

            </div>
          )}

          {userType === "teacher" && (
            <div className="grid grid-cols-1 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">

              <div>
                <label className={labelClass}>
                  Department <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  options={departmentOptions}
                  placeholder={
                    !formData.schoolId
                      ? "Select school first"
                      : departmentOptions.length
                        ? "Select department"
                        : "No departments found"
                  }
                  isSearchable
                  isDisabled={!formData.schoolId || departmentOptions.length === 0}
                  value={
                    departmentOptions.find(
                      (option) => option.value === formData.department
                    ) || null
                  }
                  onChange={(option) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: option?.value || "",
                    }))
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Qualification <span className="text-red-500">*</span>
                </label>
                <input
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="Qualification"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Subject</label>
                <input
                  name="subjects"
                  value={formData.subjects}
                  onChange={handleChange}
                  placeholder="Subject"
                  className={inputClass}
                />
              </div>

            </div>
          )}

          {userType === "parent" && (
            <div className="grid grid-cols-1 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">

              <div>
                <label className={labelClass}>
                  Relationship <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  options={relationshipOptions}
                  placeholder="Select relationship"
                  value={
                    relationshipOptions.find(
                      (option) => option.value === formData.relationship
                    ) || null
                  }
                  onChange={(option) =>
                    setFormData((prev) => ({
                      ...prev,
                      relationship: option?.value || "",
                    }))
                  }
                />
              </div>

              <div className="min-[640px]:col-span-2">
                <label className={labelClass}>
                  Children (Admission Numbers){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  name="children"
                  value={formData.children}
                  onChange={handleChange}
                  placeholder="e.g. ADM001, ADM002"
                  className={inputClass}
                />
                <p className="mt-1 text-[12px] text-[#98A2B3]">
                  Enter existing student admission numbers, comma-separated
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  Occupation
                </label>
                <input
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="Occupation"
                  className={inputClass}
                />
              </div>

            </div>
          )}

          {userType === "principal" && (
            <div className="grid grid-cols-1 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">

              <div>
                <label className={labelClass}>
                  School Name
                </label>
                <input
                  placeholder="School Name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Designation
                </label>
                <input
                  placeholder="Designation"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Qualification
                </label>
                <input
                  placeholder="Qualification"
                  className={inputClass}
                />
              </div>

            </div>
          )}
          {/* Address */}

          <div className="mt-8">
            <label className={labelClass}>
              Current Address
            </label>

            <textarea
              rows="4"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your current address"
              className="
    w-full
    h-[90px]
    rounded-md
    border
    border-[#D0D5DD]
    p-3
    text-[14px]
    outline-none
    resize-none
  "
            />
          </div>

          {/* Terms */}

          <div className="flex items-start sm:items-center justify-center mt-6 sm:mt-8 px-2">
            <input
              type="checkbox"
              className="w-4 h-4 mt-1 sm:mt-0 shrink-0 accent-[#A77A95] cursor-pointer"
            />

            <span className="ml-3 text-[13px] sm:text-[14px] text-[#667085] text-center sm:text-left">
              By signing up, you agree to our{" "}
              <span className="font-semibold text-[#111827]">
                Privacy Policy
              </span>
            </span>
          </div>

          {/* Footer */}

          <div className="flex justify-end mt-6 sm:mt-8">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 h-[38px] rounded-md bg-[#A77A95] hover:bg-[#8F6580] text-white text-[13px] font-medium disabled:opacity-60"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
      {submitting && <EdvoraLoader overlay message="Creating account…" />}
    </div>
  );
}

export default RegisterModal;