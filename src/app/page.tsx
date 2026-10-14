import { Suspense } from "react";
import ClientApp, { AppLoading } from "@/components/ClientApp";
import { getSession } from "@/lib/auth";

// The session is request data, so it is read inside <Suspense>: the page shell renders
// instantly and the typing app appears as soon as we know whether the visitor is signed in.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Suspense fallback={<AppLoading />}>
        <Practice />
      </Suspense>
    </main>
  );
}

async function Practice() {
  const session = await getSession();
  return <ClientApp signedIn={!!session} />;
}
