// src/components/FundoAnimado.tsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function FundoAnimado() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Cena
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0d1117') // fundo escuro estilo tzolkin

    // Câmera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      1000
    )
    camera.position.z = 100

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)

    // Criar partículas
    const particlesCount = 2000
    const positions = new Float32Array(particlesCount * 3)
    for (let i = 0; i < particlesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 400
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 1.5,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // Animação
    const animate = () => {
      requestAnimationFrame(animate)

      particles.rotation.y += 0.0005
      particles.rotation.x += 0.0003

      renderer.render(scene, camera)
    }

    animate()

    // Responsividade
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0" />
}
