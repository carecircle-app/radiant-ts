export const metadata = {
  title: "CareCircle  Coordinate care with confidence",
  description: "Calm, coordinated care for your family."
};

export default function Home() {
  return (
    <main style={{padding: 24, fontFamily: "system-ui", lineHeight: 1.45}}>
      <h1 style={{margin: 0}}>CareCircle</h1>
      <p style={{marginTop: 8}}>Calm, coordinated care for your family.</p>
      <p style={{marginTop: 12}}>
        <a href="/pricing">See plans</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
      </p>
    </main>
  );
}
