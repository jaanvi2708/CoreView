"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AssetTelemetry, ComponentTwinState } from "@/lib/types";
import StatusBadge from "../common/StatusBadge";
import { RotateCw, Eye, RefreshCw, Layers, Crosshair, ZoomIn, ZoomOut } from "lucide-react";

interface ThreeDigitalTwinViewerProps {
  asset: AssetTelemetry;
  onComponentSelect?: (component: ComponentTwinState) => void;
}

export default function ThreeDigitalTwinViewer({ asset, onComponentSelect }: ThreeDigitalTwinViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedComp, setSelectedComp] = useState<ComponentTwinState | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [activeCameraAngle, setActiveCameraAngle] = useState<"iso" | "front" | "top" | "side">("iso");

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const rotatingElementsRef = useRef<THREE.Group[]>([]);
  const dynamicObjectsRef = useRef<THREE.Object3D[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#0d1117");

    // 2. Camera Setup
    const width = container.clientWidth || 600;
    const height = 400;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(24, 18, 28);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting System (PBR Quality)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(25, 35, 25);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x58a6ff, 0.45);
    fillLight.position.set(-25, 15, -20);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x8b949e, 0.35);
    rimLight.position.set(0, -20, -20);
    scene.add(rimLight);

    // Defect status light
    const isCritical = asset.health_state === "Critical";
    const isWarning = asset.health_state === "Warning";
    const statusHex = isCritical ? 0xf85149 : isWarning ? 0xd29922 : 0x2ea043;

    const defectPointLight = new THREE.PointLight(statusHex, isCritical ? 2.5 : isWarning ? 1.5 : 0.0, 15);
    defectPointLight.position.set(2, 4, 1);
    scene.add(defectPointLight);

    // 5. High-Precision Engineering Grid & Circular Base Plate
    const gridHelper = new THREE.GridHelper(36, 36, 0x30363d, 0x161b22);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // Concentric SCADA Platform Ring
    const platformGeo = new THREE.CylinderGeometry(14, 14.5, 0.4, 48);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x161b22,
      metalness: 0.8,
      roughness: 0.4
    });
    const platformMesh = new THREE.Mesh(platformGeo, platformMat);
    platformMesh.position.y = -2.2;
    platformMesh.receiveShadow = true;
    scene.add(platformMesh);

    // Outer Neon Ring Marker
    const ringGeo = new THREE.RingGeometry(13.8, 14.2, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x388bfd, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -1.98;
    scene.add(ringMesh);

    // 6. Master Assembly Groups
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    mainGroupRef.current = mainGroup;

    meshesRef.current = [];
    rotatingElementsRef.current = [];
    dynamicObjectsRef.current = [];

    // PBR Material Palette
    const castIronMat = new THREE.MeshStandardMaterial({
      color: 0x21262d,
      metalness: 0.7,
      roughness: 0.5,
      wireframe: wireframeMode
    });

    const brushedSteelMat = new THREE.MeshStandardMaterial({
      color: 0xa0aab5,
      metalness: 0.9,
      roughness: 0.2,
      wireframe: wireframeMode
    });

    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x30363d,
      metalness: 0.85,
      roughness: 0.3,
      wireframe: wireframeMode
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe6edf3,
      metalness: 0.98,
      roughness: 0.1,
      wireframe: wireframeMode
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd29922,
      metalness: 0.9,
      roughness: 0.3,
      wireframe: wireframeMode
    });

    const defectThermalMat = new THREE.MeshStandardMaterial({
      color: statusHex,
      emissive: statusHex,
      emissiveIntensity: isCritical ? 0.7 : isWarning ? 0.45 : 0.05,
      metalness: 0.6,
      roughness: 0.3,
      wireframe: wireframeMode
    });

    // 7. BUILD SOPHISTICATED 3D INDUSTRIAL MODELS BY ASSET CATEGORY
    if (asset.category === "compressor") {
      // ==========================================
      // MODEL 1: MULTI-STAGE CENTRIFUGAL COMPRESSOR
      // ==========================================

      // Heavy Structural Skid Frame
      const skidBase = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 11), castIronMat);
      skidBase.position.set(0, -1.4, 0);
      skidBase.receiveShadow = true;
      mainGroup.add(skidBase);

      // Spring Vibration Isolators (4 corners)
      [[-9, -4.5], [9, -4.5], [-9, 4.5], [9, 4.5]].forEach(([sx, sz]) => {
        const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16), brushedSteelMat);
        spring.position.set(sx, -1.9, sz);
        mainGroup.add(spring);
      });

      // High-Power 250kW Drive Motor
      const motorBody = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 9.5, 32), darkSteelMat);
      motorBody.rotation.z = Math.PI / 2;
      motorBody.position.set(-5.5, 2.5, 0);
      motorBody.castShadow = true;
      mainGroup.add(motorBody);

      // Motor Cooling Ribs
      for (let i = -3.5; i <= 3.5; i += 1.2) {
        const fin = new THREE.Mesh(new THREE.TorusGeometry(4.0, 0.15, 8, 32), brushedSteelMat);
        fin.rotation.y = Math.PI / 2;
        fin.position.set(-5.5 + i, 2.5, 0);
        mainGroup.add(fin);
      }

      // Motor Terminal Junction Box on top
      const termBox = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 2.4), darkSteelMat);
      termBox.position.set(-5.5, 6.8, 0);
      mainGroup.add(termBox);

      // Flexible High-Speed Coupling Guard
      const couplingGuard = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 2.8, 24), brushedSteelMat);
      couplingGuard.rotation.z = Math.PI / 2;
      couplingGuard.position.set(0.2, 2.5, 0);
      mainGroup.add(couplingGuard);

      // Centrifugal Volute Casing (Compressor Scroll)
      const voluteScroll = new THREE.Mesh(new THREE.TorusGeometry(4.8, 2.0, 24, 48), castIronMat);
      voluteScroll.position.set(5.5, 2.5, 0);
      voluteScroll.castShadow = true;
      mainGroup.add(voluteScroll);

      // Flanged Air Intake Bellmouth
      const intakeFlange = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.2, 3.2, 24), brushedSteelMat);
      intakeFlange.rotation.x = Math.PI / 2;
      intakeFlange.position.set(5.5, 2.5, 3.8);
      mainGroup.add(intakeFlange);

      // Top Discharge Exhaust Pipe with Pressure Gauge
      const exhaustPipe = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4.5, 24), brushedSteelMat);
      exhaustPipe.position.set(5.5, 7.0, 0);
      mainGroup.add(exhaustPipe);

      const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.4, 16), brassMat);
      gauge.rotation.x = Math.PI / 2;
      gauge.position.set(5.5, 8.5, 1.2);
      mainGroup.add(gauge);

      // Rotating Impeller Assembly inside
      const impellerGroup = new THREE.Group();
      impellerGroup.position.set(5.5, 2.5, 0);
      const impellerHub = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 1.8, 16), chromeMat);
      impellerHub.rotation.z = Math.PI / 2;
      impellerGroup.add(impellerHub);

      // 8 Aerodynamic Impeller Blades
      for (let b = 0; b < 8; b++) {
        const bladeAngle = (b * Math.PI * 2) / 8;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.8), brushedSteelMat);
        blade.position.set(0, Math.cos(bladeAngle) * 2.2, Math.sin(bladeAngle) * 2.2);
        blade.rotation.x = bladeAngle + 0.3;
        impellerGroup.add(blade);
      }
      mainGroup.add(impellerGroup);
      rotatingElementsRef.current.push(impellerGroup);

      // Defect Hotspot: Drive-End Bearing Housing with Pulsing Defect Mesh
      const driveEndBrg = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.8, 24), defectThermalMat);
      driveEndBrg.rotation.z = Math.PI / 2;
      driveEndBrg.position.set(1.6, 2.5, 0);
      driveEndBrg.userData = { componentId: "cmp01-drive-brg", name: "Drive-End Hydrodynamic Bearing" };
      mainGroup.add(driveEndBrg);
      meshesRef.current.push(driveEndBrg);

    } else if (asset.category === "cnc_mill") {
      // ==========================================
      // MODEL 2: HIGH-PRECISION 5-AXIS CNC MILLING CENTER
      // ==========================================

      // Heavy Mineral Cast Machine Bed
      const machineBed = new THREE.Mesh(new THREE.BoxGeometry(16, 2.8, 16), castIronMat);
      machineBed.position.set(0, -0.6, 0);
      machineBed.receiveShadow = true;
      mainGroup.add(machineBed);

      // Rigid Double-Column Gantry
      const columnLeft = new THREE.Mesh(new THREE.BoxGeometry(3.2, 14, 4), darkSteelMat);
      columnLeft.position.set(-6, 6.5, -2);
      mainGroup.add(columnLeft);

      const columnRight = new THREE.Mesh(new THREE.BoxGeometry(3.2, 14, 4), darkSteelMat);
      columnRight.position.set(6, 6.5, -2);
      mainGroup.add(columnRight);

      const topCrossbeam = new THREE.Mesh(new THREE.BoxGeometry(15.2, 3.5, 4.5), darkSteelMat);
      topCrossbeam.position.set(0, 13.5, -2);
      mainGroup.add(topCrossbeam);

      // Precision X/Y Worktable with T-Slots
      const worktable = new THREE.Mesh(new THREE.BoxGeometry(10, 1.4, 9), brushedSteelMat);
      worktable.position.set(0, 1.2, 1.5);
      worktable.castShadow = true;
      mainGroup.add(worktable);

      // Clamped Aluminum Workpiece Engine Block
      const workpiece = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.2, 4.5), brushedSteelMat);
      workpiece.position.set(0, 3.0, 1.5);
      mainGroup.add(workpiece);

      // Traveling Headstock Assembly
      const headstock = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.0, 4.2), brushedSteelMat);
      headstock.position.set(0, 9.5, 0.5);
      mainGroup.add(headstock);

      // High-Speed Electro-Spindle (Defect Component)
      const spindleHousing = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.4, 4.2, 24), defectThermalMat);
      spindleHousing.position.set(0, 5.5, 0.8);
      spindleHousing.userData = { componentId: "cnc01-spindle", name: "High-Speed Electro-Spindle (24,000 RPM)" };
      mainGroup.add(spindleHousing);
      meshesRef.current.push(spindleHousing);

      // Rotating Spindle Tool (BT40 Holder + Carbide End Mill)
      const spindleToolGroup = new THREE.Group();
      spindleToolGroup.position.set(0, 3.8, 0.8);

      const toolHolder = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.4, 1.4, 16), chromeMat);
      spindleToolGroup.add(toolHolder);

      const endMillBit = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.8, 12), brassMat);
      endMillBit.position.y = -1.2;
      spindleToolGroup.add(endMillBit);

      mainGroup.add(spindleToolGroup);
      rotatingElementsRef.current.push(spindleToolGroup);

      // Tool Changer Carousel Turret on the Left
      const toolMagazine = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 1.2, 24), darkSteelMat);
      toolMagazine.position.set(-6.5, 10.5, 2.5);
      mainGroup.add(toolMagazine);

      // Dual Coolant Nozzles
      const nozzle1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.8, 8), brassMat);
      nozzle1.rotation.z = 0.4;
      nozzle1.position.set(-1.2, 4.5, 0.8);
      mainGroup.add(nozzle1);

    } else if (asset.category === "flow_wrapper") {
      // ==========================================
      // MODEL 3: PACKAGING FLOW WRAPPER & CONVEYOR
      // ==========================================

      // Stainless Steel Frame Bed
      const conveyorBed = new THREE.Mesh(new THREE.BoxGeometry(24, 0.8, 5.5), brushedSteelMat);
      conveyorBed.position.set(0, 0.8, 0);
      mainGroup.add(conveyorBed);

      // Structural Support Legs
      for (let lx = -9; lx <= 9; lx += 9) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.8, 12), darkSteelMat);
        leg.position.set(lx, -0.6, 2.2);
        mainGroup.add(leg);

        const legBack = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.8, 12), darkSteelMat);
        legBack.position.set(lx, -0.6, -2.2);
        mainGroup.add(legBack);
      }

      // Upper Film Roll Unwind Spindle
      const filmSpindle = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 4.5, 24), chromeMat);
      filmSpindle.rotation.x = Math.PI / 2;
      filmSpindle.position.set(-3.5, 6.2, 0);
      mainGroup.add(filmSpindle);

      const filmMast = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.5, 0.8), darkSteelMat);
      filmMast.position.set(-3.5, 3.5, -2.4);
      mainGroup.add(filmMast);

      // Infeed Guide Rollers
      for (let r = -10; r < 2; r += 2.5) {
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 4.8, 16), chromeMat);
        roller.rotation.x = Math.PI / 2;
        roller.position.set(r, 1.6, 0);
        mainGroup.add(roller);
      }

      // Dynamic Product Packages moving along the line
      const packageGroup = new THREE.Group();
      for (let p = -8; p <= 8; p += 4) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 2.2), brassMat);
        box.position.set(p, 1.8, 0);
        packageGroup.add(box);
      }
      mainGroup.add(packageGroup);
      dynamicObjectsRef.current.push(packageGroup);

      // Rotary Sealing Jaw Block (Defect Component)
      const rotarySealer = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.8, 5.2), defectThermalMat);
      rotarySealer.position.set(5.5, 2.8, 0);
      rotarySealer.userData = { componentId: "wrp01-seal", name: "Rotary Ultrasonic Cross-Sealer" };
      mainGroup.add(rotarySealer);
      meshesRef.current.push(rotarySealer);

    } else if (asset.category === "robotic_arm") {
      // ==========================================
      // MODEL 4: 6-AXIS ARTICULATED INDUSTRIAL ROBOT
      // ==========================================

      // Cast Base Pedestal (J0)
      const robotPedestal = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.2, 2.2, 24), castIronMat);
      robotPedestal.position.y = -0.9;
      robotPedestal.receiveShadow = true;
      mainGroup.add(robotPedestal);

      // Rotating Turntable Base (J1)
      const j1Turntable = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.2, 2.4, 24), darkSteelMat);
      j1Turntable.position.y = 1.2;
      mainGroup.add(j1Turntable);

      // J2 Boom Arm Joint Pivot
      const j2Pivot = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 3.4, 20), brushedSteelMat);
      j2Pivot.rotation.x = Math.PI / 2;
      j2Pivot.position.set(0, 3.0, 0);
      mainGroup.add(j2Pivot);

      // Lower Boom Arm
      const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 9.0, 2.6), darkSteelMat);
      lowerArm.position.set(0, 7.0, 1.2);
      lowerArm.rotation.x = 0.25;
      lowerArm.castShadow = true;
      mainGroup.add(lowerArm);

      // J3 Elbow Pivot Joint
      const j3Elbow = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 3.2, 20), brushedSteelMat);
      j3Elbow.rotation.x = Math.PI / 2;
      j3Elbow.position.set(0, 11.2, 2.4);
      mainGroup.add(j3Elbow);

      // Upper Forearm Barrel (J4)
      const foreArm = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.2, 7.5, 20), darkSteelMat);
      foreArm.rotation.x = -0.55;
      foreArm.position.set(0, 13.8, 5.0);
      mainGroup.add(foreArm);

      // 3-Axis Precision Wrist (J5/J6 Defect Hotspot)
      const wristJoint = new THREE.Mesh(new THREE.SphereGeometry(1.7, 24, 24), defectThermalMat);
      wristJoint.position.set(0, 16.5, 7.2);
      wristJoint.userData = { componentId: "rob01-wrist", name: "3-Axis Precision Harmonic Wrist" };
      mainGroup.add(wristJoint);
      meshesRef.current.push(wristJoint);

      // Pneumatic 2-Finger Industrial Gripper Tool
      const gripperBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.8), chromeMat);
      gripperBase.position.set(0, 18.0, 8.2);
      mainGroup.add(gripperBase);

      const fingerL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 0.6), brushedSteelMat);
      fingerL.position.set(-0.8, 19.5, 8.2);
      mainGroup.add(fingerL);

      const fingerR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 0.6), brushedSteelMat);
      fingerR.position.set(0.8, 19.5, 8.2);
      mainGroup.add(fingerR);

    } else {
      // ==========================================
      // MODEL 5: AS/RS CRANE / INDUSTRIAL CHILLER
      // ==========================================

      // Twin Vertical Lattice Steel Mast Columns
      const mastL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 20, 1.6), darkSteelMat);
      mastL.position.set(-3.2, 8.0, 0);
      mainGroup.add(mastL);

      const mastR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 20, 1.6), darkSteelMat);
      mastR.position.set(3.2, 8.0, 0);
      mainGroup.add(mastR);

      // Horizontal Lattice Bracing
      for (let my = 1; my <= 17; my += 3.5) {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.6, 1.2), brushedSteelMat);
        brace.position.set(0, my, 0);
        mainGroup.add(brace);
      }

      // Traveling Hoist Carriage Platform (Defect Component)
      const hoistCarriage = new THREE.Mesh(new THREE.BoxGeometry(8.2, 2.4, 7.2), defectThermalMat);
      hoistCarriage.position.set(0, 8.5, 0);
      hoistCarriage.userData = { componentId: "asrs01-travel", name: "High-Bay Hoist & Travel Carriage" };
      mainGroup.add(hoistCarriage);
      meshesRef.current.push(hoistCarriage);

      // Telescopic Cargo Forks & Wooden Pallet
      const forkL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 6.5), brushedSteelMat);
      forkL.position.set(-2.0, 7.2, 2.0);
      mainGroup.add(forkL);

      const forkR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 6.5), brushedSteelMat);
      forkR.position.set(2.0, 7.2, 2.0);
      mainGroup.add(forkR);

      const pallet = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.0, 5.0), brassMat);
      pallet.position.set(0, 8.0, 2.2);
      mainGroup.add(pallet);
    }

    // 8. INTERACTIVE MOUSE ORBIT CONTROLS & CAMERA DAMPING
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      mainGroup.rotation.y += deltaX * 0.007;
      mainGroup.rotation.x += deltaY * 0.007;

      // Limit pitch angle to prevent flipping
      mainGroup.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, mainGroup.rotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    // Zoom via Wheel
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomFactor = e.deltaY * 0.02;
      const newFov = Math.max(20, Math.min(65, cameraRef.current.fov + zoomFactor));
      cameraRef.current.fov = newFov;
      cameraRef.current.updateProjectionMatrix();
    };

    // 3D Component Selection via Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(meshesRef.current, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const compId = hit.userData.componentId;
        const matched = asset.components.find(c => c.id === compId) || asset.components[0];
        if (matched) {
          setSelectedComp(matched);
          if (onComponentSelect) onComponentSelect(matched);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    dom.addEventListener("wheel", handleWheel, { passive: false });
    dom.addEventListener("click", handleClick);

    // 9. ANIMATION RENDERING LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth auto-rotation
      if (autoRotate && !isDragging) {
        mainGroup.rotation.y += 0.0035;
      }

      // Rotate high-speed machinery elements (Impellers, Spindles, Rollers)
      rotatingElementsRef.current.forEach(group => {
        group.rotation.x += 0.08;
      });

      // Animate dynamic conveyor items
      dynamicObjectsRef.current.forEach(dyn => {
        dyn.position.x = (elapsedTime * 1.5) % 8 - 4;
      });

      // Defect Light Pulsing
      if (isCritical) {
        defectPointLight.intensity = 1.8 + Math.sin(elapsedTime * 5.0) * 1.2;
      } else if (isWarning) {
        defectPointLight.intensity = 1.0 + Math.sin(elapsedTime * 3.0) * 0.6;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Responsive Canvas Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      dom.removeEventListener("wheel", handleWheel);
      dom.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [asset.id, asset.category, autoRotate, wireframeMode]);

  const handleSetCameraAngle = (angle: "iso" | "front" | "top" | "side") => {
    setActiveCameraAngle(angle);
    if (!cameraRef.current || !mainGroupRef.current) return;

    mainGroupRef.current.rotation.set(0, 0, 0);

    if (angle === "iso") {
      cameraRef.current.position.set(24, 18, 28);
    } else if (angle === "front") {
      cameraRef.current.position.set(0, 6, 34);
    } else if (angle === "top") {
      cameraRef.current.position.set(0, 36, 0.1);
    } else if (angle === "side") {
      cameraRef.current.position.set(34, 6, 0);
    }
    cameraRef.current.lookAt(0, 2, 0);
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    cameraRef.current.fov = Math.max(20, Math.min(65, cameraRef.current.fov + delta));
    cameraRef.current.updateProjectionMatrix();
  };

  return (
    <div className="scada-card p-4 bg-[#161b22] border-[#30363d] flex flex-col gap-3">
      {/* 3D Viewer Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d] font-bold">
              3D CAD TWIN
            </span>
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#f0f6fc] uppercase">
              {asset.id.toUpperCase()}: {asset.name}
            </h3>
            <StatusBadge status={asset.health_state} size="sm" />
          </div>
          <p className="text-[11px] text-[#8b949e] font-mono mt-0.5">
            PBR WebGL 3D Mesh • Full Dynamic Kinematics & Thermal Defect Synchronization
          </p>
        </div>

        {/* 3D View Modes & Camera Controls */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <div className="flex bg-[#0d1117] p-0.5 rounded border border-[#30363d] text-[10px]">
            <button
              onClick={() => handleSetCameraAngle("iso")}
              className={`px-2 py-0.5 rounded transition-colors ${activeCameraAngle === "iso" ? "bg-[#21262d] text-[#58a6ff] font-bold" : "text-[#8b949e]"}`}
            >
              ISO
            </button>
            <button
              onClick={() => handleSetCameraAngle("front")}
              className={`px-2 py-0.5 rounded transition-colors ${activeCameraAngle === "front" ? "bg-[#21262d] text-[#58a6ff] font-bold" : "text-[#8b949e]"}`}
            >
              FRONT
            </button>
            <button
              onClick={() => handleSetCameraAngle("side")}
              className={`px-2 py-0.5 rounded transition-colors ${activeCameraAngle === "side" ? "bg-[#21262d] text-[#58a6ff] font-bold" : "text-[#8b949e]"}`}
            >
              SIDE
            </button>
            <button
              onClick={() => handleSetCameraAngle("top")}
              className={`px-2 py-0.5 rounded transition-colors ${activeCameraAngle === "top" ? "bg-[#21262d] text-[#58a6ff] font-bold" : "text-[#8b949e]"}`}
            >
              TOP
            </button>
          </div>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 btn-interactive ${
              autoRotate
                ? "bg-[#21262d] text-[#58a6ff] border-[#388bfd]"
                : "bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-[#c9d1d9]"
            }`}
            title="Toggle Continuous 3D Rotation"
          >
            <RotateCw className={`w-3 h-3 ${autoRotate ? "animate-spin" : ""}`} />
            <span>Rotate</span>
          </button>

          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 btn-interactive ${
              wireframeMode
                ? "bg-[#21262d] text-[#58a6ff] border-[#388bfd]"
                : "bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-[#c9d1d9]"
            }`}
            title="Toggle Structural Wireframe Mode"
          >
            <Layers className="w-3 h-3" />
            <span>Wireframe</span>
          </button>

          <div className="flex bg-[#0d1117] rounded border border-[#30363d]">
            <button
              onClick={() => handleZoom(-8)}
              className="p-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleZoom(8)}
              className="p-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive 3D WebGL Canvas Container */}
      <div className="relative rounded bg-[#0d1117] border border-[#30363d] overflow-hidden">
        <div ref={containerRef} className="w-full h-[400px] cursor-grab active:cursor-grabbing" />

        {/* 3D Telemetry HUD Overlay */}
        <div className="absolute top-3 left-3 bg-[#161b22]/90 backdrop-blur border border-[#30363d] p-3 rounded text-xs font-mono text-[#c9d1d9] pointer-events-none space-y-1.5 shadow-md">
          <div className="flex items-center justify-between gap-4 border-b border-[#30363d] pb-1">
            <span className="text-[10px] text-[#8b949e] uppercase font-bold">Live 3D Telemetry</span>
            <span className="w-2 h-2 rounded-full bg-[#2ea043]" />
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#8b949e]">Health Index:</span>
            <strong className={asset.prediction.health_index < 50 ? "text-[#f85149]" : "text-[#3fb950]"}>
              {asset.prediction.health_index.toFixed(1)}%
            </strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#8b949e]">Triaxial Vibration:</span>
            <strong className={asset.vibration_x > 2.0 ? "text-[#f85149]" : "text-[#c9d1d9]"}>
              {asset.vibration_x.toFixed(2)} mm/s
            </strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#8b949e]">Bearing RTD Temp:</span>
            <strong className={asset.temperature_bearing > 80 ? "text-[#f85149]" : "text-[#c9d1d9]"}>
              {asset.temperature_bearing.toFixed(1)}°C
            </strong>
          </div>
        </div>

        {/* 3D Clicked Component Detail Popover */}
        {selectedComp && (
          <div className="absolute bottom-3 right-3 bg-[#161b22]/95 border border-[#388bfd] p-3.5 rounded text-xs font-mono text-[#c9d1d9] max-w-sm shadow-xl space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2 border-b border-[#30363d] pb-1.5">
              <strong className="text-[#f0f6fc] text-xs truncate">{selectedComp.name}</strong>
              <StatusBadge status={selectedComp.status} size="sm" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8b949e]">
              <div>Temp: <strong className="text-[#c9d1d9]">{selectedComp.temperature}°C</strong></div>
              <div>Vibe: <strong className="text-[#c9d1d9]">{selectedComp.vibration_rms} mm/s</strong></div>
            </div>
            <div className="p-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[11px] text-[#f85149]">
              Defect: {selectedComp.defect_type || "Nominal fatigue"} (Risk: {(selectedComp.failure_risk * 100).toFixed(0)}%)
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-[#8b949e]">
        <span>Left-click + drag to rotate 360° • Mouse wheel to zoom • Click pulsing defect mesh for component analysis</span>
        <span className="text-[#58a6ff] font-semibold">Three.js WebGL 60 FPS PBR Engine</span>
      </div>
    </div>
  );
}
