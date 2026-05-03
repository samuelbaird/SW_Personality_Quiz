import type { CharacterTheme } from './characterThemes'
import { getTraitDescriptors, traitToPercent } from './traits'
import type { QuizResult, TraitKey } from '../types/quiz'

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 630
const SYSTEM_FONT = '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const TRAIT_LABELS = new Map(getTraitDescriptors().map((descriptor) => [descriptor.key, descriptor.label]))

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    image.src = src.startsWith('http') ? src : `${window.location.origin}${src}`
  })
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height)
  const scaledWidth = image.width * scale
  const scaledHeight = image.height * scale
  const offsetX = x + (width - scaledWidth) / 2
  const offsetY = y + (height - scaledHeight) / 2

  ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight)
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  weight = 700,
) {
  for (let size = maxSize; size >= minSize; size -= 2) {
    ctx.font = `${weight} ${size}px ${SYSTEM_FONT}`
    if (ctx.measureText(text).width <= maxWidth) {
      return size
    }
  }
  return minSize
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (!words.length) {
    return []
  }
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (ctx.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
    }
    currentLine = word
  }

  if (currentLine) {
    lines.push(currentLine)
  }
  return lines
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const lines = wrapText(ctx, text, maxWidth)
  const trimmedLines = lines.slice(0, maxLines)
  trimmedLines.forEach((line, index) => {
    const isLastVisibleLine = index === maxLines - 1 && lines.length > maxLines
    const textToDraw = isLastVisibleLine ? `${line}...` : line
    ctx.fillText(textToDraw, x, y + index * lineHeight)
  })
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function traitLabel(traitKey: TraitKey): string {
  const label = TRAIT_LABELS.get(traitKey)
  if (label) {
    return label
  }
  return traitKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function drawFittedParagraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
) {
  const sanitized = text.trim().replace(/\s+/g, ' ')
  if (!sanitized) {
    return
  }

  for (let fontSize = 20; fontSize >= 12; fontSize -= 1) {
    ctx.font = `500 ${fontSize}px ${SYSTEM_FONT}`
    const lines = wrapText(ctx, sanitized, maxWidth)
    const lineHeight = Math.round(fontSize * 1.24)
    if (lines.length * lineHeight <= maxHeight) {
      lines.forEach((line, index) => {
        ctx.fillText(line, x, y + index * lineHeight)
      })
      return
    }
  }

  ctx.font = `500 12px ${SYSTEM_FONT}`
  const lineHeight = 15
  const lines = wrapText(ctx, sanitized, maxWidth)
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })
}

