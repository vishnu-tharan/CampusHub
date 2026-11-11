export default function Loading() {
  return (
    <div className="shell page-space flex flex-col items-center justify-center min-h-[50vh] text-center" role="status">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mb-6" />
      <p className="eyebrow justify-center">CAMPUSHUB</p>
      <p className="lead mt-2">Loading campus experiences…</p>
    </div>
  );
}
