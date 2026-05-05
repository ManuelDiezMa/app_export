import React, { useState, useCallback, useRef, useEffect } from "react";

/* ═══ LOCALSTORAGE ═══ */
function loadLS(k, fb) { try { const v = localStorage.getItem("exp_" + k); return v !== null ? JSON.parse(v) : fb; } catch { return fb; } }
function usePersist(k, fb) {
  const [v, sV] = useState(() => loadLS(k, fb));
  const set = useCallback((fn) => { sV(p => { const n = typeof fn === "function" ? fn(p) : fn; try { localStorage.setItem("exp_" + k, JSON.stringify(n)); } catch {} return n; }); }, [k]);
  return [v, set];
}
const SUPABASE_URL = "https://izqihthvpiblgftrthpk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cWlodGh2cGlibGdmdHJ0aHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzI0NDksImV4cCI6MjA5MzA0ODQ0OX0.QtHFCTrvwFNv8W7_OlRmKuTr9J7GWwFFWpA0UDUDa0o";
const SUPABASE_STATE_ID = "export-panel-main";
async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res;
}
function useMedia(q) {
  const get = () => typeof window !== "undefined" && window.matchMedia(q).matches;
  const [m, setM] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [q]);
  return m;
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
  { id: "cedidos", name: "CEDIDOS", ci: 7 },
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
  { id: "cedidos_op", name: "Cedidos", z: "cedidos", type: "tarea_extra", icon: "↗️" },
];

const ZC = ["#3b82f6","#8b5cf6","#f59e0b","#10b981","#ef4444","#6366f1","#14b8a6","#f97316"];
const TC = { directo: "#3b82f6", indirecto: "#a78bfa", tarea_extra: "#fbbf24" };
const TL = { directo: "DIR", indirecto: "IND", tarea_extra: "EXTRA" };
const CHECK_PROGRESS = "progress";
const CHECK_DONE = "done";
const ROUTE_STEPS = ["cutoff", "fme", "cuadre", "awb", "flejado", "salida"];
const ROUTE_LABELS = { cutoff: "CUT OFF", fme: "FME", cuadre: "CUADRE", awb: "AWB", flejado: "FLEJADO", salida: "SALIDA" };
const TABS = [
  ["dashboard", "Resumen", "Estado del turno"],
  ["turno", "Turno", "Personal y carga"],
  ["situacion", "Seguimiento", "Registro horario"],
  ["rutas", "Rutas PT", "Control de salidas"],
];
const TAB_INFO = {
  dashboard: { title: "Resumen operativo", desc: "Carga, personal, riesgos y previsión de cierre en una sola vista." },
  turno: { title: "Preparación del turno", desc: "Introduce la carga inicial y reparte el equipo por departamento." },
  situacion: { title: "Seguimiento en vivo", desc: "Registra producción real, caídas y ritmo de clasificación." },
  rutas: { title: "Rutas PT", desc: "Carga rutas, marca estados y mantén el foco en las salidas críticas." },
};

