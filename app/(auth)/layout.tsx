import Link from 'next/link'
import Logo from '@/components/ui/Logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-10 group">
          <Logo height={52} className="group-hover:scale-105 transition-transform" />
        </Link>
        {children}
      </div>
    </div>
  )
}
