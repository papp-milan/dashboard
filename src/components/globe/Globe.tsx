
import { useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

function GlobeModel() {
    const globeRef = useRef<THREE.Group>(null)

    // Create longitude and latitude lines
    const lines = useMemo(() => {
        const result: THREE.LineLoop[] = []
        const material = new THREE.LineBasicMaterial({
            color: "#ffffff",
            transparent: true,
            opacity: 1,
            linewidth: 1,
        })

        // Longitude lines
        for (let i = 0; i < 6; i++) {
            const longitude = (i * Math.PI) / 6
            const points: THREE.Vector3[] = []

            for (let j = 0; j <= 100; j++) {
                const angle = (j / 100) * Math.PI * 2

                points.push(
                    new THREE.Vector3(
                        1.005 * Math.sin(angle) * Math.sin(longitude),
                        1.005 * Math.cos(angle),
                        1.005 * Math.sin(angle) * Math.cos(longitude)
                    )
                )
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            result.push(new THREE.LineLoop(geometry, material))
        }

        // Latitude lines
        for (let i = -2; i <= 2; i++) {
            const latitude = (i * Math.PI) / 6
            const radius = Math.cos(latitude)
            const y = Math.sin(latitude)
            const points: THREE.Vector3[] = []

            for (let j = 0; j <= 100; j++) {
                const angle = (j / 100) * Math.PI * 2

                points.push(
                    new THREE.Vector3(
                        1.005 * radius * Math.cos(angle),
                        1.005 * y,
                        1.005 * radius * Math.sin(angle)
                    )
                )
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            result.push(new THREE.LineLoop(geometry, material))
        }

        return result
    }, [])

    // Continuous horizontal rotation
    useFrame((_, delta) => {
        if (globeRef.current) {
            globeRef.current.rotation.y += delta * 0.2
        }
    })

    return (
        <group rotation={[Math.PI / 6, 0, Math.PI / 6]}>
            <group ref={globeRef}>
                {/* Invisible sphere */}
                <mesh>
                    <sphereGeometry args={[1, 64, 64]} />
                    <meshBasicMaterial
                        transparent
                        opacity={0}
                        colorWrite={false}
                        depthWrite
                    />
                </mesh>

                {/* Globe lines */}
                {lines.map((line, index) => (
                    <primitive key={index} object={line} />
                ))}

                {/* Outer border */}
                <mesh>
                    <torusGeometry args={[1, 0.008, 8, 100]} />
                    <meshBasicMaterial color="white" />
                </mesh>
            </group>
        </group>
    )
}

export function Globe() {
    return (
        <div className="h-full w-full">
            <Canvas
                camera={{ position: [0, 0, 3], fov: 45 }}
                gl={{ alpha: true, antialias: true }}
            >
                <GlobeModel />
            </Canvas>
        </div>
    )
}