/* ═══ STYLES ═══ */
const S = {
  bg: "#eef3f7",
  app: "#f8fafc",
  card: "#ffffff",
  cardBorder: "rgba(15,23,42,0.10)",
  surface: "#f1f5f9",
  text: "#162033",
  sub: "#475569",
  dim: "#64748b",
  muted: "#94a3b8",
  accent: "#2563eb",
  accentSoft: "rgba(37,99,235,0.10)",
  ok: "#059669",
  warn: "#d97706",
  bad: "#dc2626",
  mono: "'JetBrains Mono',monospace",
  sans: "'Inter','DM Sans',sans-serif",
};
const inp = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(15,23,42,0.14)", background: "#ffffff", color: S.text, fontSize: 16, fontWeight: 700, fontFamily: S.mono, boxSizing: "border-box", boxShadow: "0 1px 2px rgba(15,23,42,0.04)", outlineColor: S.accent };

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
function fmtTime(digits) {
  const d = digits.replace(/[^0-9]/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  if (d.length === 3 && Number(d[0]) > 2) return `0${d[0]}:${d.slice(1)}`;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}
function normalizeTime(value) {
  const d = value.replace(/[^0-9]/g, "").slice(0, 4);
  if (!d) return "";
  if (d.length === 1) return `0${d}:00`;
  if (d.length === 2) return `${d.padStart(2, "0")}:00`;
  const raw = fmtTime(d);
  const [h, m = ""] = raw.split(":");
  const hh = Math.min(23, parseInt(h, 10) || 0);
  const mm = Math.min(59, parseInt(m.padEnd(2, "0"), 10) || 0);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function focusNextTime(ref) {
  const fields = [...document.querySelectorAll('[data-time-field="true"]')];
  const i = fields.indexOf(ref.current);
  const next = fields[i + 1];
  if (next) { next.focus(); next.select(); }
}
function TimeF({ value, onChange, style, autoNext = true }) {
  const ref = useRef(null);
  const [l, sL] = useState(value || "");
  useEffect(() => { if (document.activeElement !== ref.current) sL(value || ""); }, [value]);
  return <input ref={ref} data-time-field="true" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={5} value={l} placeholder="HH:MM" style={style || inp}
    onChange={e => {
      const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
      const complete = digits.length === 4 || (digits.length === 3 && Number(digits[0]) > 2);
      const formatted = complete ? normalizeTime(digits) : fmtTime(digits);
      sL(formatted); onChange(formatted);
      if (autoNext && complete) setTimeout(() => focusNextTime(ref), 0);
    }}
    onBlur={() => { const n = normalizeTime(l); sL(n); onChange(n); }}
    onKeyDown={e => {
      if (e.key === "Enter") { e.preventDefault(); focusNextTime(ref); }
    }} />;
}
function DF({ value, onCommit, placeholder, style }) {
  const ref = useRef(null);
  const [l, sL] = useState(value ? String(value) : "");
  const lv = useRef(value);
  useEffect(() => { if (lv.current !== value && document.activeElement !== ref.current) sL(value ? String(value) : ""); lv.current = value; }, [value]);
  return <input ref={ref} type="text" inputMode="decimal" value={l} placeholder={placeholder || "0"} style={style || inp}
    onChange={e => { const v = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"); sL(v); const n = parseFloat(v); onCommit(Number.isFinite(n) ? n : 0); }}
    onBlur={() => { sL(value ? String(value) : ""); lv.current = value; }} />;
}

function EC({ count, onChange, warn }) {
  const [ed, sEd] = useState(false);
  const [l, sL] = useState(String(count));
  const ref = useRef(null);
  useEffect(() => { if (!ed) sL(String(count)); }, [count, ed]);
  useEffect(() => { if (ed && ref.current) { ref.current.focus(); ref.current.select(); } }, [ed]);
  if (ed) return <input ref={ref} type="text" inputMode="numeric" value={l}
    style={{ width: 52, height: 32, textAlign: "center", fontSize: 15, fontWeight: 800, fontFamily: S.mono, border: `2px solid ${S.accent}`, borderRadius: 8, background: "#ffffff", color: S.text, boxSizing: "border-box", outline: "none" }}
    onChange={e => sL(e.target.value.replace(/[^0-9]/g, ""))}
    onBlur={() => { onChange(parseInt(l) || 0); sEd(false); }}
    onKeyDown={e => { if (e.key === "Enter") { onChange(parseInt(l) || 0); sEd(false); } }} />;
  return (<div style={{ display: "flex", alignItems: "center", background: warn ? "rgba(220,38,38,0.08)" : "#f8fafc", borderRadius: 8, border: `1px solid ${warn ? "rgba(220,38,38,0.25)" : "rgba(15,23,42,0.10)"}` }}>
    <button onClick={() => onChange(Math.max(0, count - 1))} style={{ width: 32, height: 32, border: "none", background: "transparent", fontSize: 16, cursor: "pointer", color: S.dim, fontWeight: 700 }}>−</button>
    <span onClick={() => sEd(true)} style={{ minWidth: 26, textAlign: "center", fontSize: 15, fontWeight: 800, color: warn ? S.bad : S.text, fontFamily: S.mono, cursor: "pointer" }}>{count}</span>
    <button onClick={() => onChange(count + 1)} style={{ width: 32, height: 32, border: "none", background: "transparent", fontSize: 16, cursor: "pointer", color: S.dim, fontWeight: 700 }}>+</button>
  </div>);
}

function Card({ children, sx }) { return <div style={{ background: S.card, borderRadius: 10, padding: 16, marginBottom: 14, border: `1px solid ${S.cardBorder}`, boxShadow: "0 10px 24px rgba(15,23,42,0.07)", ...sx }}>{children}</div>; }
function Lbl({ children }) { return <div style={{ fontSize: 11, fontWeight: 800, color: S.dim, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 9 }}>{children}</div>; }
function Pill({ color, children }) { return <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800, background: color + "18", color, border: `1px solid ${color}24`, whiteSpace: "nowrap" }}>{children}</span>; }
function toM(t) { const p = t.split(":").map(Number); return p[0] * 60 + (p[1] || 0); }
function isRouteDone(r) {
  const c = r.checks || {};
  return ROUTE_STEPS.every(f => c[f] === CHECK_DONE || c[f] === true);
}
function routeHasProgress(r) {
  const c = r.checks || {};
  return ROUTE_STEPS.some(f => c[f] === CHECK_PROGRESS);
}
function timeLabel(diff) {
  if (diff < 0) return `${Math.abs(diff)}m vencida`;
  if (diff === 0) return "ahora";
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}
function parseRouteText(text) {
  return text.split(/\n+/).map(line => line.trim()).filter(Boolean).map((line, i) => {
    const rawTimes = line.match(/\b(?:\d{1,2}[:.]\d{2}|\d{3,4})\b/g) || [];
    const times = rawTimes.map(normalizeTime).filter(Boolean);
    if (times.length === 0 || /cut\s*off|destino|salida|cuadre/i.test(line) && times.length < 2) return null;
    const parts = line.split(/\t|;|,/).map(p => p.trim()).filter(Boolean);
    let dest = parts.find(p => /[a-záéíóúüñ]/i.test(p) && !/\b(?:\d{1,2}[:.]\d{2}|\d{3,4})\b/.test(p) && !/cut\s*off|fme|cuadre|salida|awb|flejado/i.test(p));
    if (!dest) {
      dest = line.replace(/\b(?:\d{1,2}[:.]\d{2}|\d{3,4})\b/g, " ")
        .replace(/cut\s*off|destino|fme|cuadre|salida|camion|awb|flejado/ig, " ")
        .replace(/[-_|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
    const comment = /cancel/i.test(line) ? "CANCELADO" : "";
    return {
      id: Date.now() + i,
      cutoff: times[0] || "",
      dest: dest || `Ruta ${i + 1}`,
      fme: times[1] || "",
      cuadre: times[2] || "",
      salida: times[3] || "",
      status: comment ? "cancelled" : "pending",
      comment,
    };
  }).filter(Boolean)
    .sort((a, b) => toM(a.cutoff.padStart(5, "0")) - toM(b.cutoff.padStart(5, "0")))
    .map((r, order) => ({ ...r, order }));
}

function routeOrderValue(r, i) {
  return Number.isFinite(r.order) ? r.order : i;
}

/* ═══ APP ═══ */
function App() {
  const wide = useMedia("(min-width: 900px)");
  const desktop = useMedia("(min-width: 1120px)");
  const [zones, setZones] = usePersist("zones2", DEF_ZONES);
  const [roles, setRoles] = usePersist("roles2", DEF_ROLES);
  const [staff, setStaff] = usePersist("staff2", {});
  const [objAGV, setObjAGV] = usePersist("objAGV", 172);
  const [objManual, setObjManual] = usePersist("objManual", 80);
  const [ratioR, setRatioR] = usePersist("ratioR", 6);
  const [capCl, setCapCl] = usePersist("capCl", 300);
  const [ratioClasifPicado, setRatioClasifPicado] = usePersist("ratioClasifPicado", 70);
  const [finT, setFinT] = usePersist("finT", "14:00");
  const [horasTurno, setHorasTurno] = usePersist("horasTurno", 7.5);
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
  const [hlH, setHlH] = useState(""); const [hlP, setHlP] = useState(0); const [hlC, setHlC] = useState(0); const [hlPC, setHlPC] = useState(0);
  const [showDL, setShowDL] = useState(false);
  const [dlP, setDlP] = useState(0); const [dlR, setDlR] = useState(0);
  const [routes, setRoutes] = usePersist("routes", []);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showPasteRoutes, setShowPasteRoutes] = useState(false);
  const [pasteRoutesText, setPasteRoutesText] = useState("");
  const [pasteRoutesError, setPasteRoutesError] = useState("");
  const [nRCut, setNRCut] = useState(""); const [nRDest, setNRDest] = useState(""); const [nRFme, setNRFme] = useState(""); const [nRCua, setNRCua] = useState(""); const [nRSal, setNRSal] = useState("");
  const [routeFilter, setRouteFilter] = useState("focus");
  const [editRouteId, setEditRouteId] = useState(null);
  const [eRCut, setERCut] = useState(""); const [eRDest, setERDest] = useState(""); const [eRFme, setERFme] = useState(""); const [eRCua, setERCua] = useState(""); const [eRSal, setERSal] = useState(""); const [eRCom, setERCom] = useState("");
  const [projectionMode, setProjectionMode] = useState("mix");
  const [routeImgLoading, setRouteImgLoading] = useState(false);
  const [routeImgError, setRouteImgError] = useState(null);
  const [syncReady, setSyncReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState("local");
  const remoteStamp = useRef(null);
  const applyingRemote = useRef(false);
  const routeCamRef = useRef(null);
  const routeGalRef = useRef(null);

  useEffect(() => {
    if (routes.some((r, i) => !Number.isFinite(r.order) || r.order !== i)) {
      const nextRoutes = routes
        .map((r, i) => ({ ...r, order: routeOrderValue(r, i) }))
        .sort((a, b) => routeOrderValue(a, 0) - routeOrderValue(b, 0))
        .map((r, order) => ({ ...r, order }));
      setRoutes(nextRoutes);
    }
  }, [routes, setRoutes]);

  useEffect(() => {
    if (!zones.some(z => z.id === "cedidos")) setZones(p => [...p, { id: "cedidos", name: "CEDIDOS", ci: 7 }]);
    if (!roles.some(r => r.id === "cedidos_op")) setRoles(p => [...p, { id: "cedidos_op", name: "Cedidos", z: "cedidos", type: "tarea_extra", icon: "↗️" }]);
  }, [zones, roles, setZones, setRoles]);

  const syncState = {
    zones2: zones, roles2: roles, staff2: staff,
    objAGV, objManual, ratioR, capCl, ratioClasifPicado, finT, horasTurno, drops,
    pP2: pP, pC2: pC, pR2: pR, tG2: tG, hourLogs, dropLogs, routes,
  };
  const applyRemoteState = useCallback((state) => {
    if (!state || typeof state !== "object") return;
    applyingRemote.current = true;
    if (state.zones2) setZones(state.zones2);
    if (state.roles2) setRoles(state.roles2);
    if (state.staff2) setStaff(state.staff2);
    if (state.objAGV !== undefined) setObjAGV(state.objAGV);
    if (state.objManual !== undefined) setObjManual(state.objManual);
    if (state.ratioR !== undefined) setRatioR(state.ratioR);
    if (state.capCl !== undefined) setCapCl(state.capCl);
    if (state.ratioClasifPicado !== undefined) setRatioClasifPicado(state.ratioClasifPicado);
    if (state.finT !== undefined) setFinT(state.finT);
    if (state.horasTurno !== undefined) setHorasTurno(state.horasTurno);
    if (state.drops) setDrops(state.drops);
    if (state.pP2 !== undefined) setPP(state.pP2);
    if (state.pC2 !== undefined) setPC(state.pC2);
    if (state.pR2 !== undefined) setPR(state.pR2);
    if (state.tG2 !== undefined) setTG(state.tG2);
    if (state.hourLogs) setHourLogs(state.hourLogs);
    if (state.dropLogs) setDropLogs(state.dropLogs);
    if (state.routes) setRoutes(state.routes);
    setTimeout(() => { applyingRemote.current = false; }, 0);
  }, [setZones, setRoles, setStaff, setObjAGV, setObjManual, setRatioR, setCapCl, setRatioClasifPicado, setFinT, setHorasTurno, setDrops, setPP, setPC, setPR, setTG, setHourLogs, setDropLogs, setRoutes]);

  useEffect(() => {
    let alive = true;
    const loadRemote = async () => {
      try {
        setSyncStatus("conectando");
        const res = await sbFetch(`app_state?id=eq.${SUPABASE_STATE_ID}&select=state,updated_at`);
        const rows = await res.json();
        if (!alive) return;
        if (rows[0]?.state) {
          remoteStamp.current = rows[0].updated_at;
          applyRemoteState(rows[0].state);
        } else {
          await sbFetch("app_state", {
            method: "POST",
            headers: { Prefer: "resolution=merge-duplicates" },
            body: JSON.stringify({ id: SUPABASE_STATE_ID, state: syncState }),
          });
        }
        setSyncReady(true); setSyncStatus("sincronizado");
      } catch {
        if (!alive) return;
        setSyncReady(false); setSyncStatus("local");
      }
    };
    loadRemote();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!syncReady || applyingRemote.current) return;
    setSyncStatus("guardando");
    const t = setTimeout(async () => {
      try {
        const res = await sbFetch("app_state", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=representation" },
          body: JSON.stringify({ id: SUPABASE_STATE_ID, state: syncState }),
        });
        const rows = await res.json();
        remoteStamp.current = rows[0]?.updated_at || remoteStamp.current;
        setSyncStatus("sincronizado");
      } catch {
        setSyncStatus("local");
      }
    }, 650);
    return () => clearTimeout(t);
  }, [syncReady, zones, roles, staff, objAGV, objManual, ratioR, capCl, ratioClasifPicado, finT, horasTurno, drops, pP, pC, pR, tG, hourLogs, dropLogs, routes]);

  useEffect(() => {
    if (!syncReady) return;
    const t = setInterval(async () => {
      try {
        const res = await sbFetch(`app_state?id=eq.${SUPABASE_STATE_ID}&select=state,updated_at`);
        const rows = await res.json();
        const row = rows[0];
        if (row?.updated_at && row.updated_at !== remoteStamp.current) {
          remoteStamp.current = row.updated_at;
          applyRemoteState(row.state);
          setSyncStatus("sincronizado");
        }
      } catch {
        setSyncStatus("local");
      }
    }, 12000);
    return () => clearInterval(t);
  }, [syncReady, applyRemoteState]);

  // Route image handler - compress + send to Claude
  const handleRouteImg = async (file) => {
    if (!file) return;
    setRouteImgLoading(true); setRouteImgError(null);
    try {
      // Compress image to max 1200px wide
      const b64 = await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxW = 1200;
          const scale = img.width > maxW ? maxW / img.width : 1;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          res(dataUrl.split(",")[1]);
        };
        img.onerror = () => rej(new Error("No se pudo leer la imagen"));
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(file);
      });

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
              { type: "text", text: 'This is a warehouse shipping routes table. Extract ALL visible routes. For each route, get: CUT OFF time, Destino (destination name), FME time, CUADRE time, SALIDA CAMION time, and any comments. Ignore rows that are clearly crossed out or cancelled UNLESS they have a comment like "CANCELADO". Return ONLY a JSON array, nothing else:\n[{"cutoff":"HH:MM","dest":"Name","fme":"HH:MM","cuadre":"HH:MM","salida":"HH:MM","comment":""}]\nUse 24h format. If a field is unreadable use empty string. Include cancelled routes with comment "CANCELADO".' }
            ]
          }]
        })
      });
      if (!response.ok) throw new Error(`API error ${response.status}`);
      const data = await response.json();
      const text = (data.content || []).map(i => i.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const newRoutes = parsed.map((r, i) => ({
          id: Date.now() + i,
          order: i,
          cutoff: r.cutoff || "",
          dest: r.dest || "",
          fme: r.fme || "",
          cuadre: r.cuadre || "",
          salida: r.salida || "",
          status: (r.comment || "").toUpperCase().includes("CANCEL") ? "cancelled" : "pending",
          comment: r.comment || "",
        }));
        setRoutes(newRoutes);
      } else {
        setRouteImgError("No se encontraron rutas en la imagen.");
      }
    } catch (err) {
      setRouteImgError(`Error: ${err.message || "No se pudo leer"}. Añade las rutas manualmente.`);
    }
    setRouteImgLoading(false);
  };

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
  const pAGV = g("pt_agv_op"), pMan = g("pt_manual_op");
  const salA = pAGV * objAGV, salM = pMan * objManual, salT = salA + salM;
  const clTot = roles.filter(r => r.z === "clasificacion").reduce((a, r) => a + g(r.id), 0);
  const capH = clTot * capCl;
  const rAGV = g("runner_op"); const rNeed = pAGV > 0 ? Math.ceil(pAGV / ratioR) : 0;

  // Hourly averages
  const totPicR = hourLogs.reduce((a, l) => a + l.picadas, 0);
  const totClaR = hourLogs.reduce((a, l) => a + l.clasificadas, 0);
  const ratioLogs = hourLogs.filter(l => l.picadas > 0 && Number.isFinite(l.clasifRatioReal));
  const realClasifRatio = ratioLogs.length > 0 ? ratioLogs.reduce((a, l) => a + l.clasifRatioReal, 0) / ratioLogs.length : null;
  const planClasifRatio = ratioClasifPicado / 100;
  const mixClasifRatio = realClasifRatio !== null ? (planClasifRatio + realClasifRatio) / 2 : planClasifRatio;
  const activeClasifRatio = projectionMode === "real" ? (realClasifRatio ?? planClasifRatio) : projectionMode === "mix" ? mixClasifRatio : planClasifRatio;
  const activeClasifPct = Math.round(activeClasifRatio * 100);
  const totHH = hourLogs.length * (tDir + tInd);
  const tphAcum = totHH > 0 ? (totPicR / totHH).toFixed(1) : "—";
  const tClasStaff = roles.filter(r => r.z === "clasificacion").reduce((a, r) => a + g(r.id), 0);
  const avgPicPerPerson = hourLogs.length > 0 && tDir > 0 ? Math.round(totPicR / (hourLogs.length * tDir)) : null;
  const avgClaPerPerson = hourLogs.length > 0 && tClasStaff > 0 ? Math.round(totClaR / (hourLogs.length * tClasStaff)) : null;

  const expectedPH = salT;
  const expectedCH = capH;
  const realPH = hourLogs.length > 0 ? Math.round(totPicR / hourLogs.length) : 0;
  const realCH = hourLogs.length > 0 ? Math.round(totClaR / hourLogs.length) : 0;
  const mixPH = realPH > 0 ? Math.round((expectedPH + realPH) / 2) : expectedPH;
  const mixCH = realCH > 0 ? Math.round((expectedCH + realCH) / 2) : expectedCH;
  const activePH = projectionMode === "real" ? realPH : projectionMode === "mix" ? mixPH : expectedPH;
  const activeCH = projectionMode === "real" ? realCH : projectionMode === "mix" ? mixCH : expectedCH;
  const picarFin = hRest > 0 && activePH > 0 ? Math.max(0, pP - activePH * hRest) : pP;
  const clasifFin = hRest > 0 && activeCH > 0 ? Math.max(0, (pC + Math.min(pP, activePH * hRest) * activeClasifRatio) - activeCH * hRest) : pC;
  const rfidFin = hRest > 0 && activePH > 0 ? Math.max(0, pR - activePH * hRest) : pR;
  const actDrops = [...drops].sort((a, b) => toM(a.time) - toM(b.time));
  const nextDr = actDrops.find(d => toM(d.time) > nowM);
  const mToDr = nextDr ? toM(nextDr.time) - nowM : null;
  const routesMeta = [...routes].sort((a, b) => routeOrderValue(a, 0) - routeOrderValue(b, 0)).map(r => {
    const cutM = r.cutoff && r.cutoff.includes(":") ? toM(r.cutoff.padStart(5, "0")) : 9999;
    const diff = cutM - nowM;
    const done = isRouteDone(r);
    const progress = routeHasProgress(r);
    const cancelled = r.status === "cancelled";
    const urgent = !cancelled && !done && !progress && cutM !== 9999 && diff < 60;
    const state = cancelled ? "cancelled" : done ? "done" : urgent ? "urgent" : progress ? "progress" : "open";
    return { r, cutM, diff, done, progress, cancelled, urgent, state };
  });
  const routeVisible = routesMeta.filter(m => routeFilter === "all" || (routeFilter === "focus" && !m.cancelled) || routeFilter === m.state);
  const activeRoutes = routesMeta.filter(m => !m.cancelled);
  const routeDoneCount = activeRoutes.filter(m => m.done).length;
  const routeUrgentCount = routesMeta.filter(m => m.urgent).length;
  const routeProgressCount = routesMeta.filter(m => m.progress && !m.done && !m.cancelled).length;
  const nextRoute = routesMeta.find(m => !m.cancelled && !m.done);
  const recommendations = [
    sinA > 0 ? { c: "#f59e0b", t: "Asignar personal libre", d: `${sinA} persona${sinA === 1 ? "" : "s"} sin destino operativo.` } : null,
    sinA < 0 ? { c: "#ef4444", t: "Revisar reparto", d: `Hay ${Math.abs(sinA)} persona${Math.abs(sinA) === 1 ? "" : "s"} más asignadas que el total.` } : null,
    pAGV > 0 && rAGV < rNeed ? { c: "#ef4444", t: "Faltan runners para AGV", d: `Runner AGV ${rAGV}/${rNeed}. Mueve ${rNeed - rAGV} si quieres mantener el ritmo.` } : null,
    capH > 0 && salT > 0 && capH < salT + pC ? { c: "#ef4444", t: "Clasificación será cuello de botella", d: `Faltan ${(salT + pC - capH).toLocaleString()} uds/h de capacidad.` } : null,
    hRest > 0 && picarFin > 0 ? { c: "#f59e0b", t: "Riesgo fin de turno", d: `A este ritmo quedarían ${Math.round(picarFin).toLocaleString()} uds por picar.` } : null,
    routeUrgentCount > 0 ? { c: "#ef4444", t: "Rutas PT en rojo", d: `${routeUrgentCount} ruta${routeUrgentCount === 1 ? "" : "s"} vencida o a menos de 1h.` } : null,
  ].filter(Boolean);

  const moveZone = (i, d) => { setZones(p => { const n = [...p]; const ni = i + d; if (ni < 0 || ni >= n.length) return p; [n[i], n[ni]] = [n[ni], n[i]]; return n; }); };
  const addHourLog = () => {
    const logH = normalizeTime(hlH);
    if (!logH) return;
    const tph = (tDir + tInd) > 0 ? (hlP / (tDir + tInd)).toFixed(1) : "0";
    const avgPic = tDir > 0 ? Math.round(hlP / tDir) : 0;
    const avgCla = tClasStaff > 0 ? Math.round(hlC / tClasStaff) : 0;
    const prevClasif = pC;
    const pendingClasifReal = hlPC;
    const clasifGenerada = Math.max(0, pendingClasifReal + hlC - prevClasif);
    const clasifRatioReal = hlP > 0 ? clasifGenerada / hlP : null;
    setHourLogs(p => [...p, { id: Date.now(), hora: logH, picadas: hlP, clasificadas: hlC, pendClasifReal: pendingClasifReal, prevClasif, clasifGenerada, clasifRatioReal, personal: asig, dir: tDir, ind: tInd, clasifStaff: tClasStaff, tph, avgPic, avgCla, expectedPic: expectedPH, expectedClas: expectedCH }]);
    setPP(prev => Math.max(0, prev - hlP));
    setPC(pendingClasifReal);
    setHlH(""); setHlP(0); setHlC(0); setHlPC(0); setShowHL(false);
  };
  const addDropLog = () => {
    setDropLogs(p => [...p, { id: Date.now(), hora: hAct, picar: dlP, clasif: pC, rfid: dlR }]);
    setPP(dlP); setPR(dlR);
    setDlP(0); setDlR(0); setShowDL(false);
  };
  const resetTurno = () => {
    if (!window.confirm("¿Nuevo turno? Se borran datos operativos.")) return;
    setPP(0); setPC(0); setPR(0); setTG(0); setStaff({}); setHourLogs([]); setDropLogs([]);
    setRoutes(p => p.map(r => ({ ...r, status: "pending", checks: {} })));
  };
  const startEditRoute = (r) => {
    setEditRouteId(r.id);
    setERCut(r.cutoff || ""); setERDest(r.dest || ""); setERFme(r.fme || ""); setERCua(r.cuadre || ""); setERSal(r.salida || ""); setERCom(r.comment || "");
  };
  const saveEditRoute = () => {
    const cutoff = normalizeTime(eRCut);
    if (!editRouteId || !eRDest.trim() || !cutoff) return;
    setRoutes(p => p.map(r => r.id === editRouteId ? {
      ...r,
      cutoff,
      dest: eRDest.trim(),
      fme: normalizeTime(eRFme),
      cuadre: normalizeTime(eRCua),
      salida: normalizeTime(eRSal),
      comment: eRCom,
    } : r));
    setEditRouteId(null);
  };
  const importPastedRoutes = () => {
    const parsed = parseRouteText(pasteRoutesText);
    if (parsed.length === 0) {
      setPasteRoutesError("No he encontrado rutas. Prueba a pegar columnas con Cut Off, destino, FME, cuadre y salida.");
      return;
    }
    setRoutes(parsed);
    setPasteRoutesText(""); setPasteRoutesError(""); setShowPasteRoutes(false); setRouteFilter("focus");
  };

  const gcol = (z) => ZC[z.ci % ZC.length];

  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: S.sans, color: S.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid rgba(15,23,42,0.08)", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 8px 24px rgba(15,23,42,0.06)" }}>
        <div style={{ maxWidth: desktop ? 1220 : wide ? 980 : 560, margin: "0 auto", padding: wide ? "18px 28px 12px" : "14px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.8, color: S.accent, textTransform: "uppercase" }}>Control Export</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: wide ? 24 : 21, fontWeight: 800, color: S.text }}>Panel de turno</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: S.accent, fontFamily: S.mono }}>{hAct}</span>
            {mRest > 0 && <span style={{ fontSize: 11, color: mRest > 60 ? S.ok : S.bad, fontWeight: 800, background: mRest > 60 ? "rgba(5,150,105,0.09)" : "rgba(220,38,38,0.09)", borderRadius: 999, padding: "3px 7px" }}>~{hRest.toFixed(1)}h</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <span title="Estado de sincronización" style={{ alignSelf: "center", padding: "7px 9px", borderRadius: 999, border: `1px solid ${syncStatus === "sincronizado" ? "rgba(5,150,105,0.22)" : syncStatus === "local" ? "rgba(217,119,6,0.24)" : "rgba(37,99,235,0.22)"}`, background: syncStatus === "sincronizado" ? "rgba(5,150,105,0.08)" : syncStatus === "local" ? "rgba(217,119,6,0.09)" : S.accentSoft, color: syncStatus === "sincronizado" ? S.ok : syncStatus === "local" ? S.warn : S.accent, fontSize: 10, fontWeight: 800 }}>{syncStatus === "sincronizado" ? "Online" : syncStatus === "local" ? "Local" : "Sync"}</span>
          <button title="Nuevo turno" onClick={resetTurno} style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.20)", color: S.bad, borderRadius: 9, padding: "7px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Nuevo</button>
          <button title="Configuración" onClick={() => setShowCfg(!showCfg)} style={{ background: showCfg ? S.accentSoft : "#f8fafc", border: `1px solid ${showCfg ? "rgba(37,99,235,0.25)" : S.cardBorder}`, color: showCfg ? S.accent : S.sub, borderRadius: 9, padding: "7px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Ajustes</button>
        </div>
        </div>
      </div>

      {/* CONFIG */}
      {showCfg && (
        <div style={{ maxWidth: desktop ? 1220 : wide ? 980 : 560, margin: "0 auto", padding: wide ? "14px 28px 18px" : "12px 14px 16px", background: "#ffffff", borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
          <Lbl>Productividad (uds/h)</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><label style={{ fontSize: 11, color: "#3b82f6", marginBottom: 4, display: "block", fontWeight: 700 }}>Media PT AGV / trabajador</label><NF value={objAGV} onCommit={setObjAGV} /></div>
            <div><label style={{ fontSize: 11, color: "#10b981", marginBottom: 4, display: "block", fontWeight: 700 }}>Media PT Manual / trabajador</label><NF value={objManual} onCommit={setObjManual} /></div>
            <div><label style={{ fontSize: 11, color: "#f59e0b", marginBottom: 4, display: "block", fontWeight: 700 }}>Media Clasificador / trabajador</label><NF value={capCl} onCommit={v => setCapCl(v || 1)} /></div>
            <div><label style={{ fontSize: 11, color: "#14b8a6", marginBottom: 4, display: "block", fontWeight: 700 }}>Clasif. generada por picado (%)</label><NF value={ratioClasifPicado} onCommit={v => setRatioClasifPicado(Math.max(0, Math.min(100, v || 0)))} /></div>
          </div>
          <Lbl>Ratios</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><label style={{ fontSize: 10, color: S.dim, marginBottom: 4, display: "block" }}>Pickers/Runner</label><NF value={ratioR} onCommit={v => setRatioR(v || 1)} /></div>
            <div><label style={{ fontSize: 10, color: S.dim, marginBottom: 4, display: "block" }}>Horas efectivas turno</label><DF value={horasTurno} onCommit={setHorasTurno} placeholder="7.5" style={{ ...inp }} /></div>
          </div>
          <Lbl>Fin de turno (ref.)</Lbl>
          <TimeF value={finT} onChange={setFinT} style={{ ...inp, marginBottom: 8 }} />
          <div style={{ fontSize: 10, color: S.dim, marginBottom: 12 }}>Turno efectivo: <b style={{ color: S.text }}>{horasTurno}h</b> · Ratio clasif→picado: <b style={{ color: S.text }}>{ratioClasifPicado}%</b></div>
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
              <TimeF value={nDT} onChange={setNDT} style={{ ...inp, fontSize: 12, padding: 6, width: 80 }} />
              <TF value={nDN} onChange={setNDN} placeholder="Nota" style={{ ...inp, fontSize: 12, padding: 6, flex: 1 }} />
              <button onClick={() => { const t = normalizeTime(nDT); if (t) { setDrops(p => [...p, { id: Date.now(), time: t, note: nDN }]); setNDT(""); setNDN(""); setAddDropOpen(false); } }} style={{ border: "none", background: "#3b82f6", color: "#fff", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+</button>
              <button onClick={() => setAddDropOpen(false)} style={{ border: `1px solid ${S.cardBorder}`, background: "#f8fafc", color: S.dim, borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
            </div>}
        </div>
      )}

      {/* TABS */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: wide ? 8 : 5, maxWidth: desktop ? 1220 : wide ? 980 : 560, margin: "0 auto", padding: wide ? "8px 28px 10px" : "7px 10px 9px" }}>
        {TABS.map(([id, l, s]) => (
          <button key={id} onClick={() => setTab(id)} style={{ minHeight: wide ? 54 : 45, padding: wide ? "8px 10px" : "7px 4px", border: `1px solid ${tab === id ? "rgba(37,99,235,0.28)" : "rgba(15,23,42,0.08)"}`, borderRadius: 10, background: tab === id ? S.accentSoft : "#f8fafc", color: tab === id ? S.accent : S.sub, fontSize: wide ? 13 : 11, fontWeight: 800, cursor: "pointer", textAlign: "left", boxShadow: tab === id ? "inset 0 -2px 0 rgba(37,99,235,0.25)" : "none" }}>
            <span style={{ display: "block" }}>{l}</span>
            {wide && <span style={{ display: "block", fontSize: 10, color: tab === id ? S.accent : S.dim, fontWeight: 600, marginTop: 2 }}>{s}</span>}
          </button>
        ))}
        </div>
      </div>

      <div style={{ maxWidth: desktop ? 1220 : wide ? 980 : 560, margin: "0 auto", padding: wide ? "18px 28px 100px" : "14px 14px 100px" }}>
        <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
          <div>
            <div style={{ fontSize: wide ? 22 : 19, fontWeight: 800, color: S.text }}>{TAB_INFO[tab].title}</div>
            <div style={{ fontSize: 12, color: S.dim, marginTop: 3, lineHeight: 1.35 }}>{TAB_INFO[tab].desc}</div>
          </div>
        </div>

        {/* ═══ DASHBOARD ═══ */}
        {tab === "dashboard" && (<>
          <div style={{ display: wide ? "grid" : "block", gridTemplateColumns: desktop ? "1.05fr 0.95fr" : "1fr 1fr", gap: wide ? 14 : 0, alignItems: "start" }}>
            <div>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: wide ? 10 : 6, marginBottom: 14 }}>
            {[{ l: "Por Picar", v: pP, c: "#ef4444" }, { l: "Por Clasif.", v: pC, c: "#f59e0b" }, { l: "Pdt RFID", v: pR, c: "#a78bfa" }, { l: "Personas", v: asig, c: "#3b82f6" }].map(k => (
              <div key={k.l} style={{ background: S.card, borderRadius: 10, padding: wide ? "12px 10px" : "10px 7px", textAlign: "left", border: `1px solid ${S.cardBorder}`, borderTop: `3px solid ${k.c}`, boxShadow: "0 8px 18px rgba(15,23,42,0.06)" }}>
                <div style={{ fontSize: 9, color: S.dim, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{k.l}</div>
                <div style={{ fontSize: wide ? 22 : 17, fontWeight: 800, color: k.c, fontFamily: S.mono, marginTop: 5 }}>{k.v.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {(recommendations.length > 0 || asig > 0 || routes.length > 0) && (
            <Card sx={{ borderLeft: `4px solid ${recommendations.some(a => a.c === "#ef4444") ? "#ef4444" : recommendations.length > 0 ? "#f59e0b" : "#10b981"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Lbl>Centro de mando</Lbl>
                <Pill color={recommendations.length > 0 ? "#f59e0b" : "#10b981"}>{recommendations.length > 0 ? `${recommendations.length} aviso${recommendations.length === 1 ? "" : "s"}` : "Estable"}</Pill>
              </div>
              {recommendations.length > 0 ? recommendations.slice(0, 4).map((a, idx) => (
                <div key={idx} style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: idx > 0 ? `1px solid ${S.cardBorder}` : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: a.c, marginTop: 5, boxShadow: `0 0 0 4px ${a.c}18` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: S.text }}>{a.t}</div>
                    <div style={{ fontSize: 11, color: S.dim, marginTop: 2 }}>{a.d}</div>
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: 12, color: S.sub }}>Sin riesgos claros con los datos actuales. Vigila las próximas rutas y el primer registro real de productividad.</div>
              )}
              {nextRoute && (
                <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: nextRoute.urgent ? "rgba(220,38,38,0.08)" : S.accentSoft, display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 11, color: S.sub, fontWeight: 700 }}>Próxima ruta: {nextRoute.r.dest}</span>
                  <span style={{ fontSize: 11, color: nextRoute.urgent ? S.bad : S.accent, fontWeight: 800, fontFamily: S.mono }}>{timeLabel(nextRoute.diff)}</span>
                </div>
              )}
            </Card>
          )}

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
              {tExt > 0 && <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${S.cardBorder}`, fontSize: 10, color: TC.tarea_extra, fontWeight: 700 }}>EXTRA ({tExt}) — no cuenta para TPH</div>}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: `1px solid ${S.cardBorder}`, fontSize: 12, fontWeight: 700 }}>
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
              {pAGV > 0 && rAGV < rNeed && <div style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "rgba(220,38,38,0.08)", color: S.bad }}>Runners: {rAGV}/{rNeed}</div>}
              {capH < salT + pC ? <div style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "rgba(220,38,38,0.08)", color: S.bad }}>Cuello de botella clasificación</div>
                : clTot > 0 && <div style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "rgba(5,150,105,0.08)", color: S.ok }}>Clasificación absorbe</div>}
            </Card>
          )}
            </div>
            <div>

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
                <div style={{ background: hourLogs.length > 0 ? "rgba(20,184,166,0.1)" : "#f8fafc", borderRadius: 12, padding: 10, textAlign: "center", border: `1px solid ${hourLogs.length > 0 ? "rgba(20,184,166,0.2)" : S.cardBorder}` }}>
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
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: S.sub }}>Total acumulado</span>
                    <span style={{ fontFamily: S.mono, fontWeight: 700 }}>
                      <span style={{ color: "#3b82f6" }}>{totPicR.toLocaleString()}</span>
                      <span style={{ color: S.dim }}> pic · </span>
                      <span style={{ color: "#f59e0b" }}>{totClaR.toLocaleString()}</span>
                      <span style={{ color: S.dim }}> cla</span>
                    </span>
                  </div>
                  <div style={{ marginTop: 8, background: "rgba(245,158,11,0.08)", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: S.sub }}>Ratio clasif/picado real</span>
                    <span style={{ fontFamily: S.mono, fontWeight: 800, color: "#fbbf24" }}>{realClasifRatio !== null ? `${Math.round(realClasifRatio * 100)}%` : "sin datos"}</span>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Lbl>Proyección ~{finT}</Lbl>
                <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 8 }}>
                  {[["plan", "Plan"], ["mix", "Mixto"], ["real", "Real"]].map(([id, l]) => (
                    <button key={id} onClick={() => setProjectionMode(id)} style={{ border: "none", borderRadius: 6, padding: "4px 7px", background: projectionMode === id ? "#ffffff" : "transparent", color: projectionMode === id ? S.accent : S.dim, fontSize: 10, fontWeight: 800, cursor: "pointer", boxShadow: projectionMode === id ? "0 1px 3px rgba(15,23,42,0.08)" : "none" }}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                <div style={{ background: "rgba(59,130,246,0.08)", borderRadius: 8, padding: "6px 8px", border: "1px solid rgba(59,130,246,0.16)" }}>
                  <div style={{ fontSize: 8, color: S.dim, fontWeight: 800 }}>PICADO USADO</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: S.accent, fontFamily: S.mono }}>{activePH.toLocaleString()} uds/h</div>
                </div>
                <div style={{ background: "rgba(16,185,129,0.08)", borderRadius: 8, padding: "6px 8px", border: "1px solid rgba(16,185,129,0.16)" }}>
                  <div style={{ fontSize: 8, color: S.dim, fontWeight: 800 }}>CLASIF. USADA</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: S.ok, fontFamily: S.mono }}>{activeCH.toLocaleString()} uds/h</div>
                </div>
              </div>
              <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: 8, padding: "6px 8px", border: "1px solid rgba(245,158,11,0.16)", marginBottom: 8, display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 10, color: S.dim, fontWeight: 800 }}>RATIO REAL CLASIF/PICADO</span>
                <span style={{ fontSize: 12, color: "#fbbf24", fontFamily: S.mono, fontWeight: 800 }}>{realClasifRatio !== null ? `${Math.round(realClasifRatio * 100)}%` : "sin datos"} · usado {activeClasifPct}%</span>
              </div>
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
            </div>
          </div>

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
          <div style={{ display: wide ? "grid" : "block", gridTemplateColumns: desktop ? "360px 1fr" : "320px 1fr", gap: wide ? 14 : 0, alignItems: "start" }}>
            <div>
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
              <span style={{ fontSize: 12, fontWeight: 800, color: sinA === 0 ? S.ok : sinA < 0 ? S.bad : S.warn }}>{sinA === 0 ? "✓ Todos" : sinA > 0 ? `${sinA} libres` : `${Math.abs(sinA)} extra`}</span>
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
            </div>
            <div style={{ display: wide ? "grid" : "block", gridTemplateColumns: desktop ? "1fr 1fr" : "1fr", gap: wide ? 10 : 0, alignItems: "start" }}>

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
                      <button onClick={() => setEZone(null)} style={{ border: `1px solid ${S.cardBorder}`, background: "#f8fafc", color: S.dim, borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
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
            </div>
          </div>
        </>)}

        {/* ═══ SITUACIÓN ═══ */}
        {tab === "situacion" && (<>
          <div style={{ display: wide ? "grid" : "block", gridTemplateColumns: desktop ? "360px 1fr" : "320px 1fr", gap: wide ? 14 : 0, alignItems: "start" }}>
            <div>
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
            <button onClick={() => { setHlPC(pC); setShowHL(true); setShowDL(false); }} style={{ padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>⏱ Registro hora</button>
            <button onClick={() => { setShowDL(true); setShowHL(false); }} style={{ padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>📦 Caída</button>
          </div>

          {showHL && (
            <Card sx={{ borderColor: "rgba(59,130,246,0.3)" }}>
              <Lbl>¿Qué se ha hecho esta hora?</Lbl>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 4 }}>Hora</label>
                <TimeF value={hlH} onChange={setHlH} style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: "#ef4444", display: "block", marginBottom: 4 }}>Uds picadas</label><NF value={hlP} onCommit={setHlP} /></div>
                <div><label style={{ fontSize: 10, color: "#f59e0b", display: "block", marginBottom: 4 }}>Uds clasificadas</label><NF value={hlC} onCommit={setHlC} /></div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 10, color: "#f59e0b", display: "block", marginBottom: 4 }}>Pend. clasif real al cierre</label>
                <NF value={hlPC} onCommit={setHlPC} style={{ ...inp, borderColor: "rgba(245,158,11,0.35)" }} />
              </div>
              {hlP > 0 && (
                <div style={{ fontSize: 11, color: S.dim, marginBottom: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.16)", padding: 8, borderRadius: 8 }}>
                  Ratio estimado esta hora: <b style={{ color: "#fbbf24" }}>{Math.round((Math.max(0, hlPC + hlC - pC) / hlP) * 100)}%</b>
                  <span style={{ marginLeft: 4 }}>({Math.max(0, hlPC + hlC - pC).toLocaleString()} uds nuevas a clasif.)</span>
                </div>
              )}
              <div style={{ fontSize: 11, color: S.dim, marginBottom: 10, background: "#f8fafc", padding: 8, borderRadius: 8 }}>
                Esperado: <b style={{ color: "#3b82f6" }}>{salT.toLocaleString()}</b> pic · <b style={{ color: "#10b981" }}>{capH.toLocaleString()}</b> cla · ratio activo <b style={{ color: "#fbbf24" }}>{activeClasifPct}%</b>
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
              <div style={{ fontSize: 11, color: S.dim, marginBottom: 10, background: "#f8fafc", padding: 8, borderRadius: 8 }}>
                Pend. clasificar se mantiene: <b style={{ color: "#f59e0b" }}>{pC.toLocaleString()}</b>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addDropLog} style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#f59e0b", color: "#000", fontWeight: 700, cursor: "pointer" }}>Guardar</button>
                <button onClick={() => setShowDL(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${S.cardBorder}`, background: "transparent", color: S.dim, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              </div>
            </Card>
          )}
            </div>
            <div>

          {hourLogs.length > 0 && (
            <Card>
              <Lbl>Registro por horas</Lbl>
              {hourLogs.map((l, i) => {
                const dP = l.picadas - l.expectedPic, dC = l.clasificadas - l.expectedClas;
                const ratioTxt = Number.isFinite(l.clasifRatioReal) ? `${Math.round(l.clasifRatioReal * 100)}%` : "—";
                return (
                  <div key={l.id} style={{ padding: "8px 0", borderBottom: i < hourLogs.length - 1 ? `1px solid ${S.cardBorder}` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: S.text }}>{l.hora}</span>
                        <Pill color="#14b8a6">TPH {l.tph}</Pill>
                        <Pill color="#fbbf24">R {ratioTxt}</Pill>
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
                      <div>
                        <span style={{ color: S.dim }}>Pend cla: </span>
                        <span style={{ fontWeight: 700, fontFamily: S.mono, color: "#fbbf24" }}>{(l.pendClasifReal ?? 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span style={{ color: S.dim }}>Nueva cla: </span>
                        <span style={{ fontWeight: 700, fontFamily: S.mono, color: "#fbbf24" }}>{(l.clasifGenerada ?? 0).toLocaleString()}</span>
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
            </div>
          </div>
        </>)}

        {/* ═══ RUTAS PT ═══ */}
        {tab === "rutas" && (<>
          <div style={{ display: wide ? "grid" : "block", gridTemplateColumns: desktop ? "360px 1fr" : "320px 1fr", gap: wide ? 14 : 0, alignItems: "start" }}>
            <div>
          {/* Photo upload */}
          <Card>
            <Lbl>Cargar rutas del día</Lbl>
            <p style={{ fontSize: 12, color: S.dim, marginTop: -2, marginBottom: 10, lineHeight: 1.35 }}>Pega las rutas desde una tabla o lista. La foto queda como apoyo si necesitas probar OCR.</p>
            <input ref={routeCamRef} type="file" accept="image/*" capture="environment" onChange={e => { handleRouteImg(e.target.files?.[0]); e.target.value = ""; }} style={{ display: "none" }} />
            <input ref={routeGalRef} type="file" accept="image/*" onChange={e => { handleRouteImg(e.target.files?.[0]); e.target.value = ""; }} style={{ display: "none" }} />
            <button onClick={() => { setShowPasteRoutes(!showPasteRoutes); setPasteRoutesError(""); }} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid rgba(16,185,129,0.28)", background: "rgba(16,185,129,0.09)", color: "#6ee7b7", fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 8 }}>Pegar rutas</button>
            {showPasteRoutes && (
              <div style={{ marginBottom: 10, background: "#f8fafc", border: `1px solid ${S.cardBorder}`, borderRadius: 10, padding: 10 }}>
                <textarea value={pasteRoutesText} onChange={e => { setPasteRoutesText(e.target.value); setPasteRoutesError(""); }} placeholder={"Pega aquí desde Excel, email o WhatsApp.\nEjemplo:\n10:30\tMadrid\t11:00\t11:20\t12:00\n11:30\tBarcelona\t12:00\t12:20\t13:00"} style={{ ...inp, minHeight: 130, resize: "vertical", fontFamily: S.sans, fontSize: 12, lineHeight: 1.35 }} />
                {pasteRoutesError && <div style={{ color: "#fca5a5", fontSize: 11, marginTop: 6 }}>{pasteRoutesError}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={importPastedRoutes} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#10b981", color: "#052e1a", fontWeight: 800, cursor: "pointer" }}>Importar</button>
                  <button onClick={() => { setShowPasteRoutes(false); setPasteRoutesText(""); setPasteRoutesError(""); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${S.cardBorder}`, background: "transparent", color: S.dim, fontWeight: 800, cursor: "pointer" }}>Cancelar</button>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => routeCamRef.current?.click()} disabled={routeImgLoading} style={{ flex: 1, padding: 12, borderRadius: 10, border: "2px dashed rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.05)", color: "#3b82f6", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>📷 Cámara</button>
              <button onClick={() => routeGalRef.current?.click()} disabled={routeImgLoading} style={{ flex: 1, padding: 12, borderRadius: 10, border: "2px dashed rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.05)", color: "#a78bfa", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🖼 Galería</button>
            </div>
            {routeImgLoading && <div style={{ marginTop: 10, padding: 10, background: S.accentSoft, borderRadius: 8, fontSize: 12, color: S.accent, textAlign: "center", fontWeight: 700 }}>Leyendo rutas de la imagen...</div>}
            {routeImgError && <div style={{ marginTop: 10, padding: 10, background: "rgba(220,38,38,0.08)", borderRadius: 8, fontSize: 12, color: S.bad }}>{routeImgError}<div style={{ marginTop: 4, color: S.dim }}>Si la foto falla, usa “Pegar rutas”; no depende del OCR.</div></div>}
          </Card>

          {/* Routes list */}
          {routes.length > 0 && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Lbl>Rutas del día</Lbl>
                <div style={{ fontSize: 11, color: S.dim }}>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>{routeDoneCount}</span>
                  <span> / {activeRoutes.length}</span>
                </div>
              </div>
              <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 12, background: "rgba(51,65,85,0.3)" }}>
                <div style={{ width: `${activeRoutes.length > 0 ? (routeDoneCount / activeRoutes.length) * 100 : 0}%`, background: "#10b981", transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10, fontSize: 10, color: S.dim, fontWeight: 700 }}>
                <span><b style={{ color: S.warn }}>Amarillo</b> 1 toque</span>
                <span><b style={{ color: S.ok }}>Verde</b> 2 toques</span>
                <span><b style={{ color: S.bad }}>Rojo</b> urgente/vencida</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                {[{ l: "Rojo", v: routeUrgentCount, c: "#ef4444" }, { l: "En curso", v: routeProgressCount, c: "#f59e0b" }, { l: "Listas", v: routeDoneCount, c: "#10b981" }].map(k => (
                  <div key={k.l} style={{ background: `${k.c}10`, border: `1px solid ${k.c}24`, borderRadius: 8, padding: "7px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: S.dim, fontWeight: 800, textTransform: "uppercase" }}>{k.l}</div>
                    <div style={{ color: k.c, fontFamily: S.mono, fontWeight: 800, fontSize: 16 }}>{k.v}</div>
                  </div>
                ))}
              </div>
              {nextRoute && (
                <div style={{ background: nextRoute.urgent ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.08)", border: `1px solid ${nextRoute.urgent ? "rgba(239,68,68,0.22)" : "rgba(59,130,246,0.16)"}`, borderRadius: 8, padding: "8px 10px", marginBottom: 10, display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 11, color: S.sub, fontWeight: 700 }}>Siguiente foco: {nextRoute.r.dest}</span>
                  <span style={{ fontSize: 11, color: nextRoute.urgent ? S.bad : S.accent, fontWeight: 800, fontFamily: S.mono }}>{timeLabel(nextRoute.diff)}</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
                {[["focus", "Foco"], ["urgent", "Rojo"], ["progress", "Curso"], ["done", "Listas"], ["all", "Todas"]].map(([id, l]) => (
                  <button key={id} onClick={() => setRouteFilter(id)} style={{ border: `1px solid ${routeFilter === id ? "rgba(37,99,235,0.28)" : S.cardBorder}`, borderRadius: 999, padding: "7px 10px", background: routeFilter === id ? S.accentSoft : "#f8fafc", color: routeFilter === id ? S.accent : S.dim, fontSize: 10, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
                ))}
              </div>
            </Card>
          )}
            </div>
            <div>

          <div style={{ display: desktop ? "grid" : "block", gridTemplateColumns: "1fr 1fr", gap: desktop ? 10 : 0, alignItems: "start" }}>
          {routeVisible.map(({ r, diff }, i) => {
            const isCancelled = r.status === "cancelled";
            const checks = r.checks || {};
            const isDone = (field) => checks[field] === CHECK_DONE || checks[field] === true;
            const isProgress = (field) => checks[field] === CHECK_PROGRESS;
            const allDone = ROUTE_STEPS.every(isDone);
            const hasProgress = ROUTE_STEPS.some(isProgress);
            const hasDone = ROUTE_STEPS.some(isDone);
            const cutM = r.cutoff && r.cutoff.includes(":") ? toM(r.cutoff.padStart(5, "0")) : 0;
            const isUrgent = !isDone("cutoff") && !isProgress("cutoff") && !isCancelled && cutM > 0 && cutM - nowM < 60;
            const toggleCheck = (field) => {
              setRoutes(p => p.map(x => {
                if (x.id !== r.id) return x;
                const current = (x.checks || {})[field];
                const next = current === CHECK_PROGRESS ? CHECK_DONE : current === CHECK_DONE || current === true ? undefined : CHECK_PROGRESS;
                const nextChecks = { ...(x.checks || {}) };
                if (next) nextChecks[field] = next;
                else delete nextChecks[field];
                return { ...x, checks: nextChecks };
              }));
            };
            const cellStyle = (field) => ({
              padding: "7px 4px", textAlign: "center", fontSize: 11, fontFamily: S.mono, fontWeight: 800, cursor: "pointer", borderRadius: 8, transition: "all 0.15s", minHeight: 44,
              background: isDone(field) ? "rgba(5,150,105,0.10)" : isProgress(field) ? "rgba(217,119,6,0.12)" : "#f8fafc",
              border: `1px solid ${isDone(field) ? "rgba(5,150,105,0.24)" : isProgress(field) ? "rgba(217,119,6,0.28)" : "rgba(15,23,42,0.08)"}`,
              color: isDone(field) ? S.ok : isProgress(field) ? S.warn : isCancelled ? S.dim : S.sub,
              textDecoration: isCancelled ? "line-through" : "none",
              boxShadow: isDone(field) || isProgress(field) ? "inset 0 1px 0 rgba(255,255,255,0.65)" : "none",
            });
            return (
              <div key={r.id} style={{
                background: allDone ? "linear-gradient(135deg, rgba(5,150,105,0.08), #ffffff)" : isCancelled ? "#f1f5f9" : isUrgent ? "linear-gradient(135deg, rgba(220,38,38,0.09), #ffffff)" : hasProgress ? "linear-gradient(135deg, rgba(217,119,6,0.09), #ffffff)" : S.card,
                borderRadius: 10, marginBottom: 9, border: `1px solid ${allDone ? "rgba(5,150,105,0.22)" : isUrgent ? "rgba(220,38,38,0.26)" : hasProgress ? "rgba(217,119,6,0.24)" : S.cardBorder}`,
                borderLeft: `5px solid ${allDone ? S.ok : isUrgent ? S.bad : hasProgress ? S.warn : hasDone ? S.accent : "rgba(100,116,139,0.30)"}`,
                padding: "10px 11px", opacity: isCancelled ? 0.52 : 1, boxShadow: "0 8px 20px rgba(15,23,42,0.07)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: allDone ? S.ok : isUrgent ? S.bad : S.text, textDecoration: isCancelled ? "line-through" : allDone ? "line-through" : "none" }}>{r.dest}</span>
                    {isUrgent && <span style={{ fontSize: 8, color: S.bad, fontWeight: 800, background: "rgba(220,38,38,0.10)", padding: "2px 6px", borderRadius: 999 }}>URGENTE</span>}
                    {hasProgress && !isUrgent && !allDone && <span style={{ fontSize: 8, color: S.warn, fontWeight: 800, background: "rgba(217,119,6,0.10)", padding: "2px 6px", borderRadius: 999 }}>EN CURSO</span>}
                    {allDone && <span style={{ fontSize: 8, color: S.ok, fontWeight: 800 }}>✓</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {!isCancelled && !allDone && r.cutoff && <span style={{ fontSize: 10, fontFamily: S.mono, fontWeight: 800, color: isUrgent ? S.bad : S.accent, background: isUrgent ? "rgba(220,38,38,0.09)" : S.accentSoft, borderRadius: 999, padding: "4px 7px" }}>{timeLabel(diff)}</span>}
                    <button onClick={() => startEditRoute(r)} style={{ background: "#f8fafc", border: `1px solid ${S.cardBorder}`, color: S.sub, borderRadius: 7, fontSize: 10, fontWeight: 800, cursor: "pointer", padding: "5px 7px" }}>Editar</button>
                    <button onClick={() => setRoutes(p => p.map(x => x.id === r.id ? { ...x, status: x.status === "cancelled" ? "pending" : "cancelled", checks: {} } : x))} style={{ background: "none", border: "none", color: S.dim, fontSize: 12, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
                {editRouteId === r.id ? (
                  <div style={{ background: "#f8fafc", border: `1px solid ${S.cardBorder}`, borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <div><label style={{ fontSize: 9, color: S.dim, display: "block", marginBottom: 3 }}>Cut Off</label><TimeF value={eRCut} onChange={setERCut} style={{ ...inp, fontSize: 13, padding: 8 }} /></div>
                      <div><label style={{ fontSize: 9, color: S.dim, display: "block", marginBottom: 3 }}>Destino</label><TF value={eRDest} onChange={setERDest} placeholder="Destino" style={{ ...inp, fontSize: 13, padding: 8, fontFamily: S.sans }} /></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <div><label style={{ fontSize: 9, color: S.dim, display: "block", marginBottom: 3 }}>FME</label><TimeF value={eRFme} onChange={setERFme} style={{ ...inp, fontSize: 13, padding: 8 }} /></div>
                      <div><label style={{ fontSize: 9, color: S.dim, display: "block", marginBottom: 3 }}>Cuadre</label><TimeF value={eRCua} onChange={setERCua} style={{ ...inp, fontSize: 13, padding: 8 }} /></div>
                      <div><label style={{ fontSize: 9, color: S.dim, display: "block", marginBottom: 3 }}>Salida</label><TimeF value={eRSal} onChange={setERSal} style={{ ...inp, fontSize: 13, padding: 8 }} /></div>
                    </div>
                    <TF value={eRCom} onChange={setERCom} placeholder="Comentario" style={{ ...inp, fontSize: 13, padding: 8, fontFamily: S.sans, marginBottom: 8 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={saveEditRoute} style={{ flex: 1, padding: 9, borderRadius: 8, border: "none", background: "#10b981", color: "#052e1a", fontWeight: 800, cursor: "pointer" }}>Guardar</button>
                      <button onClick={() => setEditRouteId(null)} style={{ flex: 1, padding: 9, borderRadius: 8, border: `1px solid ${S.cardBorder}`, background: "transparent", color: S.dim, fontWeight: 800, cursor: "pointer" }}>Cancelar</button>
                    </div>
                  </div>
                ) : <div style={{ display: "grid", gridTemplateColumns: wide ? "repeat(6, 1fr)" : "repeat(3, 1fr)", gap: 4 }}>
                  {ROUTE_STEPS.map(field => (
                    <div key={field} onClick={() => toggleCheck(field)} style={cellStyle(field)}>
                      <div style={{ fontSize: 8, color: S.dim, fontWeight: 600, marginBottom: 2 }}>{ROUTE_LABELS[field]}</div>
                      {r[field] || (field === "awb" || field === "flejado" ? "OK" : "—")}
                    </div>
                  ))}
                </div>}
                {r.comment && <div style={{ fontSize: 10, color: "#fbbf24", marginTop: 4 }}>{r.comment}</div>}
              </div>
            );
          })}
          </div>

          {routes.length > 0 && routeVisible.length === 0 && (
            <Card sx={{ textAlign: "center", padding: "18px 16px" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: S.sub }}>No hay rutas en este filtro</div>
              <button onClick={() => setRouteFilter("focus")} style={{ marginTop: 8, border: `1px solid ${S.cardBorder}`, background: S.accentSoft, color: S.accent, borderRadius: 8, padding: "7px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Ver foco</button>
            </Card>
          )}

          {!showAddRoute ? (
            <button onClick={() => setShowAddRoute(true)} style={{ width: "100%", padding: 10, borderRadius: 10, border: `2px dashed ${S.cardBorder}`, background: "transparent", color: S.dim, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>+ Añadir ruta</button>
          ) : (
            <Card sx={{ marginTop: 6 }}>
              <Lbl>Nueva ruta</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 3 }}>Cut Off</label><TimeF value={nRCut} onChange={setNRCut} style={inp} /></div>
                <div><label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 3 }}>Destino</label><TF value={nRDest} onChange={setNRDest} placeholder="Destino" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 3 }}>FME</label><TimeF value={nRFme} onChange={setNRFme} style={inp} /></div>
                <div><label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 3 }}>Cuadre</label><TimeF value={nRCua} onChange={setNRCua} style={inp} /></div>
                <div><label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 3 }}>Salida</label><TimeF value={nRSal} onChange={setNRSal} style={inp} /></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { const cutoff = normalizeTime(nRCut); if (nRDest.trim() && cutoff) { const fme = normalizeTime(nRFme), cuadre = normalizeTime(nRCua), salida = normalizeTime(nRSal); setRoutes(p => [...p, { id: Date.now(), order: p.length, cutoff, dest: nRDest.trim(), fme, cuadre, salida, status: "pending", comment: "" }]); setNRCut(""); setNRDest(""); setNRFme(""); setNRCua(""); setNRSal(""); setShowAddRoute(false); } }} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Añadir</button>
                <button onClick={() => setShowAddRoute(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${S.cardBorder}`, background: "transparent", color: S.dim, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              </div>
            </Card>
          )}

          {routes.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => { if (window.confirm("¿Resetear todas las rutas a pendiente?")) setRoutes(p => p.map(r => ({ ...r, status: "pending", checks: {} }))); }} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${S.cardBorder}`, background: "#f8fafc", color: S.dim, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Resetear</button>
              <button onClick={() => { if (window.confirm("¿Borrar todas las rutas?")) setRoutes([]); }} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "rgba(220,38,38,0.08)", color: S.bad, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Borrar todas</button>
            </div>
          )}

          {routes.length === 0 && !routeImgLoading && (
            <Card sx={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.6 }}>🚚</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: S.sub }}>Sin rutas cargadas</div>
              <div style={{ fontSize: 12, color: S.dim, marginTop: 4 }}>Haz una foto a la hoja de rutas del día o añádelas manualmente</div>
            </Card>
          )}
            </div>
          </div>
        </>)}
      </div>
      {!wide && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 120, background: "rgba(255,255,255,0.96)", borderTop: "1px solid rgba(15,23,42,0.10)", boxShadow: "0 -10px 26px rgba(15,23,42,0.10)", padding: "8px 8px 10px" }}>
          <div style={{ maxWidth: 560, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {TABS.map(([id, l]) => (
              <button key={id} onClick={() => setTab(id)} style={{ border: "none", borderRadius: 10, background: tab === id ? S.accentSoft : "transparent", color: tab === id ? S.accent : S.dim, padding: "8px 2px", fontSize: 10, fontWeight: 800, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
