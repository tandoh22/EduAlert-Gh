export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
      {message}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="edu-card p-6 text-center text-red-600 text-sm">
      {message || 'Something went wrong. Please try again.'}
    </div>
  );
}

export function EmptyState({ message }) {
  return (
    <div className="edu-card p-8 text-center text-slate-500 text-sm">
      {message || 'No data available yet.'}
    </div>
  );
}
