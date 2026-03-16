import * as THREE from "three";
import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import {
  BallCollider,
  Physics,
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from "@react-three/rapier";

const textureLoader = new THREE.TextureLoader();
const imageUrls = [
  "/images/react2.webp",
  "/images/node2.webp",
  "/images/express.webp",
  "/images/mongo.webp",
  "/images/mysql.webp",
  "/images/javascript.webp",
  "/images/pytorch.webp",
  "/images/tensorflow.webp",
  "/images/spacy.webp",
  "/images/numpy.webp",
  "/images/aws.webp",
  "/images/react.webp",
  "/images/node.webp",
  "/images/python.webp",
  "/images/java.webp",
  "/images/pandas.webp",
];
const textures = imageUrls.map((url) => textureLoader.load(url));

const sphereGeometry = new THREE.SphereGeometry(1, 28, 28);

const spheres = [...Array(30)].map(() => ({
  scale: [0.7, 1, 0.8, 1, 1][Math.floor(Math.random() * 5)],
}));

type SphereProps = {
  vec?: THREE.Vector3;
  scale: number;
  r?: typeof THREE.MathUtils.randFloatSpread;
  material: THREE.MeshPhysicalMaterial;
  isActive: boolean;
};

function SphereGeo({
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  material,
  isActive,
}: SphereProps) {
  const api = useRef<RapierRigidBody | null>(null);

  useFrame((_state, delta) => {
    if (!isActive) return;
    delta = Math.min(0.1, delta);
    const impulse = vec
      .copy(api.current!.translation())
      .normalize()
      .multiply(
        new THREE.Vector3(
          -50 * delta * scale,
          -150 * delta * scale,
          -50 * delta * scale
        )
      );

    api.current?.applyImpulse(impulse, true);
  });

  return (
    <RigidBody
      linearDamping={0.75}
      angularDamping={0.15}
      friction={0.2}
      position={[r(20), r(20) - 25, r(20) - 10]}
      ref={api}
      colliders={false}
    >
      <BallCollider args={[scale]} />
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.2 * scale]}
        args={[0.15 * scale, 0.275 * scale]}
      />
      <mesh
        castShadow
        receiveShadow
        scale={scale}
        geometry={sphereGeometry}
        material={material}
        rotation={[0.3, 1, 1]}
      />
    </RigidBody>
  );
}

type PointerProps = {
  vec?: THREE.Vector3;
  isActive: boolean;
};

function Pointer({ vec = new THREE.Vector3(), isActive }: PointerProps) {
  const ref = useRef<RapierRigidBody>(null);

  useFrame(({ pointer, viewport }) => {
    if (!isActive) return;
    const targetVec = vec.lerp(
      new THREE.Vector3(
        (pointer.x * viewport.width) / 2,
        (pointer.y * viewport.height) / 2,
        0
      ),
      0.2
    );
    ref.current?.setNextKinematicTranslation(targetVec);
  });

  return (
    <RigidBody
      position={[100, 100, 100]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[2]} />
    </RigidBody>
  );
}

