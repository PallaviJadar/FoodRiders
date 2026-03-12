import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

export function DeliveryScene() {
  const group = useRef();
  const scooterRef = useRef();
  const deliveryPersonRef = useRef();
  
  // Animate the scene
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Gentle floating animation for the whole scene
    if (group.current) {
      group.current.position.y = Math.sin(t * 0.5) * 0.1;
    }

    // Scooter movement
    if (scooterRef.current) {
      scooterRef.current.rotation.y = Math.sin(t * 0.3) * 0.1;
    }

    // Delivery person subtle movement
    if (deliveryPersonRef.current) {
      deliveryPersonRef.current.rotation.y = Math.sin(t * 0.4) * 0.1;
      deliveryPersonRef.current.position.y = Math.sin(t * 0.6) * 0.05 + 0.5;
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]} scale={[0.6, 0.6, 0.6]}>
      {/* Scooter */}
      <group ref={scooterRef} position={[-2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} /> {/* Wheel */}
          <meshStandardMaterial color="#a8e6cf" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.5, 0.8, 0.8]} /> {/* Body */}
          <meshStandardMaterial color="#a8e6cf" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.5, 1, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1, 16]} /> {/* Handle */}
          <meshStandardMaterial color="#3d3d3d" />
        </mesh>
      </group>

      {/* Delivery Person on Scooter */}
      <group position={[-2, 1, 0]}>
        {/* Body */}
        <mesh>
          <capsuleGeometry args={[0.3, 0.5, 8, 16]} />
          <meshStandardMaterial color="#ffd3b6" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial color="#ffaaa5" />
        </mesh>
        {/* Cap */}
        <mesh position={[0, 0.8, 0]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.1, 32]} />
          <meshStandardMaterial color="#ff8b94" />
        </mesh>
        {/* Delivery Box */}
        <mesh position={[0, 0, -0.4]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#ffd3b6" />
        </mesh>
      </group>

      {/* Standing Delivery Person */}
      <group ref={deliveryPersonRef} position={[2, 0, 0]}>
        {/* Body */}
        <mesh position={[0, 0.5, 0]}>
          <capsuleGeometry args={[0.3, 1, 8, 16]} />
          <meshStandardMaterial color="#ffd3b6" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.4, 0]}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial color="#ffaaa5" />
        </mesh>
        {/* Cap */}
        <mesh position={[0, 1.6, 0]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.1, 32]} />
          <meshStandardMaterial color="#ff8b94" />
        </mesh>
        {/* Pizza Box */}
        <mesh position={[0.4, 0.8, 0]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#dcedc1" />
        </mesh>
      </group>
    </group>
  );
}

export default DeliveryScene; 
