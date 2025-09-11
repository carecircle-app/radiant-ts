/** DonationSection  static, server component (no redirects, no fetch) */
export default function DonationSection() {
  const stats = [
    { label: "Lunches served", value: "2,340" },
    { label: "Families helped", value: "415" },
    { label: "Total donated", value: "$18,920" },
  ];

  return (
    <section id="donate" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-3xl font-bold tracking-tight">CareCircle Global Foundation</h2>
      <p className="mt-3 text-neutral-700">
        For every Elite plan we donate <strong>$1.00</strong>, for every Lite plan we donate
        <strong> $0.50</strong>, and for monthly subscriptions we add
        <strong> $1.50</strong>. You can also make a one-time gift below.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="mt-1 text-sm text-neutral-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href="/#donate"  /* placeholder; swap to your real donate URL later */
          className="rounded-xl bg-black px-5 py-3 text-white"
        >
          Donate now
        </a>
        <span className="text-sm text-neutral-500">
          100% of donations go to foundation programs.
        </span>
      </div>

      {/* Simple gallery placeholders; replace with real images in /public/foundation */}
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="aspect-[4/3] rounded-xl bg-neutral-100 ring-1 ring-neutral-200
                                  flex items-center justify-center text-neutral-400">
            photo/video
          </div>
        ))}
      </div>
    </section>
  );
}
