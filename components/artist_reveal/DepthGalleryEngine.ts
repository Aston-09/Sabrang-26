import * as THREE from 'three'
import { Gallery } from './Gallery'
import { TrailController } from './TrailController'

/* ── Label data passed to React ── */

export interface LabelData {
  index: string
  word: string
  chipColor: string
  cmyk: string
  rgb: string
  hex: string
  pms: string
  textColor: string
}

/* ── Utility: colour-space conversions (ported from Label.js) ── */

function normalizeHexColor(rawColor: string): string {
  const fallback = '#ffffff'
  if (typeof rawColor !== 'string') return fallback

  let hex = rawColor.trim()
  if (!hex) return fallback
  if (!hex.startsWith('#')) hex = `#${hex}`

  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const short = hex.slice(1)
    hex = `#${short.split('').map((c) => `${c}${c}`).join('')}`
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return fallback
  return hex.toLowerCase()
}

function hexToRgb(hex: string) {
  const n = normalizeHexColor(hex).slice(1)
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  }
}

function rgbToCmyk({ r, g, b }: { r: number; g: number; b: number }) {
  const R = r / 255, G = g / 255, B = b / 255
  const k = 1 - Math.max(R, G, B)
  if (k >= 0.999) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: Math.round(((1 - R - k) / (1 - k)) * 100),
    m: Math.round(((1 - G - k) / (1 - k)) * 100),
    y: Math.round(((1 - B - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  }
}

function buildColorSpecs(accentColor: string, pmsValue: string) {
  const normAccent = normalizeHexColor(accentColor)
  const rgb = hexToRgb(normAccent)
  const cmyk = rgbToCmyk(rgb)
  return {
    chipHex: normAccent,
    cmyk: `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`,
    rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    hex: normAccent.slice(1).toUpperCase(),
    pms: pmsValue || 'N/A',
  }
}

/* ── Engine ── */

export class DepthGalleryEngine {
  private canvas: HTMLCanvasElement
  private onLabelUpdate: (data: LabelData) => void

  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer

  private gallery: Gallery
  private trailController: TrailController

  private isInitialized = false
  private isRunning = false
  private isDisposed = false
  private animationFrameId: number | null = null
  private preloadedTextures = new Map<string, THREE.Texture>()

  /* Scroll / progress state (replaces the original Scroll class) */
  private targetProgress = 0
  private currentProgress = 0
  private velocity = 0
  private velocityMax = 1.5
  private previousProgress = 0
  private scrollSmoothing = 0.14
  private velocityDamping = 0.18
  private velocityStopThreshold = 0.0001

  /* Camera bounds */
  private maxCameraZ = Infinity
  private minCameraZ = -Infinity
  private firstPlaneViewOffset = 5
  private lastPlaneViewOffset = 5

  /* Label */
  private activePlaneIndex = -1

  /* Frame-text dark-plane count (for theme toggle) */
  private frameDarkPlaneCount = 2

  constructor(
    canvas: HTMLCanvasElement,
    onLabelUpdate: (data: LabelData) => void
  ) {
    this.canvas = canvas
    this.onLabelUpdate = onLabelUpdate

    // Scene
    this.scene = new THREE.Scene()

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    this.camera.position.set(0, 0, 6)

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.autoClear = false

    // Subsystems
    this.gallery = new Gallery()
    this.trailController = new TrailController({ gallery: this.gallery })
  }

  /* ── Lifecycle ── */

  async init() {
    if (this.isInitialized || this.isDisposed) return

    // Preload textures
    this.preloadedTextures = await this.preloadTextures()
    if (this.isDisposed) return
    this.gallery.setPreloadedTextures(this.preloadedTextures)

    // Init subsystems
    await this.gallery.init(this.scene)
    if (this.isDisposed) return

    this.trailController.init(this.scene, this.camera)

    // Camera bounds
    this.updateCameraBounds()
    this.camera.position.z = this.maxCameraZ

    // Initial label
    this.emitLabel()

    // Start
    this.resize()
    window.addEventListener('resize', this.handleResize)
    this.isInitialized = true
    this.start()
  }

  private start() {
    if (!this.isInitialized || this.isRunning || this.isDisposed) return
    this.isRunning = true
    this.tick()
  }

  /* ── Public API (called by React/ScrollTrigger) ── */

  setProgress(progress: number) {
    this.targetProgress = THREE.MathUtils.clamp(progress, 0, 1)
  }

  /* ── Resize ── */

  private handleResize = () => this.resize()

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth || 1
    const height = this.canvas.clientHeight || window.innerHeight || 1
    if (width <= 0 || height <= 0) return

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    this.gallery.updatePlaneScale()
    this.gallery.layoutPlanes()
  }

  /* ── Texture preloading ── */

  private async preloadTextures() {
    const textureSources = this.gallery.getTextureSources()
    if (!textureSources.length) return new Map<string, THREE.Texture>()

    const textureLoader = new THREE.TextureLoader()
    const loaded = new Map<string, THREE.Texture>()

    await Promise.all(
      textureSources.map(async (src) => {
        try {
          const texture = await textureLoader.loadAsync(src)
          texture.colorSpace = THREE.SRGBColorSpace
          loaded.set(src, texture)
        } catch (error) {
          console.warn(`Texture failed to load: ${src}`, error)
        }
      })
    )

    return loaded
  }

  /* ── Camera bounds ── */

  private updateCameraBounds() {
    const depthRange = this.gallery.getDepthRange()
    this.maxCameraZ = depthRange.nearestZ + this.firstPlaneViewOffset
    this.minCameraZ = depthRange.deepestZ + this.lastPlaneViewOffset

    if (this.minCameraZ > this.maxCameraZ) {
      this.minCameraZ = this.maxCameraZ
    }
  }

  /* ── Progress → camera Z ── */

  private updateScrollState() {
    // Smooth progress
    this.currentProgress = THREE.MathUtils.lerp(
      this.currentProgress,
      this.targetProgress,
      this.scrollSmoothing
    )

    // Camera Z from progress (0 = first plane, 1 = last plane)
    this.camera.position.z = THREE.MathUtils.lerp(
      this.maxCameraZ,
      this.minCameraZ,
      this.currentProgress
    )

    // Velocity from progress delta
    const rawVelocity = (this.currentProgress - this.previousProgress) * 100
    this.velocity = THREE.MathUtils.lerp(this.velocity, rawVelocity, this.velocityDamping)
    this.velocity = THREE.MathUtils.clamp(this.velocity, -this.velocityMax, this.velocityMax)

    if (Math.abs(this.velocity) < this.velocityStopThreshold) {
      this.velocity = 0
    }

    this.previousProgress = this.currentProgress
  }

  /* ── Label computation ── */

  private getTargetPlaneIndex(): number {
    const blendData = this.gallery.getPlaneBlendData(this.camera.position.z)
    if (!blendData) return -1
    return blendData.blend >= 0.5 ? blendData.nextPlaneIndex : blendData.currentPlaneIndex
  }

  private emitLabel() {
    const planeIndex = this.getTargetPlaneIndex()
    if (planeIndex < 0 || planeIndex === this.activePlaneIndex) return

    const plane = this.gallery.planes[planeIndex]
    if (!plane) return

    const labelData = plane.userData.label || {}
    const specs = buildColorSpecs(plane.userData.accentColor, labelData.pms)

    this.onLabelUpdate({
      index: String(planeIndex + 1).padStart(2, '0'),
      word: labelData.word || 'tone',
      chipColor: specs.chipHex,
      cmyk: specs.cmyk,
      rgb: specs.rgb,
      hex: specs.hex,
      pms: specs.pms,
      textColor: labelData.color || '#f4f4f4',
    })

    this.activePlaneIndex = planeIndex
  }

  /* ── Main render loop ── */

  private tick = () => {
    if (!this.isRunning) return
    this.animationFrameId = requestAnimationFrame(this.tick)

    const time = performance.now()

    // 1. Progress → camera
    this.updateScrollState()

    const scrollState = {
      velocity: this.velocity,
      velocityMax: this.velocityMax,
      maxCameraZ: this.maxCameraZ,
      minCameraZ: this.minCameraZ,
    }

    // 2. Trail
    this.trailController.update(this.camera, scrollState, time)

    // 3. Gallery (visibility + motion)
    this.gallery.update(this.camera, scrollState)

    // 4. Label
    this.emitLabel()

    // 5. Render
    this.renderer.clear()
    this.renderer.render(this.scene, this.camera)
  }

  /* ── Cleanup ── */

  dispose() {
    this.isDisposed = true
    this.isRunning = false

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    window.removeEventListener('resize', this.handleResize)

    this.preloadedTextures.forEach((tex) => tex.dispose())
    this.preloadedTextures.clear()

    this.trailController.dispose()
    this.gallery.dispose()
  }
}
