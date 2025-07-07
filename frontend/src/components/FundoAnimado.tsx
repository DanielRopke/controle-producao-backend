// src/components/FundoAnimado.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";

export function FundoAnimado() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Cena e câmera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f0f2f5"); // Fundo cinza claro

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.z = 200;

    // Renderizador
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Textura circular das bolinhas (verde uniforme)
    const circleCanvas = document.createElement("canvas");
    circleCanvas.width = 64;
    circleCanvas.height = 64;
    const ctx = circleCanvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    // Cor verde uniforme
    gradient.addColorStop(0, "rgba(22, 163, 74, 1)"); // verde #16a34a
    gradient.addColorStop(1, "rgba(22, 163, 74, 1)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    const spriteTexture = new THREE.CanvasTexture(circleCanvas);

    const PARTICLE_COUNT = 300;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 4);
    const opacities = new Float32Array(PARTICLE_COUNT);

    const velocities: THREE.Vector3[] = [];
    const phases: number[] = [];

    // Atualização: espalhamento proporcional à tela
    const spreadBase = 400;
    const aspect = window.innerWidth / window.innerHeight;
    const spreadX = spreadBase * aspect * 1.5; // mais largo horizontalmente
    const spreadY = spreadBase * 1.5;           // mais alto verticalmente
    const spreadZ = spreadBase;                  // profundidade padrão

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = Math.random() * spreadX - spreadX / 2;
      positions[i * 3 + 1] = Math.random() * spreadY - spreadY / 2;
      positions[i * 3 + 2] = Math.random() * spreadZ - spreadZ / 2;

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        )
      );

      phases.push(Math.random() * Math.PI * 2);

      // Cor verde para as bolinhas
      colors[i * 4] = 22 / 255;
      colors[i * 4 + 1] = 163 / 255;
      colors[i * 4 + 2] = 74 / 255;
      colors[i * 4 + 3] = 1.0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));

    const material = new THREE.PointsMaterial({
      size: 12,
      map: spriteTexture,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      sizeAttenuation: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const maxConnections = PARTICLE_COUNT * PARTICLE_COUNT;
    const linePositions = new Float32Array(maxConnections * 3 * 2);
    const lineColors = new Float32Array(maxConnections * 4 * 2);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 4));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      linewidth: 1,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    const mouseLinePositions = new Float32Array(PARTICLE_COUNT * 3 * 2);
    const mouseLineColors = new Float32Array(PARTICLE_COUNT * 4 * 2);
    const mouseLineGeometry = new THREE.BufferGeometry();
    mouseLineGeometry.setAttribute("position", new THREE.BufferAttribute(mouseLinePositions, 3));
    mouseLineGeometry.setAttribute("color", new THREE.BufferAttribute(mouseLineColors, 4));

    const mouseLineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      linewidth: 1,
    });

    const mouseLines = new THREE.LineSegments(mouseLineGeometry, mouseLineMaterial);
    scene.add(mouseLines);

    const mouse = new THREE.Vector2(-1000, -1000);

    function onMouseMove(event: MouseEvent) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener("mousemove", onMouseMove);

    // --- MOVIMENTAÇÃO SUAVE DA CÂMERA INÍCIO ---
    let targetCameraX = 0;
    let targetCameraY = 0;

    // Atualiza o target da câmera baseado no mouse
    function updateCameraTarget() {
      targetCameraX = mouse.x * 20; // escala de movimento na horizontal
      targetCameraY = mouse.y * 20; // escala de movimento na vertical
    }
    window.addEventListener("mousemove", () => {
      updateCameraTarget();
    });
    // --- MOVIMENTAÇÃO SUAVE DA CÂMERA FIM ---

    let time = 0;

    function animate() {
      requestAnimationFrame(animate);
      time += 0.02;

      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
      const linePosAttr = lineGeometry.attributes.position as THREE.BufferAttribute;
      const lineColorAttr = lineGeometry.attributes.color as THREE.BufferAttribute;
      const mouseLinePosAttr = mouseLineGeometry.attributes.position as THREE.BufferAttribute;
      const mouseLineColorAttr = mouseLineGeometry.attributes.color as THREE.BufferAttribute;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3;

        positions[ix] += velocities[i].x;
        positions[ix + 1] += velocities[i].y;
        positions[ix + 2] += velocities[i].z;

        if (positions[ix] > spreadX / 2 || positions[ix] < -spreadX / 2)
          velocities[i].x = -velocities[i].x;
        if (positions[ix + 1] > spreadY / 2 || positions[ix + 1] < -spreadY / 2)
          velocities[i].y = -velocities[i].y;
        if (positions[ix + 2] > spreadZ / 2 || positions[ix + 2] < -spreadZ / 2)
          velocities[i].z = -velocities[i].z;

        const opacity = 0.3 + 0.7 * (Math.sin(time + phases[i]) * 0.5 + 0.5);
        opacities[i] = opacity;

        // Mantém o verde, mas atualiza a transparência com opacidade animada
        colorAttr.array[i * 4] = 22 / 255;
        colorAttr.array[i * 4 + 1] = 163 / 255;
        colorAttr.array[i * 4 + 2] = 74 / 255;
        colorAttr.array[i * 4 + 3] = opacity;
      }

      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      let vertexpos = 0;
      let colorpos = 0;

      // LINHAS ENTRE BOLINHAS: cor VERDE mais escura para destaque
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3;
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const jx = j * 3;
          const dx = positions[ix] - positions[jx];
          const dy = positions[ix + 1] - positions[jx + 1];
          const dz = positions[ix + 2] - positions[jx + 2];
          const distSquared = dx * dx + dy * dy + dz * dz;

          if (distSquared < 15000) {
            const lineOpacity = Math.min(opacities[i], opacities[j]) * 0.3; // Opacidade aumentada
            linePositions[vertexpos++] = positions[ix];
            linePositions[vertexpos++] = positions[ix + 1];
            linePositions[vertexpos++] = positions[ix + 2];
            linePositions[vertexpos++] = positions[jx];
            linePositions[vertexpos++] = positions[jx + 1];
            linePositions[vertexpos++] = positions[jx + 2];

            for (let k = 0; k < 2; k++) {
              // Verde mais escuro para as linhas: RGB (0, 100, 44)
              lineColors[colorpos++] = 0 / 255;
              lineColors[colorpos++] = 100 / 255;
              lineColors[colorpos++] = 44 / 255;
              lineColors[colorpos++] = lineOpacity;
            }
          }
        }
      }

      lines.geometry.setDrawRange(0, vertexpos / 3);
      linePosAttr.needsUpdate = true;
      lineColorAttr.needsUpdate = true;

      const mouseRaycaster = new THREE.Raycaster();
      mouseRaycaster.setFromCamera(mouse, camera);
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const mousePos3D = new THREE.Vector3();
      mouseRaycaster.ray.intersectPlane(planeZ, mousePos3D);

      let mVertexPos = 0;
      let mColorPos = 0;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3;
        const dx = positions[ix] - mousePos3D.x;
        const dy = positions[ix + 1] - mousePos3D.y;
        const dz = positions[ix + 2] - mousePos3D.z;
        const distSquared = dx * dx + dy * dy + dz * dz;

        if (distSquared < 18000) {
          const lineOpacity = opacities[i] * 0.4; // Linha do mouse mais opaca

          mouseLinePositions[mVertexPos++] = positions[ix];
          mouseLinePositions[mVertexPos++] = positions[ix + 1];
          mouseLinePositions[mVertexPos++] = positions[ix + 2];
          mouseLinePositions[mVertexPos++] = mousePos3D.x;
          mouseLinePositions[mVertexPos++] = mousePos3D.y;
          mouseLinePositions[mVertexPos++] = mousePos3D.z;

          for (let k = 0; k < 2; k++) {
            // Mesma cor verde escuro para linhas do mouse
            mouseLineColors[mColorPos++] = 0 / 255;
            mouseLineColors[mColorPos++] = 100 / 255;
            mouseLineColors[mColorPos++] = 44 / 255;
            mouseLineColors[mColorPos++] = lineOpacity;
          }
        }
      }

      mouseLines.geometry.setDrawRange(0, mVertexPos / 3);
      mouseLinePosAttr.needsUpdate = true;
      mouseLineColorAttr.needsUpdate = true;

      // --- MOVIMENTAÇÃO SUAVE DA CÂMERA ---
      camera.position.x += (targetCameraX - camera.position.x) * 0.05;
      camera.position.y += (targetCameraY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      // --- FIM MOVIMENTAÇÃO SUAVE DA CÂMERA ---

      renderer.render(scene, camera);
    }

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousemove", updateCameraTarget);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0" />;
}
