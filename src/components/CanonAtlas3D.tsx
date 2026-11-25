import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BookOpen, ChevronDown, ChevronUp, GitFork, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { loadCanonIndex, loadTskCanonHead } from '../services/scriptureService';
import {
  AtlasTheme,
  CanonBookIndex,
  CanonDivision,
  CanonHeadGraph,
  CanonIndex,
  VerseId,
} from '../types/scripture';

interface CanonAtlas3DProps {
  mode: 'canon_arc' | 'canon_ring';
  atlasTheme: AtlasTheme;
  selectedVerseId: VerseId;
  onOpenBookInGraph: (verseId: VerseId) => void;
  onOpenBookInReader: (bookId: string, chapter: number, verseId: VerseId) => void;
}

type TestamentFilter3D = 'all' | 'cross' | 'OT' | 'NT';
type ArcColorMode = 'division' | 'distance';

interface BookPlacement {
  book: CanonBookIndex;
  center: THREE.Vector3;
  tangentAngle: number;
  arcSpan: number;
}

const DIVISION_HEX: Record<CanonDivision, number> = {
  Pentateuch: 0xd4894a,
  History: 0xc27a44,
  'Wisdom & Poetry': 0xe5a94c,
  'Major Prophets': 0xc86d32,
  'Minor Prophets': 0xb05f37,
  Gospels: 0x4ec498,
  Acts: 0x67b7d1,
  'Pauline Epistles': 0x7aa2f7,
  'General Epistles': 0x9b8ce8,
  Apocalyptic: 0xc48fdb,
};

const DIVISION_HEX_LIGHT: Record<CanonDivision, number> = {
  Pentateuch: 0x9a481e,
  History: 0x85431c,
  'Wisdom & Poetry': 0x9f6416,
  'Major Prophets': 0x8a3a18,
  'Minor Prophets': 0x73321d,
  Gospels: 0x1e7a65,
  Acts: 0x1d667f,
  'Pauline Epistles': 0x2f5396,
  'General Epistles': 0x57439c,
  Apocalyptic: 0x783992,
};

const FEATURED_BOOK_ANCHORS: Record<string, VerseId> = {
  GEN: 'GEN.1.1',
  EXO: 'EXO.25.8',
  LEV: 'LEV.16.15',
  PSA: 'PSA.23.1',
  ISA: 'ISA.53.5',
  DAN: 'DAN.7.13',
  MAT: 'MAT.5.17',
  JHN: 'JHN.3.16',
  ACT: 'ACT.2.17',
  ROM: 'ROM.3.24',
  HEB: 'HEB.8.5',
  REV: 'REV.21.1',
};

// Reusable math objects (zero per-frame allocations)
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecCtrl = new THREE.Vector3();
const _vecPt = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _colA = new THREE.Color();
const _colB = new THREE.Color();
const _targetCamPos = new THREE.Vector3();
const _targetCtrlPos = new THREE.Vector3();

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

function createDialFloorTexture(
  mode: 'canon_arc' | 'canon_ring',
  theme: AtlasTheme,
  maxAniso: number
): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const isLight = theme === 'light';
  ctx.fillStyle = isLight ? '#EFECE5' : '#0E1013';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  ctx.strokeStyle = isLight ? 'rgba(45, 38, 30, 0.08)' : 'rgba(214, 206, 190, 0.07)';
  ctx.lineWidth = 1.5;

  if (mode === 'canon_ring') {
    for (const r of [140, 220, 300, 380, 445]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 66; i++) {
      const ang = (i / 66) * Math.PI * 2;
      const inner = i % 5 === 0 ? 355 : 372;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
      ctx.lineTo(cx + Math.cos(ang) * 405, cy + Math.sin(ang) * 405);
      ctx.stroke();
    }
  } else {
    const step = 48;
    for (let p = step; p < size; p += step) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
    }
    ctx.strokeStyle = isLight ? 'rgba(154, 72, 30, 0.25)' : 'rgba(212, 137, 74, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, cy);
    ctx.lineTo(size - 40, cy);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, maxAniso);
  tex.needsUpdate = true;
  return tex;
}

