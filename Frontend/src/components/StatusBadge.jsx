const styles = {
  Pending: 'bg-slate-100 text-slate-700 border border-slate-200',
  Submitted: 'bg-blue-50 text-blue-700 border border-blue-100',
  Late: 'bg-red-500 text-white border border-red-500',
  Graded: 'bg-[#0A192F] text-white border border-[#0A192F]',
  Upcoming: 'bg-slate-100 text-slate-600 border border-slate-200',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || styles.Pending
      }`}
    >
      {status}
    </span>
  );
}
