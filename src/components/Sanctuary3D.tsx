import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Eye, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { SANCTUARY_ARTICLES } from '../data/sanctuary';
import { AtlasTheme } from '../types/scripture';

interface Sanctuary3DProps {
  atlasTheme: AtlasTheme;
  selectedId: string;
  onSelectComponent: (id: string) => void;
}

type CameraPreset = 'precinct' | 'courtyard' | 'holy' | 'most_holy';

const PRESET_VIEWS: Record<
  CameraPreset,
  { label: string; pos: [number, number, number]; target: [number, number, number] }
> = {
  precinct: { label: 'Full Precinct', pos: [14, 15, 22], target: [0, 0.8, 0] },
  courtyard: { label: 'Outer Court', pos: [14, 6.5, 9], target: [8, 1.0, 0] },
  holy: { label: 'Holy Place', pos: [-2.5, 5.2, 8.5], target: [-5.5, 1.0, 0] },
  most_holy: { label: 'Most Holy Place', pos: [-11.5, 4.4, 7.2], target: [-11.5, 1.1, 0] },
};

const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export const Sanctuary3D: React.FC<Sanctuary3DProps> = ({
  atlasTheme,
  selectedId,
  onSelectComponent,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cutawayOpen, setCutawayOpen] = useState(true);
  const [preset, setPreset] = useState<CameraPreset>('precinct');
  const [dockOpen, setDockOpen] = useState(false);

  const onSelectRef = useRef(onSelectComponent);
  onSelectRef.current = onSelectComponent;

  const sceneApiRef = useRef<{
    setCameraPreset: (p: CameraPreset) => void;
    setCutaway: (open: boolean) => void;
    highlightSelection: (id: string) => void;
  } | null>(null);

  const selectedArticle = useMemo(
    () => SANCTUARY_ARTICLES.find((a) => a.id === selectedId) ?? SANCTUARY_ARTICLES[0],
    [selectedId]
  );

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isLight = atlasTheme === 'light';
    const isSoftware = detectSoftwareWebGL();
    const width = container.clientWidth || 760;
    const height = container.clientHeight || 480;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftware,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSoftware ? 1 : 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 1.08 : 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xf2ede3 : 0x0d0e10);
    scene.fog = new THREE.FogExp2(isLight ? 0xf2ede3 : 0x0d0e10, 0.012);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.2, 160);
    camera.position.set(...PRESET_VIEWS.precinct.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minDistance = 4;
    controls.maxDistance = 44;
    controls.target.set(...PRESET_VIEWS.precinct.target);

    // Desert sand plinth & compass orientation
    const plinthGeo = new THREE.BoxGeometry(38, 0.4, 21);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xe4dccb : 0x1b1d21,
      roughness: 0.92,
      metalness: 0.04,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.set(0, -0.2, 0);
    scene.add(plinth);

    const gridHelper = new THREE.GridHelper(
      36,
      36,
      isLight ? 0xb5ab9a : 0x2c3038,
      isLight ? 0xd9d1c2 : 0x181a1f
    );
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // PBR Materials
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xe6b55b,
      roughness: 0.22,
      metalness: 0.92,
    });
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xb96a35,
      roughness: 0.35,
      metalness: 0.82,
    });
    const linenMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xf7f2e8 : 0xdad2c4,
      roughness: 0.88,
      metalness: 0.02,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.84,
    });
    const veilMat = new THREE.MeshStandardMaterial({
      color: 0x7b4c9e,
      roughness: 0.72,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x3fa986,
      roughness: 0.14,
      metalness: 0.2,
    });
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xd95826,
      emissive: 0xd95826,
      emissiveIntensity: 1.35,
      roughness: 0.5,
    });

    // Clickable registry
    const clickableMeshes: THREE.Object3D[] = [];
    const stationGroups = new Map<string, THREE.Group>();
    const selectionHaloMat = new THREE.MeshBasicMaterial({
      color: 0x4ec498,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const selectionHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.18, 36),
      selectionHaloMat
    );
    selectionHalo.rotation.x = -Math.PI / 2;
    selectionHalo.position.y = 0.04;
    scene.add(selectionHalo);

    const registerStation = (id: string, group: THREE.Group) => {
      group.userData.sanctuaryId = id;
      group.traverse((obj) => {
        obj.userData.sanctuaryId = id;
        if ((obj as THREE.Mesh).isMesh) clickableMeshes.push(obj);
      });
      stationGroups.set(id, group);
      scene.add(group);
    };

    // Scale: 100 x 50 cubits => 32 x 16 scene units (1 cubit = 0.32u). East = +X, West = -X
    // 1. Outer Courtyard (perimeter linen curtains + bronze pillars, East Gate opening)
    const courtGroup = new THREE.Group();
    const courtFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 16),
      new THREE.MeshStandardMaterial({
        color: isLight ? 0xebe3d3 : 0x15171b,
        roughness: 0.94,
      })
    );
    courtFloor.rotation.x = -Math.PI / 2;
    courtFloor.position.set(0, 0.02, 0);
    courtGroup.add(courtFloor);

    const wallH = 1.6;
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(32, wallH), linenMat);
    northWall.position.set(0, wallH / 2, -8);
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(32, wallH), linenMat);
    southWall.position.set(0, wallH / 2, 8);
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(16, wallH), linenMat);
    westWall.rotation.y = Math.PI / 2;
    westWall.position.set(-16, wallH / 2, 0);
    const eastTop = new THREE.Mesh(new THREE.PlaneGeometry(5, wallH), linenMat);
    eastTop.rotation.y = Math.PI / 2;
    eastTop.position.set(16, wallH / 2, -5.5);
    const eastBot = new THREE.Mesh(new THREE.PlaneGeometry(5, wallH), linenMat);
    eastBot.rotation.y = Math.PI / 2;
    eastBot.position.set(16, wallH / 2, 5.5);
    const eastGateCurtain = new THREE.Mesh(new THREE.PlaneGeometry(6, wallH), veilMat);
    eastGateCurtain.rotation.y = Math.PI / 2;
    eastGateCurtain.position.set(16, wallH / 2, 0);
    courtGroup.add(northWall, southWall, westWall, eastTop, eastBot, eastGateCurtain);

    // Bronze court pillars
    const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, wallH + 0.14, 8);
    for (let i = 0; i <= 10; i++) {
      const px = -16 + i * 3.2;
      const pN = new THREE.Mesh(pillarGeo, bronzeMat);
      pN.position.set(px, (wallH + 0.14) / 2, -8);
      const pS = new THREE.Mesh(pillarGeo, bronzeMat);
      pS.position.set(px, (wallH + 0.14) / 2, 8);
      courtGroup.add(pN, pS);
    }
    registerStation('sanc-courtyard', courtGroup);

    // 2. Altar of Burnt Offering (East court: x = +9.5)
    const altarGroup = new THREE.Group();
    altarGroup.position.set(9.5, 0, 0);
    const altarBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2.2), bronzeMat);
    altarBody.position.y = 0.6;
    const altarFire = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 1.5), emberMat);
    altarFire.position.y = 1.18;
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.2), bronzeMat);
    ramp.position.set(1.75, 0.18, 0);
    altarGroup.add(altarBody, altarFire, ramp);
    for (const [hx, hz] of [
      [-1.0, -1.0],
      [1.0, -1.0],
      [-1.0, 1.0],
      [1.0, 1.0],
    ]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.32, 6), bronzeMat);
      horn.position.set(hx, 1.32, hz);
      altarGroup.add(horn);
    }
    registerStation('sanc-altar-burnt-offering', altarGroup);

    // 3. Bronze Laver (between Altar and Tent door: x = +4.2)
    const laverGroup = new THREE.Group();
    laverGroup.position.set(4.2, 0, 0);
    const laverFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 0.55, 18), bronzeMat);
    laverFoot.position.y = 0.28;
    const laverBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.45, 0.52, 24), bronzeMat);
    laverBowl.position.y = 0.78;
    const laverWater = new THREE.Mesh(new THREE.CircleGeometry(0.84, 24), waterMat);
    laverWater.rotation.x = -Math.PI / 2;
    laverWater.position.y = 1.05;
    laverGroup.add(laverFoot, laverBowl, laverWater);
    registerStation('sanc-laver', laverGroup);

    // Tabernacle Tent Shell (x: -13.2 .. -1.2, z: -2.4 .. +2.4, h: 3.2)
    const roofGroup = new THREE.Group();
    const tentCovering = new THREE.Mesh(
      new THREE.BoxGeometry(12.2, 0.14, 5.1),
      new THREE.MeshStandardMaterial({
        color: isLight ? 0x6c5442 : 0x3b2f26,
        roughness: 0.9,
        transparent: true,
        opacity: 0.42,
      })
    );
    tentCovering.position.set(-7.2, 3.25, 0);
    roofGroup.add(tentCovering);
    roofGroup.visible = false; // Cutaway open by default so interior vessels glow clearly
    scene.add(roofGroup);

    // 4. Holy Place (x: -9.2 .. -1.2)
    const holyGroup = new THREE.Group();
    const holyFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 4.8),
      new THREE.MeshStandardMaterial({ color: isLight ? 0xe5dac6 : 0x201d19, roughness: 0.8 })
    );
    holyFloor.rotation.x = -Math.PI / 2;
    holyFloor.position.set(-5.2, 0.03, 0);
    const holyNorth = new THREE.Mesh(new THREE.BoxGeometry(8, 3.1, 0.12), goldMat);
    holyNorth.position.set(-5.2, 1.55, -2.4);
    const holySouth = new THREE.Mesh(new THREE.BoxGeometry(8, 3.1, 0.12), goldMat);
    holySouth.position.set(-5.2, 1.55, 2.4);
    holyGroup.add(holyFloor, holyNorth, holySouth);
    registerStation('sanc-holy-place', holyGroup);

    // 5. Golden Candlestick (South side of Holy Place: x = -5.4, z = +1.45)
    const menorahGroup = new THREE.Group();
    menorahGroup.position.set(-5.4, 0, 1.45);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.18, 1.4, 12), goldMat);
    stem.position.y = 0.7;
    const branchBar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.07, 0.08), goldMat);
    branchBar.position.y = 1.05;
    menorahGroup.add(stem, branchBar);
    for (let i = -3; i <= 3; i++) {
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.4, 8), goldMat);
      candle.position.set(i * 0.16, 1.25, 0);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), emberMat);
      flame.position.set(i * 0.16, 1.5, 0);
      menorahGroup.add(candle, flame);
    }
    const menorahLight = new THREE.PointLight(0xffbe66, 2.2, 6);
    menorahLight.position.set(-5.4, 1.7, 1.45);
    scene.add(menorahLight);
    registerStation('sanc-candlestick', menorahGroup);

    // 6. Table of Showbread (North side of Holy Place: x = -5.4, z = -1.45)
    const tableGroup = new THREE.Group();
    tableGroup.position.set(-5.4, 0, -1.45);
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.65), goldMat);
    tableTop.position.y = 0.85;
    const loafMat = new THREE.MeshStandardMaterial({ color: 0xd4a45a, roughness: 0.75 });
    const stackA = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.28, 12), loafMat);
    stackA.position.set(-0.24, 1.04, 0);
    const stackB = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.28, 12), loafMat);
    stackB.position.set(0.24, 1.04, 0);
    tableGroup.add(tableTop, stackA, stackB);
    for (const [lx, lz] of [
      [-0.46, -0.25],
      [0.46, -0.25],
      [-0.46, 0.25],
      [0.46, 0.25],
    ]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.82, 0.08), goldMat);
      leg.position.set(lx, 0.41, lz);
      tableGroup.add(leg);
    }
    registerStation('sanc-table-showbread', tableGroup);

    // 7. Altar of Incense (Before the Veil: x = -8.1, z = 0)
    const incenseGroup = new THREE.Group();
    incenseGroup.position.set(-8.1, 0, 0);
    const incenseBody = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.15, 0.68), goldMat);
    incenseBody.position.y = 0.58;
    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.09, 0.76), goldMat);
    crown.position.y = 1.18;
    const emberTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), emberMat);
    emberTop.position.y = 1.24;
    incenseGroup.add(incenseBody, crown, emberTop);
    registerStation('sanc-altar-incense', incenseGroup);

    // 8. The Veil (x = -9.2)
    const veilGroup = new THREE.Group();
    const veilMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 3.05), veilMat);
    veilMesh.rotation.y = Math.PI / 2;
    veilMesh.position.set(-9.2, 1.54, 0);
    veilGroup.add(veilMesh);
    registerStation('sanc-veil', veilGroup);

    // 9. Most Holy Place (x: -13.2 .. -9.2)
    const mostHolyGroup = new THREE.Group();
    const mhFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(4.0, 4.8),
      new THREE.MeshStandardMaterial({ color: isLight ? 0xded3be : 0x161412, roughness: 0.75 })
    );
    mhFloor.rotation.x = -Math.PI / 2;
    mhFloor.position.set(-11.2, 0.035, 0);
    const mhNorth = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.1, 0.12), goldMat);
    mhNorth.position.set(-11.2, 1.55, -2.4);
    const mhSouth = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.1, 0.12), goldMat);
    mhSouth.position.set(-11.2, 1.55, 2.4);
    const mhWest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.1, 4.92), goldMat);
    mhWest.position.set(-13.2, 1.55, 0);
    mostHolyGroup.add(mhFloor, mhNorth, mhSouth, mhWest);
    registerStation('sanc-most-holy-place', mostHolyGroup);

    // 10. Ark of the Covenant & Mercy Seat (x = -11.5, z = 0)
    const arkGroup = new THREE.Group();
    arkGroup.position.set(-11.5, 0, 0);
    const arkChest = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 1.45), goldMat);
    arkChest.position.y = 0.45;
    const mercySeat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 1.52), goldMat);
    mercySeat.position.y = 0.92;
    const cherubL = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.52, 8), goldMat);
    cherubL.position.set(0, 1.22, -0.42);
    const cherubR = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.52, 8), goldMat);
    cherubR.position.set(0, 1.22, 0.42);
    const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 8), goldMat);
    poleL.rotation.z = Math.PI / 2;
    poleL.position.set(0, 0.3, -0.78);
    const poleR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 8), goldMat);
    poleR.rotation.z = Math.PI / 2;
    poleR.position.set(0, 0.3, 0.78);
    arkGroup.add(arkChest, mercySeat, cherubL, cherubR, poleL, poleR);
    const shekinahLight = new THREE.PointLight(0xffe1a0, 3.4, 8);
    shekinahLight.position.set(-11.5, 1.85, 0);
    scene.add(shekinahLight);
    registerStation('sanc-ark-covenant', arkGroup);

    // Gentle overhead fill light
    const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.25);
    dirLight.position.set(14, 24, 12);
    scene.add(dirLight);

    // Highlight helper
    const positionSelectionHalo = (id: string) => {
      const grp = stationGroups.get(id);
      if (!grp) {
        selectionHalo.visible = false;
        return;
      }
      if (id === 'sanc-courtyard') {
        selectionHalo.position.set(0, 0.04, 0);
        selectionHalo.scale.set(1, 1, 1);
      } else if (id === 'sanc-holy-place') {
        selectionHalo.position.set(-5.2, 0.05, 0);
        selectionHalo.scale.set(2.1, 2.1, 1);
      } else if (id === 'sanc-most-holy-place') {
        selectionHalo.position.set(-11.2, 0.05, 0);
        selectionHalo.scale.set(1.8, 1.8, 1);
      } else if (id === 'sanc-veil') {
        selectionHalo.position.set(-9.2, 0.05, 0);
        selectionHalo.scale.set(1.2, 1.2, 1);
      } else {
        selectionHalo.position.set(grp.position.x, 0.05, grp.position.z);
        selectionHalo.scale.set(1.35, 1.35, 1);
      }
      selectionHalo.visible = true;
    };
    positionSelectionHalo(selectedId);

    // On-demand render & camera flight state
    let needsRender = true;
    let flying = false;
    let rafId = 0;
    const prevTime = { value: performance.now() };
    const gl = renderer.getContext();

    const requestRender = () => {
      needsRender = true;
    };

    const waitForGpu = (done: () => void) => {
      if ('fenceSync' in gl) {
        const gl2 = gl as WebGL2RenderingContext;
        const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (!sync) {
          done();
          return;
        }
        gl2.flush();
        const poll = () => {
          const status = gl2.clientWaitSync(sync, 0, 0);
          if (status === gl2.TIMEOUT_EXPIRED) {
            requestAnimationFrame(poll);
          } else {
            gl2.deleteSync(sync);
            done();
          }
        };
        requestAnimationFrame(poll);
      } else {
        gl.finish();
        done();
      }
    };

    let settleCallback: (() => void) | null = null;
    controls.addEventListener('change', requestRender);

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - prevTime.value) / 1000);
      prevTime.value = now;

      if (flying) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetPos.x, 6.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetPos.y, 6.5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetPos.z, 6.5, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLook.x, 6.5, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLook.y, 6.5, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLook.z, 6.5, dt);
        needsRender = true;
        if (camera.position.distanceTo(_targetPos) < 0.08) {
          flying = false;
        }
      }

      if (controls.update()) {
        needsRender = true;
      }

      if (needsRender) {
        needsRender = false;
        renderer.render(scene, camera);
        if (settleCallback) {
          const cb = settleCallback;
          settleCallback = null;
          waitForGpu(cb);
        }
      }
    };
    rafId = requestAnimationFrame(animate);

    // Raycast click picking (only when pointer didn't drag)
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData?.sanctuaryId as string | undefined;
        if (hitId) {
          onSelectRef.current(hitId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth || 760;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    });
    resizeObserver.observe(container);

    sceneApiRef.current = {
      setCameraPreset: (p: CameraPreset) => {
        const cfg = PRESET_VIEWS[p];
        _targetPos.set(...cfg.pos);
        _targetLook.set(...cfg.target);
        flying = true;
        requestRender();
      },
      setCutaway: (open: boolean) => {
        roofGroup.visible = !open;
        requestRender();
      },
      highlightSelection: (id: string) => {
        positionSelectionHalo(id);
        requestRender();
      },
    };

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      sceneApiRef.current = null;
    };
  }, [atlasTheme]);

  useEffect(() => {
    sceneApiRef.current?.highlightSelection(selectedId);
  }, [selectedId]);

  const handlePreset = (p: CameraPreset) => {
    setPreset(p);
    sceneApiRef.current?.setCameraPreset(p);
  };

  const handleToggleCutaway = () => {
    const next = !cutawayOpen;
    setCutawayOpen(next);
    sceneApiRef.current?.setCutaway(next);
  };

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden">
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        aria-label="3D Wilderness Tabernacle scale model"
      />

      {/* Minimal top-right orientation badge (<= 2 lines, opaque background) */}
      <div className="absolute top-3 right-3 px-3 py-1.5 rounded bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] text-right pointer-events-none">
        <div className="text-[11px] font-medium text-[var(--atlas-heading)]">
          {selectedArticle.name}
        </div>
        <div className="text-[10px] font-mono text-[var(--atlas-text-muted)]">
          Click 3D vessel to inspect · East → West
        </div>
      </div>

      {/* Collapsible bottom dock (zero backdrop-filter over WebGL) */}
      <div className="absolute bottom-3 left-3 z-20 max-w-[92%]">
        {dockOpen ? (
          <div className="p-3 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] shadow-xl space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-muted)]">
                3D Camera &amp; Cutaway
              </span>
              <button
                type="button"
                onClick={() => setDockOpen(false)}
                className="p-0.5 text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]"
                aria-label="Collapse 3D controls"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(PRESET_VIEWS) as CameraPreset[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePreset(key)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                    preset === key
                      ? 'bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] font-semibold'
                      : 'bg-[var(--atlas-bg)] text-[var(--atlas-text-secondary)] border border-[var(--atlas-border)] hover:bg-[var(--atlas-elevated)]'
                  }`}
                >
                  {PRESET_VIEWS[key].label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-[var(--atlas-border)]">
              <button
                type="button"
                onClick={handleToggleCutaway}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border ${
                  cutawayOpen
                    ? 'bg-[var(--atlas-secondary)]/15 text-[var(--atlas-secondary-soft)] border-[var(--atlas-secondary)]/40'
                    : 'bg-[var(--atlas-bg)] text-[var(--atlas-text-muted)] border-[var(--atlas-border)]'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>{cutawayOpen ? 'Roof Cutaway: Open' : 'Roof Covering: Shown'}</span>
              </button>

              <button
                type="button"
                onClick={() => handlePreset('precinct')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-[var(--atlas-bg)] text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] border border-[var(--atlas-border)]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDockOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] text-xs font-medium text-[var(--atlas-text)] hover:bg-[var(--atlas-elevated)] shadow-lg"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
            <span>3D Controls</span>
            <ChevronUp className="w-3.5 h-3.5 text-[var(--atlas-text-muted)]" />
          </button>
        )}
      </div>
    </div>
  );
};
