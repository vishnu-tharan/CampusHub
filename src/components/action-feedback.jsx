export function ActionFeedback({ state }) {
  return (
    <div aria-live="polite">
      {state.error && (
        <p role="alert" className="notice error">
          {state.error}
        </p>
      )}
      {state.success && <p className="notice success">{state.success}</p>}
    </div>
  );
}
