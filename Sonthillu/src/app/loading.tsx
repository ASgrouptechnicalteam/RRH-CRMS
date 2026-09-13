export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-navy border-t-transparent" />
        <p className="text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}
