import * as THREE from 'three'
import { galleryPlaneData, type GalleryPlaneConfig } from './galleryData'

/* ── Public interfaces ── */

export interface PlaneBlendData {
  currentPlaneIndex: number
  nextPlaneIndex: number
  blend: number
}

export interface MoodColors {
  background: string
  blob1: string
  blob2: string
}

export interface MoodBlendData {
  currentMood: MoodColors
  nextMood: MoodColors
  blend: number
}

export interface ScrollState {
  velocity: number
  velocityMax: number
}

/* ── Gallery ── */

export class Gallery {
  isInitialized = false

  // Planes
  planes: THREE.Mesh[] = []
  texturesBySource: Map<string, THREE.Texture> = new Map()
  useTextures = true
  planeGap = 5
  desktopPlaneScale = 1
  mobilePlaneScale = 0.65
  mobileXSpreadFactor = 0.25
  mobileBreakpoint = 768
  planeConfig: GalleryPlaneConfig[] = galleryPlaneData
  moodSampleOffset = 1
  planeFadeSampleOffset = 1
  planeFadeSmoothing = 0.14

  // Parallax
  parallaxEnabled = true
  parallaxAmountX = 0.16
  parallaxAmountY = 0.08
  parallaxSmoothing = 0.08
  pointerTarget = new THREE.Vector2(0, 0)
  pointerCurrent = new THREE.Vector2(0, 0)

  // Breath
  breathEnabled = true
  breathTiltAmount = 0.045
  breathScaleAmount = 0.03
  breathSmoothing = 0.14
  breathGain = 1.1
  breathIntensity = 0
  targetBreathIntensity = 0

  // Gesture drift
  gestureParallaxEnabled = true
  gestureParallaxAmountY = 0.05
  gestureParallaxSmoothing = 0.05
  driftCurrent = 0
  driftTarget = 0

