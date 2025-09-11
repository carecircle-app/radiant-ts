export const metadata = { title: 'Home smoke test' };
export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>/ HOME  no redirect</h1>
      <p>If you see this, / is NOT redirecting.</p>
    </main>
  );
}
