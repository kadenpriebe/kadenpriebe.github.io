'use client';

import React, { useState, useEffect, useCallback } from "react";

const COLORS = {
  bg: "#0a0a0f",
  card: "#12121a",
  cardBorder: "#1e1e2e",
  accent: "#6ee7b7",
  accentDim: "#6ee7b720",
  secondary: "#818cf8",
  secondaryDim: "#818cf820",
  warn: "#fbbf24",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  gridLine: "#1a1a2e",
};

type Vector2 = [number, number];
type Matrix2x2 = [Vector2, Vector2];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function matMul2x2(A: Matrix2x2, B: Matrix2x2): Matrix2x2 {
  return [
    [A[0][0]*B[0][0]+A[0][1]*B[1][0], A[0][0]*B[0][1]+A[0][1]*B[1][1]],
    [A[1][0]*B[0][0]+A[1][1]*B[1][0], A[1][1]*B[1][1]+A[1][1]*B[1][1]]
  ];
}

function transpose2x2(A: Matrix2x2): Matrix2x2 {
  return [[A[0][0], A[1][0]], [A[0][1], A[1][1]]];
}

function rotMatrix(theta: number): Matrix2x2 {
  const c = Math.cos(theta), s = Math.sin(theta);
  return [[c, -s], [s, c]];
}

function applyMat(M: Matrix2x2, v: Vector2): Vector2 {
  return [M[0][0]*v[0]+M[0][1]*v[1], M[1][0]*v[0]+M[1][1]*v[1]];
}

function computeCovariance(points: Vector2[]): Matrix2x2 {
  const n = points.length;
  if (n === 0) return [[0,0],[0,0]];
  const mx = points.reduce((s,p)=>s+p[0],0)/n;
  const my = points.reduce((s,p)=>s+p[1],0)/n;
  let s00=0,s01=0,s11=0;
  for (const p of points) {
    const dx=p[0]-mx, dy=p[1]-my;
    s00+=dx*dx; s01+=dx*dy; s11+=dy*dy;
  }
  return [[s00/n, s01/n],[s01/n, s11/n]];
}

function eigenDecomp2x2(S: Matrix2x2) {
  const a=S[0][0], b=S[0][1], d=S[1][1];
  const trace=a+d, det=a*d-b*b;
  const disc=Math.sqrt(Math.max(0, trace*trace/4-det));
  const l1=trace/2+disc, l2=trace/2-disc;
  let v1: Vector2, v2: Vector2;
  if (Math.abs(b) > 1e-10) {
    v1=[l1-d, b]; v2=[l2-d, b];
  } else if (Math.abs(a-d) > 1e-10) {
    v1=[1,0]; v2=[0,1];
    if (d > a) { v1=[0,1]; v2=[1,0]; }
  } else {
    v1=[1,0]; v2=[0,1];
  }
  const n1=Math.sqrt(v1[0]*v1[0]+v1[1]*v1[1]);
  const n2=Math.sqrt(v2[0]*v2[0]+v2[1]*v2[1]);
  v1=[v1[0]/n1, v1[1]/n1];
  v2=[v2[0]/n2, v2[1]/n2];
  return {values:[l1,l2], vectors:[v1,v2]};
}

const TABS = [
  { id: "covariance", label: "1. Covariance Matrix" },
  { id: "orthogonal", label: "2. Orthogonal Matrix" },
  { id: "together", label: "3. PCA + Transform" },
];

interface GridCanvasProps {
  width: number;
  height: number;
  scale: number;
  children: (toScreen: (x: number, y: number) => Vector2, cx: number, cy: number, scale: number) => React.ReactNode;
  label?: string;
}

