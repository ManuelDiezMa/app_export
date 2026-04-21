import React, { useState, useCallback, useRef, useEffect } from "react";

/* ═══ LOCALSTORAGE ═══ */
function loadLS(key, fb) { try { const v = localStorage.getItem("exp_" + key); return v !== null ? JSON.parse(v) : fb; } catch { return fb; } }
function usePersist(key, fb) {
  const [val, setVal] = useState(() => loadLS(key, fb));
  const set = useCallback((v) => { setVal(prev => { const next = typeof v === "function" ? v(prev) : v; try { localStorage.setItem("exp_" + key, JSON.stringify(next)); } catch {} return next; }); }, [key]);
  return [val, set];
}

/* ═══ DEFAULT STRUCTURE ═══ */
const DEF_ZONES = [
  { id: "clasificacion", name: "Clasificación", ci: 2 },
  { id: "facturacion", name: "Facturación", ci: 3 },
  { id: "runner", name: "Runner", ci: 1 },
  { id: "pesaje", name: "Pesaje de Bultos", ci: 5 },
  { id: "picking_agv", name: "Picking AGV", ci: 0 },
  { id: "clerks", name: "Clerks", ci: 6 },
  { id: "rfid", name: "RFID", ci: 4 },
  { id: "picking_manual", name: "Picking Manual", ci: 7 },
];
const DEF_ROLES = [
  { id: "clasif_doblado", name: "Doblado", z: "clasificacion", type: "tarea_extra", icon: "👔" },
  { id: "clasif_perchado", name: "Perchado", z: "clasificacion", type: "tarea_extra", icon: "👗" },
  { id: "facturacion_op", name: "Facturación", z: "facturacion", type: "indirecto", icon: "🧾" },
  { id: "runner_agv", name: "AGV", z: "runner", type: "indirecto", icon: "🏃" },
  { id: "runner_manual", name: "Manual", z: "runner", type: "indirecto", icon: "🏃‍♂️" },
  { id: "runner_totales", name: "Totales", z: "runner", type: "indirecto", icon: "📊" },
  { id: "pesaje_op", name: "Pesaje", z: "pesaje", type: "indirecto", icon: "⚖️" },
  { id: "picker_agv", name: "Picker AGV", z: "picking_agv", type: "directo", icon: "🤖" },
  { id: "clerk_op", name: "Clerk", z: "clerks", type: "indirecto", icon: "🖥️" },
  { id: "rfid_op", name: "RFID", z: "rfid", type: "indirecto", icon: "📡" },
  { id: "picker_manual", name: "Picker Manual", z: "picking_manual", type: "directo", icon: "📦" },
];

const PAL = [
  { bg: "#dbeafe", ac: "#2563eb", hd: "#1e40af" },
  { bg: "#ede9fe", ac: "#7c3aed", hd: "#5b21b6" },
  { bg: "#d1fae5", ac: "#059669", hd: "#065f46" },
  { bg: "#fef3c7", ac: "#d97706", hd: "#92400e" },
  { bg: "#fce7f3", ac: "#db2777", hd: "#9d174d" },
  { bg: "#e0e7ff", ac: "#4f46e5", hd: "#3730a3" },
  { bg: "#ccfbf1", ac: "#0d9488", hd: "#115e59" },
  { bg: "#f1f5f9", ac: "#475569", hd: "#1e293b" },
];
const TC = { directo: "#2563eb", indirecto: "#7c3aed", tarea_extra: "#d97706" };
const TL = { directo: "DIR", indirecto: "IND", tarea_extra: "EXTRA" };
const bi = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#111827", fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", boxSizing: "border-box" };

/* ═══ COMPONENTS ═══ */
function NumField({ value, onCommit, placeholder, style }) {
  const ref = useRef(null);
  const [loc, setLoc] = useState(value ? String(value) : "");
  const lv = useRef(value);
  useEffect(() => { if (lv.current !== value && document.activeElement !== ref.current) { setLoc(value ? String(value) : ""); } lv.current = value; }, [value]);
  return <input ref={ref} type="text" inputMode="numeric" pattern="[0-9]*" value={loc} placeholder={placeholder || "0"} style={style || bi}
    onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ""); setLoc(v); onCommit(parseInt(v) || 0); }}
    onBlur={() => { setLoc(value ? String(value) : ""); lv.current = value; }} />;
}

function TextField({ value, onChange, placeholder, style }) {
  return <input type="text" value={value} placeholder={placeholder} style={style || bi} onChange={e => onChange(e.target.value)} />;
}

