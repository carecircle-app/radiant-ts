export async function GET() {
  return new Response('ROOT OK', {
    status: 200,
    headers: { 'content-type': 'text/plain' },
  });
}