function GridCanvas({ width, height, scale, children, label }: GridCanvasProps) {
  const cx=width/2, cy=height/2;
  const toScreen = (x: number, y: number): Vector2 => [cx+x*scale, cy-y*scale];
  const gridLines = [];
  const range = Math.ceil((width/2)/scale);
  for (let i=-range; i<=range; i++) {
    const [sx] = toScreen(i,0);
    const [,sy] = toScreen(0,i);
    gridLines.push(
      <line key={`v${i}`} x1={sx} y1={0} x2={sx} y2={height} stroke={COLORS.gridLine} strokeWidth={i===0?1.5:0.5}/>,
      <line key={`h${i}`} x1={0} y1={sy} x2={width} y2={sy} stroke={COLORS.gridLine} strokeWidth={i===0?1.5:0.5}/>
    );
  }
  return (
    <div style={{position:"relative"}}>
      {label && <div style={{position:"absolute",top:8,left:12,fontSize:11,color:COLORS.textDim,fontFamily:"'JetBrains Mono',monospace",zIndex:2}}>{label}</div>}
      <svg width={width} height={height} style={{background:COLORS.bg, borderRadius:8, border:`1px solid ${COLORS.cardBorder}`}}>
        {gridLines}
        {children(toScreen, cx, cy, scale)}
      </svg>
    </div>
  );
}

interface ArrowProps {
  from: Vector2;
  to: Vector2;
  color: string;
  width?: number;
  toScreen: (x: number, y: number) => Vector2;
}

function Arrow({ from, to, color, width=2, toScreen }: ArrowProps) {
  const [x1,y1] = toScreen(from[0],from[1]);
  const [x2,y2] = toScreen(to[0],to[1]);
  const angle = Math.atan2(y2-y1, x2-x1);
  const headLen = 10;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width}/>
      <polygon
        points={`${x2},${y2} ${x2-headLen*Math.cos(angle-0.4)},${y2-headLen*Math.sin(angle-0.4)} ${x2-headLen*Math.cos(angle+0.4)},${y2-headLen*Math.sin(angle+0.4)}`}
        fill={color}
      />
    </g>
  );
}

interface MatrixDisplayProps {
  matrix: Matrix2x2;
  label: string;
  color: string;
}

function MatrixDisplay({ matrix, label, color }: MatrixDisplayProps) {
  const fmt = (v: number) => v.toFixed(2);
  return (
    <div style={{display:"inline-block", margin:"0 8px", textAlign:"center"}}>
      <div style={{fontSize:11, color:COLORS.textDim, marginBottom:4, fontFamily:"'JetBrains Mono',monospace"}}>{label}</div>
      <div style={{
        display:"inline-grid", gridTemplateColumns:"1fr 1fr", gap:"2px 12px",
        padding:"8px 14px", borderRadius:6, border:`1px solid ${color}40`,
        background:`${color}10`, fontFamily:"'JetBrains Mono',monospace", fontSize:14, color
      }}>
        <span>{fmt(matrix[0][0])}</span><span>{fmt(matrix[0][1])}</span>
        <span>{fmt(matrix[1][0])}</span><span>{fmt(matrix[1][1])}</span>
      </div>
    </div>
  );
}