function EditableCounter({ count, onChange, warn }) {
  const [ed, setEd] = useState(false);
  const [loc, setLoc] = useState(String(count));
  const ref = useRef(null);
  useEffect(() => { if (!ed) setLoc(String(count)); }, [count, ed]);
  useEffect(() => { if (ed && ref.current) { ref.current.focus(); ref.current.select(); } }, [ed]);
  if (ed) return <input ref={ref} type="text" inputMode="numeric" pattern="[0-9]*" value={loc}
    style={{ width: 56, height: 34, textAlign: "center", fontSize: 15, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", border: "2px solid #2563eb", borderRadius: 10, background: "#eff6ff", color: "#111827", boxSizing: "border-box", outline: "none" }}
    onChange={e => setLoc(e.target.value.replace(/[^0-9]/g, ""))}
    onBlur={() => { onChange(parseInt(loc) || 0); setEd(false); }}
    onKeyDown={e => { if (e.key === "Enter") { onChange(parseInt(loc) || 0); setEd(false); } }} />;
  return (<div style={{ display: "flex", alignItems: "center", background: warn ? "#fef2f2" : "#f3f4f6", borderRadius: 10, border: `1px solid ${warn ? "#fca5a5" : "#e5e7eb"}` }}>
    <button onClick={() => onChange(Math.max(0, count - 1))} style={{ width: 34, height: 34, border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: "#6b7280", fontWeight: 700 }}>−</button>
    <span onClick={() => setEd(true)} style={{ minWidth: 28, textAlign: "center", fontSize: 15, fontWeight: 800, color: warn ? "#dc2626" : "#111827", fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>{count}</span>
    <button onClick={() => onChange(count + 1)} style={{ width: 34, height: 34, border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: "#6b7280", fontWeight: 700 }}>+</button>
  </div>);
}

function Card({ children, sx }) { return <div style={{ background: "#fff", borderRadius: 14, padding: 16, marginBottom: 14, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", ...sx }}>{children}</div>; }
function Lbl({ children }) { return <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>{children}</div>; }
function toM(t) { const p = t.split(":").map(Number); return p[0] * 60 + (p[1] || 0); }

/* ═══ APP ═══ */
function App() {
  const [zones, setZones] = usePersist("zones2", DEF_ZONES);
  const [roles, setRoles] = usePersist("roles2", DEF_ROLES);
  const [staff, setStaff] = usePersist("staff2", {});
  const [objAGV, setObjAGV] = usePersist("objAGV", 172);
  const [objManual, setObjManual] = usePersist("objManual", 80);
  const [ratioR, setRatioR] = usePersist("ratioR", 6);
  const [capCl, setCapCl] = usePersist("capCl", 300);
  const [finT, setFinT] = usePersist("finT", "14:00");
  const [drops, setDrops] = usePersist("drops", [
    { id: 1, time: "10:30", note: "" }, { id: 2, time: "11:30", note: "Solo jueves" },
    { id: 3, time: "12:30", note: "" }, { id: 4, time: "13:30", note: "" },
  ]);
  const [pP, setPP] = usePersist("pP2", 0);
  const [pC, setPC] = usePersist("pC2", 0);
  const [pR, setPR] = usePersist("pR2", 0);
  const [tG, setTG] = usePersist("tG2", 0);
  const [hourLogs, setHourLogs] = usePersist("hourLogs", []);
  const [dropLogs, setDropLogs] = usePersist("dropLogs", []);
  const [tab, setTab] = useState("dashboard");
  const [showCfg, setShowCfg] = useState(false);
  const [now, setNow] = useState(new Date());

  // Turno edit states
  const [eZone, setEZone] = useState(null); const [eZN, setEZN] = useState("");
  const [addZoneOpen, setAddZoneOpen] = useState(false); const [nZN, setNZN] = useState("");
  const [addRZ, setAddRZ] = useState(null); const [nRN, setNRN] = useState(""); const [nRT, setNRT] = useState("indirecto");
  const [addDropOpen, setAddDropOpen] = useState(false); const [nDT, setNDT] = useState(""); const [nDN, setNDN] = useState("");

  // Situacion states
  const [showHourLog, setShowHourLog] = useState(false);
  const [hlHora, setHlHora] = useState("");
  const [hlPicadas, setHlPicadas] = useState(0);
  const [hlClasif, setHlClasif] = useState(0);
  const [showDropLog, setShowDropLog] = useState(false);
  const [dlPicar, setDlPicar] = useState(0);
  const [dlClasif, setDlClasif] = useState(0);
  const [dlRFID, setDlRFID] = useState(0);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const hAct = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const nowM = now.getHours() * 60 + now.getMinutes();
  const finM = toM(finT);
  const mRest = Math.max(0, finM - nowM);
  const hRest = mRest / 60;

  const g = useCallback(id => staff[id] || 0, [staff]);
  const sc = useCallback((id, v) => setStaff(p => ({ ...p, [id]: Math.max(0, v) })), []);
  const gcol = z => PAL[z.ci % PAL.length];

  // Totals
  const tDir = roles.filter(r => r.type === "directo").reduce((a, r) => a + g(r.id), 0);
  const tInd = roles.filter(r => r.type === "indirecto").reduce((a, r) => a + g(r.id), 0);
  const tExt = roles.filter(r => r.type === "tarea_extra").reduce((a, r) => a + g(r.id), 0);
  const asig = tDir + tInd + tExt;
  const sinA = tG - asig;
  const tpi = tDir > 0 ? (tInd / tDir).toFixed(2) : "—";

  // Output
  const pAGV = g("picker_agv"), pMan = g("picker_manual");
  const salA = pAGV * objAGV, salM = pMan * objManual, salT = salA + salM;
  const clTot = roles.filter(r => r.z === "clasificacion").reduce((a, r) => a + g(r.id), 0);
  const capH = clTot * capCl;
  const rAGV = g("runner_agv");
  const rNeed = pAGV > 0 ? Math.ceil(pAGV / ratioR) : 0;

  // TPH from hour logs
  const totalPicadasReal = hourLogs.reduce((a, l) => a + l.picadas, 0);
  const totalClasifReal = hourLogs.reduce((a, l) => a + l.clasificadas, 0);
  const totalHorasHombre = hourLogs.length * (tDir + tInd);
  const tphAcum = totalHorasHombre > 0 ? (totalPicadasReal / totalHorasHombre).toFixed(1) : "—";

  // Expected vs real
  const expectedPicadaH = salT;
  const expectedClasifH = capH;

  // Projection
  const picarAlFinal = hRest > 0 && salT > 0 ? Math.max(0, pP - salT * hRest) : pP;
  const clasifAlFinal = hRest > 0 && capH > 0 ? Math.max(0, (pC + Math.min(pP, salT * hRest)) - capH * hRest) : pC;
  const rfidAlFinal = hRest > 0 && salT > 0 ? Math.max(0, pR - salT * hRest) : pR;

  // Drops
  const actDrops = [...drops].sort((a, b) => toM(a.time) - toM(b.time));
  const nextDr = actDrops.find(d => toM(d.time) > nowM);
  const mToDr = nextDr ? toM(nextDr.time) - nowM : null;

  // Zone reorder
  const moveZone = (idx, dir) => {
    setZones(p => {
      const n = [...p]; const ni = idx + dir;
      if (ni < 0 || ni >= n.length) return p;
      [n[idx], n[ni]] = [n[ni], n[idx]]; return n;
    });
  };

  // Handlers
  const addHourLog = () => {
    if (!hlHora) return;
    const tphHour = (tDir + tInd) > 0 ? (hlPicadas / (tDir + tInd)).toFixed(1) : "0";
    setHourLogs(p => [...p, { id: Date.now(), hora: hlHora, picadas: hlPicadas, clasificadas: hlClasif, personal: asig, dir: tDir, ind: tInd, tph: tphHour, expectedPic: expectedPicadaH, expectedClas: expectedClasifH }]);
    // Restar picadas de pendiente picar
    setPP(prev => Math.max(0, prev - hlPicadas));
    // Pendiente clasificar: restar lo clasificado, sumar lo picado (que pasa a cola)
    setPC(prev => Math.max(0, prev - hlClasif + hlPicadas));
    setHlHora(""); setHlPicadas(0); setHlClasif(0); setShowHourLog(false);
  };

  const addDropLog = () => {
    setDropLogs(p => [...p, { id: Date.now(), hora: hAct, picar: dlPicar, clasif: pC, rfid: dlRFID }]);
    setPP(dlPicar); setPR(dlRFID);
    // pC no se toca — se mantiene el acumulado actual
    setDlPicar(0); setDlClasif(0); setDlRFID(0); setShowDropLog(false);
  };

  const resetTurno = () => {
    if (!window.confirm("¿Nuevo turno? Se borran datos operativos.\nLa configuración se mantiene.")) return;
    setPP(0); setPC(0); setPR(0); setTG(0); setStaff({}); setHourLogs([]); setDropLogs([]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "'DM Sans',sans-serif", color: "#111827", maxWidth: 480, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ padding: "14px 20px 12px", background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#9ca3af" }}>CONTROL DE PERSONAL</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 800 }}>Export</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2563eb", fontFamily: "'JetBrains Mono',monospace" }}>{hAct}</span>
            {mRest > 0 && <span style={{ fontSize: 11, color: mRest > 60 ? "#059669" : "#dc2626", fontWeight: 700 }}>~{hRest.toFixed(1)}h</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={resetTurno} style={{ background: "#fff", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>🔄</button>
          <button onClick={() => setShowCfg(!showCfg)} style={{ background: showCfg ? "#e5e7eb" : "#fff", border: "1px solid #d1d5db", color: "#6b7280", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⚙</button>
        </div>
      </div>

      {/* CONFIG */}
      {showCfg && (
        <div style={{ padding: "12px 20px 16px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
          <Lbl>Productividad (uds/h)</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><label style={{ fontSize: 11, color: "#2563eb", marginBottom: 4, display: "block", fontWeight: 600 }}>AGV</label><NumField value={objAGV} onCommit={setObjAGV} /></div>
            <div><label style={{ fontSize: 11, color: "#059669", marginBottom: 4, display: "block", fontWeight: 600 }}>Manual</label><NumField value={objManual} onCommit={setObjManual} /></div>
          </div>
          <Lbl>Ratios</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><label style={{ fontSize: 10, color: "#6b7280", marginBottom: 4, display: "block" }}>Pickers/Runner</label><NumField value={ratioR} onCommit={v => setRatioR(v || 1)} /></div>
            <div><label style={{ fontSize: 10, color: "#6b7280", marginBottom: 4, display: "block" }}>Uds/h Clasificador</label><NumField value={capCl} onCommit={v => setCapCl(v || 1)} /></div>
          </div>
          <Lbl>Referencia fin de turno</Lbl>
          <input type="time" value={finT} onChange={e => setFinT(e.target.value)} style={{ ...bi, marginBottom: 12 }} />
          <Lbl>Horas de caída (ref.)</Lbl>
          {actDrops.map(d => (
            <div key={d.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", minWidth: 50 }}>{d.time}</span>
              <span style={{ fontSize: 11, color: "#6b7280", flex: 1 }}>{d.note}</span>
              <button onClick={() => setDrops(p => p.filter(x => x.id !== d.id))} style={{ background: "none", border: "none", color: "#d1d5db", fontSize: 14, cursor: "pointer" }}>×</button>
            </div>
          ))}
          {!addDropOpen ? <button onClick={() => setAddDropOpen(true)} style={{ background: "none", border: "none", color: "#2563eb", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Añadir caída</button>
          : <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="time" value={nDT} onChange={e => setNDT(e.target.value)} style={{ ...bi, fontSize: 12, padding: 6, width: 90 }} />
              <TextField value={nDN} onChange={setNDN} placeholder="Nota" style={{ ...bi, fontSize: 12, padding: 6, flex: 1 }} />
              <button onClick={() => { if (nDT) { setDrops(p => [...p, { id: Date.now(), time: nDT, note: nDN }]); setNDT(""); setNDN(""); setAddDropOpen(false); } }} style={{ border: "none", background: "#2563eb", color: "#fff", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+</button>
              <button onClick={() => setAddDropOpen(false)} style={{ border: "none", background: "#e5e7eb", color: "#6b7280", borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
            </div>}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", padding: "0 12px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        {[["dashboard", "Dashboard"], ["turno", "Turno"], ["situacion", "Situación"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: "11px 12px", border: "none", background: "transparent", color: tab === id ? "#2563eb" : "#9ca3af", fontSize: 13, fontWeight: 700, cursor: "pointer", borderBottom: tab === id ? "2px solid #2563eb" : "2px solid transparent", flex: 1, textAlign: "center" }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: "16px 20px 100px" }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab === "dashboard" && (<>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
            {[{ l: "Por Picar", v: pP, c: "#dc2626" }, { l: "Por Clasif.", v: pC, c: "#d97706" }, { l: "Pdt RFID", v: pR, c: "#7c3aed" }, { l: "Personas", v: asig, c: "#2563eb" }].map(k => (
              <div key={k.l} style={{ background: "#fff", borderRadius: 10, padding: "10px 4px", textAlign: "center", border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 8, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>{k.l}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: k.c, fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>{k.v.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Staff table */}
          {asig > 0 && (
            <Card>
              <Lbl>Personal por departamento</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: TC.directo, marginBottom: 6, textAlign: "center" }}>DIRECTOS ({tDir})</div>
                  {roles.filter(r => r.type === "directo").map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}>
                      <span style={{ color: "#374151" }}>{r.icon} {r.name}</span>
                      <span style={{ fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: TC.directo }}>{g(r.id)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: TC.indirecto, marginBottom: 6, textAlign: "center" }}>INDIRECTOS ({tInd})</div>
                  {roles.filter(r => r.type === "indirecto").map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}>
                      <span style={{ color: "#374151" }}>{r.icon} {r.name}</span>
                      <span style={{ fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: TC.indirecto }}>{g(r.id)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {tExt > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: TC.tarea_extra, marginBottom: 4 }}>TAREA EXTRA ({tExt}) — no cuenta para TPH</div>
                  {roles.filter(r => r.type === "tarea_extra").map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                      <span>{r.icon} {r.name}</span><span style={{ fontWeight: 800, color: TC.tarea_extra, fontFamily: "'JetBrains Mono',monospace" }}>{g(r.id)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "2px solid #e5e7eb", fontSize: 12, fontWeight: 700 }}>
                <span>TPI: <span style={{ fontFamily: "'JetBrains Mono',monospace", color: tDir > 0 && tInd / tDir > 0.5 ? "#dc2626" : "#059669" }}>{tpi}</span></span>
                <span>{sinA === 0 && tG > 0 ? <span style={{ color: "#059669" }}>✓ Todos</span> : sinA > 0 ? <span style={{ color: "#92400e" }}>{sinA} sin asignar</span> : sinA < 0 ? <span style={{ color: "#dc2626" }}>{Math.abs(sinA)} de más</span> : null}</span>
              </div>
            </Card>
          )}

          {/* Flow */}
          {salT > 0 && (
            <Card>
              <Lbl>Flujo operativo</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                <div style={{ background: "#eff6ff", borderRadius: 10, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 700 }}>SALIDA PICADA</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#1e40af", fontFamily: "'JetBrains Mono',monospace" }}>{salT.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: "#6b7280" }}>uds/h esperadas</div>
                </div>
                <div style={{ background: capH >= salT + pC ? "#f0fdf4" : "#fef2f2", borderRadius: 10, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#6b7280", fontWeight: 700 }}>CAP. CLASIFICAR</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: capH >= salT + pC ? "#065f46" : "#dc2626", fontFamily: "'JetBrains Mono',monospace" }}>{capH.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: "#6b7280" }}>uds/h</div>
                </div>
              </div>
              {pAGV > 0 && rAGV < rNeed && <div style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#fef2f2", color: "#991b1b", marginBottom: 4 }}>🏃 Runners: {rAGV}/{rNeed}</div>}
              {capH < salT + pC ? <div style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#fef2f2", color: "#991b1b" }}>⚠ Cuello de botella clasificación</div>
                : clTot > 0 && <div style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#f0fdf4", color: "#065f46" }}>✓ Clasificación absorbe</div>}
            </Card>
          )}

          {/* TPH */}
          {(tDir + tInd) > 0 && (
            <Card sx={{ borderLeft: "4px solid #0d9488" }}>
              <Lbl>TPH</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "#ccfbf1", borderRadius: 10, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#0d9488", fontWeight: 700 }}>ESPERADO</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#085041", fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{(salT / (tDir + tInd)).toFixed(1)}</div>
                  <div style={{ fontSize: 9, color: "#6b7280" }}>{salT.toLocaleString()} / {tDir + tInd} pers</div>
                </div>
                <div style={{ background: hourLogs.length > 0 ? "#ccfbf1" : "#f3f4f6", borderRadius: 10, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: hourLogs.length > 0 ? "#0d9488" : "#9ca3af", fontWeight: 700 }}>REAL (ACUMULADO)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: hourLogs.length > 0 ? "#085041" : "#9ca3af", fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{tphAcum}</div>
                  <div style={{ fontSize: 9, color: "#6b7280" }}>{hourLogs.length > 0 ? `${totalPicadasReal.toLocaleString()} uds / ${hourLogs.length}h` : "Sin registros"}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Next drop */}
          {nextDr && <div style={{ background: "#fffbeb", borderRadius: 10, padding: "10px 14px", marginBottom: 14, border: "1px solid #fde68a", fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: "#92400e" }}>⏰ Próxima caída ref.: {nextDr.time}</span>
            <span style={{ color: "#6b7280", marginLeft: 6 }}>({mToDr < 60 ? `${mToDr}min` : `${(mToDr / 60).toFixed(1)}h`})</span>
            {nextDr.note && <span style={{ color: "#d97706", marginLeft: 6, fontSize: 10 }}>({nextDr.note})</span>}
          </div>}

          {/* Projection */}
          {salT > 0 && (pP > 0 || pC > 0) && hRest > 0 && (
            <Card sx={{ borderLeft: "4px solid #1e40af" }}>
              <Lbl>Proyección ~{finT} ({hRest.toFixed(1)}h)</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[{ l: "Por Picar", v: picarAlFinal, c0: "#dc2626", c1: "#059669", bg0: "#fef2f2", bg1: "#f0fdf4", b0: "#fecaca", b1: "#bbf7d0" },
                  { l: "Por Clasif.", v: clasifAlFinal, c0: "#d97706", c1: "#059669", bg0: "#fffbeb", bg1: "#f0fdf4", b0: "#fde68a", b1: "#bbf7d0" },
                  { l: "Pdt RFID", v: rfidAlFinal, c0: "#7c3aed", c1: "#059669", bg0: "#f5f3ff", bg1: "#f0fdf4", b0: "#ddd6fe", b1: "#bbf7d0" }
                ].map(k => (
                  <div key={k.l} style={{ background: k.v > 0 ? k.bg0 : k.bg1, borderRadius: 10, padding: "10px 6px", textAlign: "center", border: `1px solid ${k.v > 0 ? k.b0 : k.b1}` }}>
                    <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700 }}>{k.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: k.v > 0 ? k.c0 : k.c1, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{Math.round(k.v).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Distribution */}
          {asig > 0 && (
            <Card>
              <Lbl>Distribución por zona</Lbl>
              <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden", marginBottom: 10, border: "1px solid #e5e7eb" }}>
                {zones.map(z => { const c = roles.filter(r => r.z === z.id).reduce((a, r) => a + g(r.id), 0); const p = (c / asig) * 100; if (p === 0) return null; return <div key={z.id} style={{ width: `${p}%`, background: gcol(z).ac, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>{p > 14 && `${Math.round(p)}%`}</div>; })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {zones.map(z => { const c = roles.filter(r => r.z === z.id).reduce((a, r) => a + g(r.id), 0); return <div key={z.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}><div style={{ width: 10, height: 10, borderRadius: 3, background: gcol(z).ac }} /><span style={{ fontSize: 12, color: "#6b7280" }}>{z.name}</span><span style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace" }}>{c}</span></div>; })}
              </div>
            </Card>
          )}

          {asig === 0 && pP === 0 && (
            <Card sx={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>👋</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Inicio de turno</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>Ve a <b>Turno</b> para asignar personal</div>
            </Card>
          )}
        </>)}

        {/* ═══ TURNO ═══ */}
        {tab === "turno" && (<>
          <Card>
            <Lbl>¿Qué tienes?</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><label style={{ fontSize: 10, color: "#dc2626", display: "block", marginBottom: 4, fontWeight: 600 }}>Pend. picar</label><NumField value={pP} onCommit={setPP} style={{ ...bi, fontSize: 16, textAlign: "center", padding: 10, borderColor: "#fca5a5" }} /></div>
              <div><label style={{ fontSize: 10, color: "#d97706", display: "block", marginBottom: 4, fontWeight: 600 }}>Pend. clasif.</label><NumField value={pC} onCommit={setPC} style={{ ...bi, fontSize: 16, textAlign: "center", padding: 10, borderColor: "#fcd34d" }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={{ fontSize: 10, color: "#7c3aed", display: "block", marginBottom: 4, fontWeight: 600 }}>Pend. RFID</label><NumField value={pR} onCommit={setPR} style={{ ...bi, fontSize: 16, textAlign: "center", padding: 10, borderColor: "#c4b5fd" }} /></div>
              <div><label style={{ fontSize: 10, color: "#2563eb", display: "block", marginBottom: 4, fontWeight: 600 }}>Personas</label><NumField value={tG} onCommit={setTG} style={{ ...bi, fontSize: 16, textAlign: "center", padding: 10, borderColor: "#93c5fd" }} /></div>
            </div>
          </Card>

          {tG > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: sinA === 0 ? "#f0fdf4" : sinA < 0 ? "#fef2f2" : "#fffbeb", borderRadius: 10, padding: "10px 14px", marginBottom: 14, border: `1px solid ${sinA === 0 ? "#bbf7d0" : sinA < 0 ? "#fecaca" : "#fde68a"}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: sinA === 0 ? "#065f46" : sinA < 0 ? "#991b1b" : "#92400e" }}>{sinA === 0 ? "✓ Todos asignados" : sinA > 0 ? `${sinA} sin asignar` : `${Math.abs(sinA)} de más`}</span>
              <div style={{ display: "flex", gap: 6, fontSize: 11 }}>
                <span style={{ color: TC.directo, fontWeight: 700 }}>{tDir} dir</span>
                <span style={{ color: TC.indirecto, fontWeight: 700 }}>{tInd} ind</span>
                {tExt > 0 && <span style={{ color: TC.tarea_extra, fontWeight: 700 }}>{tExt} ext</span>}
              </div>
            </div>
          )}

          {salT > 0 && (
            <Card>
              <Lbl>Impacto</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "#eff6ff", borderRadius: 10, padding: 10, textAlign: "center" }}><div style={{ fontSize: 9, color: "#6b7280", fontWeight: 700 }}>SALIDA</div><div style={{ fontSize: 22, fontWeight: 800, color: "#1e40af", fontFamily: "'JetBrains Mono',monospace" }}>{salT.toLocaleString()}</div><div style={{ fontSize: 9, color: "#6b7280" }}>uds/h</div></div>
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 10, textAlign: "center" }}><div style={{ fontSize: 9, color: "#6b7280", fontWeight: 700 }}>CAP. CLASIF.</div><div style={{ fontSize: 22, fontWeight: 800, color: "#065f46", fontFamily: "'JetBrains Mono',monospace" }}>{capH.toLocaleString()}</div><div style={{ fontSize: 9, color: "#6b7280" }}>uds/h</div></div>
              </div>
            </Card>
          )}

          {/* Zones with reorder */}
          {zones.map((zone, zi) => {
            const zr = roles.filter(r => r.z === zone.id); const col = gcol(zone);
            const zt = zr.reduce((a, r) => a + g(r.id), 0);
            const isEd = eZone === zone.id;
            return (
              <div key={zone.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", background: col.bg, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {isEd ? (
                    <div style={{ display: "flex", gap: 4, flex: 1, alignItems: "center" }}>
                      <TextField value={eZN} onChange={setEZN} placeholder="Nombre" style={{ ...bi, fontSize: 12, padding: "5px 8px", flex: 1 }} />
                      <button onClick={() => { if (eZN.trim()) { setZones(p => p.map(z => z.id === zone.id ? { ...z, name: eZN.trim() } : z)); setEZone(null); } }} style={{ border: "none", background: "#059669", color: "#fff", borderRadius: 6, padding: "5px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✓</button>
                      <button onClick={() => setEZone(null)} style={{ border: "none", background: "#e5e7eb", color: "#6b7280", borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
                    </div>
                  ) : (<>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        <button onClick={() => moveZone(zi, -1)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 10, cursor: "pointer", padding: 0, lineHeight: 1 }}>▲</button>
                        <button onClick={() => moveZone(zi, 1)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 10, cursor: "pointer", padding: 0, lineHeight: 1 }}>▼</button>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: col.hd, textTransform: "uppercase", letterSpacing: 1 }}>{zone.name}</span>
                      <button onClick={() => { setEZone(zone.id); setEZN(zone.name); }} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 11, cursor: "pointer" }}>✏️</button>
                      {zr.length === 0 && <button onClick={() => setZones(p => p.filter(z => z.id !== zone.id))} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>🗑</button>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: col.hd, background: "#fff", padding: "2px 10px", borderRadius: 8, fontFamily: "'JetBrains Mono',monospace" }}>{zt}</span>
                  </>)}
                </div>
                <div style={{ padding: "4px 12px" }}>
                  {zr.map(role => (
                    <div key={role.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 4px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{role.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{role.name}</span>
                        <span style={{ fontSize: 9, color: TC[role.type], fontWeight: 700 }}>{TL[role.type]}</span>
                        <button onClick={() => { setRoles(p => p.filter(r => r.id !== role.id)); setStaff(p => { const n = { ...p }; delete n[role.id]; return n; }); }} style={{ background: "none", border: "none", color: "#d1d5db", fontSize: 12, cursor: "pointer" }}>×</button>
                      </div>
                      <EditableCounter count={g(role.id)} onChange={v => sc(role.id, v)} warn={sinA < 0} />
                    </div>
                  ))}
                  {addRZ === zone.id ? (
                    <div style={{ padding: "6px 0" }}>
                      <TextField value={nRN} onChange={setNRN} placeholder="Nombre del rol" style={{ ...bi, fontSize: 12, padding: "6px 8px", marginBottom: 6 }} />
                      <div style={{ display: "flex", gap: 4 }}>
                        <select value={nRT} onChange={e => setNRT(e.target.value)} style={{ padding: "5px 6px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", color: "#111827", fontSize: 11 }}>
                          <option value="directo">Directo</option><option value="indirecto">Indirecto</option><option value="tarea_extra">Tarea Extra</option>
                        </select>
                        <button onClick={() => { if (nRN.trim()) { setRoles(p => [...p, { id: "r_" + Date.now(), name: nRN.trim(), z: zone.id, type: nRT, icon: "👤" }]); setNRN(""); setNRT("indirecto"); setAddRZ(null); } }} style={{ border: "none", background: col.ac, color: "#fff", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Añadir</button>
                        <button onClick={() => { setAddRZ(null); setNRN(""); }} style={{ border: "1px solid #d1d5db", background: "#fff", color: "#6b7280", borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setAddRZ(zone.id); setNRN(""); setNRT("indirecto"); }} style={{ width: "100%", padding: 6, border: "none", background: "transparent", color: "#9ca3af", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>+ Añadir rol</button>
                  )}
                </div>
              </div>
            );
          })}

          {!addZoneOpen ? (
            <button onClick={() => setAddZoneOpen(true)} style={{ width: "100%", padding: 12, borderRadius: 12, border: "2px dashed #d1d5db", background: "transparent", color: "#9ca3af", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Añadir departamento</button>
          ) : (
            <Card sx={{ borderColor: "#d1d5db" }}>
              <TextField value={nZN} onChange={setNZN} placeholder="Nombre del departamento" style={{ ...bi, marginBottom: 10, fontSize: 14 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { if (nZN.trim()) { setZones(p => [...p, { id: "z_" + Date.now(), name: nZN.trim(), ci: zones.length % PAL.length }]); setNZN(""); setAddZoneOpen(false); } }} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Crear</button>
                <button onClick={() => { setAddZoneOpen(false); setNZN(""); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#6b7280", fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              </div>
            </Card>
          )}
        </>)}

        {/* ═══ SITUACIÓN ═══ */}
        {tab === "situacion" && (<>
          {/* Current status */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Lbl>Estado actual — {hAct}</Lbl>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{asig} personas</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[{ l: "Por Picar", v: pP, c: "#dc2626" }, { l: "Por Clasif.", v: pC, c: "#d97706" }, { l: "Pdt RFID", v: pR, c: "#7c3aed" }].map(k => (
                <div key={k.l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>{k.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: k.c, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{k.v.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Two register buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <button onClick={() => { setShowHourLog(true); setShowDropLog(false); }} style={{ padding: 14, borderRadius: 12, border: "none", background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>⏱ Registro hora</button>
            <button onClick={() => { setShowDropLog(true); setShowHourLog(false); }} style={{ padding: 14, borderRadius: 12, border: "none", background: "#d97706", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>📦 Caída / Actualizar</button>
          </div>

          {/* Hour log form */}
          {showHourLog && (
            <Card sx={{ borderColor: "#93c5fd" }}>
              <Lbl>Registro horario — ¿Qué se ha hecho esta hora?</Lbl>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Hora (ej: 10:00)</label>
                <input type="time" value={hlHora} onChange={e => setHlHora(e.target.value)} style={bi} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: "#dc2626", display: "block", marginBottom: 4 }}>Uds picadas</label><NumField value={hlPicadas} onCommit={setHlPicadas} /></div>
                <div><label style={{ fontSize: 10, color: "#d97706", display: "block", marginBottom: 4 }}>Uds clasificadas</label><NumField value={hlClasif} onCommit={setHlClasif} /></div>
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10, background: "#f9fafb", padding: 8, borderRadius: 8 }}>
                Esperado: <b style={{ color: "#2563eb" }}>{salT.toLocaleString()}</b> picadas · <b style={{ color: "#059669" }}>{capH.toLocaleString()}</b> clasificadas
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addHourLog} style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Guardar</button>
                <button onClick={() => setShowHourLog(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#6b7280", fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              </div>
            </Card>
          )}

          {/* Drop log form */}
          {showDropLog && (
            <Card sx={{ borderColor: "#fcd34d" }}>
              <Lbl>Actualización de caída — {hAct}</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: "#dc2626", display: "block", marginBottom: 4 }}>Pend. picar (nuevo acumulado)</label><NumField value={dlPicar} onCommit={setDlPicar} /></div>
                <div><label style={{ fontSize: 10, color: "#7c3aed", display: "block", marginBottom: 4 }}>Pend. RFID (nuevo acumulado)</label><NumField value={dlRFID} onCommit={setDlRFID} /></div>
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10, background: "#f9fafb", padding: 8, borderRadius: 8 }}>
                Pend. clasificar se mantiene automáticamente: <b style={{ color: "#d97706" }}>{pC.toLocaleString()}</b>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addDropLog} style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#d97706", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Guardar</button>
                <button onClick={() => setShowDropLog(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#6b7280", fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              </div>
            </Card>
          )}

          {/* Hour logs history */}
          {hourLogs.length > 0 && (
            <Card>
              <Lbl>Registro por horas</Lbl>
              {hourLogs.map((l, i) => {
                const diffPic = l.picadas - l.expectedPic;
                const diffClas = l.clasificadas - l.expectedClas;
                return (
                  <div key={l.id} style={{ padding: "10px 0", borderBottom: i < hourLogs.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{l.hora}</span>
                        <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 6 }}>TPH: <b style={{ color: "#0d9488" }}>{l.tph}</b></span>
                      </div>
                      <button onClick={() => setHourLogs(p => p.filter(x => x.id !== l.id))} style={{ background: "none", border: "none", color: "#d1d5db", fontSize: 14, cursor: "pointer" }}>🗑</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                      <div style={{ fontSize: 11 }}>
                        <span style={{ color: "#6b7280" }}>Picadas: </span>
                        <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#dc2626" }}>{l.picadas.toLocaleString()}</span>
                        <span style={{ fontSize: 9, color: diffPic >= 0 ? "#059669" : "#dc2626", marginLeft: 4 }}>({diffPic >= 0 ? "+" : ""}{diffPic.toLocaleString()} vs esp.)</span>
                      </div>
                      <div style={{ fontSize: 11 }}>
                        <span style={{ color: "#6b7280" }}>Clasif: </span>
                        <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#d97706" }}>{l.clasificadas.toLocaleString()}</span>
                        <span style={{ fontSize: 9, color: diffClas >= 0 ? "#059669" : "#dc2626", marginLeft: 4 }}>({diffClas >= 0 ? "+" : ""}{diffClas.toLocaleString()} vs esp.)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Accumulated */}
              <div style={{ paddingTop: 10, borderTop: "2px solid #e5e7eb", marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                  <span>Acumulado ({hourLogs.length}h)</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>TPH: <span style={{ color: "#0d9488" }}>{tphAcum}</span></span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                  <span style={{ color: "#dc2626" }}>Pic: {totalPicadasReal.toLocaleString()}</span>
                  <span style={{ color: "#d97706" }}>Clas: {totalClasifReal.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Drop logs history */}
          {dropLogs.length > 0 && (
            <Card>
              <Lbl>Actualizaciones de pendientes</Lbl>
              {dropLogs.map((d, i) => {
                const prev = i > 0 ? dropLogs[i - 1] : null;
                const dP = prev ? d.picar - prev.picar : 0;
                const dC = prev ? d.clasif - prev.clasif : 0;
                return (
                  <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < dropLogs.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{d.hora}</span>
                      <div style={{ display: "flex", gap: 8, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
                        <span style={{ color: "#dc2626" }}>{d.picar.toLocaleString()}{prev && <span style={{ fontSize: 9, color: dP > 0 ? "#dc2626" : "#059669", marginLeft: 2 }}>{dP > 0 ? "+" : ""}{dP.toLocaleString()}</span>}</span>
                        <span style={{ color: "#d97706" }}>{d.clasif.toLocaleString()}{prev && <span style={{ fontSize: 9, color: dC > 0 ? "#dc2626" : "#059669", marginLeft: 2 }}>{dC > 0 ? "+" : ""}{dC.toLocaleString()}</span>}</span>
                        <span style={{ color: "#7c3aed" }}>{d.rfid.toLocaleString()}</span>
                      </div>
                    </div>
                    <button onClick={() => setDropLogs(p => p.filter(x => x.id !== d.id))} style={{ background: "none", border: "none", color: "#d1d5db", fontSize: 14, cursor: "pointer" }}>🗑</button>
                  </div>
                );
              })}
            </Card>
          )}
        </>)}
      </div>
    </div>
  );
}

export default App;
