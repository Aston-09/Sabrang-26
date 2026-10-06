import * as THREE from 'three'

export class Trail {
  group = new THREE.Group()
  points: THREE.Vector3[] = []
  mesh: THREE.Mesh | null = null

  minDistance = 0.006
  maxPoints = 220
  curveTension = 0.5
  curveSegments = 220
  radialSegments = 8
  radiusHead = 0.012
  radiusTail = 0.003
  pointSmoothing = 0.3
  maxTrimPerFrame = 4
  jumpResetDistance = 999

  material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f6f9ff'),
    emissive: new THREE.Color('#7fd5ff'),
    emissiveIntensity: 1.35,
    roughness: 0.2,
    metalness: 0.05,
    transparent: true,
    opacity: 0.84,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
  })

  get object() {
    return this.group
  }

  addPoint(position: THREE.Vector3) {
    if (!(position instanceof THREE.Vector3)) return

    const lastPoint = this.points[this.points.length - 1] || null

    if (lastPoint && position.distanceToSquared(lastPoint) < this.minDistance * this.minDistance) {
      return
    }

    const nextPoint = position.clone()

    // On large jumps, restart the trail so it snaps cleanly.
    if (lastPoint && nextPoint.distanceTo(lastPoint) > this.jumpResetDistance) {
      this.points = [nextPoint]

      if (this.mesh) {
        this.mesh.geometry.dispose()
        this.group.remove(this.mesh)
        this.mesh = null
      }

      return
    }

    const easedPoint = lastPoint
      ? lastPoint.clone().lerp(nextPoint, this.pointSmoothing)
      : nextPoint
    this.points.push(easedPoint)

    let trimBudget = this.maxTrimPerFrame
    while (this.points.length > this.maxPoints && trimBudget > 0) {
      this.points.shift()
      trimBudget -= 1
    }

    if (this.points.length < 2) {
      return
    }

    const curve = new THREE.CatmullRomCurve3(this.points, false, 'centripetal', this.curveTension)
    const segments = Math.max(24, Math.min(this.curveSegments, this.points.length * 4))
    const nextGeometry = this.createTaperedTube(curve, segments, this.radiusHead, this.radiusTail)

    if (!this.mesh) {
      this.mesh = new THREE.Mesh(nextGeometry, this.material)
      this.mesh.renderOrder = 1200
      this.group.add(this.mesh)
      return
    }

    this.mesh.geometry.dispose()
    this.mesh.geometry = nextGeometry
  }

  private createTaperedTube(
    curve: THREE.CatmullRomCurve3,
    segments: number,
    radiusHead: number,
    radiusTail: number
  ): THREE.BufferGeometry {
    const pathPoints = curve.getSpacedPoints(segments)
    const ringPoints = this.radialSegments + 1

    const vertices: number[] = []
    const indices: number[] = []

    const up = new THREE.Vector3(0, 0, 1)
    const tangent = new THREE.Vector3()
    const normal = new THREE.Vector3()
    const binormal = new THREE.Vector3()
    const radialOffset = new THREE.Vector3()
    const vertexPosition = new THREE.Vector3()

    for (let i = 0; i < pathPoints.length; i += 1) {
      const t = i / Math.max(pathPoints.length - 1, 1)
      const radius = radiusHead + (radiusTail - radiusHead) * Math.pow(t, 1.5)

      curve.getTangent(t, tangent).normalize()
      normal.crossVectors(up, tangent).normalize()

      if (normal.lengthSq() === 0) {
        normal.set(1, 0, 0)
      }

      binormal.crossVectors(tangent, normal).normalize()

      for (let j = 0; j <= this.radialSegments; j += 1) {
        const angle = (j / this.radialSegments) * Math.PI * 2
        const cx = -Math.cos(angle) * radius
        const cy = Math.sin(angle) * radius

        radialOffset.copy(normal).multiplyScalar(cx).addScaledVector(binormal, cy)

        vertexPosition.copy(pathPoints[i]).add(radialOffset)
        vertices.push(vertexPosition.x, vertexPosition.y, vertexPosition.z)
      }
    }

    for (let i = 0; i < pathPoints.length - 1; i += 1) {
      for (let j = 0; j < this.radialSegments; j += 1) {
        const baseIndex = i * ringPoints + j
        indices.push(baseIndex, baseIndex + ringPoints, baseIndex + 1)
        indices.push(baseIndex + ringPoints, baseIndex + ringPoints + 1, baseIndex + 1)
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    return geometry
  }

  dispose() {
    this.reset()
    this.material.dispose()
  }

  reset() {
    if (this.mesh) {
      this.mesh.geometry.dispose()
      this.group.remove(this.mesh)
      this.mesh = null
    }

    this.points = []
  }
}
