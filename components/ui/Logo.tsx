import Image from 'next/image'
import logoIcon from '@/assets/logo/logo.png'
import logoFull from '@/assets/logo/logocompleto.png'

interface LogoProps {
  /** 'full' = logocompleto.png (logo + texto), 'icon' = logo.png (solo icono) */
  variant?: 'full' | 'icon'
  height?: number
  className?: string
}

export default function Logo({ variant = 'full', height = 44, className }: LogoProps) {
  if (variant === 'icon') {
    return (
      <Image
        src={logoIcon}
        alt="FitPrompt"
        height={height}
        width={height}
        style={{ height: `${height}px`, width: `${height}px` }}
        className={className}
        priority
      />
    )
  }

  return (
    <Image
      src={logoFull}
      alt="FitPrompt"
      height={height}
      width={height * 5}
      style={{ height: `${height}px`, width: 'auto' }}
      className={className}
      priority
    />
  )
}
