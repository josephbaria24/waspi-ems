'use client'

import { useEffect, useRef } from 'react'

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const cards: Array<{
      x: number
      y: number
      vx: number
      vy: number
      vz: number
      width: number
      height: number
      rotation: number
      rotationSpeed: number
      z: number
      hue: number
    }> = []

    // Create floating cards
    for (let i = 0; i < 8; i++) {
      cards.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.02,
        width: 80 + Math.random() * 60,
        height: 50 + Math.random() * 40,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        z: Math.random() * 1000,
        hue: 140 + Math.random() * 20, // emerald hue range
      })
    }

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Sort cards by z-depth
      cards.sort((a, b) => a.z - b.z)

      cards.forEach((card) => {
        // Update position
        card.x += card.vx
        card.y += card.vy
        card.z += card.vz * 100
        card.rotation += card.rotationSpeed

        // Bounce at edges
        if (card.x - card.width / 2 < 0 || card.x + card.width / 2 > canvas.width) {
          card.vx *= -1
        }
        if (card.y - card.height / 2 < 0 || card.y + card.height / 2 > canvas.height) {
          card.vy *= -1
        }
        if (card.z < 100 || card.z > 1000) {
          card.vz *= -1
        }

        // Keep in bounds
        card.x = Math.max(card.width / 2, Math.min(canvas.width - card.width / 2, card.x))
        card.y = Math.max(card.height / 2, Math.min(canvas.height - card.height / 2, card.y))
        card.z = Math.max(100, Math.min(1000, card.z))

        // Calculate depth-based opacity and size
        const depthFactor = card.z / 1000
        const scale = 0.5 + depthFactor * 0.5
        const opacity = 0.1 + depthFactor * 0.25

        // Save context
        ctx.save()
        ctx.translate(card.x, card.y)
        ctx.rotate(card.rotation)

        // Draw card
        const w = card.width * scale
        const h = card.height * scale

        // Card body gradient
        const gradient = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2)
        gradient.addColorStop(0, `hsla(${card.hue}, 100%, 35%, ${opacity})`)
        gradient.addColorStop(0.5, `hsla(${card.hue}, 100%, 45%, ${opacity})`)
        gradient.addColorStop(1, `hsla(${card.hue}, 100%, 35%, ${opacity})`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(-w / 2, -h / 2, w, h, 8)
        ctx.fill()

        // Shiny highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.6})`
        ctx.beginPath()
        ctx.ellipse(-w / 4, -h / 3, w / 3, h / 4, -Math.PI / 6, 0, Math.PI * 2)
        ctx.fill()

        // Border
        ctx.strokeStyle = `hsla(${card.hue}, 100%, 50%, ${opacity * 0.8})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(-w / 2, -h / 2, w, h, 8)
        ctx.stroke()

        ctx.restore()
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 opacity-60"
      style={{ background: 'transparent' }}
    />
  )
}