  // Pointer event handlers (bound to instance)
  private onPointerMove = (event: PointerEvent) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1
    const y = (event.clientY / window.innerHeight) * 2 - 1
    this.pointerTarget.set(x, -y)
  }

  private onPointerLeave = () => {
    this.pointerTarget.set(0, 0)
  }

  /* ── Lifecycle ── */

  async init(scene: THREE.Scene) {
    if (this.isInitialized) return

    this.setPlanes(scene)
    this.updatePlaneMaterialMode()
    this.updatePlaneScale()
    this.layoutPlanes()
    this.bindPointerEvents()

    this.isInitialized = true
  }

  /* ── Plane creation ── */

  private setPlanes(scene: THREE.Scene) {
    const planeGeometry = new THREE.PlaneGeometry(3, 3)

    this.planeConfig.forEach((plane, index) => {
      const texture = this.texturesBySource.get(plane.textureSrc) || null
      const textureImage = texture?.image as HTMLImageElement | undefined
      const aspectRatio =
        textureImage && textureImage.width > 0 && textureImage.height > 0
          ? textureImage.width / textureImage.height
          : 1
      const fallbackColor = plane.fallbackColor || '#ffffff'
      const accentColor = plane.accentColor || fallbackColor
      const backgroundColor = plane.backgroundColor || fallbackColor
      const blob1Color = plane.blob1Color || fallbackColor
      const blob2Color = plane.blob2Color || fallbackColor
      const labelData = this.getPlaneLabelData(plane, this.planes.length)
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: fallbackColor,
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        opacity: index === 0 ? 1 : 0,
      })
      const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
      planeMesh.userData.basePosition = plane.position
      planeMesh.userData.baseColor = fallbackColor
      planeMesh.userData.accentColor = accentColor
      planeMesh.userData.backgroundColor = backgroundColor
      planeMesh.userData.blob1Color = blob1Color
      planeMesh.userData.blob2Color = blob2Color
      planeMesh.userData.label = labelData
      planeMesh.userData.texture = texture
      planeMesh.userData.aspectRatio = aspectRatio
      scene.add(planeMesh)
      this.planes.push(planeMesh)
    })
  }

  private getPlaneLabelData(planeDefinition: GalleryPlaneConfig, index: number) {
    const fallback = {
      word: `tone ${String(index + 1).padStart(2, '0')}`,
      pms: 'N/A',
      color: '',
    }
    const label = planeDefinition.label || fallback

    return {
      word: label.word || fallback.word,
      pms: label.pms || fallback.pms,
      color: label.color || fallback.color,
    }
  }

  /* ── Layout ── */

  updatePlaneScale() {
    const isMobileViewport = window.innerWidth <= this.mobileBreakpoint
    const scale = isMobileViewport ? this.mobilePlaneScale : this.desktopPlaneScale

    this.planes.forEach((plane) => {
      const aspectRatio = plane.userData.aspectRatio || 1
      plane.scale.set(scale * aspectRatio, scale, 1)
    })
  }

  layoutPlanes() {
    const xSpreadFactor = this.getXSpreadFactor()

    this.planes.forEach((plane, index) => {
      const basePosition = plane.userData.basePosition || { x: 0, y: 0 }
      const xPosition = basePosition.x * xSpreadFactor
      plane.position.set(xPosition, basePosition.y, -index * this.planeGap)
    })
  }

  private getXSpreadFactor() {
    const isMobileViewport = window.innerWidth <= this.mobileBreakpoint
    return isMobileViewport ? this.mobileXSpreadFactor : 1
  }

  /* ── Depth queries ── */

  getDepthRange() {
    if (!this.planes.length) {
      return { nearestZ: 0, deepestZ: 0 }
    }

    const zPositions = this.planes.map((plane) => plane.position.z)
    return {
      nearestZ: Math.max(...zPositions),
      deepestZ: Math.min(...zPositions),
    }
  }

  getDepthProgress(cameraZ: number) {
    const { nearestZ, deepestZ } = this.getDepthRange()
    const depthSpan = nearestZ - deepestZ
    if (depthSpan <= 0) return 0

    return THREE.MathUtils.clamp((nearestZ - cameraZ) / depthSpan, 0, 1)
  }

  getActivePlaneIndex(cameraZ: number) {
    if (!this.planes.length) return -1

    let closestPlaneIndex = 0
    let smallestDistance = Infinity

    this.planes.forEach((plane, index) => {
      const distanceToPlane = Math.abs(cameraZ - plane.position.z)
      if (distanceToPlane < smallestDistance) {
        smallestDistance = distanceToPlane
        closestPlaneIndex = index
      }
    })

    return closestPlaneIndex
  }

  /* ── Mood / blend queries ── */

  getMoodColorsByIndex(index: number): MoodColors | null {
    if (index < 0 || index >= this.planes.length) return null

    const { backgroundColor, blob1Color, blob2Color } = this.planes[index].userData
    if (!backgroundColor) return null

    return { background: backgroundColor, blob1: blob1Color, blob2: blob2Color }
  }

  getMoodBlendData(cameraZ: number): MoodBlendData | null {
    if (!this.planes.length) return null

    const safeCameraZ = Number.isFinite(cameraZ) ? cameraZ : this.planes[0].position.z
    const moodSampleZ = safeCameraZ - this.planeGap * this.moodSampleOffset
    const lastPlaneIndex = this.planes.length - 1

    if (lastPlaneIndex === 0 || this.planeGap <= 0) {
      const singleMood = this.getMoodColorsByIndex(0)
      if (!singleMood) return null

      return {
        currentMood: singleMood,
        nextMood: singleMood,
        blend: 0,
      }
    }

    const firstPlaneZ = this.planes[0].position.z
    const normalizedDepth = THREE.MathUtils.clamp(
      (firstPlaneZ - moodSampleZ) / this.planeGap,
      0,
      lastPlaneIndex
    )
    const currentPlaneIndex = Math.floor(normalizedDepth)
    const nextPlaneIndex = Math.min(currentPlaneIndex + 1, lastPlaneIndex)
    const blend = normalizedDepth - currentPlaneIndex

    const currentMood = this.getMoodColorsByIndex(currentPlaneIndex)
    const nextMood = this.getMoodColorsByIndex(nextPlaneIndex) || currentMood
    if (!currentMood || !nextMood) return null

    return {
      currentMood,
      nextMood,
      blend,
    }
  }

  getPlaneBlendData(cameraZ: number): PlaneBlendData | null {
    if (!this.planes.length) return null

    const planeGap = Math.max(this.planeGap, 0.0001)
    const firstPlaneZ = this.planes[0].position.z
    const lastPlaneIndex = this.planes.length - 1
    const sampledCameraZ = cameraZ - planeGap * this.planeFadeSampleOffset
    const normalizedDepth = THREE.MathUtils.clamp(
      (firstPlaneZ - sampledCameraZ) / planeGap,
      0,
      lastPlaneIndex
    )
    const currentPlaneIndex = Math.floor(normalizedDepth)
    const nextPlaneIndex = Math.min(currentPlaneIndex + 1, lastPlaneIndex)
    const blend = normalizedDepth - currentPlaneIndex

    return {
      currentPlaneIndex,
      nextPlaneIndex,
      blend,
    }
  }

  /* ── Textures ── */

  getTextureSources(): string[] {
    const textureSources = this.planeConfig
      .map((planeDefinition) => planeDefinition.textureSrc)
      .filter(Boolean)

    return [...new Set(textureSources)]
  }

  setPreloadedTextures(texturesBySource: Map<string, THREE.Texture>) {
    this.texturesBySource = texturesBySource instanceof Map ? texturesBySource : new Map()
  }

  private updatePlaneMaterialMode() {
    this.planes.forEach((plane) => {
      const planeMaterial = plane.material as THREE.MeshBasicMaterial
      const texture = plane.userData.texture || null
      const hasTexture = Boolean(texture)

      planeMaterial.map = this.useTextures && hasTexture ? texture : null
      planeMaterial.color.set(this.useTextures && hasTexture ? '#ffffff' : plane.userData.baseColor)
      planeMaterial.needsUpdate = true
    })
  }

  /* ── Per-frame visibility ── */

  updatePlaneVisibility(cameraZ: number) {
    const blendData = this.getPlaneBlendData(cameraZ)
    if (!blendData) return

    const { currentPlaneIndex, nextPlaneIndex, blend } = blendData

    this.planes.forEach((plane, index) => {
      let targetOpacity = 0

      if (index === currentPlaneIndex) {
        targetOpacity = 1 - blend
      }
      if (index === nextPlaneIndex) {
        targetOpacity = Math.max(targetOpacity, blend)
      }

      const mat = plane.material as THREE.MeshBasicMaterial
      const currentOpacity = Number.isFinite(mat.opacity) ? mat.opacity : 0
      mat.opacity = THREE.MathUtils.lerp(
        currentOpacity,
        targetOpacity,
        this.planeFadeSmoothing
      )
      mat.needsUpdate = true
    })
  }

  /* ── Pointer events ── */

  private bindPointerEvents() {
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('pointerleave', this.onPointerLeave, { passive: true })
  }

  /* ── Per-frame motion (parallax + breath + drift) ── */

  updatePlaneMotion(scroll: ScrollState | null = null) {
    // Smooth pointer toward target
    this.pointerCurrent.lerp(this.pointerTarget, this.parallaxSmoothing)

    // Velocity → breath + drift
    const velocityMax = Math.max(scroll?.velocityMax || 1, 0.0001)
    const velocityNormalized = THREE.MathUtils.clamp(
      Math.abs(scroll?.velocity || 0) / velocityMax,
      0,
      1
    )
    const scrollDrift = THREE.MathUtils.clamp((scroll?.velocity || 0) / velocityMax, -1, 1)
    this.targetBreathIntensity = this.breathEnabled
      ? THREE.MathUtils.clamp(velocityNormalized * this.breathGain, 0, 1)
      : 0
    this.breathIntensity = THREE.MathUtils.lerp(
      this.breathIntensity,
      this.targetBreathIntensity,
      this.breathSmoothing
    )
    this.driftTarget = this.gestureParallaxEnabled ? scrollDrift : 0
    this.driftCurrent = THREE.MathUtils.lerp(
      this.driftCurrent,
      this.driftTarget,
      this.gestureParallaxSmoothing
    )

    // Per-plane: position, rotation, scale
    const xSpreadFactor = this.getXSpreadFactor()

    this.planes.forEach((plane, index) => {
      const basePosition = plane.userData.basePosition || { x: 0, y: 0 }
      const xPosition = basePosition.x * xSpreadFactor
      const yPosition = basePosition.y
      const zPosition = -index * this.planeGap
      const mat = plane.material as THREE.MeshBasicMaterial
      const opacity = Number.isFinite(mat.opacity) ? mat.opacity : 0
      const depthInfluence = 1 + index * 0.05
      const parallaxInfluence = this.parallaxEnabled ? opacity * depthInfluence : 0

      const parallaxOffsetX = this.pointerCurrent.x * this.parallaxAmountX * parallaxInfluence
      const parallaxOffsetY = this.pointerCurrent.y * this.parallaxAmountY * parallaxInfluence
      const gestureOffsetY = this.driftCurrent * this.gestureParallaxAmountY

      plane.position.x = xPosition + parallaxOffsetX
      plane.position.y = yPosition + parallaxOffsetY + gestureOffsetY
      plane.position.z = zPosition

      const breathInfluence = this.breathEnabled ? this.breathIntensity * opacity : 0
      const tiltX = -this.pointerCurrent.y * this.breathTiltAmount * breathInfluence
      const tiltY = this.pointerCurrent.x * this.breathTiltAmount * breathInfluence
      plane.rotation.x = tiltX
      plane.rotation.y = tiltY
      plane.rotation.z = 0

      const aspectRatio = plane.userData.aspectRatio || 1
      const baseScale =
        window.innerWidth <= this.mobileBreakpoint ? this.mobilePlaneScale : this.desktopPlaneScale
      const scalePulse = 1 + this.breathScaleAmount * breathInfluence
      plane.scale.x = baseScale * aspectRatio * scalePulse
      plane.scale.y = baseScale * scalePulse
      plane.scale.z = 1
    })
  }

  /* ── Combined update ── */

  update(camera: THREE.Camera | null = null, scroll: ScrollState | null = null) {
    if (!camera) return
    this.updatePlaneVisibility((camera as THREE.PerspectiveCamera).position.z)
    this.updatePlaneMotion(scroll)
  }

  /* ── Cleanup ── */

  dispose() {
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerleave', this.onPointerLeave)
  }
}
