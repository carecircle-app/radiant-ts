$base = "src/app"
$successDir = Join-Path $base "success"
$cancelDir  = Join-Path $base "cancel"
New-Item -ItemType Directory -Force -Path $successDir,$cancelDir | Out-Null

@"
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
"@ | Set-Content -Encoding UTF8 (Join-Path $successDir "page.tsx")

@"
export const dynamic = "force-static";
export const metadata = { title: "Checkout canceled  CareCircle" };

export default function CancelPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Checkout canceled</h1>
      <p className="mt-4">No worries  you were not charged.</p>
      <p className="mt-6"><a className="underline" href="/#plans">Try again</a></p>
    </main>
  );
}
"@ | Set-Content -Encoding UTF8 (Join-Path $cancelDir "page.tsx")

Write-Host "Wrote src/app/success/page.tsx and src/app/cancel/page.tsx" -ForegroundColor Green
