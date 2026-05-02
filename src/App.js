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
const CHECK_PROGRESS = "progress";
const CHECK_DONE = "done";

/* ═══ STYLES ═══ */
const S = {
  bg: "#0b1120",
  card: "rgba(17,24,39,0.82)",
  cardBorder: "rgba(148,163,184,0.16)",
  surface: "#1e293b",
  text: "#f1f5f9",
  sub: "#cbd5e1",
  dim: "#8492a6",
  mono: "'JetBrains Mono',monospace",
  sans: "'DM Sans',sans-serif",
};
const inp = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.24)", background: "rgba(15,23,42,0.72)", color: "#f1f5f9", fontSize: 16, fontWeight: 700, fontFamily: S.mono, boxSizing: "border-box", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" };

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

function Card({ children, sx }) { return <div style={{ background: S.card, backdropFilter: "blur(14px)", borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${S.cardBorder}`, boxShadow: "0 14px 34px rgba(0,0,0,0.18)", ...sx }}>{children}</div>; }
function Lbl({ children }) { return <div style={{ fontSize: 10, fontWeight: 700, color: S.dim, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{children}</div>; }
function Pill({ color, children }) { return <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: color + "22", color }}>{children}</span>; }
function toM(t) { const p = t.split(":").map(Number); return p[0] * 60 + (p[1] || 0); }