function CovarianceTab() {
  const [seed, setSeed] = useState(1);
  const [spread, setSpread] = useState(0.6);
  const [tilt, setTilt] = useState(0.5);

  const getPoints = useCallback((): Vector2[] => {
    const rng = (s: number) => { s=Math.sin(s)*43758.5453; return s-Math.floor(s); };
    const pts: Vector2[] = [];
    for (let i=0; i<40; i++) {
      const gx = (rng(seed*1000+i*7.1)-0.5)*2*2;
      const gy = (rng(seed*1000+i*13.3+99)-0.5)*2*spread;
      const rx = gx*Math.cos(tilt)-gy*Math.sin(tilt);
      const ry = gx*Math.sin(tilt)+gy*Math.cos(tilt);
      pts.push([rx, ry]);
    }
    return pts;
  }, [seed, spread, tilt]);

  const points = getPoints();
  const cov = computeCovariance(points);
  const eig = eigenDecomp2x2(cov);

  return (
    <div>
      <div style={{marginBottom:16, color:COLORS.text, lineHeight:1.7, fontSize:14}}>
        <p style={{margin:"0 0 8px"}}><strong style={{color:COLORS.accent}}>Covariance matrix</strong> captures the <em>shape</em> of your data cloud — how spread out it is in each direction and whether the directions are correlated (tilted).</p>
        <p style={{margin:0}}>The <span style={{color:COLORS.accent}}>green arrows</span> are the <strong>eigenvectors</strong> (principal components) — they point along the axes of the ellipse. Their lengths = <strong>eigenvalues</strong> (variances).</p>
      </div>

      <div style={{display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-start"}}>
        <GridCanvas width={360} height={360} scale={50} label="Data cloud + eigenvectors">
          {(toScreen) => (
            <g>
              {points.map((p,i) => {
                const [sx,sy]=toScreen(p[0],p[1]);
                return <circle key={i} cx={sx} cy={sy} r={3.5} fill={COLORS.secondary} opacity={0.7}/>;
              })}
              {eig.vectors.map((v,i) => {
                const len = Math.sqrt(eig.values[i])*1.5;
                return <Arrow key={i} from={[0,0]} to={[v[0]*len, v[1]*len]}
                  color={i===0?COLORS.accent:COLORS.warn} width={2.5} toScreen={toScreen}/>;
              })}
            </g>
          )}
        </GridCanvas>

        <div style={{flex:1, minWidth:200}}>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,color:COLORS.textDim,marginBottom:4}}>
              Spread (y-axis): {spread.toFixed(1)}
            </label>
            <input type="range" min={0.1} max={2} step={0.1} value={spread}
              onChange={e=>setSpread(+e.target.value)}
              style={{width:"100%", accentColor:COLORS.accent}}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,color:COLORS.textDim,marginBottom:4}}>
              Tilt angle: {(tilt/Math.PI*180).toFixed(0)}°
            </label>
            <input type="range" min={0} max={Math.PI} step={0.05} value={tilt}
              onChange={e=>setTilt(+e.target.value)}
              style={{width:"100%", accentColor:COLORS.accent}}/>
          </div>
          <div style={{marginBottom:16}}>
            <button onClick={()=>setSeed(s=>s+1)}
              style={{padding:"6px 16px",borderRadius:6,border:`1px solid ${COLORS.accent}40`,background:COLORS.accentDim,color:COLORS.accent,cursor:"pointer",fontSize:13}}>
              New random points
            </button>
          </div>

          <MatrixDisplay matrix={cov} label="Σ (covariance)" color={COLORS.secondary}/>

          <div style={{marginTop:12, fontSize:12, fontFamily:"'JetBrains Mono',monospace"}}>
            <div style={{color:COLORS.accent}}>λ₁ = {eig.values[0].toFixed(2)} &nbsp; v₁ = [{eig.vectors[0][0].toFixed(2)}, {eig.vectors[0][1].toFixed(2)}]</div>
            <div style={{color:COLORS.warn, marginTop:2}}>λ₂ = {eig.values[1].toFixed(2)} &nbsp; v₂ = [{eig.vectors[1][0].toFixed(2)}, {eig.vectors[1][1].toFixed(2)}]</div>
          </div>

          <div style={{marginTop:16, padding:12, borderRadius:6, background:`${COLORS.accent}08`, border:`1px solid ${COLORS.accent}20`, fontSize:13, color:COLORS.textDim, lineHeight:1.6}}>
            <strong style={{color:COLORS.accent}}>Try it:</strong> Drag the tilt slider and watch the off-diagonal entries of Σ change. When tilt = 0° or 90°, the off-diagonals are ≈ 0 (no correlation). When tilted, they grow (correlated directions).
          </div>
        </div>
      </div>
    </div>
  );
}

