function EdvoraLoader({
  message = "Loading…",
  overlay = false,
  className = "",
}) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="login-loader" />
      {message ? (
        <p className="mt-8 text-sm font-medium text-[#735366]">{message}</p>
      ) : null}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#FAEEE9]/55">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full min-h-[240px] flex items-center justify-center py-12">
      {content}
    </div>
  );
}

export default EdvoraLoader;
