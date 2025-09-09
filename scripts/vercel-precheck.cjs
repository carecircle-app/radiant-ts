// No-op Vercel precheck (CommonJS). Always succeeds.
try {
  console.log("[precheck] ok");
  process.exit(0);
} catch (e) {
  // Never block builds
  process.exit(0);
}
