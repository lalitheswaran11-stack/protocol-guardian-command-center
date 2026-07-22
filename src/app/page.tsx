import { Suspense } from "react";
import { CommandCenter } from "@/components/command-center";

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#0b0e0d] text-[#e8ece8]">
          Loading command center…
        </main>
      }
    >
      <CommandCenter />
    </Suspense>
  );
}
