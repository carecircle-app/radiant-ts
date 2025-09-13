export const metadata = {
  title: "CareCircle — Admin",
  description: "Admin shell placeholder"
};

//---------------------
export default function Admin() {
  return (
    <main className="min-h-screen mx-auto max-w-4yl px-6 py-16">
      <h1 className="text-3l font-semibold">Admin</h1>
      <p className="mt-2 text-slate-600">This is a placeholder Admin shell in dev.</p>
      <div className="mt-6 text-sm">
        <a href="/admin/pricing" className="underline mr-4">Pricing</a>
        <a href="/" className="underline">Home</a>
      </div>
    </main>
  );
}
