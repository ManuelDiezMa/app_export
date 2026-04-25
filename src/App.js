import React, { useState, useCallback, useRef, useEffect } from "react";

/* ═══ LOCALSTORAGE ═══ */
function loadLS(k, fb) { try { const v = localStorage.getItem("exp_" + k); return v !== null ? JSON.parse(v) : fb; } catch { return fb; } }
function usePersist(k, fb) {
  const [v, sV] = useState(() => loadLS(k, fb));
  const set = useCallback((fn) => { sV(p => { const n = typeof fn === "function" ? fn(p) : fn; try { localStorage.setItem("exp_" + k, JSON.stringify(n)); } catch {} return n; }); }, [k]);
  return [v, set];
}

/* ═══ DEFAULTS ═══ */
const DEF_ZONES = [
  { id: "clasificacion", name: "Clasificación", ci: 0 },
  { id: "facturacion", name: "Facturación", ci: 1 },
  { id: "runner", name: "Runner", ci: 2 },
  { id: "pesaje", name: "Pesaje de Bultos", ci: 3 },
  { id: "picking_agv", name: "Picking AGV", ci: 4 },
  { id: "clerks", name: "Clerks", ci: 5 },
  { id: "rfid", name: "RFID", ci: 6 },
  { id: "picking_manual", name: "Picking Manual", ci: 7 },
  { id: "extra", name: "Extra", ci: 3 },
];
const DEF_ROLES = [
  { id: "clasif_doblado", name: "Doblado", z: "clasificacion", type: "indirecto", icon: "👔" },
  { id: "clasif_perchado", name: "Perchado", z: "clasificacion", type: "indirecto", icon: "👗" },
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

const ZC = ["#3b82f6","#8b5cf6","#f59e0b","#10b981","#ef4444","#6366f1","#14b8a6","#f97316"];
const TC = { directo: "#3b82f6", indirecto: "#a78bfa", tarea_extra: "#fbbf24" };
const TL = { directo: "DIR", indirecto: "IND", tarea_extra: "EXTRA" };

/* ═══ STYLES ═══ */
const S = {
  bg: "#0f172a",
  card: "rgba(30,41,59,0.7)",
  cardBorder: "rgba(71,85,105,0.3)",
  surface: "#1e293b",
  text: "#f1f5f9",
  sub: "#94a3b8",
  dim: "#64748b",
  mono: "'JetBrains Mono',monospace",
  sans: "'DM Sans',sans-serif",
};
const inp = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(71,85,105,0.5)", background: "rgba(15,23,42,0.6)", color: "#f1f5f9", fontSize: 16, fontWeight: 700, fontFamily: S.mono, boxSizing: "border-box" };

/* ═══ COMPONENTS ═══ */
function NF({ value, onCommit, placeholder, style }) {
  const ref = useRef(null);
  const [l, sL] = useState(value ? String(value) : "");
  const lv = useRef(value);
  useEffect(() => { if (lv.current !== value && document.activeElement !== ref.current) sL(value ? String(value) : ""); lv.current = value; }, [value]);
  return <input ref={ref} type="text" inputMode="numeric" pattern="[0-9]*" value={l} placeholder={placeholder || "0"} style={style || inp}
    onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ""); sL(v); onCommit(parseInt(v) || 0); }}
    onBlur={() => { sL(value ? String(value) : ""); lv.current = value; }} />;
}
function TF({ value, onChange, placeholder, style }) { return <input type="text" value={value} placeholder={placeholder} style={style || inp} onChange={e => onChange(e.target.value)} />; }

function EC({ count, onChange, warn }) {
  const [ed, sEd] = useState(false);
  const [l, sL] = useState(String(count));
  const ref = useRef(null);
  useEffect(() => { if (!ed) sL(String(count)); }, [count, ed]);
  useEffect(() => { if (ed && ref.current) { ref.current.focus(); ref.current.select(); } }, [ed]);
  if (ed) return <input ref={ref} type="text" inputMode="numeric" value={l}
    style={{ width: 52, height: 32, textAlign: "center", fontSize: 15, fontWeight: 800, fontFamily: S.mono, border: "2px solid #3b82f6", borderRadius: 8, background: "rgba(59,130,246,0.15)", color: "#f1f5f9", boxSizing: "border-box", outline: "none" }}
    onChange={e => sL(e.target.value.replace(/[^0-9]/g, ""))}
    onBlur={() => { onChange(parseInt(l) || 0); sEd(false); }}
    onKeyDown={e => { if (e.key === "Enter") { onChange(parseInt(l) || 0); sEd(false); } }} />;
  return (<div style={{ display: "flex", alignItems: "center", background: warn ? "rgba(239,68,68,0.15)" : "rgba(51,65,85,0.5)", borderRadius: 8, border: `1px solid ${warn ? "rgba(239,68,68,0.3)" : "rgba(71,85,105,0.3)"}` }}>
    <button onClick={() => onChange(Math.max(0, count - 1))} style={{ width: 32, height: 32, border: "none", background: "transparent", fontSize: 16, cursor: "pointer", color: S.dim, fontWeight: 700 }}>−</button>
    <span onClick={() => sEd(true)} style={{ minWidth: 26, textAlign: "center", fontSize: 15, fontWeight: 800, color: warn ? "#fca5a5" : S.text, fontFamily: S.mono, cursor: "pointer" }}>{count}</span>
    <button onClick={() => onChange(count + 1)} style={{ width: 32, height: 32, border: "none", background: "transparent", fontSize: 16, cursor: "pointer", color: S.dim, fontWeight: 700 }}>+</button>
  </div>);
}

