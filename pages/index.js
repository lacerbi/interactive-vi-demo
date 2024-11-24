import Image from "next/image";
import localFont from "next/font/local";
import InteractiveVI from "../components/InteractiveVI";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Home() {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen p-8 font-[family-name:var(--font-geist-sans)]`}
    >
      <main className="flex flex-col items-center max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Interactive Variational Inference</h1>
        <div className="w-full">
          <InteractiveVI />
        </div>
      </main>
    </div>
  );
}