import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#101010] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2.5 mb-10 group">
          <div className="w-10 h-10 bg-[#FF471A] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-xl">F</span>
          </div>
          <span className="text-white font-bold text-2xl">FitPrompt</span>
        </Link>
        {children}
      </div>
    </div>
  )
}
