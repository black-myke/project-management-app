"use client"

import { useEffect, useRef } from "react"

function BackgroundParticles() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const particleCount = 60 // Increased particle count
    const particles = []

    // Neon colors array
    const neonColors = [
      "#FF00FF", // Magenta
      "#00FFFF", // Cyan
      "#FFFF00", // Yellow
      "#FF3300", // Orange-Red
      "#33FF00", // Lime Green
      "#0033FF", // Blue
      "#FF00CC", // Pink
      "#00FFCC", // Turquoise
      "#CCFF00", // Chartreuse
    ]

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div")
      particle.classList.add("particle")

      // Random size between 3-10px (larger)
      const size = Math.random() * 7 + 3
      particle.style.width = `${size}px`
      particle.style.height = `${size}px`

      // Random position
      particle.style.left = `${Math.random() * 100}%`
      particle.style.top = `${Math.random() * 100}%`

      // Random opacity
      particle.style.opacity = `${Math.random() * 0.5 + 0.2}`

      // Random neon color
      const colorIndex = Math.floor(Math.random() * neonColors.length)
      const color = neonColors[colorIndex]
      particle.style.backgroundColor = color
      particle.style.boxShadow = `0 0 ${size * 3}px ${color}`

      // Random animation duration
      const duration = Math.random() * 15 + 5
      particle.style.animation = `float ${duration}s ease-in-out infinite`
      particle.style.animationDelay = `${Math.random() * 5}s`

      container.appendChild(particle)
      particles.push({
        element: particle,
        speed: Math.random() * 0.7 + 0.2, // Faster speed
        direction: Math.random() * Math.PI * 2,
        color,
        colorIndex,
        size,
      })
    }

    // Animate particles
    const animateParticles = () => {
      particles.forEach((particle) => {
        const element = particle.element

        // Get current position
        const currentTop = Number.parseFloat(element.style.top)
        const currentLeft = Number.parseFloat(element.style.left)

        // Calculate new position
        const dx = Math.cos(particle.direction) * particle.speed
        const dy = Math.sin(particle.direction) * particle.speed

        let newTop = currentTop + dy
        let newLeft = currentLeft + dx

        // Bounce off edges
        if (newTop < 0 || newTop > 100) {
          particle.direction = Math.PI * 2 - particle.direction
          newTop = Math.max(0, Math.min(100, newTop))
        }

        if (newLeft < 0 || newLeft > 100) {
          particle.direction = Math.PI - particle.direction
          newLeft = Math.max(0, Math.min(100, newLeft))
        }

        // Update position
        element.style.top = `${newTop}%`
        element.style.left = `${newLeft}%`

        // Slowly change color
        particle.colorIndex = (particle.colorIndex + 0.005) % neonColors.length
        const newColorIndex = Math.floor(particle.colorIndex)
        const newColor = neonColors[newColorIndex]
        element.style.backgroundColor = newColor
        element.style.boxShadow = `0 0 ${particle.size * 3}px ${newColor}`
      })

      requestAnimationFrame(animateParticles)
    }

    const animationId = requestAnimationFrame(animateParticles)

    return () => {
      cancelAnimationFrame(animationId)
      particles.forEach((particle) => particle.element.remove())
    }
  }, [])

  return <div ref={containerRef} className="particles" />
}

export default BackgroundParticles
