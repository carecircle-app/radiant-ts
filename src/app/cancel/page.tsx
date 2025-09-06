// src/app/cancel/page.tsx
export default function CancelPage() {
  return (
    <div className="p-12 max-w-lg mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4 text-red-600">❌ Payment Canceled</h1>
      <p className="mb-4">
        Your checkout was canceled. No charges were made.
      </p>
      <a
        href="/"
        className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Back to Home
      </a>
    </div>
  );
}
