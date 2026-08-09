import { useRef, useEffect } from 'react'
import { useTheme } from './themes.jsx'

const rand = (min, max) => Math.random() * (max - min) + min
const TAU = Math.PI * 2

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

export default function BackgroundCanvas() {
  const canvasRef = useRef(null)
  const { current } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    let w,
      h,
      time = 0
    let rafId

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()

    const c = current().colors

    /* ─── Aurora (default) ─── */
    const auroraBands = Array.from({ length: 4 }, (_, i) => ({
      baseY: rand(0.25, 0.7),
      amp: rand(40, 90),
      freq: rand(0.002, 0.005) * (i % 2 ? 1 : -1),
      speed: rand(0.03, 0.07),
      phase: rand(0, TAU),
      color: [c.accent, c.accent2, c.cyan, c.accent2][i],
      alpha: rand(0.08, 0.2),
      width: rand(70, 140),
    }))
    const auroraStars = Array.from({ length: 50 }, () => ({
      x: rand(0, 1),
      y: rand(0, 1),
      size: rand(0.5, 2),
      speed: rand(0.04, 0.15),
      phase: rand(0, TAU),
    }))

    /* ─── Lava (magma) ─── */
    const lavaParticles = Array.from({ length: 80 }, () => ({
      x: rand(0, 1),
      y: rand(1.05, 1.5),
      size: rand(2, 7),
      speed: rand(0.1, 0.4),
      alpha: rand(0.2, 0.6),
      color: ['#ff6b4a', '#ff8c4a', '#ffaa4a', '#ff3b3b'][Math.floor(rand(0, 4))],
      drift: rand(-0.008, 0.008),
    }))

    /* ─── Ocean ─── */
    const fishes = Array.from({ length: 14 }, () => ({
      x: rand(-0.5, 1.5),
      y: rand(0.1, 0.9),
      size: rand(12, 35),
      speed: rand(0.15, 0.4),
      dir: Math.random() > 0.5 ? 1 : -1,
      tailPhase: rand(0, TAU),
      color: [c.accent, c.accent2, c.cyan, c.green][Math.floor(rand(0, 4))],
      alpha: rand(0.25, 0.5),
    }))
    const bubbles = Array.from({ length: 20 }, () => ({
      x: rand(0.05, 0.95),
      y: rand(0, 1),
      size: rand(1.5, 4),
      speed: rand(0.04, 0.12),
      alpha: rand(0.1, 0.25),
    }))

    /* ─── Gold ─── */
    const goldParticles = Array.from({ length: 70 }, () => ({
      x: rand(0, 1),
      y: rand(0, 1),
      size: rand(1, 4),
      speed: rand(0.008, 0.03),
      phase: rand(0, TAU),
      driftX: rand(-0.0008, 0.0008),
      driftY: rand(-0.0008, 0.0008),
      alpha: rand(0.1, 0.5),
    }))
    const goldGlows = Array.from({ length: 5 }, () => ({
      x: rand(0.15, 0.85),
      y: rand(0.15, 0.85),
      size: rand(60, 130),
      phase: rand(0, TAU),
      speed: rand(0.05, 0.12),
      alpha: rand(0.04, 0.1),
    }))

    /* ─── Mint ─── */
    const leaves = Array.from({ length: 16 }, () => ({
      x: rand(-0.1, 1.1),
      y: rand(-0.2, 1.2),
      size: rand(10, 24),
      speed: rand(0.05, 0.15),
      rotation: rand(0, TAU),
      rotSpeed: rand(-0.007, 0.007),
      driftX: rand(-0.001, -0.003),
      driftY: rand(0.0015, 0.004),
      alpha: rand(0.15, 0.35),
      color: Math.random() > 0.5 ? c.accent : c.green,
    }))

    /* ─── Eye ─── */
    const eyeGlows = Array.from({ length: 3 }, () => ({
      x: rand(0.2, 0.8),
      y: rand(0.2, 0.8),
      size: rand(200, 400),
      phase: rand(0, TAU),
      speed: rand(0.02, 0.05),
      alpha: rand(0.03, 0.06),
    }))

    const themeId = current().id

    const draw = {
      default() {
        // Aurora bands
        for (const b of auroraBands) {
          ctx.beginPath()
          ctx.moveTo(-10, b.baseY * h + Math.sin(-10 * b.freq + time * b.speed + b.phase) * b.amp)
          for (let x = -10; x <= w + 10; x += 3) {
            const y =
              b.baseY * h +
              Math.sin(x * b.freq + time * b.speed + b.phase) * b.amp +
              Math.sin(x * b.freq * 1.7 + time * b.speed * 0.6 + b.phase) * b.amp * 0.35
            ctx.lineTo(x, y)
          }
          ctx.lineTo(w + 10, h + 10)
          ctx.lineTo(-10, h + 10)
          ctx.closePath()

          const grad = ctx.createLinearGradient(
            0,
            b.baseY * h - b.amp - b.width * 0.4,
            0,
            b.baseY * h + b.amp + b.width * 0.4
          )
          grad.addColorStop(0, 'transparent')
          grad.addColorStop(0.3, hexToRgba(b.color, b.alpha))
          grad.addColorStop(0.5, hexToRgba(b.color, b.alpha * 1.2))
          grad.addColorStop(0.7, hexToRgba(b.color, b.alpha * 0.6))
          grad.addColorStop(1, 'transparent')
          ctx.fillStyle = grad
          ctx.fill()
        }

        // Stars
        for (const s of auroraStars) {
          const a = s.alpha * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase))
          ctx.globalAlpha = a
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(s.x * w, s.y * h + Math.sin(time * 0.2 + s.phase) * 12, s.size, 0, TAU)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      },

      magma() {
        // Bottom glow
        const bottomGlow = ctx.createLinearGradient(0, h * 0.7, 0, h)
        bottomGlow.addColorStop(0, 'transparent')
        bottomGlow.addColorStop(0.5, hexToRgba('#ff6b4a', 0.08))
        bottomGlow.addColorStop(1, hexToRgba('#ff3b3b', 0.15))
        ctx.fillStyle = bottomGlow
        ctx.fillRect(0, h * 0.7, w, h * 0.3)

        // Particles
        for (const p of lavaParticles) {
          p.y -= p.speed * 0.005
          p.x += p.drift + Math.sin(time * 0.3 + p.y * 2) * 0.003
          if (p.y < -0.05) {
            p.y = rand(1.05, 1.3)
            p.x = rand(0, 1)
          }

          const px = p.x * w,
            py = p.y * h
          const a = p.alpha * (0.7 + 0.3 * Math.sin(time * 0.5 + p.y * 5))

          // Glow
          const glow = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2.5)
          glow.addColorStop(0, hexToRgba(p.color, a * 0.6))
          glow.addColorStop(0.5, hexToRgba(p.color, a * 0.15))
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(px, py, p.size * 2.5, 0, TAU)
          ctx.fill()

          // Core
          ctx.globalAlpha = a * 0.8
          ctx.fillStyle = '#ffd24a'
          ctx.beginPath()
          ctx.arc(px, py, p.size * 0.3, 0, TAU)
          ctx.fill()

          ctx.globalAlpha = a * 0.9
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(px, py, p.size * 0.5, 0, TAU)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      },

      ocean() {
        // Bubbles
        for (const b of bubbles) {
          b.y -= b.speed * 0.005
          b.x += Math.sin(time * 0.15 + b.y * 3) * 0.002
          if (b.y < -0.05) {
            b.y = 1
            b.x = rand(0.05, 0.95)
          }

          ctx.globalAlpha = b.alpha * (0.5 + 0.5 * Math.sin(time * 0.3 + b.y * 4))
          ctx.strokeStyle = hexToRgba(c.cyan, 1)
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.arc(b.x * w, b.y * h, b.size, 0, TAU)
          ctx.stroke()
        }

        // Fish
        for (const f of fishes) {
          f.x += f.speed * 0.002 * f.dir
          f.tailPhase += 0.015 * f.dir
          if (f.x > 1.3) f.x = -0.3
          if (f.x < -0.3) f.x = 1.3

          ctx.save()
          ctx.translate(f.x * w, f.y * h)
          if (f.dir < 0) ctx.scale(-1, 1)
          ctx.globalAlpha = f.alpha

          const s = f.size
          const tailWag = Math.sin(f.tailPhase) * 0.25

          // Body
          ctx.fillStyle = f.color
          ctx.beginPath()
          ctx.ellipse(0, 0, s * 0.5, s * 0.18, 0, 0, TAU)
          ctx.fill()

          // Tail
          ctx.beginPath()
          ctx.moveTo(-s * 0.48, 0)
          ctx.quadraticCurveTo(-s * 0.55, -s * 0.2 + tailWag * s * 0.15, -s * 0.8, -s * 0.18 + tailWag * s * 0.25)
          ctx.quadraticCurveTo(-s * 0.6, 0, -s * 0.8, s * 0.18 + tailWag * s * 0.25)
          ctx.quadraticCurveTo(-s * 0.55, s * 0.2 + tailWag * s * 0.15, -s * 0.48, 0)
          ctx.fill()

          // Fin
          ctx.beginPath()
          ctx.moveTo(s * 0.15, -s * 0.14)
          ctx.quadraticCurveTo(s * 0.3, -s * 0.25, s * 0.05, -s * 0.2)
          ctx.quadraticCurveTo(s * 0.1, -s * 0.12, s * 0.15, -s * 0.14)
          ctx.fill()

          // Eye
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(s * 0.25, -s * 0.04, s * 0.06, 0, TAU)
          ctx.fill()
          ctx.fillStyle = '#111'
          ctx.beginPath()
          ctx.arc(s * 0.28, -s * 0.04, s * 0.03, 0, TAU)
          ctx.fill()

          ctx.restore()
        }
        ctx.globalAlpha = 1
      },

      gold() {
        // Glowing orbs
        for (const g of goldGlows) {
          const a = g.alpha * (0.5 + 0.5 * Math.sin(time * g.speed + g.phase))
          const glow = ctx.createRadialGradient(g.x * w, g.y * h, 0, g.x * w, g.y * h, g.size)
          glow.addColorStop(0, hexToRgba(c.accent, a))
          glow.addColorStop(0.4, hexToRgba(c.accent2, a * 0.4))
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(g.x * w, g.y * h, g.size, 0, TAU)
          ctx.fill()
        }

        // Particles
        for (const p of goldParticles) {
          p.x += p.driftX
          p.y += p.driftY
          if (p.x < -0.05) p.x = 1.05
          if (p.x > 1.05) p.x = -0.05
          if (p.y < -0.05) p.y = 1.05
          if (p.y > 1.05) p.y = -0.05

          const a = p.alpha * (0.2 + 0.8 * Math.sin(time * p.speed + p.phase))
          ctx.globalAlpha = a

          const glow = ctx.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, p.size * 3)
          glow.addColorStop(0, hexToRgba(c.accent, a * 0.4))
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(p.x * w, p.y * h, p.size * 3, 0, TAU)
          ctx.fill()

          ctx.fillStyle = c.accent
          ctx.beginPath()
          ctx.arc(p.x * w, p.y * h, p.size * 0.6, 0, TAU)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      },

      mint() {
        for (const l of leaves) {
          l.x += l.driftX
          l.y += l.driftY
          l.rotation += l.rotSpeed
          if (l.y > 1.3) {
            l.y = -0.2
            l.x = rand(-0.1, 1.1)
          }
          if (l.x < -0.2) l.x = 1.2

          ctx.save()
          ctx.translate(l.x * w, l.y * h)
          ctx.rotate(l.rotation)
          ctx.globalAlpha = l.alpha * (0.6 + 0.4 * Math.sin(time * 0.1 + l.x * 2))

          const s = l.size
          ctx.fillStyle = l.color

          // Leaf shape
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.bezierCurveTo(s * 0.4, -s * 0.3, s * 0.8, -s * 0.15, s * 0.9, 0)
          ctx.bezierCurveTo(s * 0.8, s * 0.15, s * 0.4, s * 0.3, 0, 0)
          ctx.fill()

          // Stem
          ctx.strokeStyle = hexToRgba(c.green, 0.3)
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(-s * 0.05, 0)
          ctx.lineTo(-s * 0.15, s * 0.02)
          ctx.stroke()

          // Vein
          ctx.beginPath()
          ctx.moveTo(s * 0.05, 0)
          ctx.lineTo(s * 0.6, -s * 0.05)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(s * 0.15, 0)
          ctx.lineTo(s * 0.5, s * 0.08)
          ctx.stroke()

          ctx.restore()
        }
        ctx.globalAlpha = 1
      },

      eye() {
        for (const g of eyeGlows) {
          const a = g.alpha * (0.5 + 0.5 * Math.sin(time * g.speed + g.phase))
          const x = g.x * w + Math.sin(time * 0.04 + g.phase) * 25
          const y = g.y * h + Math.cos(time * 0.03 + g.phase) * 18
          const glow = ctx.createRadialGradient(x, y, 0, x, y, g.size)
          glow.addColorStop(0, hexToRgba(c.accent, a))
          glow.addColorStop(0.5, hexToRgba(c.green, a * 0.3))
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(x, y, g.size, 0, TAU)
          ctx.fill()
        }

        // Subtle horizontal bands
        ctx.globalAlpha = 0.015
        for (let i = 0; i < 8; i++) {
          const y = h * (0.15 + i * 0.09) + Math.sin(time * 0.015 + i * 1.2) * 6
          ctx.fillStyle = c.accent
          ctx.fillRect(0, y, w, 1.5)
        }
        ctx.globalAlpha = 1
      },

      /* ─── Sunshine (阳光橙) ─── */
      sunshine() {
        // Orange slices
        if (!draw._slices) {
          draw._slices = Array.from({ length: 18 }, () => ({
            x: rand(0, 1),
            y: rand(0, 1),
            size: rand(14, 32),
            speed: rand(0.02, 0.06),
            driftX: rand(-0.0005, 0.0005),
            driftY: rand(-0.0003, 0.0003),
            rotation: rand(0, TAU),
            rotSpeed: rand(-0.003, 0.003),
            alpha: rand(0.12, 0.3),
            segments: Math.floor(rand(5, 9)),
          }))
        }
        for (const s of draw._slices) {
          s.x += s.driftX + Math.sin(time * 0.2 + s.y * 3) * 0.0003
          s.y += s.driftY + Math.cos(time * 0.15 + s.x * 2) * 0.0002
          s.rotation += s.rotSpeed
          if (s.x < -0.1) s.x = 1.1
          if (s.x > 1.1) s.x = -0.1
          if (s.y < -0.1) s.y = 1.1
          if (s.y > 1.1) s.y = -0.1

          ctx.save()
          ctx.translate(s.x * w, s.y * h)
          ctx.rotate(s.rotation)
          ctx.globalAlpha = s.alpha * (0.6 + 0.4 * Math.sin(time * s.speed + s.x * 2))

          // Outer rind
          ctx.fillStyle = '#ff8c2a'
          ctx.beginPath()
          ctx.arc(0, 0, s.size, 0, TAU)
          ctx.fill()

          // Inner flesh
          ctx.fillStyle = '#ffa94a'
          ctx.beginPath()
          ctx.arc(0, 0, s.size * 0.82, 0, TAU)
          ctx.fill()

          // Center
          ctx.fillStyle = '#ffc060'
          ctx.beginPath()
          ctx.arc(0, 0, s.size * 0.25, 0, TAU)
          ctx.fill()

          // Segment lines
          ctx.strokeStyle = 'rgba(255,200,100,0.4)'
          ctx.lineWidth = 0.8
          for (let i = 0; i < s.segments; i++) {
            const angle = (i / s.segments) * TAU
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(Math.cos(angle) * s.size * 0.78, Math.sin(angle) * s.size * 0.78)
            ctx.stroke()
          }

          ctx.restore()
        }
        ctx.globalAlpha = 1
      },

      /* ─── Ultramarine (群青蓝) ─── */
      ultramarine() {
        if (!draw._crystals) {
          draw._crystals = Array.from({ length: 22 }, () => ({
            x: rand(0, 1),
            y: rand(0, 1),
            size: rand(6, 20),
            speed: rand(0.01, 0.04),
            driftX: rand(-0.0003, 0.0003),
            driftY: rand(-0.0002, 0.0002),
            rotation: rand(0, TAU),
            rotSpeed: rand(-0.002, 0.002),
            alpha: rand(0.1, 0.3),
            sides: Math.floor(rand(4, 7)),
            color: ['#4a6aff', '#6a8aff', '#4ac8ff', '#8aa0ff'][Math.floor(rand(0, 4))],
          }))
          draw._crystalGlows = Array.from({ length: 4 }, () => ({
            x: rand(0.1, 0.9),
            y: rand(0.1, 0.9),
            size: rand(80, 180),
            phase: rand(0, TAU),
            speed: rand(0.03, 0.08),
            alpha: rand(0.03, 0.07),
          }))
        }

        // Background glows
        for (const g of draw._crystalGlows) {
          const a = g.alpha * (0.5 + 0.5 * Math.sin(time * g.speed + g.phase))
          const glow = ctx.createRadialGradient(g.x * w, g.y * h, 0, g.x * w, g.y * h, g.size)
          glow.addColorStop(0, hexToRgba('#4a6aff', a))
          glow.addColorStop(0.5, hexToRgba('#4ac8ff', a * 0.3))
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(g.x * w, g.y * h, g.size, 0, TAU)
          ctx.fill()
        }

        // Crystal shards
        for (const cr of draw._crystals) {
          cr.x += cr.driftX + Math.sin(time * 0.1 + cr.y * 2) * 0.0002
          cr.y += cr.driftY + Math.cos(time * 0.08 + cr.x * 3) * 0.00015
          cr.rotation += cr.rotSpeed
          if (cr.x < -0.1) cr.x = 1.1
          if (cr.x > 1.1) cr.x = -0.1
          if (cr.y < -0.1) cr.y = 1.1
          if (cr.y > 1.1) cr.y = -0.1

          ctx.save()
          ctx.translate(cr.x * w, cr.y * h)
          ctx.rotate(cr.rotation)
          ctx.globalAlpha = cr.alpha * (0.5 + 0.5 * Math.sin(time * cr.speed + cr.x * 3))

          // Crystal shape (polygon)
          ctx.fillStyle = cr.color
          ctx.beginPath()
          for (let i = 0; i < cr.sides; i++) {
            const angle = (i / cr.sides) * TAU - TAU / 4
            const r = cr.size * (0.7 + 0.3 * Math.sin(angle * 2))
            const px = Math.cos(angle) * r
            const py = Math.sin(angle) * r
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.fill()

          // Highlight facet
          ctx.fillStyle = 'rgba(255,255,255,0.15)'
          ctx.beginPath()
          ctx.moveTo(0, -cr.size * 0.5)
          ctx.lineTo(cr.size * 0.3, -cr.size * 0.2)
          ctx.lineTo(0, 0)
          ctx.lineTo(-cr.size * 0.2, -cr.size * 0.3)
          ctx.closePath()
          ctx.fill()

          ctx.restore()
        }
        ctx.globalAlpha = 1
      },
    }

    const loop = (t) => {
      time = t / 1000
      ctx.clearRect(0, 0, w, h)
      if (draw[themeId]) draw[themeId]()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [current])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  )
}
