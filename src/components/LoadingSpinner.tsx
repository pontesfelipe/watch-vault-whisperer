interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export const LoadingSpinner = ({
  message = "Loading...",
  size = "md",
  fullScreen = true
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  const content = (
    <div className="text-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-accent mx-auto ${sizeClasses[size]}`}
        aria-label="Loading"
        role="status"
      />
      {message && (
        <p className="mt-4 text-textMuted">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {content}
      </div>
    );
  }

  return content;
};