const TechStack = () => {
  const [isActive, setIsActive] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    // Check WebGL availability
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
    if (!gl) {
      setWebglAvailable(false);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const threshold = document
        .getElementById("work")!
        .getBoundingClientRect().top;
      setIsActive(scrollY > threshold);
    };
    document.querySelectorAll(".header a").forEach((elem) => {
      const element = elem as HTMLAnchorElement;
      element.addEventListener("click", () => {
        const interval = setInterval(() => {
          handleScroll();
        }, 10);
        setTimeout(() => {
          clearInterval(interval);
        }, 1000);
      });
    });
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const materials = useMemo(() => {
    return textures.map(
      (texture) =>
        new THREE.MeshPhysicalMaterial({
          map: texture,
          emissive: "#ffffff",
          emissiveMap: texture,
          emissiveIntensity: 0.3,
          metalness: 0.5,
          roughness: 1,
          clearcoat: 0.1,
        })
    );
  }, []);

  return (
    <div className="techstack">
      <h2> My Techstack</h2>

      {webglAvailable ? (
        <Canvas
          shadows
          gl={{ alpha: true, stencil: false, depth: false, antialias: false }}
          camera={{ position: [0, 0, 20], fov: 32.5, near: 1, far: 100 }}
          onCreated={(state) => (state.gl.toneMappingExposure = 1.5)}
          className="tech-canvas"
        >
          <ambientLight intensity={1} />
          <spotLight
            position={[20, 20, 25]}
            penumbra={1}
            angle={0.2}
            color="white"
            castShadow
            shadow-mapSize={[512, 512]}
          />
          <directionalLight position={[0, 5, -4]} intensity={2} />
          <Physics gravity={[0, 0, 0]}>
            <Pointer isActive={isActive} />
            {spheres.map((props, i) => (
              <SphereGeo
                key={i}
                {...props}
                material={materials[Math.floor(Math.random() * materials.length)]}
                isActive={isActive}
              />
            ))}
          </Physics>
          <Environment
            files="/models/char_enviorment.hdr"
            environmentIntensity={0.5}
            environmentRotation={[0, 4, 2]}
          />
          <EffectComposer enableNormalPass={false}>
            <N8AO color="#0f002c" aoRadius={2} intensity={1.15} />
          </EffectComposer>
        </Canvas>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "500px",
            color: "#aaa",
            padding: "20px",
            textAlign: "center",
            borderRadius: "8px",
          }}
        >
          <div>
            <p style={{ fontSize: "16px", marginBottom: "10px" }}>
              WebGL is not available on your browser. Please enable hardware acceleration or update your GPU drivers to view this section.
            </p>
          </div>
        </div>
      )}

      <div style={{ marginTop: "60px", paddingBottom: "40px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "30px",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          <div style={{ padding: "25px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ color: "#00d4ff", marginBottom: "15px", fontSize: "1.1rem", fontWeight: "600" }}>Languages</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {["Python", "JavaScript", "Java", "C#"].map((skill) => (
                <span key={skill} style={{ padding: "8px 12px", backgroundColor: "rgba(0,212,255,0.1)", borderRadius: "6px", fontSize: "0.9rem", border: "1px solid rgba(0,212,255,0.2)" }}>{skill}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: "25px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ color: "#00d4ff", marginBottom: "15px", fontSize: "1.1rem", fontWeight: "600" }}>Backend & APIs</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {["FastAPI", "REST APIs", "Node.js", "Express.js"].map((skill) => (
                <span key={skill} style={{ padding: "8px 12px", backgroundColor: "rgba(0,212,255,0.1)", borderRadius: "6px", fontSize: "0.9rem", border: "1px solid rgba(0,212,255,0.2)" }}>{skill}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: "25px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ color: "#00d4ff", marginBottom: "15px", fontSize: "1.1rem", fontWeight: "600" }}>Databases</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {["PostgreSQL", "MySQL", "MongoDB"].map((skill) => (
                <span key={skill} style={{ padding: "8px 12px", backgroundColor: "rgba(0,212,255,0.1)", borderRadius: "6px", fontSize: "0.9rem", border: "1px solid rgba(0,212,255,0.2)" }}>{skill}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: "25px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ color: "#00d4ff", marginBottom: "15px", fontSize: "1.1rem", fontWeight: "600" }}>AI/ML & Data</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {["scikit-learn", "spaCy", "PyTorch", "Pandas", "NumPy", "TF-IDF"].map((skill) => (
                <span key={skill} style={{ padding: "8px 12px", backgroundColor: "rgba(0,212,255,0.1)", borderRadius: "6px", fontSize: "0.9rem", border: "1px solid rgba(0,212,255,0.2)" }}>{skill}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: "25px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ color: "#00d4ff", marginBottom: "15px", fontSize: "1.1rem", fontWeight: "600" }}>Cloud & DevOps</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {["AWS (EC2, S3)", "Render", "Git", "GitHub"].map((skill) => (
                <span key={skill} style={{ padding: "8px 12px", backgroundColor: "rgba(0,212,255,0.1)", borderRadius: "6px", fontSize: "0.9rem", border: "1px solid rgba(0,212,255,0.2)" }}>{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechStack;