function Card({ children, sx }) { return <div style={{ background: S.card, backdropFilter: "blur(12px)", borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${S.cardBorder}`, ...sx }}>{children}</div>; }
function Lbl({ children }) { return <div style={{ fontSize: 10, fontWeight: 700, color: S.dim, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{children}</div>; }
function Pill({ color, children }) { return <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: color + "22", color }}>{children}</span>; }
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
  const [eZone, setEZone] = useState(null); const [eZN, setEZN] = useState("");
  const [addZoneOpen, setAddZoneOpen] = useState(false); const [nZN, setNZN] = useState("");
  const [addRZ, setAddRZ] = useState(null); const [nRN, setNRN] = useState(""); const [nRT, setNRT] = useState("indirecto");
  const [addDropOpen, setAddDropOpen] = useState(false); const [nDT, setNDT] = useState(""); const [nDN, setNDN] = useState("");
  const [showHL, setShowHL] = useState(false);
  const [hlH, setHlH] = useState(""); const [hlP, setHlP] = useState(0); const [hlC, setHlC] = useState(0);
  const [showDL, setShowDL] = useState(false);
  const [dlP, setDlP] = useState(0); const [dlR, setDlR] = useState(0);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const hAct = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const nowM = now.getHours() * 60 + now.getMinutes();
  const finM = toM(finT);
  const mRest = Math.max(0, finM - nowM);
  const hRest = mRest / 60;

  const g = useCallback(id => staff[id] || 0, [staff]);
  const sc = useCallback((id, v) => setStaff(p => ({ ...p, [id]: Math.max(0, v) })), []);

  const tDir = roles.filter(r => r.type === "directo").reduce((a, r) => a + g(r.id), 0);
  const tInd = roles.filter(r => r.type === "indirecto").reduce((a, r) => a + g(r.id), 0);
  const tExt = roles.filter(r => r.type === "tarea_extra").reduce((a, r) => a + g(r.id), 0);
  const asig = tDir + tInd + tExt;
  const sinA = tG - asig;
  const tpi = tDir > 0 ? (tInd / tDir).toFixed(2) : "—";
  const pAGV = g("picker_agv"), pMan = g("picker_manual");
  const salA = pAGV * objAGV, salM = pMan * objManual, salT = salA + salM;
  const clTot = roles.filter(r => r.z === "clasificacion").reduce((a, r) => a + g(r.id), 0);
  const capH = clTot * capCl;
  const rAGV = g("runner_agv"); const rNeed = pAGV > 0 ? Math.ceil(pAGV / ratioR) : 0;

  // Hourly averages
  const totPicR = hourLogs.reduce((a, l) => a + l.picadas, 0);
  const totClaR = hourLogs.reduce((a, l) => a + l.clasificadas, 0);
  const totHH = hourLogs.length * (tDir + tInd);
  const tphAcum = totHH > 0 ? (totPicR / totHH).toFixed(1) : "—";
  const tClasStaff = roles.filter(r => r.z === "clasificacion").reduce((a, r) => a + g(r.id), 0);
  const avgPicPerPerson = hourLogs.length > 0 && tDir > 0 ? Math.round(totPicR / (hourLogs.length * tDir)) : null;
  const avgClaPerPerson = hourLogs.length > 0 && tClasStaff > 0 ? Math.round(totClaR / (hourLogs.length * tClasStaff)) : null;

  const expectedPH = salT;
  const expectedCH = capH;
  const picarFin = hRest > 0 && salT > 0 ? Math.max(0, pP - salT * hRest) : pP;
  const clasifFin = hRest > 0 && capH > 0 ? Math.max(0, (pC + Math.min(pP, salT * hRest)) - capH * hRest) : pC;
  const rfidFin = hRest > 0 && salT > 0 ? Math.max(0, pR - salT * hRest) : pR;
  const actDrops = [...drops].sort((a, b) => toM(a.time) - toM(b.time));
  const nextDr = actDrops.find(d => toM(d.time) > nowM);
  const mToDr = nextDr ? toM(nextDr.time) - nowM : null;

  const moveZone = (i, d) => { setZones(p => { const n = [...p]; const ni = i + d; if (ni < 0 || ni >= n.length) return p; [n[i], n[ni]] = [n[ni], n[i]]; return n; }); };
  const addHourLog = () => {
    if (!hlH) return;
    const tph = (tDir + tInd) > 0 ? (hlP / (tDir + tInd)).toFixed(1) : "0";
    const avgPic = tDir > 0 ? Math.round(hlP / tDir) : 0;
    const avgCla = tClasStaff > 0 ? Math.round(hlC / tClasStaff) : 0;
    setHourLogs(p => [...p, { id: Date.now(), hora: hlH, picadas: hlP, clasificadas: hlC, personal: asig, dir: tDir, ind: tInd, clasifStaff: tClasStaff, tph, avgPic, avgCla, expectedPic: expectedPH, expectedClas: expectedCH }]);
    setPP(prev => Math.max(0, prev - hlP));
    setPC(prev => Math.max(0, prev - hlC + hlP));
    setHlH(""); setHlP(0); setHlC(0); setShowHL(false);
  };
  const addDropLog = () => {
    setDropLogs(p => [...p, { id: Date.now(), hora: hAct, picar: dlP, clasif: pC, rfid: dlR }]);
    setPP(dlP); setPR(dlR);
    setDlP(0); setDlR(0); setShowDL(false);
  };
  const resetTurno = () => {
    if (!window.confirm("¿Nuevo turno? Se borran datos operativos.")) return;
    setPP(0); setPC(0); setPR(0); setTG(0); setStaff({}); setHourLogs([]); setDropLogs([]);
  };

  const gcol = (z) => ZC[z.ci % ZC.length];

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${S.bg} 0%, #1a1a2e 50%, #16213e 100%)`, fontFamily: S.sans, color: S.text, maxWidth: 480, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ padding: "18px 20px 14px", background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(71,85,105,0.2)", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#3b82f6" }}>CONTROL DE PERSONAL</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg, #f1f5f9, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Export</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#3b82f6", fontFamily: S.mono }}>{hAct}</span>
            {mRest > 0 && <span style={{ fontSize: 11, color: mRest > 60 ? "#10b981" : "#ef4444", fontWeight: 700 }}>~{hRest.toFixed(1)}h</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={resetTurno} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>🔄</button>
          <button onClick={() => setShowCfg(!showCfg)} style={{ background: showCfg ? "rgba(59,130,246,0.2)" : "rgba(51,65,85,0.5)", border: "1px solid rgba(71,85,105,0.3)", color: S.sub, borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⚙</button>
        </div>
      </div>

      {/* CONFIG */}
      {showCfg && (
        <div style={{ padding: "12px 20px 16px", background: "rgba(30,41,59,0.8)", borderBottom: "1px solid rgba(71,85,105,0.2)" }}>
          <Lbl>Productividad (uds/h)</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><label style={{ fontSize: 11, color: "#3b82f6", marginBottom: 4, display: "block", fontWeight: 600 }}>AGV</label><NF value={objAGV} onCommit={setObjAGV} /></div>
            <div><label style={{ fontSize: 11, color: "#10b981", marginBottom: 4, display: "block", fontWeight: 600 }}>Manual</label><NF value={objManual} onCommit={setObjManual} /></div>
          </div>
          <Lbl>Ratios</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><label style={{ fontSize: 10, color: S.dim, marginBottom: 4, display: "block" }}>Pickers/Runner</label><NF value={ratioR} onCommit={v => setRatioR(v || 1)} /></div>
            <div><label style={{ fontSize: 10, color: S.dim, marginBottom: 4, display: "block" }}>Uds/h Clasificador</label><NF value={capCl} onCommit={v => setCapCl(v || 1)} /></div>
          </div>
          <Lbl>Fin de turno (ref.)</Lbl>
          <input type="time" value={finT} onChange={e => setFinT(e.target.value)} style={{ ...inp, marginBottom: 12 }} />
          <Lbl>Horas de caída</Lbl>
          {actDrops.map(d => (
            <div key={d.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: S.mono, minWidth: 50, color: S.text }}>{d.time}</span>
              <span style={{ fontSize: 11, color: S.dim, flex: 1 }}>{d.note}</span>
              <button onClick={() => setDrops(p => p.filter(x => x.id !== d.id))} style={{ background: "none", border: "none", color: S.dim, fontSize: 14, cursor: "pointer" }}>×</button>
            </div>
          ))}
          {!addDropOpen ? <button onClick={() => setAddDropOpen(true)} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Añadir</button>
          : <div style={{ display: "flex", gap: 6 }}>
              <input type="time" value={nDT} onChange={e => setNDT(e.target.value)} style={{ ...inp, fontSize: 12, padding: 6, width: 80 }} />
              <TF value={nDN} onChange={setNDN} placeholder="Nota" style={{ ...inp, fontSize: 12, padding: 6, flex: 1 }} />
              <button onClick={() => { if (nDT) { setDrops(p => [...p, { id: Date.now(), time: nDT, note: nDN }]); setNDT(""); setNDN(""); setAddDropOpen(false); } }} style={{ border: "none", background: "#3b82f6", color: "#fff", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+</button>
              <button onClick={() => setAddDropOpen(false)} style={{ border: "none", background: "rgba(51,65,85,0.5)", color: S.dim, borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
            </div>}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", padding: "0 16px", background: "rgba(15,23,42,0.6)", borderBottom: "1px solid rgba(71,85,105,0.2)" }}>
        {[["dashboard", "Dashboard"], ["turno", "Turno"], ["situacion", "Situación"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: "12px 12px", border: "none", background: "transparent", color: tab === id ? "#3b82f6" : S.dim, fontSize: 13, fontWeight: 700, cursor: "pointer", borderBottom: tab === id ? "2px solid #3b82f6" : "2px solid transparent", flex: 1, textAlign: "center" }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: "16px 20px 100px" }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab === "dashboard" && (<>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
            {[{ l: "Por Picar", v: pP, c: "#ef4444" }, { l: "Por Clasif.", v: pC, c: "#f59e0b" }, { l: "Pdt RFID", v: pR, c: "#a78bfa" }, { l: "Personas", v: asig, c: "#3b82f6" }].map(k => (
              <div key={k.l} style={{ background: S.card, borderRadius: 12, padding: "10px 4px", textAlign: "center", border: `1px solid ${S.cardBorder}` }}>
                <div style={{ fontSize: 8, color: S.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{k.l}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: k.c, fontFamily: S.mono, marginTop: 3 }}>{k.v.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Staff table */}
          {asig > 0 && (
            <Card>
              <Lbl>Personal</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: TC.directo, marginBottom: 6 }}>DIRECTOS <span style={{ fontFamily: S.mono }}>{tDir}</span></div>
                  {roles.filter(r => r.type === "directo").map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
                      <span style={{ color: S.sub }}>{r.icon} {r.name}</span>
                      <span style={{ fontWeight: 800, fontFamily: S.mono, color: TC.directo }}>{g(r.id)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: TC.indirecto, marginBottom: 6 }}>INDIRECTOS <span style={{ fontFamily: S.mono }}>{tInd}</span></div>
                  {roles.filter(r => r.type === "indirecto").map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
                      <span style={{ color: S.sub }}>{r.icon} {r.name}</span>
                      <span style={{ fontWeight: 800, fontFamily: S.mono, color: TC.indirecto }}>{g(r.id)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {tExt > 0 && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(71,85,105,0.3)", fontSize: 10, color: TC.tarea_extra, fontWeight: 700 }}>EXTRA ({tExt}) — no cuenta para TPH</div>}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(71,85,105,0.3)", fontSize: 12, fontWeight: 700 }}>
                <span style={{ color: S.sub }}>TPI <span style={{ fontFamily: S.mono, color: tDir > 0 && tInd / tDir > 0.5 ? "#ef4444" : "#10b981" }}>{tpi}</span></span>
                <span>{sinA === 0 && tG > 0 ? <span style={{ color: "#10b981" }}>✓</span> : sinA > 0 ? <span style={{ color: "#f59e0b" }}>{sinA} libres</span> : sinA < 0 ? <span style={{ color: "#ef4444" }}>{Math.abs(sinA)} extra</span> : null}</span>
              </div>
            </Card>
          )}

          {/* Flow */}
          {salT > 0 && (
            <Card>
              <Lbl>Flujo operativo</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div style={{ background: "rgba(59,130,246,0.1)", borderRadius: 12, padding: 10, textAlign: "center", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>SALIDA PICADA</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#3b82f6", fontFamily: S.mono }}>{salT.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: S.dim }}>uds/h esperadas</div>
                </div>
                <div style={{ background: capH >= salT + pC ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderRadius: 12, padding: 10, textAlign: "center", border: `1px solid ${capH >= salT + pC ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                  <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>CAP. CLASIFICAR</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: capH >= salT + pC ? "#10b981" : "#ef4444", fontFamily: S.mono }}>{capH.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: S.dim }}>uds/h</div>
                </div>
              </div>
              {pAGV > 0 && rAGV < rNeed && <div style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>🏃 Runners: {rAGV}/{rNeed}</div>}
              {capH < salT + pC ? <div style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>⚠ Cuello de botella clasificación</div>
                : clTot > 0 && <div style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "rgba(16,185,129,0.1)", color: "#6ee7b7" }}>✓ Clasificación absorbe</div>}
            </Card>
          )}

          {/* Productivity averages */}
          {(tDir + tInd) > 0 && (
            <Card sx={{ borderLeft: "3px solid #14b8a6" }}>
              <Lbl>Productividad</Lbl>
              {/* TPH */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: "rgba(20,184,166,0.1)", borderRadius: 12, padding: 10, textAlign: "center", border: "1px solid rgba(20,184,166,0.2)" }}>
                  <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>TPH ESPERADO</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#14b8a6", fontFamily: S.mono, marginTop: 2 }}>{salT > 0 ? (salT / (tDir + tInd)).toFixed(1) : "—"}</div>
                </div>
                <div style={{ background: hourLogs.length > 0 ? "rgba(20,184,166,0.1)" : "rgba(51,65,85,0.3)", borderRadius: 12, padding: 10, textAlign: "center", border: `1px solid ${hourLogs.length > 0 ? "rgba(20,184,166,0.2)" : "rgba(71,85,105,0.2)"}` }}>
                  <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>TPH REAL</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: hourLogs.length > 0 ? "#14b8a6" : S.dim, fontFamily: S.mono, marginTop: 2 }}>{tphAcum}</div>
                  <div style={{ fontSize: 9, color: S.dim }}>{hourLogs.length > 0 ? `${hourLogs.length}h registradas` : "Sin datos"}</div>
                </div>
              </div>
              {/* Per-person averages */}
              {hourLogs.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: S.dim, letterSpacing: 1, marginBottom: 8 }}>MEDIA POR PERSONA (ACUMULADO)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <div style={{ background: "rgba(59,130,246,0.08)", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(59,130,246,0.15)" }}>
                      <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>PICADAS/PICKER·H</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#3b82f6", fontFamily: S.mono, marginTop: 2 }}>{avgPicPerPerson !== null ? avgPicPerPerson : "—"}</div>
                      <div style={{ fontSize: 9, color: S.dim }}>{totPicR.toLocaleString()} / {hourLogs.length * tDir} picker·h</div>
                    </div>
                    <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(245,158,11,0.15)" }}>
                      <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>CLASIF/CLASIF·H</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b", fontFamily: S.mono, marginTop: 2 }}>{avgClaPerPerson !== null ? avgClaPerPerson : "—"}</div>
                      <div style={{ fontSize: 9, color: S.dim }}>{totClaR.toLocaleString()} / {hourLogs.length * tClasStaff} clasif·h</div>
                    </div>
                  </div>
                  {/* Totals */}
                  <div style={{ background: "rgba(51,65,85,0.3)", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: S.sub }}>Total acumulado</span>
                    <span style={{ fontFamily: S.mono, fontWeight: 700 }}>
                      <span style={{ color: "#3b82f6" }}>{totPicR.toLocaleString()}</span>
                      <span style={{ color: S.dim }}> pic · </span>
                      <span style={{ color: "#f59e0b" }}>{totClaR.toLocaleString()}</span>
                      <span style={{ color: S.dim }}> cla</span>
                    </span>
                  </div>
                </>
              )}
            </Card>
          )}

          {/* Next drop */}
          {nextDr && <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, border: "1px solid rgba(245,158,11,0.2)", fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: "#fbbf24" }}>⏰ {nextDr.time}</span>
            <span style={{ color: S.dim, marginLeft: 6 }}>({mToDr < 60 ? `${mToDr}min` : `${(mToDr / 60).toFixed(1)}h`})</span>
            {nextDr.note && <span style={{ color: "#f59e0b", marginLeft: 6, fontSize: 10 }}>{nextDr.note}</span>}
          </div>}

          {/* Projection */}
          {salT > 0 && (pP > 0 || pC > 0) && hRest > 0 && (
            <Card sx={{ borderLeft: "3px solid #3b82f6" }}>
              <Lbl>Proyección ~{finT}</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {[{ l: "Picar", v: picarFin, c: "#ef4444" }, { l: "Clasif.", v: clasifFin, c: "#f59e0b" }, { l: "RFID", v: rfidFin, c: "#a78bfa" }].map(k => (
                  <div key={k.l} style={{ background: k.v > 0 ? `${k.c}11` : "rgba(16,185,129,0.08)", borderRadius: 10, padding: "8px 4px", textAlign: "center", border: `1px solid ${k.v > 0 ? k.c + "33" : "rgba(16,185,129,0.2)"}` }}>
                    <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>{k.l}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: k.v > 0 ? k.c : "#10b981", fontFamily: S.mono, marginTop: 2 }}>{Math.round(k.v).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Distribution */}
          {asig > 0 && (
            <Card>
              <Lbl>Distribución</Lbl>
              <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                {zones.map(z => { const c = roles.filter(r => r.z === z.id).reduce((a, r) => a + g(r.id), 0); const p = (c / asig) * 100; if (p === 0) return null; return <div key={z.id} style={{ width: `${p}%`, background: gcol(z) }} />; })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {zones.map(z => { const c = roles.filter(r => r.z === z.id).reduce((a, r) => a + g(r.id), 0); if (c === 0) return null; return <div key={z.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}><div style={{ width: 8, height: 8, borderRadius: 2, background: gcol(z) }} /><span style={{ fontSize: 11, color: S.sub }}>{z.name}</span><span style={{ fontSize: 12, fontWeight: 800, color: S.text, marginLeft: "auto", fontFamily: S.mono }}>{c}</span></div>; })}
              </div>
            </Card>
          )}

          {asig === 0 && pP === 0 && (
            <Card sx={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.6 }}>👋</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: S.sub }}>Inicio de turno</div>
              <div style={{ fontSize: 12, color: S.dim, marginTop: 4 }}>Ve a <b style={{ color: S.text }}>Turno</b> para empezar</div>
            </Card>
          )}
        </>)}

        {/* ═══ TURNO ═══ */}
        {tab === "turno" && (<>
          <Card>
            <Lbl>¿Qué tienes?</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><label style={{ fontSize: 10, color: "#ef4444", display: "block", marginBottom: 4, fontWeight: 600 }}>Pend. picar</label><NF value={pP} onCommit={setPP} style={{ ...inp, fontSize: 16, textAlign: "center", padding: 10 }} /></div>
              <div><label style={{ fontSize: 10, color: "#f59e0b", display: "block", marginBottom: 4, fontWeight: 600 }}>Pend. clasif.</label><NF value={pC} onCommit={setPC} style={{ ...inp, fontSize: 16, textAlign: "center", padding: 10 }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={{ fontSize: 10, color: "#a78bfa", display: "block", marginBottom: 4, fontWeight: 600 }}>Pend. RFID</label><NF value={pR} onCommit={setPR} style={{ ...inp, fontSize: 16, textAlign: "center", padding: 10 }} /></div>
              <div><label style={{ fontSize: 10, color: "#3b82f6", display: "block", marginBottom: 4, fontWeight: 600 }}>Personas</label><NF value={tG} onCommit={setTG} style={{ ...inp, fontSize: 16, textAlign: "center", padding: 10 }} /></div>
            </div>
          </Card>

          {tG > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: sinA === 0 ? "rgba(16,185,129,0.1)" : sinA < 0 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, border: `1px solid ${sinA === 0 ? "rgba(16,185,129,0.2)" : sinA < 0 ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: sinA === 0 ? "#6ee7b7" : sinA < 0 ? "#fca5a5" : "#fcd34d" }}>{sinA === 0 ? "✓ Todos" : sinA > 0 ? `${sinA} libres` : `${Math.abs(sinA)} extra`}</span>
              <div style={{ display: "flex", gap: 6, fontSize: 11 }}>
                <Pill color={TC.directo}>{tDir} dir</Pill>
                <Pill color={TC.indirecto}>{tInd} ind</Pill>
                {tExt > 0 && <Pill color={TC.tarea_extra}>{tExt} ext</Pill>}
              </div>
            </div>
          )}

          {salT > 0 && (
            <Card>
              <Lbl>Impacto</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "rgba(59,130,246,0.1)", borderRadius: 10, padding: 10, textAlign: "center" }}><div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>SALIDA</div><div style={{ fontSize: 22, fontWeight: 800, color: "#3b82f6", fontFamily: S.mono }}>{salT.toLocaleString()}</div><div style={{ fontSize: 9, color: S.dim }}>uds/h</div></div>
                <div style={{ background: "rgba(16,185,129,0.1)", borderRadius: 10, padding: 10, textAlign: "center" }}><div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>CAP. CLASIF.</div><div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", fontFamily: S.mono }}>{capH.toLocaleString()}</div><div style={{ fontSize: 9, color: S.dim }}>uds/h</div></div>
              </div>
            </Card>
          )}

          {/* Zones */}
          {zones.map((zone, zi) => {
            const zr = roles.filter(r => r.z === zone.id); const col = gcol(zone);
            const zt = zr.reduce((a, r) => a + g(r.id), 0);
            const isEd = eZone === zone.id;
            return (
              <div key={zone.id} style={{ background: S.card, borderRadius: 14, marginBottom: 8, border: `1px solid ${S.cardBorder}`, overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", background: col + "15", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${col}22` }}>
                  {isEd ? (
                    <div style={{ display: "flex", gap: 4, flex: 1, alignItems: "center" }}>
                      <TF value={eZN} onChange={setEZN} placeholder="Nombre" style={{ ...inp, fontSize: 12, padding: "5px 8px", flex: 1 }} />
                      <button onClick={() => { if (eZN.trim()) { setZones(p => p.map(z => z.id === zone.id ? { ...z, name: eZN.trim() } : z)); setEZone(null); } }} style={{ border: "none", background: "#10b981", color: "#fff", borderRadius: 6, padding: "5px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✓</button>
                      <button onClick={() => setEZone(null)} style={{ border: "none", background: "rgba(51,65,85,0.5)", color: S.dim, borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
                    </div>
                  ) : (<>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <button onClick={() => moveZone(zi, -1)} style={{ background: "none", border: "none", color: S.dim, fontSize: 9, cursor: "pointer", padding: 0, lineHeight: 1 }}>▲</button>
                        <button onClick={() => moveZone(zi, 1)} style={{ background: "none", border: "none", color: S.dim, fontSize: 9, cursor: "pointer", padding: 0, lineHeight: 1 }}>▼</button>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: col, textTransform: "uppercase", letterSpacing: 1 }}>{zone.name}</span>
                      <button onClick={() => { setEZone(zone.id); setEZN(zone.name); }} style={{ background: "none", border: "none", color: S.dim, fontSize: 10, cursor: "pointer" }}>✏️</button>
                      {zr.length === 0 && <button onClick={() => setZones(p => p.filter(z => z.id !== zone.id))} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 10, cursor: "pointer" }}>🗑</button>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: col, fontFamily: S.mono }}>{zt}</span>
                  </>)}
                </div>
                <div style={{ padding: "2px 12px" }}>
                  {zr.map(role => (
                    <div key={role.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 2px", borderBottom: `1px solid ${S.cardBorder}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13 }}>{role.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: S.sub }}>{role.name}</span>
                        <Pill color={TC[role.type]}>{TL[role.type]}</Pill>
                        <button onClick={() => { setRoles(p => p.filter(r => r.id !== role.id)); setStaff(p => { const n = { ...p }; delete n[role.id]; return n; }); }} style={{ background: "none", border: "none", color: S.dim, fontSize: 11, cursor: "pointer" }}>×</button>
                      </div>
                      <EC count={g(role.id)} onChange={v => sc(role.id, v)} warn={sinA < 0} />
                    </div>
                  ))}
                  {addRZ === zone.id ? (
                    <div style={{ padding: "6px 0" }}>
                      <TF value={nRN} onChange={setNRN} placeholder="Nombre del rol" style={{ ...inp, fontSize: 12, padding: "6px 8px", marginBottom: 6 }} />
                      <div style={{ display: "flex", gap: 4 }}>
                        <select value={nRT} onChange={e => setNRT(e.target.value)} style={{ padding: "5px 6px", borderRadius: 6, border: `1px solid ${S.cardBorder}`, background: S.surface, color: S.text, fontSize: 11 }}>
                          <option value="directo">Directo</option><option value="indirecto">Indirecto</option><option value="tarea_extra">Tarea Extra</option>
                        </select>
                        <button onClick={() => { if (nRN.trim()) { setRoles(p => [...p, { id: "r_" + Date.now(), name: nRN.trim(), z: zone.id, type: nRT, icon: "👤" }]); setNRN(""); setNRT("indirecto"); setAddRZ(null); } }} style={{ border: "none", background: col, color: "#fff", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Añadir</button>
                        <button onClick={() => { setAddRZ(null); setNRN(""); }} style={{ border: `1px solid ${S.cardBorder}`, background: "transparent", color: S.dim, borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setAddRZ(zone.id); setNRN(""); setNRT("indirecto"); }} style={{ width: "100%", padding: 5, border: "none", background: "transparent", color: S.dim, fontSize: 10, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>+ Añadir rol</button>
                  )}
                </div>
              </div>
            );
          })}

          {!addZoneOpen ? (
            <button onClick={() => setAddZoneOpen(true)} style={{ width: "100%", padding: 12, borderRadius: 12, border: `2px dashed ${S.cardBorder}`, background: "transparent", color: S.dim, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Añadir departamento</button>
          ) : (
            <Card>
              <TF value={nZN} onChange={setNZN} placeholder="Nombre del departamento" style={{ ...inp, marginBottom: 10, fontSize: 14 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { if (nZN.trim()) { setZones(p => [...p, { id: "z_" + Date.now(), name: nZN.trim(), ci: zones.length % ZC.length }]); setNZN(""); setAddZoneOpen(false); } }} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Crear</button>
                <button onClick={() => { setAddZoneOpen(false); setNZN(""); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${S.cardBorder}`, background: "transparent", color: S.dim, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              </div>
            </Card>
          )}
        </>)}

        {/* ═══ SITUACIÓN ═══ */}
        {tab === "situacion" && (<>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Lbl>Estado — {hAct}</Lbl>
              <Pill color="#3b82f6">{asig} personas</Pill>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[{ l: "Por Picar", v: pP, c: "#ef4444" }, { l: "Por Clasif.", v: pC, c: "#f59e0b" }, { l: "Pdt RFID", v: pR, c: "#a78bfa" }].map(k => (
                <div key={k.l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: S.dim, fontWeight: 700, textTransform: "uppercase" }}>{k.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: k.c, fontFamily: S.mono, marginTop: 4 }}>{k.v.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <button onClick={() => { setShowHL(true); setShowDL(false); }} style={{ padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>⏱ Registro hora</button>
            <button onClick={() => { setShowDL(true); setShowHL(false); }} style={{ padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>📦 Caída</button>
          </div>

          {showHL && (
            <Card sx={{ borderColor: "rgba(59,130,246,0.3)" }}>
              <Lbl>¿Qué se ha hecho esta hora?</Lbl>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 4 }}>Hora</label>
                <input type="time" value={hlH} onChange={e => setHlH(e.target.value)} style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: "#ef4444", display: "block", marginBottom: 4 }}>Uds picadas</label><NF value={hlP} onCommit={setHlP} /></div>
                <div><label style={{ fontSize: 10, color: "#f59e0b", display: "block", marginBottom: 4 }}>Uds clasificadas</label><NF value={hlC} onCommit={setHlC} /></div>
              </div>
              <div style={{ fontSize: 11, color: S.dim, marginBottom: 10, background: "rgba(51,65,85,0.3)", padding: 8, borderRadius: 8 }}>
                Esperado: <b style={{ color: "#3b82f6" }}>{salT.toLocaleString()}</b> pic · <b style={{ color: "#10b981" }}>{capH.toLocaleString()}</b> cla
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addHourLog} style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Guardar</button>
                <button onClick={() => setShowHL(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${S.cardBorder}`, background: "transparent", color: S.dim, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              </div>
            </Card>
          )}

          {showDL && (
            <Card sx={{ borderColor: "rgba(245,158,11,0.3)" }}>
              <Lbl>Actualización de caída — {hAct}</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: "#ef4444", display: "block", marginBottom: 4 }}>Pend. picar (acumulado)</label><NF value={dlP} onCommit={setDlP} /></div>
                <div><label style={{ fontSize: 10, color: "#a78bfa", display: "block", marginBottom: 4 }}>Pend. RFID (acumulado)</label><NF value={dlR} onCommit={setDlR} /></div>
              </div>
              <div style={{ fontSize: 11, color: S.dim, marginBottom: 10, background: "rgba(51,65,85,0.3)", padding: 8, borderRadius: 8 }}>
                Pend. clasificar se mantiene: <b style={{ color: "#f59e0b" }}>{pC.toLocaleString()}</b>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addDropLog} style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#f59e0b", color: "#000", fontWeight: 700, cursor: "pointer" }}>Guardar</button>
                <button onClick={() => setShowDL(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${S.cardBorder}`, background: "transparent", color: S.dim, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              </div>
            </Card>
          )}

          {hourLogs.length > 0 && (
            <Card>
              <Lbl>Registro por horas</Lbl>
              {hourLogs.map((l, i) => {
                const dP = l.picadas - l.expectedPic, dC = l.clasificadas - l.expectedClas;
                return (
                  <div key={l.id} style={{ padding: "8px 0", borderBottom: i < hourLogs.length - 1 ? `1px solid ${S.cardBorder}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: S.text }}>{l.hora}</span>
                        <Pill color="#14b8a6">TPH {l.tph}</Pill>
                        {l.avgPic !== undefined && <Pill color="#3b82f6">{l.avgPic}/pic</Pill>}
                        {l.avgCla !== undefined && <Pill color="#f59e0b">{l.avgCla}/cla</Pill>}
                      </div>
                      <button onClick={() => setHourLogs(p => p.filter(x => x.id !== l.id))} style={{ background: "none", border: "none", color: S.dim, fontSize: 14, cursor: "pointer" }}>🗑</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6, fontSize: 11 }}>
                      <div>
                        <span style={{ color: S.dim }}>Pic: </span>
                        <span style={{ fontWeight: 700, fontFamily: S.mono, color: "#3b82f6" }}>{l.picadas.toLocaleString()}</span>
                        <span style={{ fontSize: 9, color: dP >= 0 ? "#10b981" : "#ef4444", marginLeft: 3 }}>{dP >= 0 ? "+" : ""}{dP.toLocaleString()}</span>
                      </div>
                      <div>
                        <span style={{ color: S.dim }}>Cla: </span>
                        <span style={{ fontWeight: 700, fontFamily: S.mono, color: "#f59e0b" }}>{l.clasificadas.toLocaleString()}</span>
                        <span style={{ fontSize: 9, color: dC >= 0 ? "#10b981" : "#ef4444", marginLeft: 3 }}>{dC >= 0 ? "+" : ""}{dC.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ paddingTop: 8, borderTop: `1px solid ${S.cardBorder}`, marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                <span style={{ color: S.sub }}>Acum. {hourLogs.length}h</span>
                <span style={{ fontFamily: S.mono }}>
                  <span style={{ color: "#3b82f6" }}>{totPicR.toLocaleString()}</span>
                  <span style={{ color: S.dim }}> · </span>
                  <span style={{ color: "#f59e0b" }}>{totClaR.toLocaleString()}</span>
                  <span style={{ color: S.dim }}> · TPH </span>
                  <span style={{ color: "#14b8a6" }}>{tphAcum}</span>
                </span>
              </div>
            </Card>
          )}

          {dropLogs.length > 0 && (
            <Card>
              <Lbl>Actualizaciones de caída</Lbl>
              {dropLogs.map((d, i) => {
                const prev = i > 0 ? dropLogs[i - 1] : null;
                const dp = prev ? d.picar - prev.picar : 0;
                return (
                  <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < dropLogs.length - 1 ? `1px solid ${S.cardBorder}` : "none" }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: S.text }}>{d.hora}</span>
                      <div style={{ fontSize: 11, fontFamily: S.mono, marginTop: 2, display: "flex", gap: 6 }}>
                        <span style={{ color: "#ef4444" }}>{d.picar.toLocaleString()}{prev && <span style={{ fontSize: 9, color: dp > 0 ? "#ef4444" : "#10b981", marginLeft: 2 }}>{dp > 0 ? "+" : ""}{dp.toLocaleString()}</span>}</span>
                        <span style={{ color: "#f59e0b" }}>{d.clasif.toLocaleString()}</span>
                        <span style={{ color: "#a78bfa" }}>{d.rfid.toLocaleString()}</span>
                      </div>
                    </div>
                    <button onClick={() => setDropLogs(p => p.filter(x => x.id !== d.id))} style={{ background: "none", border: "none", color: S.dim, fontSize: 14, cursor: "pointer" }}>🗑</button>
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
