export const metadata = {
  title: "CareCircle  Be Together, Even Apart",
  description: "Private spaces for families and close friends, with simple subscriptions.",
};

const CTA = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-medium ring-1 ring-slate-300 hover:bg-slate-50 transition"
  >
    {children}
  </a>
);

export default function Page() {
  const priceLite  = "price_1S3jjE07Y1V0tQQTGbpD36z4";
  const priceElite = "price_1S3IaJ07Y1V0tQQTbQkTXIK6";
  const donateOnce = "price_1S3ldL07Y1V0tQQTTW2BYwGT";
  const donateMo   = "price_1S2FwU07Y1V0tQQTOzczazKUp";

  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between border-b">
        <div className="text-xl font-semibold">CareCircle</div>
        <nav className="hidden md:flex gap-6 text-sm">
          <a href="/pricing" className="hover:underline">Pricing</a>
          <a href="/company" className="hover:underline">Company</a>
          <a href="/blog" className="hover:underline">Blog</a>
          <a href="/login" className="hover:underline">Log in</a>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Be together, <span className="text-slate-500">even apart.</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600">
          A calm, private space for your family or circle to share updates, health info, and support.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <CTA href={`/api/stripe/checkout?priceId=${priceLite}`}>Start Lite</CTA>
          <CTA href={`/api/stripe/checkout?priceId=${priceElite}`}>Go Elite</CTA>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Or support us:{" "}
          <a className="underline" href={`/api/stripe/checkout?priceId=${donateOnce}`}>one-time</a>{" "}
          {" "}
          <a className="underline" href={`/api/stripe/checkout?priceId=${donateMo}`}>monthly</a>
        </p>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-12 border-t text-sm text-slate-500">
         {new Date().getFullYear()} CareCircle
      </footer>
    </main>
  );
}