function OrthogonalTab() {
  const [theta, setTheta] = useState(0.5);

  const O = rotMatrix(theta);
  const OT = transpose2x2(O);
  // Correcting matMul2x2 usage for product OT * O
  const product: Matrix2x2 = [
    [OT[0][0]*O[0][0] + OT[0][1]*O[1][0], OT[0][0]*O[0][1] + OT[0][1]*O[1][1]],
    [OT[1][0]*O[0][0] + OT[1][1]*O[1][0], OT[1][0]*O[0][1] + OT[1][1]*O[1][1]]
  ];

  const unitVecs: Vector2[] = [[1,0],[0,1]];
  const transformed = unitVecs.map(v => applyMat(O, v));

  return (
    <div>
      <div style={{marginBottom:16, color:COLORS.text, lineHeight:1.7, fontSize:14}}>
        <p style={{margin:"0 0 8px"}}><strong style={{color:COLORS.secondary}}>Orthogonal matrix O</strong> rotates (or reflects) vectors without stretching or squishing them. The key property: <strong>O⊤O = I</strong> (identity).</p>
        <p style={{margin:0}}>This means: lengths are preserved, angles are preserved, and O⊤ undoes what O does (O⊤ = O⁻¹).</p>
      </div>

      <div style={{display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-start"}}>
        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          <GridCanvas width={280} height={280} scale={80} label="Original basis">
            {(toScreen) => (
              <g>
                <Arrow from={[0,0]} to={unitVecs[0]} color={COLORS.accent} width={3} toScreen={toScreen}/>
                <Arrow from={[0,0]} to={unitVecs[1]} color={COLORS.warn} width={3} toScreen={toScreen}/>
                {(() => { const [sx,sy]=toScreen(unitVecs[0][0],unitVecs[0][1]); return <text key="e1" x={sx+8} y={sy-5} fill={COLORS.accent} fontSize={13} fontFamily="'JetBrains Mono',monospace">e₁</text>; })()}
                {(() => { const [sx,sy]=toScreen(unitVecs[1][0],unitVecs[1][1]); return <text key="e2" x={sx+8} y={sy-5} fill={COLORS.warn} fontSize={13} fontFamily="'JetBrains Mono',monospace">e₂</text>; })()}
              </g>
            )}
          </GridCanvas>
          <GridCanvas width={280} height={280} scale={80} label="After O (rotated)">
            {(toScreen) => (
              <g>
                <Arrow from={[0,0]} to={unitVecs[0]} color={`${COLORS.accent}30`} width={1.5} toScreen={toScreen}/>
                <Arrow from={[0,0]} to={unitVecs[1]} color={`${COLORS.warn}30`} width={1.5} toScreen={toScreen}/>
                <Arrow from={[0,0]} to={transformed[0]} color={COLORS.accent} width={3} toScreen={toScreen}/>
                <Arrow from={[0,0]} to={transformed[1]} color={COLORS.warn} width={3} toScreen={toScreen}/>
                {(() => { const [sx,sy]=toScreen(transformed[0][0],transformed[0][1]); return <text key="Oe1" x={sx+8} y={sy-5} fill={COLORS.accent} fontSize={13} fontFamily="'JetBrains Mono',monospace">Oe₁</text>; })()}
                {(() => { const [sx,sy]=toScreen(transformed[1][0],transformed[1][1]); return <text key="Oe2" x={sx+8} y={sy-5} fill={COLORS.warn} fontSize={13} fontFamily="'JetBrains Mono',monospace">Oe₂</text>; })()}
              </g>
            )}
          </GridCanvas>
        </div>

        <div style={{flex:1, minWidth:220}}>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,color:COLORS.textDim,marginBottom:4}}>
              Rotation θ: {(theta/Math.PI*180).toFixed(0)}°
            </label>
            <input type="range" min={0} max={Math.PI*2} step={0.05} value={theta}
              onChange={e=>setTheta(+e.target.value)}
              style={{width:"100%", accentColor:COLORS.secondary}}/>
          </div>

          <div style={{display:"flex", flexWrap:"wrap", gap:8, marginBottom:16}}>
            <MatrixDisplay matrix={O} label="O" color={COLORS.secondary}/>
            <MatrixDisplay matrix={OT} label="O⊤" color={COLORS.secondary}/>
            <MatrixDisplay matrix={product} label="O⊤O" color={COLORS.accent}/>
          </div>

          <div style={{padding:12, borderRadius:6, background:`${COLORS.secondary}08`, border:`1px solid ${COLORS.secondary}20`, fontSize:13, color:COLORS.textDim, lineHeight:1.6, marginBottom:12}}>
            <strong style={{color:COLORS.secondary}}>Key facts:</strong>
            <div style={{marginTop:6}}>• |Oe₁| = {Math.sqrt(transformed[0][0]**2+transformed[0][1]**2).toFixed(3)} (still 1 ✓)</div>
            <div>• |Oe₂| = {Math.sqrt(transformed[1][0]**2+transformed[1][1]**2).toFixed(3)} (still 1 ✓)</div>
            <div>• Oe₁ · Oe₂ = {(transformed[0][0]*transformed[1][0]+transformed[0][1]*transformed[1][1]).toFixed(3)} (still 0 ✓)</div>
            <div style={{marginTop:6}}>Lengths and angles preserved. That's what orthogonal means.</div>
          </div>

          <div style={{padding:12, borderRadius:6, background:`${COLORS.accent}08`, border:`1px solid ${COLORS.accent}20`, fontSize:13, color:COLORS.textDim, lineHeight:1.6}}>
            <strong style={{color:COLORS.accent}}>Try it:</strong> Rotate θ and confirm O⊤O always equals the identity matrix. The vectors rotate but never stretch.
          </div>
        </div>
      </div>
    </div>
  );
}