export async function buildShareImage(result: QuizResult, theme: CharacterTheme): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas context is unavailable.')
  }

  const [characterImage, corridorImage] = await Promise.allSettled([
    loadImage(theme.image),
    loadImage('/imperial-corridor-bg.png'),
  ])

  ctx.fillStyle = '#0b1220'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  if (corridorImage.status === 'fulfilled') {
    ctx.save()
    ctx.globalAlpha = 0.25
    drawCoverImage(ctx, corridorImage.value, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.restore()
  }

  const portraitX = 480
  const portraitWidth = CANVAS_WIDTH - portraitX
  if (characterImage.status === 'fulfilled') {
    drawCoverImage(ctx, characterImage.value, portraitX, 0, portraitWidth, CANVAS_HEIGHT)
  }

  // One continuous wash prevents visible vertical seams between gradient layers.
  const cinematicWash = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0)
  cinematicWash.addColorStop(0, 'rgba(2,6,23,0.8)')
  cinematicWash.addColorStop(0.34, 'rgba(2,6,23,0.68)')
  cinematicWash.addColorStop(0.56, 'rgba(2,6,23,0.52)')
  cinematicWash.addColorStop(0.78, 'rgba(2,6,23,0.4)')
  cinematicWash.addColorStop(1, 'rgba(2,6,23,0.5)')
  ctx.fillStyle = cinematicWash
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  const edgeVignette = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
  edgeVignette.addColorStop(0, 'rgba(2,6,23,0.2)')
  edgeVignette.addColorStop(0.5, 'rgba(2,6,23,0)')
  edgeVignette.addColorStop(1, 'rgba(2,6,23,0.28)')
  ctx.fillStyle = edgeVignette
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  const glow = ctx.createRadialGradient(915, 280, 80, 915, 280, 360)
  glow.addColorStop(0, theme.glow)
  glow.addColorStop(1, 'rgba(15,23,42,0)')
  ctx.fillStyle = glow
  ctx.fillRect(480, 0, 720, 630)
  ctx.restore()

  ctx.fillStyle = theme.accent
  ctx.fillRect(0, 0, 8, CANVAS_HEIGHT)

  const leftPadding = 54
  const leftPanelWidth = 550

  ctx.fillStyle = '#94a3b8'
  ctx.font = `600 18px ${SYSTEM_FONT}`
  ctx.fillText('STAR WARS PERSONALITY QUIZ', leftPadding, 92)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = `500 24px ${SYSTEM_FONT}`
  ctx.fillText('You are', leftPadding, 146)

  const nameSize = fitFontSize(ctx, result.character.name, leftPanelWidth, 72, 56, 700)
  ctx.fillStyle = '#f8fafc'
  ctx.font = `700 ${nameSize}px ${SYSTEM_FONT}`
  ctx.fillText(result.character.name, leftPadding, 226)

  let cursorY = 272
  if (result.character.signature) {
    ctx.fillStyle = theme.accent
    ctx.font = `italic 500 28px ${SYSTEM_FONT}`
    drawWrappedText(ctx, result.character.signature, leftPadding, cursorY, leftPanelWidth, 34, 2)
    cursorY += 78
  }

  const alignmentPercent = traitToPercent(result.alignmentScore)
  const matchPercent = traitToPercent(result.matchScore)
  const isLight = result.alignmentScore >= 0.5
  const alignmentLabel = isLight ? 'Light' : 'Dark'
  const dominantKey = (result.dominantTraits[0] ?? 'morality') as TraitKey
  const dominantPercent = traitToPercent(result.traits[dominantKey])
  const leastDominantEntry = (Object.entries(result.traits) as [TraitKey, number][])
    .sort((first, second) => first[1] - second[1])[0] ?? ['morality', result.traits.morality]
  const leastDominantKey = leastDominantEntry[0]
  const leastDominantPercent = traitToPercent(leastDominantEntry[1])

  ctx.fillStyle = '#e2e8f0'
  ctx.font = `600 24px ${SYSTEM_FONT}`
  ctx.fillText(`Match ${matchPercent}%`, leftPadding, cursorY + 56)
  ctx.fillText('Alignment:', leftPadding + 230, cursorY + 56)
  ctx.fillStyle = isLight ? theme.accent : '#f43f5e'
  ctx.fillText(`${alignmentLabel} ${alignmentPercent}%`, leftPadding + 370, cursorY + 56)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = `600 18px ${SYSTEM_FONT}`
  ctx.fillText(`Top: ${traitLabel(dominantKey)} ${dominantPercent}%`, leftPadding, cursorY + 92)
  ctx.fillText(
    `Lowest: ${traitLabel(leastDominantKey)} ${leastDominantPercent}%`,
    leftPadding + 280,
    cursorY + 92,
  )

  const explanationText = result.explanation.trim() || result.character.description
  const explanationBoxX = leftPadding
  const explanationBoxY = cursorY + 112
  const explanationBoxWidth = leftPanelWidth
  const explanationBoxHeight = 136

  ctx.fillStyle = 'rgba(2,6,23,0.56)'
  roundedRectPath(ctx, explanationBoxX, explanationBoxY, explanationBoxWidth, explanationBoxHeight, 14)
  ctx.fill()
  ctx.lineWidth = 1.25
  ctx.strokeStyle = `${theme.accent}66`
  roundedRectPath(ctx, explanationBoxX, explanationBoxY, explanationBoxWidth, explanationBoxHeight, 14)
  ctx.stroke()

  ctx.fillStyle = '#94a3b8'
  ctx.font = `600 15px ${SYSTEM_FONT}`
  ctx.fillText('PERSONALITY READING', explanationBoxX + 16, explanationBoxY + 26)
  ctx.fillStyle = '#e2e8f0'
  drawFittedParagraph(
    ctx,
    explanationText,
    explanationBoxX + 16,
    explanationBoxY + 56,
    explanationBoxWidth - 28,
    explanationBoxHeight - 64,
  )

  const pillText = 'swquiz.vercel.app'
  ctx.font = `700 26px ${SYSTEM_FONT}`
  const pillPaddingX = 24
  const pillHeight = 58
  const pillWidth = ctx.measureText(pillText).width + pillPaddingX * 2
  const pillX = CANVAS_WIDTH - pillWidth - 40
  const pillY = CANVAS_HEIGHT - pillHeight - 40

  ctx.fillStyle = theme.accent
  roundedRectPath(ctx, pillX, pillY, pillWidth, pillHeight, 14)
  ctx.fill()

  ctx.fillStyle = '#020617'
  ctx.fillText(pillText, pillX + pillPaddingX, pillY + 39)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }
      reject(new Error('Could not generate share image.'))
    }, 'image/png')
  })
}
