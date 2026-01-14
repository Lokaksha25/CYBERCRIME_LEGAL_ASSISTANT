export default function ExampleQueries() {
  const queries = [
    "Summarize a phishing case",
    "Why was IPC 420 applied?",
    "Explain judgment reasoning"
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {queries.map((q, i) => (
        <span
          key={i}
          className="px-4 py-2 border rounded-full text-sm hover:bg-gray-100 cursor-pointer"
        >
          {q}
        </span>
      ))}
    </div>
  );
}