function getVersePosition3D(
  verseIdx: number,
  canon: CanonIndex,
  mode: 'canon_arc' | 'canon_ring',
  out: THREE.Vector3
): THREE.Vector3 {
  const otBooks = canon.books.slice(0, 39);
  const otVerses = otBooks.reduce((sum, b) => sum + b.verseCount, 0);
  const total = Math.max(1, canon.totalVerses);
  const clamped = Math.max(0, Math.min(total - 1, verseIdx));

  if (mode === 'canon_arc') {
    const gapHalf = 1.6;
    const totalHalfSpan = 30.0;
    if (clamped < otVerses) {
      const t = clamped / Math.max(1, otVerses - 1);
      const x = -totalHalfSpan + t * (totalHalfSpan - gapHalf);
      out.set(x, 0.55, 0);
    } else {
      const ntVerses = Math.max(1, total - otVerses);
      const t = (clamped - otVerses) / Math.max(1, ntVerses - 1);
      const x = gapHalf + t * (totalHalfSpan - gapHalf);
      out.set(x, 0.55, 0);
    }
    return out;
  }

  // Canon Ring mode: 360 deg on XZ plane with clean OT/NT boundary gap
  const gapRad = 0.14;
  const otRatio = otVerses / total;
  const usable = Math.PI * 2 - gapRad * 2;
  const otArc = usable * otRatio;
  const ntArc = usable - otArc;
  const startAngle = -Math.PI / 2 + gapRad * 0.5;
  const radius = 17.5;

  let theta: number;
  if (clamped < otVerses) {
    const t = clamped / Math.max(1, otVerses - 1);
    theta = startAngle + t * otArc;
  } else {
    const ntVerses = Math.max(1, total - otVerses);
    const t = (clamped - otVerses) / Math.max(1, ntVerses - 1);
    theta = startAngle + otArc + gapRad + t * ntArc;
  }

  out.set(Math.cos(theta) * radius, 0.55, Math.sin(theta) * radius);
  return out;
}

function getBookPlacements(canon: CanonIndex, mode: 'canon_arc' | 'canon_ring'): BookPlacement[] {
  const pStart = new THREE.Vector3();
  const pEnd = new THREE.Vector3();
  return canon.books.map((book) => {
    const v0 = book.firstVerseIdx;
    const v1 = Math.min(canon.totalVerses - 1, book.firstVerseIdx + Math.max(0, book.verseCount - 1));
    getVersePosition3D(v0, canon, mode, pStart);
    getVersePosition3D(v1, canon, mode, pEnd);
    const center = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
    const tangentAngle = mode === 'canon_ring' ? Math.atan2(center.z, center.x) : 0;
    const arcSpan = Math.max(0.28, pStart.distanceTo(pEnd));
    return { book, center, tangentAngle, arcSpan };
  });
}

function findBookAtVerseIndex(verseIdx: number, books: CanonBookIndex[]): CanonBookIndex {
  let lo = 0;
  let hi = books.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const b = books[mid];
    if (verseIdx < b.firstVerseIdx) {
      hi = mid - 1;
    } else if (verseIdx >= b.firstVerseIdx + b.verseCount) {
      lo = mid + 1;
    } else {
      return b;
    }
  }
  return books[0];
}

function createExtrudedRailMesh(
  lengthX: number,
  widthZ: number,
  heightY: number,
  material: THREE.Material
): THREE.Mesh {
  const shape = new THREE.Shape();
  const hw = widthZ / 2;
  const hh = heightY / 2;
  shape.moveTo(-hw, -hh);
  shape.lineTo(hw, -hh);
  shape.lineTo(hw * 0.86, hh);
  shape.lineTo(-hw * 0.86, hh);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: lengthX,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  geo.rotateY(Math.PI / 2);
  geo.translate(-lengthX / 2, 0, 0);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createPillarGroup(
  bronzeMat: THREE.Material,
  goldMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();

  // 1. Stepped plinth base
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 0.95), bronzeMat);
  plinth.position.y = 0.12;
  g.add(plinth);

  // 2. Turned Lathe shaft collar & column
  const profile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.32, 0.0),
    new THREE.Vector2(0.24, 0.18),
    new THREE.Vector2(0.18, 0.95),
    new THREE.Vector2(0.25, 1.08),
    new THREE.Vector2(0.14, 1.24),
    new THREE.Vector2(0.0, 1.32),
  ];
  const latheGeo = new THREE.LatheGeometry(profile, 16);
  const shaft = new THREE.Mesh(latheGeo, bronzeMat);
  shaft.position.y = 0.24;
  g.add(shaft);

  // 3. Finial crown accent
  const crown = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), goldMat);
  crown.position.y = 1.66;
  g.add(crown);

  return g;
}

