export const dynamic = "force-static";
export const metadata = { title: "Thanks  CareCircle" };

export default function SuccessPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Payment successful</h1>
      <p className="mt-4">Thanks for supporting CareCircle. A receipt will be sent to your email.</p>
      <p className="mt-6"><a className="underline" href="/">Back home</a></p>
    </main>
  );
}
