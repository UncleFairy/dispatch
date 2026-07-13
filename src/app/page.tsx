// Placeholder home route. Replaced in a later phase with the auth-aware entry
// point (redirect to /feed or /login based on the session cookie).
export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">DISPATCH</h1>
      <p className="mt-2 text-sm">Frontend challenge — work in progress.</p>
    </main>
  );
}