export const CanonAtlas3D: React.FC<CanonAtlas3DProps> = ({
  mode,
  atlasTheme,
  selectedVerseId,
  onOpenBookInGraph,
  onOpenBookInReader,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const [canonIndex, setCanonIndex] = useState<CanonIndex | null>(null);
  const [canonHead, setCanonHead] = useState<CanonHeadGraph | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const [testamentFilter, setTestamentFilter] = useState<TestamentFilter3D>('all');
  const [colorMode, setColorMode] = useState<ArcColorMode>('division');
  const [maxArcs, setMaxArcs] = useState<number>(18000);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(() => {
    const bid = selectedVerseId.split('.')[0];
    return bid || null;
  });
  const [hoveredBook, setHoveredBook] = useState<{
    book: CanonBookIndex;
    x: number;
    y: number;
  } | null>(null);
  const [renderedArcCount, setRenderedArcCount] = useState<number>(0);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  // Keyboard shortcut 'H' to toggle dock (Zen mode)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'h' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLSelectElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Load dataset asynchronously once
  useEffect(() => {
    let active = true;
    Promise.all([loadCanonIndex(), loadTskCanonHead()])
      .then(([idx, head]) => {
        if (!active) return;
        setCanonIndex(idx);
        setCanonHead(head);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load 3D Canon datasets.');
      });
    return () => {
      active = false;
    };
  }, []);

  // Scene refs preserved across prop/filter updates
  const sceneBundleRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    stageGroup: THREE.Group;
    arcsObject: THREE.LineSegments | null;
    pylonsMesh: THREE.InstancedMesh | null;
    bookPlacements: BookPlacement[];
    floorTex: THREE.CanvasTexture | null;
    isSoftwareGl: boolean;
    transitioning: boolean;
    requestRender: () => void;
    disposeStage: () => void;
  } | null>(null);

  const selectedBookIdRef = useRef(selectedBookId);
  selectedBookIdRef.current = selectedBookId;

  const hoverBookRef = useRef<string | null>(null);

  // Initialize Three.js WebGL context ONCE inside dedicated container
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = Math.max(320, container.clientWidth);
    const height = Math.max(240, container.clientHeight);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgHex = atlasTheme === 'light' ? 0xf4efe6 : 0x0d0e10;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.0095);

    // Procedural Studio Environment Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Warm key light + cool sky/ground HemisphereLight + rim light
    const hemiLight = new THREE.HemisphereLight(0xcbe0f5, 0x2c221b, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe6c7, 1.35);
    keyLight.position.set(22, 34, 24);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.camera.left = -35;
    keyLight.shadow.camera.right = 35;
    keyLight.shadow.camera.top = 35;
    keyLight.shadow.camera.bottom = -35;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x67b7d1, 0.45);
    rimLight.position.set(-24, 18, -22);
    scene.add(rimLight);

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.25, 260);
    camera.position.set(0, 20, 40);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 8;
    controls.maxDistance = 95;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 3.5, 0);

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // On-demand render scheduler with afterDraw pacing for software WebGL
    let frameId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
    let lastClockMs = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function requestRender() {
      if (disposed || renderBusy) {
        if (renderBusy) renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const now = performance.now();
        const delta = Math.min(0.1, (now - lastClockMs) / 1000);
        lastClockMs = now;

        const bundle = sceneBundleRef.current;
        if (bundle && bundle.transitioning) {
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 6, delta);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 6, delta);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 6, delta);
          controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetCtrlPos.x, 6, delta);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetCtrlPos.y, 6, delta);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetCtrlPos.z, 6, delta);
          if (
            camera.position.distanceTo(_targetCamPos) < 0.05 &&
            controls.target.distanceTo(_targetCtrlPos) < 0.05
          ) {
            bundle.transitioning = false;
          } else {
            renderDirty = true;
          }
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty && !disposed) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    const handleControlStart = () => {
      if (sceneBundleRef.current) {
        sceneBundleRef.current.transitioning = false;
      }
    };
    const handleControlChange = () => {
      requestRender();
    };
    controls.addEventListener('start', handleControlStart);
    controls.addEventListener('change', handleControlChange);

    // Raycasting on pointer move (throttled) and click (layer 1: book pylons)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNdc = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let lastMoveTime = 0;

    const updateNdc = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      return rect;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastMoveTime < 45) return;
      lastMoveTime = now;
      const bundle = sceneBundleRef.current;
      if (!bundle || !bundle.pylonsMesh) return;

      const rect = updateNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObject(bundle.pylonsMesh, false);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const placement = bundle.bookPlacements[hits[0].instanceId];
        if (placement) {
          renderer.domElement.style.cursor = 'pointer';
          hoverBookRef.current = placement.book.id;
          setHoveredBook({
            book: placement.book,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          return;
        }
      }
      if (hoverBookRef.current !== null) {
        hoverBookRef.current = null;
        renderer.domElement.style.cursor = 'grab';
        setHoveredBook(null);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return; // Ignore orbit drags
      const bundle = sceneBundleRef.current;
      if (!bundle || !bundle.pylonsMesh) return;
      updateNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObject(bundle.pylonsMesh, false);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const placement = bundle.bookPlacements[hits[0].instanceId];
        if (placement) {
          setSelectedBookId((prev) => (prev === placement.book.id ? null : placement.book.id));
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
      requestRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const resizeObserver = new ResizeObserver(() => {
      if (disposed || !container) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(240, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    });
    resizeObserver.observe(container);

    const disposeStage = () => {
      while (stageGroup.children.length > 0) {
        const child = stageGroup.children[0];
        stageGroup.remove(child);
        child.traverse((obj) => {
          if ((obj as THREE.Mesh).geometry) {
            (obj as THREE.Mesh).geometry.dispose();
          }
          const mat = (obj as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else if (mat) {
            mat.dispose();
          }
        });
      }
      if (sceneBundleRef.current?.floorTex) {
        sceneBundleRef.current.floorTex.dispose();
        sceneBundleRef.current.floorTex = null;
      }
      if (sceneBundleRef.current) {
        sceneBundleRef.current.arcsObject = null;
        sceneBundleRef.current.pylonsMesh = null;
      }
    };

    sceneBundleRef.current = {
      scene,
      camera,
      renderer,
      controls,
      stageGroup,
      arcsObject: null,
      pylonsMesh: null,
      bookPlacements: [],
      floorTex: null,
      isSoftwareGl,
      transitioning: false,
      requestRender,
      disposeStage,
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', handleControlStart);
      controls.removeEventListener('change', handleControlChange);
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      disposeStage();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneBundleRef.current = null;
    };
  }, []);

  // Build / rebuild static architectural pedestal + book pylons when canonIndex, mode, or atlasTheme updates
  useEffect(() => {
    const bundle = sceneBundleRef.current;
    if (!bundle || !canonIndex) return;

    const { scene, stageGroup, renderer, requestRender, disposeStage } = bundle;
    const isLight = atlasTheme === 'light';
    const bgHex = isLight ? 0xf4efe6 : 0x0d0e10;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.0095);

    disposeStage();

    // Floor datum disc / slab with high-anisotropy procedural CanvasTexture
    const floorTex = createDialFloorTexture(
      mode,
      atlasTheme,
      renderer.capabilities.getMaxAnisotropy()
    );
    bundle.floorTex = floorTex;

    const floorGeo =
      mode === 'canon_ring'
        ? new THREE.CylinderGeometry(24, 24.4, 0.35, 64)
        : new THREE.BoxGeometry(66, 0.35, 22);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.85,
      metalness: 0.12,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.22;
    floorMesh.receiveShadow = true;
    stageGroup.add(floorMesh);

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x6e5b49 : 0x3b3530,
      metalness: 0.82,
      roughness: 0.36,
    });
    const brassMat = new THREE.MeshPhysicalMaterial({
      color: isLight ? 0x9a481e : 0xd4894a,
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 0.35,
    });

    if (mode === 'canon_arc') {
      // Twin bevelled linear rails for OT and NT + central covenantal pillars
      const otRail = createExtrudedRailMesh(28.8, 0.8, 0.24, bronzeMat);
      otRail.position.set(-15.8, 0.12, 0);
      stageGroup.add(otRail);

      const ntRail = createExtrudedRailMesh(28.8, 0.8, 0.24, bronzeMat);
      ntRail.position.set(15.8, 0.12, 0);
      stageGroup.add(ntRail);

      const leftPillar = createPillarGroup(bronzeMat, brassMat);
      leftPillar.position.set(-1.1, 0, 0);
      stageGroup.add(leftPillar);

      const rightPillar = createPillarGroup(bronzeMat, brassMat);
      rightPillar.position.set(1.1, 0, 0);
      stageGroup.add(rightPillar);
    } else {
      // Stepped architectural sanctuary ring pedestal + cardinal covenantal pillars
      const ringGeo = new THREE.TorusGeometry(17.5, 0.26, 12, 96);
      ringGeo.rotateX(Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeo, bronzeMat);
      ringMesh.position.y = 0.12;
      ringMesh.receiveShadow = true;
      stageGroup.add(ringMesh);

      const outerBevelGeo = new THREE.TorusGeometry(18.6, 0.14, 10, 96);
      outerBevelGeo.rotateX(Math.PI / 2);
      const outerBevel = new THREE.Mesh(outerBevelGeo, brassMat);
      outerBevel.position.y = 0.04;
      stageGroup.add(outerBevel);

      const dividerAngles = [-Math.PI / 2, Math.PI * 0.99];
      for (const ang of dividerAngles) {
        const p = createPillarGroup(bronzeMat, brassMat);
        p.position.set(Math.cos(ang) * 18.6, 0, Math.sin(ang) * 18.6);
        stageGroup.add(p);
      }
    }

    // InstancedMesh for all 66 canonical book markers (Layer 1 for raycasting)
    const placements = getBookPlacements(canonIndex, mode);
    bundle.bookPlacements = placements;

    const pylonGeo = new THREE.BoxGeometry(1, 1, 1);
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.42,
      metalness: 0.35,
    });
    const pylonsMesh = new THREE.InstancedMesh(pylonGeo, pylonMat, placements.length);
    pylonsMesh.layers.set(1);
    pylonsMesh.castShadow = true;
    pylonsMesh.receiveShadow = true;

    const paletteMap = isLight ? DIVISION_HEX_LIGHT : DIVISION_HEX;
    placements.forEach((p, idx) => {
      const bookHeight = 0.45 + Math.min(1.65, Math.sqrt(p.book.verseCount / 2502) * 1.65);
      const lenX = mode === 'canon_arc' ? Math.max(0.26, p.arcSpan * 0.88) : 0.42;
      const widZ = mode === 'canon_ring' ? Math.max(0.32, p.arcSpan * 0.86) : 0.92;

      _vecA.set(p.center.x, 0.25 + bookHeight * 0.5, p.center.z);
      _quat.setFromAxisAngle(_upAxis, -p.tangentAngle);
      _scale.set(lenX, bookHeight, widZ);
      _mat4.compose(_vecA, _quat, _scale);
      pylonsMesh.setMatrixAt(idx, _mat4);

      _colA.setHex(paletteMap[p.book.division]);
      pylonsMesh.setColorAt(idx, _colA);
    });

    pylonsMesh.instanceMatrix.needsUpdate = true;
    if (pylonsMesh.instanceColor) pylonsMesh.instanceColor.needsUpdate = true;
    pylonsMesh.computeBoundingSphere();

    stageGroup.add(pylonsMesh);
    bundle.pylonsMesh = pylonsMesh;

    // Smooth camera preset transition when mode switches
    if (mode === 'canon_arc') {
      _targetCamPos.set(0, 18, 42);
      _targetCtrlPos.set(0, 4.2, 0);
    } else {
      _targetCamPos.set(0, 26, 33);
      _targetCtrlPos.set(0, 2.5, 0);
    }
    bundle.transitioning = !bundle.isSoftwareGl;
    if (bundle.isSoftwareGl) {
      bundle.camera.position.copy(_targetCamPos);
      bundle.controls.target.copy(_targetCtrlPos);
    }
    requestRender();
  }, [canonIndex, mode, atlasTheme]);

  // Update book pylon colors when selection changes
  useEffect(() => {
    const bundle = sceneBundleRef.current;
    if (!bundle || !bundle.pylonsMesh || bundle.bookPlacements.length === 0) return;

    const isLight = atlasTheme === 'light';
    const paletteMap = isLight ? DIVISION_HEX_LIGHT : DIVISION_HEX;
    bundle.bookPlacements.forEach((p, idx) => {
      if (selectedBookId) {
        if (p.book.id === selectedBookId) {
          _colA.setHex(isLight ? 0x1f1b17 : 0xf4cfa4);
        } else {
          _colA.setHex(paletteMap[p.book.division]).multiplyScalar(0.38);
        }
      } else {
        _colA.setHex(paletteMap[p.book.division]);
      }
      bundle.pylonsMesh!.setColorAt(idx, _colA);
    });
    if (bundle.pylonsMesh.instanceColor) {
      bundle.pylonsMesh.instanceColor.needsUpdate = true;
    }
    bundle.requestRender();
  }, [selectedBookId, atlasTheme, canonIndex, mode]);

  // Build / rebuild batched Three.LineSegments for up to 30,000 TSK arcs
  useEffect(() => {
    const bundle = sceneBundleRef.current;
    if (!bundle || !canonIndex || !canonHead) return;

    const { stageGroup, requestRender } = bundle;

    // Clean up previous arc geometry
    if (bundle.arcsObject) {
      stageGroup.remove(bundle.arcsObject);
      bundle.arcsObject.geometry.dispose();
      (bundle.arcsObject.material as THREE.Material).dispose();
      bundle.arcsObject = null;
    }

    const otVerses = canonIndex.books
      .slice(0, 39)
      .reduce((sum, b) => sum + b.verseCount, 0);
    const focusedBook = selectedBookId
      ? canonIndex.books.find((b) => b.id === selectedBookId)
      : undefined;

    const limit = Math.min(maxArcs, canonHead.headCount);
    const SEGMENTS = 10;
    const isLight = atlasTheme === 'light';
    const paletteMap = isLight ? DIVISION_HEX_LIGHT : DIVISION_HEX;

    // Pre-pass filter indices
    const chosenIndices: number[] = [];
    for (let i = 0; i < limit; i++) {
      const fIdx = canonHead.from[i];
      const tIdx = canonHead.to[i];
      const fOT = fIdx < otVerses;
      const tOT = tIdx < otVerses;

      if (testamentFilter === 'OT' && (!fOT || !tOT)) continue;
      if (testamentFilter === 'NT' && (fOT || tOT)) continue;
      if (testamentFilter === 'cross' && fOT === tOT) continue;

      if (focusedBook) {
        const endIdx = focusedBook.firstVerseIdx + focusedBook.verseCount;
        const hitsF = fIdx >= focusedBook.firstVerseIdx && fIdx < endIdx;
        const hitsT = tIdx >= focusedBook.firstVerseIdx && tIdx < endIdx;
        if (!hitsF && !hitsT) continue;
      }
      chosenIndices.push(i);
    }

    setRenderedArcCount(chosenIndices.length);

    if (chosenIndices.length === 0) {
      requestRender();
      return;
    }

    const totalVertices = chosenIndices.length * SEGMENTS * 2;
    const positions = new Float32Array(totalVertices * 3);
    const colors = new Float32Array(totalVertices * 3);
    const totalCanon = Math.max(1, canonIndex.totalVerses);

    let ptr = 0;
    for (let k = 0; k < chosenIndices.length; k++) {
      const edgeIdx = chosenIndices[k];
      const fIdx = canonHead.from[edgeIdx];
      const tIdx = canonHead.to[edgeIdx];

      getVersePosition3D(fIdx, canonIndex, mode, _vecA);
      getVersePosition3D(tIdx, canonIndex, mode, _vecB);

      const spanRatio = Math.abs(fIdx - tIdx) / totalCanon;
      if (mode === 'canon_arc') {
        const apexY = 1.6 + Math.pow(spanRatio, 0.7) * 21.0;
        const zSweep = ((k % 17) - 8) * 0.45 * Math.sin(spanRatio * Math.PI);
        _vecCtrl.set(
          (_vecA.x + _vecB.x) * 0.5,
          apexY,
          zSweep
        );
      } else {
        const chordDist = _vecA.distanceTo(_vecB);
        const apexY = 1.2 + chordDist * 0.44;
        _vecCtrl.set(
          (_vecA.x + _vecB.x) * 0.35,
          apexY,
          (_vecA.z + _vecB.z) * 0.35
        );
      }

      if (colorMode === 'division') {
        const bA = findBookAtVerseIndex(fIdx, canonIndex.books);
        const bB = findBookAtVerseIndex(tIdx, canonIndex.books);
        _colA.setHex(paletteMap[bA.division]);
        _colB.setHex(paletteMap[bB.division]);
      } else {
        // Canonical distance spectrum: short local (cool celadon) -> medium (gold) -> cross-canon (violet)
        if (spanRatio < 0.12) {
          _colA.setHex(isLight ? 0x1e7a65 : 0x4ec498);
          _colB.copy(_colA);
        } else if (spanRatio < 0.48) {
          _colA.setHex(isLight ? 0x9a481e : 0xd4894a);
          _colB.copy(_colA);
        } else {
          _colA.setHex(isLight ? 0x783992 : 0xc48fdb);
          _colB.setHex(isLight ? 0x1e7a65 : 0x4ec498);
        }
      }

      for (let s = 0; s < SEGMENTS; s++) {
        const t0 = s / SEGMENTS;
        const t1 = (s + 1) / SEGMENTS;

        // Point 0 on Quadratic Bezier
        const u0 = 1 - t0;
        positions[ptr] = u0 * u0 * _vecA.x + 2 * u0 * t0 * _vecCtrl.x + t0 * t0 * _vecB.x;
        positions[ptr + 1] = u0 * u0 * _vecA.y + 2 * u0 * t0 * _vecCtrl.y + t0 * t0 * _vecB.y;
        positions[ptr + 2] = u0 * u0 * _vecA.z + 2 * u0 * t0 * _vecCtrl.z + t0 * t0 * _vecB.z;

        colors[ptr] = THREE.MathUtils.lerp(_colA.r, _colB.r, t0);
        colors[ptr + 1] = THREE.MathUtils.lerp(_colA.g, _colB.g, t0);
        colors[ptr + 2] = THREE.MathUtils.lerp(_colA.b, _colB.b, t0);

        // Point 1 on Quadratic Bezier
        const u1 = 1 - t1;
        positions[ptr + 3] = u1 * u1 * _vecA.x + 2 * u1 * t1 * _vecCtrl.x + t1 * t1 * _vecB.x;
        positions[ptr + 4] = u1 * u1 * _vecA.y + 2 * u1 * t1 * _vecCtrl.y + t1 * t1 * _vecB.y;
        positions[ptr + 5] = u1 * u1 * _vecA.z + 2 * u1 * t1 * _vecCtrl.z + t1 * t1 * _vecB.z;

        colors[ptr + 3] = THREE.MathUtils.lerp(_colA.r, _colB.r, t1);
        colors[ptr + 4] = THREE.MathUtils.lerp(_colA.g, _colB.g, t1);
        colors[ptr + 5] = THREE.MathUtils.lerp(_colA.b, _colB.b, t1);

        ptr += 6;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: focusedBook
        ? isLight
          ? 0.56
          : 0.48
        : isLight
        ? Math.max(0.14, 0.34 - (chosenIndices.length / 30000) * 0.18)
        : Math.max(0.12, 0.3 - (chosenIndices.length / 30000) * 0.16),
      depthWrite: false,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
    });

    const lineSegments = new THREE.LineSegments(geometry, material);
    lineSegments.frustumCulled = true;
    stageGroup.add(lineSegments);
    bundle.arcsObject = lineSegments;

    requestRender();
  }, [canonIndex, canonHead, mode, testamentFilter, colorMode, maxArcs, selectedBookId, atlasTheme]);

  const selectedBook = useMemo(
    () => canonIndex?.books.find((b) => b.id === selectedBookId) ?? null,
    [canonIndex, selectedBookId]
  );

  const handleResetCamera = () => {
    const bundle = sceneBundleRef.current;
    if (!bundle) return;
    if (mode === 'canon_arc') {
      _targetCamPos.set(0, 18, 42);
      _targetCtrlPos.set(0, 4.2, 0);
    } else {
      _targetCamPos.set(0, 26, 33);
      _targetCtrlPos.set(0, 2.5, 0);
    }
    if (bundle.isSoftwareGl) {
      bundle.camera.position.copy(_targetCamPos);
      bundle.controls.target.copy(_targetCtrlPos);
    } else {
      bundle.transitioning = true;
    }
    bundle.requestRender();
  };

  return (
    <div className="relative flex-1 h-full overflow-hidden bg-[var(--atlas-bg)] select-none">
      {/* Dedicated Isolated WebGL Canvas Container (zero backdrop-filter over canvas) */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D Canon Cross-Reference Atlas"
      />

      {/* Minimal Top-Left Spec Badge */}
      <div className="absolute top-14 left-3 z-20 pointer-events-none">
        <div className="px-3 py-1.5 rounded-md bg-[var(--atlas-surface)]/92 border border-[var(--atlas-border-strong)] text-[11px] space-y-0.5">
          <div className="font-semibold text-[var(--atlas-heading)] tracking-wide">
            {mode === 'canon_arc' ? '3D Canon Arc Topology' : '3D Canon Ring Sanctuary'}
          </div>
          <div className="font-mono text-[10.5px] tabular-nums text-[var(--atlas-text-muted)]">
            {canonIndex ? `${canonIndex.books.length} books · ${canonIndex.totalVerses.toLocaleString()} verses` : 'Indexing canon...'}
            {' · '}
            {renderedArcCount.toLocaleString()} / {canonHead ? canonHead.totalCount.toLocaleString() : '344,753'} TSK arcs
          </div>
        </div>
      </div>

      {/* Hover Tooltip near Cursor */}
      {hoveredBook && (
        <div
          className="absolute z-30 pointer-events-none px-2.5 py-1.5 rounded bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] shadow-lg text-xs"
          style={{
            left: Math.min(hoveredBook.x + 14, (mountRef.current?.clientWidth ?? 600) - 180),
            top: Math.max(12, hoveredBook.y - 44),
          }}
        >
          <div className="font-semibold text-[var(--atlas-heading)]">
            {hoveredBook.book.name}
          </div>
          <div className="text-[10.5px] font-mono text-[var(--atlas-text-muted)]">
            {hoveredBook.book.division} · {hoveredBook.book.chapterVerseCounts.length} ch ·{' '}
            {hoveredBook.book.verseCount.toLocaleString()} v
          </div>
        </div>
      )}

      {/* Load or WebGL Error Fallback */}
      {(loadError || contextLost) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--atlas-bg)]/90 p-6">
          <div className="max-w-md p-4 rounded-md bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] text-center space-y-2">
            <div className="text-sm font-semibold text-[var(--atlas-heading)]">
              {contextLost ? 'WebGL Context Paused' : '3D Atlas Dataset Unavailable'}
            </div>
            <p className="text-xs text-[var(--atlas-text-muted)]">
              {loadError ?? 'The graphics context was temporarily interrupted. Switch to 2D Ego Graph or reset the camera.'}
            </p>
          </div>
        </div>
      )}

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-25 w-[94vw] max-w-[920px] flex flex-col items-center pointer-events-none">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-t-md bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] text-[11px] font-medium text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-heading)] shadow-md"
          title="Toggle controls (H)"
        >
          <SlidersHorizontal className="w-3 h-3 text-[var(--atlas-accent)]" />
          <span>{dockCollapsed ? 'Show Canon Controls (H)' : 'Hide Controls'}</span>
          {dockCollapsed ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto w-full p-3 rounded-lg bg-[var(--atlas-surface)] border border-[var(--atlas-border-strong)] shadow-2xl space-y-2.5">
            {/* Selected Book Action Strip (when a book is clicked/chosen) */}
            {selectedBook && (
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--atlas-border)]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-[var(--atlas-heading)] truncate">
                    {selectedBook.name}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--atlas-text-muted)]">
                    {selectedBook.division} · {selectedBook.chapterVerseCounts.length} ch ·{' '}
                    {selectedBook.verseCount.toLocaleString()} v
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenBookInReader(selectedBook.id, 1, `${selectedBook.id}.1.1`)
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border-strong)] text-[11px] font-medium text-[var(--atlas-text)]"
                  >
                    <BookOpen className="w-3 h-3 text-[var(--atlas-secondary)]" />
                    <span>Open in Reader</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenBookInGraph(
                        FEATURED_BOOK_ANCHORS[selectedBook.id] ?? `${selectedBook.id}.1.1`
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-[11px] font-semibold hover:bg-[var(--atlas-accent-hover)]"
                  >
                    <GitFork className="w-3 h-3" />
                    <span>Anchor in 2D Graph</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBookId(null)}
                    className="px-2 py-1 rounded text-[11px] text-[var(--atlas-text-muted)] hover:text-[var(--atlas-heading)]"
                  >
                    All Books
                  </button>
                </div>
              </div>
            )}

            {/* Main Unified Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Testament Scope */}
              <div className="inline-flex items-center p-0.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)]">
                {(
                  [
                    { id: 'all', label: 'All Canon' },
                    { id: 'cross', label: 'OT ↔ NT' },
                    { id: 'OT', label: 'OT Only' },
                    { id: 'NT', label: 'NT Only' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTestamentFilter(opt.id)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                      testamentFilter === opt.id
                        ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                        : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Color Coding */}
              <div className="inline-flex items-center p-0.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)]">
                {(
                  [
                    { id: 'division', label: 'By Division' },
                    { id: 'distance', label: 'By Span Distance' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setColorMode(opt.id)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                      colorMode === opt.id
                        ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-secondary-soft)]'
                        : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Arc Density Slider */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="canon-3d-density"
                  className="text-[11px] text-[var(--atlas-text-muted)] whitespace-nowrap"
                >
                  Arcs
                </label>
                <input
                  id="canon-3d-density"
                  type="range"
                  min={2000}
                  max={30000}
                  step={2000}
                  value={maxArcs}
                  onChange={(e) => setMaxArcs(parseInt(e.target.value, 10))}
                  className="w-24 accent-[var(--atlas-accent)]"
                />
                <span className="font-mono text-[11px] tabular-nums text-[var(--atlas-text-secondary)] w-9">
                  {Math.round(maxArcs / 1000)}k
                </span>
              </div>

              {/* Book Filter + Camera Reset */}
              <div className="flex items-center gap-1.5">
                <select
                  aria-label="Filter arcs by biblical book"
                  value={selectedBookId ?? ''}
                  onChange={(e) => setSelectedBookId(e.target.value || null)}
                  className="h-7 px-2 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-[11px] text-[var(--atlas-text)] focus:outline-none focus:border-[var(--atlas-accent)]"
                >
                  <option value="">All 66 Books</option>
                  {canonIndex?.books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.order}. {b.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleResetCamera}
                  className="h-7 px-2.5 rounded bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border-strong)] text-[11px] text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-heading)] inline-flex items-center gap-1"
                  title="Reset 3D camera framing"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset Cam</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
