// NOTE: Do NOT add "use client" here.
import Link from "next/link";

// Adjust these relative paths if your folder layout differs
import StripeCTAButtons from "../components/StripeCTAButtons";
import Container from "../components/Container";
import Testimonials from "../components/Testimonials";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple hero with a top CTA block */}
      <header className="bg-gradient-to-br from-blue-100 via-green-100 to-purple-200">
        <Container>
          <div className="mx-auto max-w-3xl py-20 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900">
              Calm, coordinated care for your family
            </h1>
            <p className="mt-4 text-gray-700">
              Share tasks, updates, and support in one private space.
            </p>
            <div className="mt-8 flex justify-center">
              <StripeCTAButtons />
            </div>
          </div>
        </Container>
      </header>

      <main className="flex-1">
        {/* Mid-page CTA */}
        <section className="py-20 bg-gradient-to-r from-blue-50 via-green-50 to-purple-100">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Get started in seconds
              </h3>
              <p className="mt-4 text-gray-600">
                Pick a plan that fits your family. You can switch or cancel anytime.
              </p>
              <div className="mt-8 flex justify-center">
                <StripeCTAButtons />
              </div>
            </div>
          </Container>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <Container>
            <h2 className="text-2xl sm:text-3xl font-semibold text-center text-gray-900 mb-12">
              Families love the calm CareCircle creates
            </h2>
            <Testimonials />
          </Container>
        </section>
      </main>

      {/* Bottom CTA */}
      <section className="py-16 text-center bg-gradient-to-r from-blue-50 via-green-50 to-purple-100">
        <h2 className="text-2xl font-semibold mb-4">Ready to support CareCircle?</h2>
        <div className="flex justify-center">
          <StripeCTAButtons />
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Your subscription or donation helps families everywhere coordinate care with ease.
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-tr from-blue-100 via-green-100 to-purple-200 py-10">
        <Container className="text-center">
          <p className="text-sm text-gray-700 mb-4">
            © {new Date().getFullYear()} CareCircle. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/privacy" className="text-blue-700 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-blue-700 hover:underline">
              Terms of Service
            </Link>
            <Link href="/refunds" className="text-blue-700 hover:underline">
              Refund Policy
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
