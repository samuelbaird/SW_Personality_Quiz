import type { CharacterTheme } from './characterThemes'
import { traitToPercent } from './traits'
import type { QuizResult } from '../types/quiz'

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 630
const SYSTEM_FONT = '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

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
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/)
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
      currentLine = word
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

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

    const blendMask = ctx.createLinearGradient(portraitX, 0, portraitX + 260, 0)
    blendMask.addColorStop(0, '#0b1220')
    blendMask.addColorStop(1, 'rgba(11,18,32,0)')
    ctx.fillStyle = blendMask
    ctx.fillRect(portraitX, 0, 260, CANVAS_HEIGHT)
  }

  const darkenRight = ctx.createLinearGradient(portraitX, 0, CANVAS_WIDTH, 0)
  darkenRight.addColorStop(0, 'rgba(2,6,23,0)')
  darkenRight.addColorStop(1, 'rgba(2,6,23,0.58)')
  ctx.fillStyle = darkenRight
  ctx.fillRect(portraitX, 0, portraitWidth, CANVAS_HEIGHT)

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
    wrapText(ctx, result.character.signature, leftPadding, cursorY, leftPanelWidth, 34, 2)
    cursorY += 78
  }

  const alignmentPercent = traitToPercent(result.alignmentScore)
  const matchPercent = traitToPercent(result.matchScore)
  const isLight = result.alignmentScore >= 0.5
  const alignmentLabel = isLight ? 'Light' : 'Dark'

  ctx.fillStyle = '#e2e8f0'
  ctx.font = `600 24px ${SYSTEM_FONT}`
  ctx.fillText(`Match ${matchPercent}%`, leftPadding, cursorY + 56)
  ctx.fillText('Alignment:', leftPadding + 230, cursorY + 56)
  ctx.fillStyle = isLight ? theme.accent : '#f43f5e'
  ctx.fillText(`${alignmentLabel} ${alignmentPercent}%`, leftPadding + 370, cursorY + 56)

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
