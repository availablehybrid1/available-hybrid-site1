import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

export default function CarRental() {
  return (
    <>
      <Head>
        <title>Car Rental – AVAILABLE HYBRID R&amp;M INC.</title>
        <meta name="description" content="Car rental at Available Hybrid R&M Inc. Coming soon." />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-white/10">
          <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
            <Link href="/" aria-label="Available Hybrid R&M home">
              <Image src="/logo. available hybrid premium.png" alt="AVAILABLE HYBRID R&M INC." width={220} height={70} />
            </Link>
            <Link href="/" className="rounded-xl border border-white/20 px-5 py-3 text-sm hover:bg-white/10 transition">
              Back to Home
            </Link>
          </div>
        </header>
        <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-20 text-center">
          <div>
            <p className="text-base tracking-widest text-white/60">Car Rental</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-7xl">Coming Soon</h1>
          </div>
        </main>
      </div>
    </>
  );
}
