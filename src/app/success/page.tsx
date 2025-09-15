// src/app/success/page.tsx
export const metadata = {
  title: "Payment successful — CareCircle",
};

export default function SuccessPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Thank you!</h1>
      <p className="mt-2 text-slate-600">
        Your payment was successful. Your plan will be active shortly.
      </p>
      <div className="mt-6 flex gap-3">
        <a
          href="/"
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          ← Back to Home
        </a>
        <a
          href="/admin"
          className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Go to Admin
        </a>
      </div>
    </main>
  );
}
