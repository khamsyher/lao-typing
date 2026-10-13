import ClientApp from "@/components/ClientApp";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  return (
    <main className="flex flex-1 flex-col">
      <ClientApp signedIn={!!session} />
    </main>
  );
}
