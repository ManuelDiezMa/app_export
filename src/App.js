import React, { useState, useEffect } from "react";

const SUPA_URL = "https://izqihthvpiblgftrthpk.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cWlodGh2cGlibGdmdHJ0aHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzI0NDksImV4cCI6MjA5MzA0ODQ0OX0.QtHFCTrvwFNv8W7_OlRmKuTr9J7GWwFFWpA0UDUDa0o";

const headers = {
  "apikey": SUPA_KEY,
  "Authorization": `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

function App() {
  const [pP, setPP] = useState(0);
  const [status, setStatus] = useState("Conectando...");
  const [lastUpdate, setLastUpdate] = useState("");

  // Load initial data
  useEffect(() => {
    fetch(`${SUPA_URL}/rest/v1/turno?id=eq.current&select=*`, { headers })
      .then(r => r.json())
      .then(data => {
        if (data && data[0]) {
          setPP(data[0].pend_picar || 0);
          setStatus("✓ Conectado a Supabase");
          setLastUpdate(new Date().toLocaleTimeString());
        } else {
          setStatus("⚠ Sin datos");
        }
      })
      .catch(err => setStatus("✕ Error: " + err.message));
  }, []);

  // Save to Supabase
  const save = (val) => {
    setPP(val);
    fetch(`${SUPA_URL}/rest/v1/turno?id=eq.current`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ pend_picar: val, updated_at: new Date().toISOString() }),
    })
      .then(r => r.json())
      .then(() => { setStatus("✓ Guardado"); setLastUpdate(new Date().toLocaleTimeString()); })
      .catch(err => setStatus("✕ Error: " + err.message));
  };

  // Poll for changes every 3 seconds (simple sync test)
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${SUPA_URL}/rest/v1/turno?id=eq.current&select=*`, { headers })
        .then(r => r.json())
        .then(data => {
          if (data && data[0]) {
            setPP(data[0].pend_picar || 0);
            setLastUpdate(new Date().toLocaleTimeString());
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "'DM Sans',sans-serif", color: "#f1f5f9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet" />
      
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>{status}</div>
      
      <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>Pendiente de picar</div>
      <div style={{ fontSize: 48, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: "#3b82f6", marginBottom: 20 }}>{pP.toLocaleString()}</div>
      
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => save(pP + 100)} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#3b82f6", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>+100</button>
        <button onClick={() => save(Math.max(0, pP - 100))} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#ef4444", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>-100</button>
        <button onClick={() => save(0)} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "#64748b", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Reset</button>
      </div>

      <div style={{ marginTop: 30, fontSize: 12, color: "#64748b", textAlign: "center" }}>
        <div>Última sync: {lastUpdate}</div>
        <div style={{ marginTop: 8 }}>Abre esta URL en otro móvil/pestaña.</div>
        <div>Pulsa +100 y mira si cambia en el otro.</div>
      </div>
    </div>
  );
}

export default App;
