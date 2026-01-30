/**
 * Error Message Component
 */
export default function ErrorMessage({ error, onDismiss }) {
  if (!error) return null;

  const errorMessage = error.message || error.toString();

  return (
    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-4">
      <strong className="font-bold">Error: </strong>
      <span>{errorMessage}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-0 right-0 px-4 py-3"
          aria-label="Dismiss"
        >
          <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
