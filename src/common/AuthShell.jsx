import bg from "../assets/student-bg.png";

function AuthShell({ children, className = "" }) {
  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center min-[1024px]:justify-end overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 min-[1024px]:px-0 bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="absolute inset-0 bg-[#F3E8FF]/30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-[380px] min-[1024px]:mr-16 xl:mr-20">
        <div className="bg-[#F3E8FF]/95 backdrop-blur-md rounded-[20px] border border-white shadow-2xl p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthShell;
