export default function StatsCard({ title, value }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm text-center">
      <p className="text-3xl font-bold text-indigo-600">{value}</p>
      <p className="text-sm text-gray-600 mt-2">{title}</p>
    </div>
  );
}
