import React, { useState, useCallback, useRef, useEffect } from "react";

/* ═══ SUPABASE ═══ */
const SB = "https://izqihthvpiblgftrthpk.supabase.co";
const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cWlodGh2cGlibGdmdHJ0aHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzI0NDksImV4cCI6MjA5MzA0ODQ0OX0.QtHFCTrvwFNv8W7_OlRmKuTr9J7GWwFFWpA0UDUDa0o";
const SH = { "apikey": SK, "Authorization": `Bearer ${SK}`, "Content-Type": "application/json", "Prefer": "return=representation" };

async function sbGet(table, query = "") {
  try { const r = await fetch(`${SB}/rest/v1/${table}?${query}&select=*`, { headers: SH }); return await r.json(); } catch { return null; }
}
async function sbPatch(table, match, data) {
  try { await fetch(`${SB}/rest/v1/${table}?${match}`, { method: "PATCH", headers: SH, body: JSON.stringify(data) }); } catch {}
}
async function sbInsert(table, data) {
  try { await fetch(`${SB}/rest/v1/${table}`, { method: "POST", headers: SH, body: JSON.stringify(data) }); } catch {}
}
async function sbDelete(table, match) {
  try { await fetch(`${SB}/rest/v1/${table}?${match}`, { method: "DELETE", headers: SH }); } catch {}
}

