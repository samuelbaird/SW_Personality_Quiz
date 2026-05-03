import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { CharacterTheme } from '../lib/characterThemes'
import type { QuizResult } from '../types/quiz'
import {
  SOCIAL_PLATFORM_ICONS,
  SOCIAL_PLATFORM_META,
  type SocialPlatform,
} from './SocialIcons'

interface ShareModalProps {
  isOpen: boolean
  blob: Blob | null
  result: QuizResult
  theme: CharacterTheme
  appUrl: string
  onClose: () => void
}

type FeedbackState = { key: string; message: string } | null

function buildIntentUrl(platform: SocialPlatform, caption: string, appUrl: string) {
  const encodedCaption = encodeURIComponent(caption)
  const encodedUrl = encodeURIComponent(appUrl)
  switch (platform) {
    case 'x':
      return `https://twitter.com/intent/tweet?text=${encodedCaption}&url=${encodedUrl}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedCaption}`
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    case 'reddit':
      return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedCaption}`
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${caption} ${appUrl}`)}`
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedCaption}`
    default:
      return appUrl
  }
}

export function ShareModal({ isOpen, blob, result, theme, appUrl, onClose }: ShareModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)

  const defaultCaption = useMemo(
    () => `I got ${result.character.name} on the Star Wars AI Personality Quiz! Try it: ${appUrl}`,
    [appUrl, result.character.name],
  )

  const imageFile = useMemo(() => {
    if (!blob) {
      return null
    }
    return new File([blob], `swquiz-${result.character.id}.png`, { type: 'image/png' })
  }, [blob, result.character.id])

  const hasNativeShare = useMemo(() => 'share' in navigator && 'canShare' in navigator, [])
  const hasClipboardApi = useMemo(() => 'clipboard' in navigator, [])

  const canNativeShare = useMemo(
    () => Boolean(imageFile && hasNativeShare && navigator.canShare({ files: [imageFile] })),
    [hasNativeShare, imageFile],
  )

  const canCopyImage = useMemo(
    () => Boolean(blob && hasClipboardApi && 'write' in navigator.clipboard && typeof ClipboardItem !== 'undefined'),
    [blob, hasClipboardApi],
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null)
      setFeedback(null)
      return
    }

    setCaption(defaultCaption)
    if (!blob) {
      return
    }

    const objectUrl = URL.createObjectURL(blob)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob, defaultCaption, isOpen])

  useEffect(() => {
    if (!feedback) {
      return
    }
    const timer = window.setTimeout(() => setFeedback(null), 2000)
    return () => window.clearTimeout(timer)
  }, [feedback])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    function onEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [isOpen, onClose])

  async function copyCaption() {
    if (!hasClipboardApi || !('writeText' in navigator.clipboard)) {
      setFeedback({ key: 'caption', message: 'Clipboard not available in this browser.' })
      return
    }
    await navigator.clipboard.writeText(caption)
    setFeedback({ key: 'caption', message: 'Caption copied.' })
  }

  async function copyImage() {
    if (!blob || !canCopyImage || !hasClipboardApi || typeof ClipboardItem === 'undefined') {
      setFeedback({ key: 'image', message: 'Image copy is not supported in this browser.' })
      return
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ])
    setFeedback({ key: 'image', message: 'Image copied.' })
  }

  function downloadImage() {
    if (!blob || !imageFile) {
      return
    }
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = imageFile.name
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    setFeedback({ key: 'download', message: 'Image downloaded.' })
  }

  async function nativeShare() {
    if (!imageFile || !canNativeShare || !hasNativeShare) {
      return
    }
    try {
      await navigator.share({
        title: 'Star Wars AI Personality Quiz',
        text: caption,
        url: appUrl,
        files: [imageFile],
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      setFeedback({ key: 'native', message: 'Native share failed. Use download + platform buttons.' })
    }
  }

  function openPlatform(platform: SocialPlatform) {
    const intentUrl = buildIntentUrl(platform, caption, appUrl)
    window.open(intentUrl, '_blank', 'noopener,noreferrer')
  }

  const platforms: SocialPlatform[] = isMobile
    ? ['whatsapp', 'x', 'telegram', 'reddit', 'facebook', 'linkedin']
    : ['linkedin', 'facebook', 'x', 'reddit', 'whatsapp', 'telegram']

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} aria-hidden />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 w-full max-w-4xl rounded-2xl border bg-slate-900/90 p-5 shadow-2xl md:p-6"
            style={{ borderColor: theme.border, boxShadow: `0 0 60px ${theme.glow}` }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-100">Share your result</h3>
                <p className="mt-1 text-sm text-slate-300">
                  {isMobile
                    ? 'Use Native share for quickest posting, or download first then open a platform.'
                    : 'Download the image first, then use a platform button with pre-filled text.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border px-3 py-1.5 text-sm text-slate-200 transition hover:brightness-125"
                style={{ borderColor: theme.border }}
              >
                Close
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-[1.35fr_1fr]">
              <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950/70">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={`Share card preview for ${result.character.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center text-sm text-slate-400">
                    Preview unavailable
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-xs uppercase tracking-widest text-slate-300">
                  Caption
                  <textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-500"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={downloadImage}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-110"
                    style={{ backgroundColor: theme.accent }}
                  >
                    Download image
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void copyCaption()
                    }}
                    className="rounded-lg border px-3 py-2 text-sm text-slate-100 transition hover:brightness-125"
                    style={{ borderColor: theme.border }}
                  >
                    Copy caption
                  </button>
                  {canCopyImage ? (
                    <button
                      type="button"
                      onClick={() => {
                        void copyImage()
                      }}
                      className="rounded-lg border px-3 py-2 text-sm text-slate-100 transition hover:brightness-125"
                      style={{ borderColor: theme.border }}
                    >
                      Copy image
                    </button>
                  ) : null}
                  {canNativeShare ? (
                    <button
                      type="button"
                      onClick={() => {
                        void nativeShare()
                      }}
                      className="rounded-lg border px-3 py-2 text-sm text-slate-100 transition hover:brightness-125"
                      style={{ borderColor: theme.border }}
                    >
                      Native share
                    </button>
                  ) : null}
                </div>

                <p className="min-h-5 text-xs text-slate-300">{feedback?.message ?? ''}</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs uppercase tracking-widest text-slate-300">Share to platform</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
                {platforms.map((platform) => {
                  const meta = SOCIAL_PLATFORM_META[platform]
                  const Icon = SOCIAL_PLATFORM_ICONS[platform]
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => openPlatform(platform)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-white transition hover:brightness-110"
                      style={{ backgroundColor: meta.color }}
                    >
                      <Icon className="h-4 w-4" />
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
