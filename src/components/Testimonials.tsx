// src/components/Testimonials.tsx

type Quote = { body: string; author: string };

const QUOTES: Quote[] = [
  { body: "CareCircle keeps everyone aligned without the chaos.", author: "A. Rivera" },
  { body: "The reminders and shared tasks reduced our stress a ton.", author: "J. Chen" },
  { body: "Finally one private place for updates and notes.", author: "M. Patel" },
];

export default function Testimonials() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {QUOTES.map((q, i) => (
        <figure
          key={i}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <blockquote className="text-sm text-slate-700">{q.body}</blockquote>
          <figcaption className="mt-2 text-xs text-slate-500">{q.author}</figcaption>
        </figure>
      ))}
    </div>
  );
}