/* ═══ DEFAULTS ═══ */
const DEF_ZONES = [
  { id: "clasificacion", name: "Clasificación", ci: 0 },
  { id: "facturacion", name: "Facturación", ci: 1 },
  { id: "runner", name: "Runner", ci: 2 },
  { id: "pesaje", name: "Pesaje de Bultos", ci: 3 },
  { id: "pt_agv", name: "PT - AGV", ci: 4 },
  { id: "clerk", name: "Clerk", ci: 5 },
  { id: "rfid", name: "RFID", ci: 6 },
  { id: "reasignacion", name: "Reasignación", ci: 7 },
  { id: "pt_manual", name: "PT Manual", ci: 0 },
  { id: "extra", name: "Extra", ci: 3 },
];
const DEF_ROLES = [
  { id: "clasificacion_op", name: "Clasificación", z: "clasificacion", type: "indirecto", icon: "📋" },
  { id: "facturacion_op", name: "Facturación", z: "facturacion", type: "indirecto", icon: "🧾" },
  { id: "runner_op", name: "Runner", z: "runner", type: "indirecto", icon: "🏃" },
  { id: "pesaje_op", name: "Pesaje", z: "pesaje", type: "indirecto", icon: "⚖️" },
  { id: "pt_agv_op", name: "PT AGV", z: "pt_agv", type: "directo", icon: "🤖" },
  { id: "clerk_op", name: "Clerk", z: "clerk", type: "indirecto", icon: "🖥️" },
  { id: "rfid_op", name: "RFID", z: "rfid", type: "indirecto", icon: "📡" },
  { id: "reasignacion_op", name: "Reasignación", z: "reasignacion", type: "indirecto", icon: "🔄" },
  { id: "pt_manual_op", name: "PT Manual", z: "pt_manual", type: "directo", icon: "📦" },
  { id: "extra_op", name: "Extra", z: "extra", type: "tarea_extra", icon: "➕" },
];
const ZC = ["#3b82f6","#8b5cf6","#f59e0b","#10b981","#ef4444","#6366f1","#14b8a6","#f97316"];
const TC = { directo: "#3b82f6", indirecto: "#a78bfa", tarea_extra: "#fbbf24" };
const TL = { directo: "DIR", indirecto: "IND", tarea_extra: "EXTRA" };
const S = { bg: "#0f172a", card: "rgba(30,41,59,0.7)", cardBorder: "rgba(71,85,105,0.3)", surface: "#1e293b", text: "#f1f5f9", sub: "#94a3b8", dim: "#64748b", mono: "'JetBrains Mono',monospace", sans: "'DM Sans',sans-serif" };
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
function TimeF({ value, onChange, style }) {
  const handleChange = (e) => {
    let v = e.target.value.replace(/[^0-9:]/g, "");
    // Remove all colons to work with raw digits
    const digits = v.replace(/:/g, "");
    if (digits.length >= 3) {
      v = digits.slice(0, 2) + ":" + digits.slice(2, 4);
    } else {
      v = digits;
    }
    if (v.length > 5) v = v.slice(0, 5);
    onChange(v);
  };
  return <input type="text" inputMode="numeric" value={value} placeholder="HH:MM" style={style || inp} onChange={handleChange} />;
}
function EC({ count, onChange, warn }) {
  const [ed, sEd] = useState(false); const [l, sL] = useState(String(count)); const ref = useRef(null);
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
function toM(t) { if (!t || !t.includes(":")) return 0; const p = t.split(":").map(Number); return p[0] * 60 + (p[1] || 0); }

/* ═══ PASSWORD GATE ═══ */
const PASS_HASH = "a3f2b8c1d9e7"; // simple hash of TurnoAM2026
function hashPass(p) { let h = 0; for (let i = 0; i < p.length; i++) { h = ((h << 5) - h) + p.charCodeAt(i); h |= 0; } return Math.abs(h).toString(16); }
const CORRECT_HASH = hashPass("TurnoAM2026");

function LoginGate({ children }) {
  const [auth, setAuth] = useState(() => {
    try { return sessionStorage.getItem("exp_auth") === CORRECT_HASH; } catch { return false; }
  });
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  if (auth) return children;

  const tryLogin = () => {
    if (hashPass(pw) === CORRECT_HASH) {
      try { sessionStorage.setItem("exp_auth", CORRECT_HASH); } catch {}
      setAuth(true);
    } else { setErr(true); setPw(""); }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #0f172a 0%, #1a1a2e 50%, #16213e 100%)`, fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet" />
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#3b82f6", marginBottom: 8 }}>CONTROL DE PERSONAL</div>
      <div style={{ fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg, #f1f5f9, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 30 }}>Export</div>
      <div style={{ width: "100%", maxWidth: 300 }}>
        <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(false); }}
          onKeyDown={e => { if (e.key === "Enter") tryLogin(); }}
          placeholder="Contraseña"
          style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1px solid ${err ? "rgba(239,68,68,0.5)" : "rgba(71,85,105,0.5)"}`, background: "rgba(15,23,42,0.6)", color: "#f1f5f9", fontSize: 16, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box", textAlign: "center", outline: "none" }} />
        {err && <div style={{ textAlign: "center", color: "#ef4444", fontSize: 12, fontWeight: 600, marginTop: 8 }}>Contraseña incorrecta</div>}
        <button onClick={tryLogin}
          style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 12 }}>Entrar</button>
      </div>
    </div>
  );
}

/* ═══ APP ═══ */
function App() {
  const [zones] = useState(DEF_ZONES);
  const [roles, setRoles] = useState(DEF_ROLES);
  const [staff, setStaff] = useState({});
  const [objAGV] = useState(172);
  const [objManual] = useState(80);
  const [ratioR] = useState(6);
  const [capCl] = useState(300);
  const [finT] = useState("14:00");
  const [pP, setPP] = useState(0);
  const [pC, setPC] = useState(0);
  const [pR, setPR] = useState(0);
  const [tG, setTG] = useState(0);
  const [hourLogs, setHourLogs] = useState([]);
  const [dropLogs, setDropLogs] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [showCfg, setShowCfg] = useState(false);
  const [now, setNow] = useState(new Date());
  const [syncStatus, setSyncStatus] = useState("...");

  // Edit states
  const [addRZ, setAddRZ] = useState(null); const [nRN, setNRN] = useState(""); const [nRT, setNRT] = useState("indirecto");
  const [showHL, setShowHL] = useState(false);
  const [hlH, setHlH] = useState(""); const [hlP, setHlP] = useState(0); const [hlC, setHlC] = useState(0);
  const [showDL, setShowDL] = useState(false);
  const [dlP, setDlP] = useState(0); const [dlR, setDlR] = useState(0);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [nRCut, setNRCut] = useState(""); const [nRDest, setNRDest] = useState(""); const [nRFme, setNRFme] = useState(""); const [nRCua, setNRCua] = useState(""); const [nRSal, setNRSal] = useState("");
  const [routeImgLoading, setRouteImgLoading] = useState(false);
  const [routeImgError, setRouteImgError] = useState(null);
  const routeCamRef = useRef(null);
  const routeGalRef = useRef(null);
  const [editRoute, setEditRoute] = useState(null);
  const [erCut, setErCut] = useState(""); const [erDest, setErDest] = useState(""); const [erFme, setErFme] = useState(""); const [erCua, setErCua] = useState(""); const [erSal, setErSal] = useState(""); const [erCom, setErCom] = useState("");

  // Clock
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const hAct = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const nowM = now.getHours() * 60 + now.getMinutes();
  const finM = toM(finT);
  const mRest = Math.max(0, finM - nowM);
  const hRest = mRest / 60;

  // ═══ SYNC: Load + Poll ═══
  const loadAll = useCallback(async () => {
    const t = await sbGet("turno", "id=eq.current");
    if (t && t[0]) {
      setPP(t[0].pend_picar || 0); setPC(t[0].pend_clasif || 0); setPR(t[0].pend_rfid || 0);
      setTG(t[0].total_gente || 0); setStaff(t[0].staff || {});
    }
    const hl = await sbGet("hour_logs", "order=id.asc");
    if (hl) setHourLogs(hl.map(l => ({ id: l.id, hora: l.hora, picadas: l.picadas, clasificadas: l.clasificadas, personal: l.personal, dir: l.dir, ind: l.ind, clasifStaff: l.clasif_staff, tph: l.tph, avgPic: l.avg_pic, avgCla: l.avg_cla, expectedPic: l.expected_pic, expectedClas: l.expected_clas })));
    const dl = await sbGet("drop_logs", "order=id.asc");
    if (dl) setDropLogs(dl.map(d => ({ id: d.id, hora: d.hora, picar: d.picar, clasif: d.clasif, rfid: d.rfid })));
    const rt = await sbGet("routes", "order=id.asc");
    if (rt) setRoutes(rt.map(r => ({ id: r.id, cutoff: r.cutoff, dest: r.dest, fme: r.fme, cuadre: r.cuadre, salida: r.salida, status: r.status, checks: r.checks || {}, comment: r.comment })));
    setSyncStatus("✓");
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { const t = setInterval(loadAll, 4000); return () => clearInterval(t); }, [loadAll]);

  // Save turno to Supabase
  const saveTurno = useCallback((pp, pc, pr, tg, st) => {
    sbPatch("turno", "id=eq.current", { pend_picar: pp, pend_clasif: pc, pend_rfid: pr, total_gente: tg, staff: st, updated_at: new Date().toISOString() });
  }, []);

  const g = useCallback(id => staff[id] || 0, [staff]);
  const sc = useCallback((id, v) => {
    setStaff(prev => {
      const next = { ...prev, [id]: Math.max(0, v) };
      saveTurno(pP, pC, pR, tG, next);
      return next;
    });
  }, [pP, pC, pR, tG, saveTurno]);

  const updatePP = (v) => { setPP(v); saveTurno(v, pC, pR, tG, staff); };
  const updatePC = (v) => { setPC(v); saveTurno(pP, v, pR, tG, staff); };
  const updatePR = (v) => { setPR(v); saveTurno(pP, pC, v, tG, staff); };
  const updateTG = (v) => { setTG(v); saveTurno(pP, pC, pR, v, staff); };

  // Calculations
  const tDir = roles.filter(r => r.type === "directo").reduce((a, r) => a + g(r.id), 0);
  const tInd = roles.filter(r => r.type === "indirecto").reduce((a, r) => a + g(r.id), 0);
  const tExt = roles.filter(r => r.type === "tarea_extra").reduce((a, r) => a + g(r.id), 0);
  const asig = tDir + tInd + tExt;
  const sinA = tG - asig;
  const tpi = tDir > 0 ? (tInd / tDir).toFixed(2) : "—";
  const pAGV = g("pt_agv_op"), pMan = g("pt_manual_op");
  const salA = pAGV * objAGV, salM = pMan * objManual, salT = salA + salM;
  const clTot = roles.filter(r => r.z === "clasificacion").reduce((a, r) => a + g(r.id), 0);
  const capH = clTot * capCl;
  const rAGV = g("runner_op"); const rNeed = pAGV > 0 ? Math.ceil(pAGV / ratioR) : 0;
  const tClasStaff = roles.filter(r => r.z === "clasificacion").reduce((a, r) => a + g(r.id), 0);

  const totPicR = hourLogs.reduce((a, l) => a + l.picadas, 0);
  const totClaR = hourLogs.reduce((a, l) => a + l.clasificadas, 0);
  const totHH = hourLogs.length * (tDir + tInd);
  const tphAcum = totHH > 0 ? (totPicR / totHH).toFixed(1) : "—";
  const avgPicPP = hourLogs.length > 0 && tDir > 0 ? Math.round(totPicR / (hourLogs.length * tDir)) : null;
  const avgClaPP = hourLogs.length > 0 && tClasStaff > 0 ? Math.round(totClaR / (hourLogs.length * tClasStaff)) : null;

  const expectedPH = salT; const expectedCH = capH;
  const picarFin = hRest > 0 && salT > 0 ? Math.max(0, pP - salT * hRest) : pP;
  const clasifFin = hRest > 0 && capH > 0 ? Math.max(0, (pC + Math.min(pP, salT * hRest)) - capH * hRest) : pC;
  const rfidFin = hRest > 0 && salT > 0 ? Math.max(0, pR - salT * hRest) : pR;

  // Handlers
  const addHourLog = async () => {
    if (!hlH) return;
    const tph = (tDir + tInd) > 0 ? (hlP / (tDir + tInd)).toFixed(1) : "0";
    const avgPic = tDir > 0 ? Math.round(hlP / tDir) : 0;
    const avgCla = tClasStaff > 0 ? Math.round(hlC / tClasStaff) : 0;
    const entry = { id: Date.now(), hora: hlH, picadas: hlP, clasificadas: hlC, personal: asig, dir: tDir, ind: tInd, clasif_staff: tClasStaff, tph, avg_pic: avgPic, avg_cla: avgCla, expected_pic: expectedPH, expected_clas: expectedCH };
    await sbInsert("hour_logs", entry);
    const newPP = Math.max(0, pP - hlP);
    const newPC = Math.max(0, pC - hlC + Math.round(hlP * 0.7));
    setPP(newPP); setPC(newPC); saveTurno(newPP, newPC, pR, tG, staff);
    setHlH(""); setHlP(0); setHlC(0); setShowHL(false);
    loadAll();
  };

  const addDropLog = async () => {
    await sbInsert("drop_logs", { id: Date.now(), hora: hAct, picar: dlP, clasif: pC, rfid: dlR });
    setPP(dlP); setPR(dlR); saveTurno(dlP, pC, dlR, tG, staff);
    setDlP(0); setDlR(0); setShowDL(false);
    loadAll();
  };

  const delHourLog = async (id) => { await sbDelete("hour_logs", `id=eq.${id}`); loadAll(); };
  const delDropLog = async (id) => { await sbDelete("drop_logs", `id=eq.${id}`); loadAll(); };

  const toggleRouteCheck = async (routeId, field) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;
    const newChecks = { ...(route.checks || {}), [field]: !(route.checks || {})[field] };
    await sbPatch("routes", `id=eq.${routeId}`, { checks: newChecks });
    loadAll();
  };
  const cancelRoute = async (routeId) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;
    await sbPatch("routes", `id=eq.${routeId}`, { status: route.status === "cancelled" ? "pending" : "cancelled", checks: {} });
    loadAll();
  };
  const startEditRoute = (r) => {
    setEditRoute(r.id); setErCut(r.cutoff || ""); setErDest(r.dest || ""); setErFme(r.fme || ""); setErCua(r.cuadre || ""); setErSal(r.salida || ""); setErCom(r.comment || "");
  };
  const saveEditRoute = async () => {
    if (!editRoute) return;
    await sbPatch("routes", `id=eq.${editRoute}`, { cutoff: erCut, dest: erDest, fme: erFme, cuadre: erCua, salida: erSal, comment: erCom });
    setEditRoute(null); loadAll();
  };
  const addRoute = async () => {
    if (!nRDest.trim() || !nRCut) return;
    await sbInsert("routes", { id: Date.now(), cutoff: nRCut, dest: nRDest.trim(), fme: nRFme, cuadre: nRCua, salida: nRSal, status: "pending", checks: {}, comment: "" });
    setNRCut(""); setNRDest(""); setNRFme(""); setNRCua(""); setNRSal(""); setShowAddRoute(false);
    loadAll();
  };

  const resetTurno = async () => {
    if (!window.confirm("¿Nuevo turno? Se borran todos los datos.")) return;
    await sbPatch("turno", "id=eq.current", { pend_picar: 0, pend_clasif: 0, pend_rfid: 0, total_gente: 0, staff: {}, updated_at: new Date().toISOString() });
    await sbDelete("hour_logs", "id=gt.0");
    await sbDelete("drop_logs", "id=gt.0");
    await sbDelete("routes", "id=gt.0");
    loadAll();
  };

  // Route image
  const handleRouteImg = async (file) => {
    if (!file) return;
    setRouteImgLoading(true); setRouteImgError(null);
    try {
      const b64 = await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => { const c = document.createElement("canvas"); const s = img.width > 1200 ? 1200 / img.width : 1; c.width = img.width * s; c.height = img.height * s; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", 0.8).split(",")[1]); };
        img.onerror = () => rej(new Error("No se pudo leer")); const r = new FileReader(); r.onload = e => { img.src = e.target.result; }; r.readAsDataURL(file);
      });
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
          { type: "text", text: 'Extract ALL visible routes from this shipping table. For each: CUT OFF time, Destino, FME time, CUADRE time, SALIDA CAMION time, and comments. Return ONLY JSON array:\n[{"cutoff":"HH:MM","dest":"Name","fme":"HH:MM","cuadre":"HH:MM","salida":"HH:MM","comment":""}]' }
        ] }] }) });
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      const data = await resp.json(); const text = (data.content || []).map(i => i.text || "").join("");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        await sbDelete("routes", "id=gt.0");
        for (const r of parsed) { await sbInsert("routes", { id: Date.now() + Math.random() * 1000, cutoff: r.cutoff || "", dest: r.dest || "", fme: r.fme || "", cuadre: r.cuadre || "", salida: r.salida || "", status: (r.comment || "").toUpperCase().includes("CANCEL") ? "cancelled" : "pending", checks: {}, comment: r.comment || "" }); }
        loadAll();
      } else { setRouteImgError("No se encontraron rutas."); }
    } catch (err) { setRouteImgError(`Error: ${err.message}`); }
    setRouteImgLoading(false);
  };

  const gcol = z => ZC[z.ci % ZC.length];

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${S.bg} 0%, #1a1a2e 50%, #16213e 100%)`, fontFamily: S.sans, color: S.text, maxWidth: 480, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ padding: "14px 20px 12px", background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(71,85,105,0.2)", position: "sticky", top: 0, zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#3b82f6" }}>CONTROL DE PERSONAL <span style={{ color: syncStatus === "✓" ? "#10b981" : "#f59e0b" }}>{syncStatus}</span></div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg, #f1f5f9, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Export</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#3b82f6", fontFamily: S.mono }}>{hAct}</span>
            {mRest > 0 && <span style={{ fontSize: 11, color: mRest > 60 ? "#10b981" : "#ef4444", fontWeight: 700 }}>~{hRest.toFixed(1)}h</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={resetTurno} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>🔄</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", padding: "0 10px", background: "rgba(15,23,42,0.6)", borderBottom: "1px solid rgba(71,85,105,0.2)" }}>
        {[["dashboard", "Dashboard"], ["turno", "Turno"], ["situacion", "Situación"], ["rutas", "Rutas PT"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: "11px 6px", border: "none", background: "transparent", color: tab === id ? "#3b82f6" : S.dim, fontSize: 12, fontWeight: 700, cursor: "pointer", borderBottom: tab === id ? "2px solid #3b82f6" : "2px solid transparent", flex: 1, textAlign: "center" }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: "16px 20px 100px" }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab === "dashboard" && (<>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
            {[{ l: "Por Picar", v: pP, c: "#ef4444" }, { l: "Por Clasif.", v: pC, c: "#f59e0b" }, { l: "Pdt RFID", v: pR, c: "#a78bfa" }, { l: "Personas", v: asig, c: "#3b82f6" }].map(k => (
              <div key={k.l} style={{ background: S.card, borderRadius: 12, padding: "10px 4px", textAlign: "center", border: `1px solid ${S.cardBorder}` }}>
                <div style={{ fontSize: 8, color: S.dim, fontWeight: 700, textTransform: "uppercase" }}>{k.l}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: k.c, fontFamily: S.mono, marginTop: 3 }}>{k.v.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {asig > 0 && (
            <Card>
              <Lbl>Personal</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: TC.directo, marginBottom: 6 }}>DIR <span style={{ fontFamily: S.mono }}>{tDir}</span></div>
                  {roles.filter(r => r.type === "directo").map(r => <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}><span style={{ color: S.sub }}>{r.icon} {r.name}</span><span style={{ fontWeight: 800, fontFamily: S.mono, color: TC.directo }}>{g(r.id)}</span></div>)}
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: TC.indirecto, marginBottom: 6 }}>IND <span style={{ fontFamily: S.mono }}>{tInd}</span></div>
                  {roles.filter(r => r.type === "indirecto").map(r => <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}><span style={{ color: S.sub }}>{r.icon} {r.name}</span><span style={{ fontWeight: 800, fontFamily: S.mono, color: TC.indirecto }}>{g(r.id)}</span></div>)}
                </div>
              </div>
              {tExt > 0 && <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${S.cardBorder}`, fontSize: 10, color: TC.tarea_extra, fontWeight: 700 }}>EXTRA ({tExt})</div>}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${S.cardBorder}`, fontSize: 12, fontWeight: 700 }}>
                <span style={{ color: S.sub }}>TPI <span style={{ fontFamily: S.mono, color: tDir > 0 && tInd / tDir > 0.5 ? "#ef4444" : "#10b981" }}>{tpi}</span></span>
                <span>{sinA === 0 && tG > 0 ? <span style={{ color: "#10b981" }}>✓</span> : sinA > 0 ? <span style={{ color: "#f59e0b" }}>{sinA} libres</span> : sinA < 0 ? <span style={{ color: "#ef4444" }}>{Math.abs(sinA)} extra</span> : null}</span>
              </div>
            </Card>
          )}

          {salT > 0 && (
            <Card>
              <Lbl>Flujo</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div style={{ background: "rgba(59,130,246,0.1)", borderRadius: 12, padding: 10, textAlign: "center", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>SALIDA</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#3b82f6", fontFamily: S.mono }}>{salT.toLocaleString()}</div><div style={{ fontSize: 9, color: S.dim }}>uds/h</div>
                </div>
                <div style={{ background: capH >= salT + pC ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderRadius: 12, padding: 10, textAlign: "center", border: `1px solid ${capH >= salT + pC ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                  <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>CAP. CLASIF.</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: capH >= salT + pC ? "#10b981" : "#ef4444", fontFamily: S.mono }}>{capH.toLocaleString()}</div><div style={{ fontSize: 9, color: S.dim }}>uds/h</div>
                </div>
              </div>
              {pAGV > 0 && rAGV < rNeed && <div style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>🏃 Runners: {rAGV}/{rNeed}</div>}
            </Card>
          )}

          {(tDir + tInd) > 0 && (
            <Card sx={{ borderLeft: "3px solid #14b8a6" }}>
              <Lbl>Productividad</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: "rgba(20,184,166,0.1)", borderRadius: 12, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>TPH ESPERADO</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#14b8a6", fontFamily: S.mono }}>{salT > 0 ? (salT / (tDir + tInd)).toFixed(1) : "—"}</div>
                </div>
                <div style={{ background: hourLogs.length > 0 ? "rgba(20,184,166,0.1)" : "rgba(51,65,85,0.3)", borderRadius: 12, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>TPH REAL</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: hourLogs.length > 0 ? "#14b8a6" : S.dim, fontFamily: S.mono }}>{tphAcum}</div>
                  <div style={{ fontSize: 9, color: S.dim }}>{hourLogs.length}h reg.</div>
                </div>
              </div>
              {hourLogs.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: "rgba(59,130,246,0.08)", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(59,130,246,0.15)" }}>
                    <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>PIC/PICKER·H</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#3b82f6", fontFamily: S.mono }}>{avgPicPP !== null ? avgPicPP : "—"}</div>
                  </div>
                  <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>CLA/CLASIF·H</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b", fontFamily: S.mono }}>{avgClaPP !== null ? avgClaPP : "—"}</div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {salT > 0 && (pP > 0 || pC > 0) && hRest > 0 && (
            <Card sx={{ borderLeft: "3px solid #3b82f6" }}>
              <Lbl>Proyección ~{finT}</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {[{ l: "Picar", v: picarFin, c: "#ef4444" }, { l: "Clasif.", v: clasifFin, c: "#f59e0b" }, { l: "RFID", v: rfidFin, c: "#a78bfa" }].map(k => (
                  <div key={k.l} style={{ background: k.v > 0 ? `${k.c}11` : "rgba(16,185,129,0.08)", borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>{k.l}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: k.v > 0 ? k.c : "#10b981", fontFamily: S.mono }}>{Math.round(k.v).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {asig === 0 && pP === 0 && <Card sx={{ textAlign: "center", padding: "30px 20px" }}><div style={{ fontSize: 28, opacity: 0.6 }}>👋</div><div style={{ fontSize: 15, fontWeight: 700, color: S.sub, marginTop: 8 }}>Inicio de turno</div></Card>}
        </>)}

        {/* ═══ TURNO ═══ */}
        {tab === "turno" && (<>
          <Card>
            <Lbl>¿Qué tienes?</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><label style={{ fontSize: 10, color: "#ef4444", display: "block", marginBottom: 4, fontWeight: 600 }}>Pend. picar</label><NF value={pP} onCommit={updatePP} style={{ ...inp, fontSize: 16, textAlign: "center", padding: 10 }} /></div>
              <div><label style={{ fontSize: 10, color: "#f59e0b", display: "block", marginBottom: 4, fontWeight: 600 }}>Pend. clasif.</label><NF value={pC} onCommit={updatePC} style={{ ...inp, fontSize: 16, textAlign: "center", padding: 10 }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={{ fontSize: 10, color: "#a78bfa", display: "block", marginBottom: 4, fontWeight: 600 }}>Pend. RFID</label><NF value={pR} onCommit={updatePR} style={{ ...inp, fontSize: 16, textAlign: "center", padding: 10 }} /></div>
              <div><label style={{ fontSize: 10, color: "#3b82f6", display: "block", marginBottom: 4, fontWeight: 600 }}>Personas</label><NF value={tG} onCommit={updateTG} style={{ ...inp, fontSize: 16, textAlign: "center", padding: 10 }} /></div>
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
                <div style={{ background: "rgba(59,130,246,0.1)", borderRadius: 10, padding: 10, textAlign: "center" }}><div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>SALIDA</div><div style={{ fontSize: 22, fontWeight: 800, color: "#3b82f6", fontFamily: S.mono }}>{salT.toLocaleString()}</div></div>
                <div style={{ background: "rgba(16,185,129,0.1)", borderRadius: 10, padding: 10, textAlign: "center" }}><div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>CAP. CLASIF.</div><div style={{ fontSize: 22, fontWeight: 800, color: "#10b981", fontFamily: S.mono }}>{capH.toLocaleString()}</div></div>
              </div>
            </Card>
          )}

          {zones.map(zone => {
            const zr = roles.filter(r => r.z === zone.id); const col = gcol(zone);
            const zt = zr.reduce((a, r) => a + g(r.id), 0);
            return (
              <div key={zone.id} style={{ background: S.card, borderRadius: 14, marginBottom: 8, border: `1px solid ${S.cardBorder}`, overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", background: col + "15", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${col}22` }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: col, textTransform: "uppercase", letterSpacing: 1 }}>{zone.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: col, fontFamily: S.mono }}>{zt}</span>
                </div>
                <div style={{ padding: "2px 12px" }}>
                  {zr.map(role => (
                    <div key={role.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 2px", borderBottom: `1px solid ${S.cardBorder}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13 }}>{role.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: S.sub }}>{role.name}</span>
                        <Pill color={TC[role.type]}>{TL[role.type]}</Pill>
                      </div>
                      <EC count={g(role.id)} onChange={v => sc(role.id, v)} warn={sinA < 0} />
                    </div>
                  ))}
                  {addRZ === zone.id ? (
                    <div style={{ padding: "6px 0" }}>
                      <TF value={nRN} onChange={setNRN} placeholder="Nombre del rol" style={{ ...inp, fontSize: 12, padding: "6px 8px", marginBottom: 6 }} />
                      <div style={{ display: "flex", gap: 4 }}>
                        <select value={nRT} onChange={e => setNRT(e.target.value)} style={{ padding: "5px 6px", borderRadius: 6, border: `1px solid ${S.cardBorder}`, background: S.surface, color: S.text, fontSize: 11 }}>
                          <option value="directo">Directo</option><option value="indirecto">Indirecto</option><option value="tarea_extra">Extra</option>
                        </select>
                        <button onClick={() => { if (nRN.trim()) { setRoles(p => [...p, { id: "r_" + Date.now(), name: nRN.trim(), z: zone.id, type: nRT, icon: "👤" }]); setNRN(""); setNRT("indirecto"); setAddRZ(null); } }} style={{ border: "none", background: col, color: "#fff", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+</button>
                        <button onClick={() => setAddRZ(null)} style={{ border: `1px solid ${S.cardBorder}`, background: "transparent", color: S.dim, borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setAddRZ(zone.id); setNRN(""); }} style={{ width: "100%", padding: 5, border: "none", background: "transparent", color: S.dim, fontSize: 10, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>+ rol</button>
                  )}
                </div>
              </div>
            );
          })}
        </>)}

        {/* ═══ SITUACIÓN ═══ */}
        {tab === "situacion" && (<>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Lbl>Estado — {hAct}</Lbl>
              <Pill color="#3b82f6">{asig} pers</Pill>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[{ l: "Por Picar", v: pP, c: "#ef4444" }, { l: "Por Clasif.", v: pC, c: "#f59e0b" }, { l: "Pdt RFID", v: pR, c: "#a78bfa" }].map(k => (
                <div key={k.l} style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: S.dim, fontWeight: 700 }}>{k.l}</div><div style={{ fontSize: 20, fontWeight: 800, color: k.c, fontFamily: S.mono, marginTop: 4 }}>{k.v.toLocaleString()}</div></div>
              ))}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <button onClick={() => { setShowHL(true); setShowDL(false); }} style={{ padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>⏱ Registro hora</button>
            <button onClick={() => { setShowDL(true); setShowHL(false); }} style={{ padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>📦 Caída</button>
          </div>

          {showHL && (
            <Card sx={{ borderColor: "rgba(59,130,246,0.3)" }}>
              <Lbl>¿Qué se ha hecho esta hora?</Lbl>
              <div style={{ marginBottom: 10 }}><label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 4 }}>Hora</label><TimeF value={hlH} onChange={setHlH} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: "#ef4444", display: "block", marginBottom: 4 }}>Uds picadas</label><NF value={hlP} onCommit={setHlP} /></div>
                <div><label style={{ fontSize: 10, color: "#f59e0b", display: "block", marginBottom: 4 }}>Uds clasificadas</label><NF value={hlC} onCommit={setHlC} /></div>
              </div>
              <div style={{ fontSize: 11, color: S.dim, marginBottom: 10, background: "rgba(51,65,85,0.3)", padding: 8, borderRadius: 8 }}>Esperado: <b style={{ color: "#3b82f6" }}>{salT.toLocaleString()}</b> pic · <b style={{ color: "#10b981" }}>{capH.toLocaleString()}</b> cla · 70% pic→clasif</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addHourLog} style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Guardar</button>
                <button onClick={() => setShowHL(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${S.cardBorder}`, background: "transparent", color: S.dim, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              </div>
            </Card>
          )}

          {showDL && (
            <Card sx={{ borderColor: "rgba(245,158,11,0.3)" }}>
              <Lbl>Caída — {hAct}</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: "#ef4444", display: "block", marginBottom: 4 }}>Pend. picar</label><NF value={dlP} onCommit={setDlP} /></div>
                <div><label style={{ fontSize: 10, color: "#a78bfa", display: "block", marginBottom: 4 }}>Pend. RFID</label><NF value={dlR} onCommit={setDlR} /></div>
              </div>
              <div style={{ fontSize: 11, color: S.dim, marginBottom: 10, background: "rgba(51,65,85,0.3)", padding: 8, borderRadius: 8 }}>Clasif. se mantiene: <b style={{ color: "#f59e0b" }}>{pC.toLocaleString()}</b></div>
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
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{l.hora}</span>
                        <Pill color="#14b8a6">TPH {l.tph}</Pill>
                        {l.avgPic !== undefined && <Pill color="#3b82f6">{l.avgPic}/pic</Pill>}
                        {l.avgCla !== undefined && <Pill color="#f59e0b">{l.avgCla}/cla</Pill>}
                      </div>
                      <button onClick={() => delHourLog(l.id)} style={{ background: "none", border: "none", color: S.dim, fontSize: 14, cursor: "pointer" }}>🗑</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6, fontSize: 11 }}>
                      <div><span style={{ color: S.dim }}>Pic: </span><span style={{ fontWeight: 700, fontFamily: S.mono, color: "#3b82f6" }}>{l.picadas.toLocaleString()}</span><span style={{ fontSize: 9, color: dP >= 0 ? "#10b981" : "#ef4444", marginLeft: 3 }}>{dP >= 0 ? "+" : ""}{dP.toLocaleString()}</span></div>
                      <div><span style={{ color: S.dim }}>Cla: </span><span style={{ fontWeight: 700, fontFamily: S.mono, color: "#f59e0b" }}>{l.clasificadas.toLocaleString()}</span><span style={{ fontSize: 9, color: dC >= 0 ? "#10b981" : "#ef4444", marginLeft: 3 }}>{dC >= 0 ? "+" : ""}{dC.toLocaleString()}</span></div>
                    </div>
                  </div>
                );
              })}
              <div style={{ paddingTop: 8, borderTop: `1px solid ${S.cardBorder}`, display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                <span style={{ color: S.sub }}>Acum. {hourLogs.length}h</span>
                <span style={{ fontFamily: S.mono }}><span style={{ color: "#3b82f6" }}>{totPicR.toLocaleString()}</span> · <span style={{ color: "#f59e0b" }}>{totClaR.toLocaleString()}</span> · TPH <span style={{ color: "#14b8a6" }}>{tphAcum}</span></span>
              </div>
            </Card>
          )}

          {dropLogs.length > 0 && (
            <Card>
              <Lbl>Caídas</Lbl>
              {dropLogs.map((d, i) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < dropLogs.length - 1 ? `1px solid ${S.cardBorder}` : "none" }}>
                  <div><span style={{ fontSize: 13, fontWeight: 700 }}>{d.hora}</span><div style={{ fontSize: 11, fontFamily: S.mono, marginTop: 2, display: "flex", gap: 6 }}><span style={{ color: "#ef4444" }}>{d.picar.toLocaleString()}</span><span style={{ color: "#f59e0b" }}>{d.clasif.toLocaleString()}</span><span style={{ color: "#a78bfa" }}>{d.rfid.toLocaleString()}</span></div></div>
                  <button onClick={() => delDropLog(d.id)} style={{ background: "none", border: "none", color: S.dim, fontSize: 14, cursor: "pointer" }}>🗑</button>
                </div>
              ))}
            </Card>
          )}
        </>)}

        {/* ═══ RUTAS PT ═══ */}
        {tab === "rutas" && (<>
          <Card>
            <Lbl>Cargar rutas</Lbl>
            <input ref={routeCamRef} type="file" accept="image/*" capture="environment" onChange={e => { handleRouteImg(e.target.files?.[0]); e.target.value = ""; }} style={{ display: "none" }} />
            <input ref={routeGalRef} type="file" accept="image/*" onChange={e => { handleRouteImg(e.target.files?.[0]); e.target.value = ""; }} style={{ display: "none" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => routeCamRef.current?.click()} disabled={routeImgLoading} style={{ flex: 1, padding: 12, borderRadius: 10, border: "2px dashed rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.05)", color: "#3b82f6", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>📷 Cámara</button>
              <button onClick={() => routeGalRef.current?.click()} disabled={routeImgLoading} style={{ flex: 1, padding: 12, borderRadius: 10, border: "2px dashed rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.05)", color: "#a78bfa", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🖼 Galería</button>
            </div>
            {routeImgLoading && <div style={{ marginTop: 10, padding: 10, background: "rgba(59,130,246,0.1)", borderRadius: 8, fontSize: 12, color: "#93c5fd", textAlign: "center" }}>⏳ Leyendo...</div>}
            {routeImgError && <div style={{ marginTop: 10, padding: 10, background: "rgba(239,68,68,0.1)", borderRadius: 8, fontSize: 12, color: "#fca5a5" }}>{routeImgError}</div>}
          </Card>

          {routes.length > 0 && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Lbl>Rutas</Lbl>
                <div style={{ fontSize: 11, color: S.dim }}><span style={{ color: "#10b981", fontWeight: 700 }}>{routes.filter(r => r.status !== "cancelled" && (r.checks || {}).cutoff && (r.checks || {}).fme && (r.checks || {}).cuadre && (r.checks || {}).salida).length}</span> / {routes.filter(r => r.status !== "cancelled").length}</div>
              </div>
              <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 10, background: "rgba(51,65,85,0.3)" }}>
                <div style={{ width: `${routes.filter(r => r.status !== "cancelled").length > 0 ? (routes.filter(r => (r.checks || {}).cutoff && (r.checks || {}).fme && (r.checks || {}).cuadre && (r.checks || {}).salida && r.status !== "cancelled").length / routes.filter(r => r.status !== "cancelled").length) * 100 : 0}%`, background: "#10b981", transition: "width 0.3s" }} />
              </div>
            </Card>
          )}

          {routes.map(r => {
            const isCan = r.status === "cancelled"; const ck = r.checks || {};
            const allDone = ck.cutoff && ck.fme && ck.cuadre && ck.salida;
            const cutM = toM((r.cutoff || "").padStart(5, "0"));
            const isUrg = !allDone && !isCan && cutM > 0 && cutM - nowM < 60 && cutM - nowM > 0;
            const isEditing = editRoute === r.id;
            const cs = (f) => ({ padding: "6px 4px", textAlign: "center", fontSize: 11, fontFamily: S.mono, fontWeight: 700, cursor: "pointer", borderRadius: 6, background: ck[f] ? "rgba(16,185,129,0.2)" : "transparent", color: ck[f] ? "#6ee7b7" : isCan ? S.dim : S.sub, textDecoration: isCan ? "line-through" : "none" });

            if (isEditing) return (
              <div key={r.id} style={{ background: "rgba(59,130,246,0.08)", borderRadius: 10, marginBottom: 4, border: "1px solid rgba(59,130,246,0.3)", padding: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                  <div><div style={{ fontSize: 8, color: S.dim, fontWeight: 600, marginBottom: 2 }}>DESTINO</div><TF value={erDest} onChange={setErDest} style={{ ...inp, fontSize: 13, padding: "6px 8px" }} /></div>
                  <div><div style={{ fontSize: 8, color: S.dim, fontWeight: 600, marginBottom: 2 }}>CUT OFF</div><TimeF value={erCut} onChange={setErCut} style={{ ...inp, fontSize: 13, padding: "6px 8px" }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                  <div><div style={{ fontSize: 8, color: S.dim, fontWeight: 600, marginBottom: 2 }}>FME</div><TimeF value={erFme} onChange={setErFme} style={{ ...inp, fontSize: 13, padding: "6px 8px" }} /></div>
                  <div><div style={{ fontSize: 8, color: S.dim, fontWeight: 600, marginBottom: 2 }}>CUADRE</div><TimeF value={erCua} onChange={setErCua} style={{ ...inp, fontSize: 13, padding: "6px 8px" }} /></div>
                  <div><div style={{ fontSize: 8, color: S.dim, fontWeight: 600, marginBottom: 2 }}>SALIDA</div><TimeF value={erSal} onChange={setErSal} style={{ ...inp, fontSize: 13, padding: "6px 8px" }} /></div>
                </div>
                <div style={{ marginBottom: 8 }}><div style={{ fontSize: 8, color: S.dim, fontWeight: 600, marginBottom: 2 }}>COMENTARIO</div><TF value={erCom} onChange={setErCom} placeholder="Comentario (opcional)" style={{ ...inp, fontSize: 12, padding: "6px 8px" }} /></div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={saveEditRoute} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Guardar</button>
                  <button onClick={() => setEditRoute(null)} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid ${S.cardBorder}`, background: "transparent", color: S.dim, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancelar</button>
                </div>
              </div>
            );

            return (
              <div key={r.id} style={{ background: allDone ? "rgba(16,185,129,0.06)" : isCan ? "rgba(51,65,85,0.15)" : isUrg ? "rgba(239,68,68,0.06)" : S.card, borderRadius: 10, marginBottom: 4, border: `1px solid ${allDone ? "rgba(16,185,129,0.2)" : isUrg ? "rgba(239,68,68,0.25)" : S.cardBorder}`, padding: "8px 10px", opacity: isCan ? 0.4 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: allDone ? "#6ee7b7" : isUrg ? "#ef4444" : S.text, textDecoration: isCan || allDone ? "line-through" : "none" }}>{r.dest}</span>
                    {isUrg && <span style={{ fontSize: 8, color: "#ef4444", fontWeight: 800, background: "rgba(239,68,68,0.15)", padding: "2px 6px", borderRadius: 4 }}>!</span>}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => startEditRoute(r)} style={{ background: "none", border: "none", color: S.dim, fontSize: 11, cursor: "pointer" }}>✏️</button>
                    <button onClick={() => cancelRoute(r.id)} style={{ background: "none", border: "none", color: S.dim, fontSize: 12, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
                  {[["cutoff", "CUT OFF", r.cutoff], ["fme", "FME", r.fme], ["cuadre", "CUADRE", r.cuadre], ["salida", "SALIDA", r.salida]].map(([f, lbl, val]) => (
                    <div key={f} onClick={() => toggleRouteCheck(r.id, f)} style={cs(f)}>
                      <div style={{ fontSize: 8, color: S.dim, fontWeight: 600, marginBottom: 2 }}>{lbl}</div>{val || "—"}
                    </div>
                  ))}
                </div>
                {r.comment && <div style={{ fontSize: 10, color: "#fbbf24", marginTop: 4 }}>{r.comment}</div>}
              </div>
            );
          })}

          {!showAddRoute ? (
            <button onClick={() => setShowAddRoute(true)} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px dashed ${S.cardBorder}`, background: "transparent", color: S.dim, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>+ Añadir ruta</button>
          ) : (
            <Card sx={{ marginTop: 6 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 3 }}>Cut Off</label><TimeF value={nRCut} onChange={setNRCut} /></div>
                <div><label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 3 }}>Destino</label><TF value={nRDest} onChange={setNRDest} placeholder="Destino" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 3 }}>FME</label><TimeF value={nRFme} onChange={setNRFme} /></div>
                <div><label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 3 }}>Cuadre</label><TimeF value={nRCua} onChange={setNRCua} /></div>
                <div><label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 3 }}>Salida</label><TimeF value={nRSal} onChange={setNRSal} /></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addRoute} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Añadir</button>
                <button onClick={() => setShowAddRoute(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${S.cardBorder}`, background: "transparent", color: S.dim, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              </div>
            </Card>
          )}

          {routes.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={async () => { if (window.confirm("¿Resetear checks?")) { for (const r of routes) await sbPatch("routes", `id=eq.${r.id}`, { checks: {}, status: "pending" }); loadAll(); } }} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "rgba(51,65,85,0.3)", color: S.dim, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🔄 Resetear</button>
              <button onClick={async () => { if (window.confirm("¿Borrar todas?")) { await sbDelete("routes", "id=gt.0"); loadAll(); } }} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "rgba(239,68,68,0.1)", color: "#fca5a5", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🗑 Borrar</button>
            </div>
          )}

          {routes.length === 0 && !routeImgLoading && (
            <Card sx={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 28, opacity: 0.6 }}>🚚</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: S.sub, marginTop: 8 }}>Sin rutas</div>
              <div style={{ fontSize: 12, color: S.dim, marginTop: 4 }}>Haz foto o añade manualmente</div>
            </Card>
          )}
        </>)}
      </div>
    </div>
  );
}

function AppWithAuth() {
  return <LoginGate><App /></LoginGate>;
}

export default AppWithAuth;