function TogetherTab() {
  const [theta, setTheta] = useState(0);
  const [seed] = useState(42);

  const getBasePoints = useCallback((): Vector2[] => {
    const rng = (s: number) => { s=Math.sin(s)*43758.5453; return s-Math.floor(s); };
    const pts: Vector2[] = [];
    for (let i=0; i<35; i++) {
      const gx = (rng(seed*1000+i*7.1)-0.5)*4;
      const gy = (rng(seed*1000+i*13.3+99)-0.5)*1.2;
      const angle = 0.4;
      pts.push([gx*Math.cos(angle)-gy*Math.sin(angle), gx*Math.sin(angle)+gy*Math.cos(angle)]);
    }
    return pts;
  }, [seed]);

  const basePoints = getBasePoints();
  const O = rotMatrix(theta);
  const rotatedPoints = basePoints.map(p => applyMat(O, p));

  const covOrig = computeCovariance(basePoints);
  const covRot = computeCovariance(rotatedPoints);
  const eigOrig = eigenDecomp2x2(covOrig);
  const eigRot = eigenDecomp2x2(covRot);

  const OT = transpose2x2(O);
  const temp = matMul2x2(O, covOrig);
  // Manually compute expectedCov = temp * OT
  const expectedCov: Matrix2x2 = [
    [temp[0][0]*OT[0][0] + temp[0][1]*OT[1][0], temp[0][0]*OT[0][1] + temp[0][1]*OT[1][1]],
    [temp[1][0]*OT[0][0] + temp[1][1]*OT[1][0], temp[1][0]*OT[0][1] + temp[1][1]*OT[1][1]]
  ];

  return (
    <div>
      <div style={{marginBottom:16, color:COLORS.text, lineHeight:1.7, fontSize:14}}>
        <p style={{margin:"0 0 8px"}}>Now see it all together: rotate data by O. Watch how the <strong style={{color:COLORS.accent}}>covariance transforms as OΣO⊤</strong>, the <strong style={{color:COLORS.accent}}>eigenvalues stay the same</strong>, and the <strong style={{color:COLORS.secondary}}>eigenvectors rotate by O</strong>.</p>
        <p style={{margin:0}}>This is exactly what Problem 2 asks you to prove!</p>
      </div>

      <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>
        <GridCanvas width={300} height={300} scale={45} label="Original D">
          {(toScreen) => (
            <g>
              {basePoints.map((p,i) => {
                const [sx,sy]=toScreen(p[0],p[1]);
                return <circle key={i} cx={sx} cy={sy} r={3} fill={COLORS.secondary} opacity={0.6}/>;
              })}
              {eigOrig.vectors.map((v,i) => {
                const len=Math.sqrt(eigOrig.values[i])*1.5;
                return <Arrow key={i} from={[0,0]} to={[v[0]*len,v[1]*len]}
                  color={i===0?COLORS.accent:COLORS.warn} width={2.5} toScreen={toScreen}/>;
              })}
            </g>
          )}
        </GridCanvas>

        <GridCanvas width={300} height={300} scale={45} label={`D' = OD (θ=${(theta/Math.PI*180).toFixed(0)}°)`}>
          {(toScreen) => (
            <g>
              {rotatedPoints.map((p,i) => {
                const [sx,sy]=toScreen(p[0],p[1]);
                return <circle key={i} cx={sx} cy={sy} r={3} fill={COLORS.secondary} opacity={0.6}/>;
              })}
              {eigRot.vectors.map((v,i) => {
                const len=Math.sqrt(eigRot.values[i])*1.5;
                return <Arrow key={i} from={[0,0]} to={[v[0]*len,v[1]*len]}
                  color={i===0?COLORS.accent:COLORS.warn} width={2.5} toScreen={toScreen}/>;
              })}
            </g>
          )}
        </GridCanvas>
      </div>

      <div style={{marginTop:12}}>
        <label style={{display:"block",fontSize:12,color:COLORS.textDim,marginBottom:4}}>
          Rotation θ: {(theta/Math.PI*180).toFixed(0)}°
        </label>
        <input type="range" min={0} max={Math.PI*2} step={0.05} value={theta}
          onChange={e=>setTheta(+e.target.value)}
          style={{width:"100%", maxWidth:612, accentColor:COLORS.accent}}/>
      </div>

      <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:16}}>
        <MatrixDisplay matrix={covOrig} label="Σ (original)" color={COLORS.secondary}/>
        <MatrixDisplay matrix={covRot} label="Σ' (rotated)" color={COLORS.accent}/>
        <MatrixDisplay matrix={expectedCov} label="OΣO⊤ (formula)" color={COLORS.warn}/>
      </div>

      <div style={{display:"flex", gap:16, flexWrap:"wrap", marginTop:16}}>
        <div style={{padding:12, borderRadius:6, background:`${COLORS.accent}08`, border:`1px solid ${COLORS.accent}20`, fontSize:13, color:COLORS.textDim, lineHeight:1.6, flex:1, minWidth:250}}>
          <strong style={{color:COLORS.accent}}>Eigenvalues (variances)</strong>
          <div style={{marginTop:6, fontFamily:"'JetBrains Mono',monospace"}}>
            <div>Original: λ₁={eigOrig.values[0].toFixed(3)}, λ₂={eigOrig.values[1].toFixed(3)}</div>
            <div>Rotated: &nbsp;λ₁={eigRot.values[0].toFixed(3)}, λ₂={eigRot.values[1].toFixed(3)}</div>
          </div>
          <div style={{marginTop:6, color:COLORS.accent}}>→ Same! Rotation doesn't change spread.</div>
        </div>
        <div style={{padding:12, borderRadius:6, background:`${COLORS.secondary}08`, border:`1px solid ${COLORS.secondary}20`, fontSize:13, color:COLORS.textDim, lineHeight:1.6, flex:1, minWidth:250}}>
          <strong style={{color:COLORS.secondary}}>Eigenvectors (PCs)</strong>
          <div style={{marginTop:6, fontFamily:"'JetBrains Mono',monospace"}}>
            <div>Orig w₁: [{eigOrig.vectors[0].map(v=>v.toFixed(2)).join(", ")}]</div>
            <div>Rot w₁': [{eigRot.vectors[0].map(v=>v.toFixed(2)).join(", ")}]</div>
            <div style={{marginTop:4}}>Ow₁: &nbsp;&nbsp;[{applyMat(O,eigOrig.vectors[0]).map(v=>v.toFixed(2)).join(", ")}]</div>
          </div>
          <div style={{marginTop:6, color:COLORS.secondary}}>→ w₁' = Ow₁! PCs rotate with the data.</div>
        </div>
      </div>
    </div>
  );
}

