import type { ReactElement, SVGProps } from 'react'

export type SocialPlatform = 'x' | 'facebook' | 'linkedin' | 'reddit' | 'whatsapp' | 'telegram'

export const SOCIAL_PLATFORM_META: Record<SocialPlatform, { label: string; color: string }> = {
  x: { label: 'X', color: '#111827' },
  facebook: { label: 'Facebook', color: '#1877F2' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
  reddit: { label: 'Reddit', color: '#FF4500' },
  whatsapp: { label: 'WhatsApp', color: '#25D366' },
  telegram: { label: 'Telegram', color: '#229ED9' },
}

function iconProps(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
    ...props,
  }
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M18.901 2H22l-6.77 7.738L23.2 22h-6.247l-4.895-6.988L5.94 22H2.84l7.242-8.277L.8 2h6.406l4.425 6.315zM17.8 20h1.718L6.274 3.896H4.43z" />
    </svg>
  )
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M13.5 21v-8.02h2.69l.4-3.13H13.5V7.85c0-.9.25-1.51 1.54-1.51h1.64V3.54c-.28-.04-1.24-.12-2.37-.12-2.35 0-3.96 1.43-3.96 4.06v2.27H7.7v3.13h2.64V21z" />
    </svg>
  )
}

export function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M6.94 8.52a1.74 1.74 0 1 1 0-3.48 1.74 1.74 0 0 1 0 3.48M5.4 9.89h3.08V19H5.4zM13.4 9.89h2.95v1.24h.04c.41-.78 1.41-1.6 2.9-1.6 3.1 0 3.68 2.04 3.68 4.7V19h-3.08v-4.24c0-1.01-.02-2.31-1.41-2.31-1.41 0-1.63 1.1-1.63 2.24V19H13.4z" />
    </svg>
  )
}

export function RedditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M20.75 13.04c0-.9-.73-1.63-1.64-1.63-.45 0-.85.18-1.15.47-1.12-.77-2.67-1.26-4.39-1.31l.92-2.9 2.51.59a1.39 1.39 0 1 0 .23-1.29l-2.87-.68a.64.64 0 0 0-.75.42L12.5 10.5c-1.78.02-3.39.52-4.54 1.31a1.62 1.62 0 0 0-2.78 1.14c0 .61.34 1.14.84 1.42a3.9 3.9 0 0 0-.04.53c0 2.72 2.67 4.92 5.95 4.92s5.95-2.2 5.95-4.92c0-.18-.01-.35-.04-.52.54-.26.91-.82.91-1.44M8.95 14.69a1.22 1.22 0 1 1 0-2.44 1.22 1.22 0 0 1 0 2.44m6.06 2.85c-.73.73-1.9 1.09-3.08 1.09s-2.35-.36-3.08-1.09a.49.49 0 1 1 .69-.69c.51.5 1.39.79 2.39.79s1.88-.29 2.39-.79a.49.49 0 1 1 .69.69m-.03-2.85a1.22 1.22 0 1 1 0-2.44 1.22 1.22 0 0 1 0 2.44" />
    </svg>
  )
}

export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M20.52 3.48A11.9 11.9 0 0 0 12.05 0C5.43 0 .05 5.38.05 12c0 2.11.55 4.18 1.6 6.01L0 24l6.17-1.62A11.93 11.93 0 0 0 12.05 24h.01c6.62 0 12-5.38 12-12a11.9 11.9 0 0 0-3.54-8.52M12.06 21.9h-.01a9.86 9.86 0 0 1-5.02-1.37l-.36-.21-3.66.96.98-3.57-.24-.37a9.82 9.82 0 0 1-1.51-5.27c0-5.45 4.44-9.89 9.9-9.89a9.83 9.83 0 0 1 9.89 9.89c0 5.45-4.44 9.89-9.89 9.89m5.43-7.41c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.34.44-.51s.2-.3.3-.5.05-.37-.02-.52c-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.66-.5h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.01-1.04 2.47s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.71.62.72.23 1.38.2 1.9.12.58-.08 1.75-.72 2-1.41.25-.69.25-1.28.17-1.4-.07-.12-.27-.2-.57-.35" />
    </svg>
  )
}

export function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0m5.66 8.16-1.97 9.29c-.15.66-.54.82-1.1.51l-3.04-2.24-1.47 1.41c-.16.16-.3.3-.62.3l.22-3.12 5.68-5.13c.25-.22-.05-.35-.38-.13L8.2 13.32l-2.9-.9c-.64-.2-.65-.64.13-.95l11.34-4.37c.53-.2.99.13.89 1.06" />
    </svg>
  )
}

export const SOCIAL_PLATFORM_ICONS: Record<
  SocialPlatform,
  (props: SVGProps<SVGSVGElement>) => ReactElement
> = {
  x: XIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  reddit: RedditIcon,
  whatsapp: WhatsAppIcon,
  telegram: TelegramIcon,
}