export default function PCAExplorer() {
  const [tab, setTab] = useState("covariance");

  return (
    <div style={{
      minHeight:"100vh", background:COLORS.bg, color:COLORS.text,
      fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", padding:"24px 20px"
    }}>
      <div style={{maxWidth:720, margin:"0 auto"}}>
        <h1 style={{
          fontSize:26, fontWeight:700, marginBottom:4,
          background:`linear-gradient(135deg, ${COLORS.accent}, ${COLORS.secondary})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
        }}>
          PCA + Orthogonal Transforms
        </h1>
        <p style={{color:COLORS.textDim, fontSize:14, marginTop:0, marginBottom:20}}>
          Interactive explorer for CS3780 HW2, Problem 2
        </p>

        <div style={{display:"flex", gap:4, marginBottom:20, flexWrap:"wrap"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{
                padding:"8px 16px", borderRadius:6, border:"none", cursor:"pointer",
                fontSize:13, fontWeight:500, transition:"all 0.2s",
                background: tab===t.id ? `${COLORS.accent}20` : "transparent",
                color: tab===t.id ? COLORS.accent : COLORS.textDim,
                borderBottom: tab===t.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "covariance" && <CovarianceTab />}
        {tab === "orthogonal" && <OrthogonalTab />}
        {tab === "together" && <TogetherTab />}
      </div>
    </div>
  );
}
