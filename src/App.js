import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const PASSWORD = "StayCurious";

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit() {
    if (input === PASSWORD) {
      sessionStorage.setItem("lt_auth", "1");
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  }

  return (
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", background: "#0d0d0d", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Lead Tracker</div>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase", marginBottom: 32 }}>Enter password to continue</div>
      <input type="password" placeholder="Password" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} style={{ width: "100%", maxWidth: 280, background: "#111", border: `1px solid ${error ? "#ff5252" : "#1e1e1e"}`, borderRadius: 4, color: "#e0e0e0", padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 12, boxSizing: "border-box", textAlign: "center" }} autoFocus />
      {error && <div style={{ fontSize: 11, color: "#ff5252", marginBottom: 12, letterSpacing: 1 }}>Incorrect password</div>}
      <button onClick={handleSubmit} style={{ width: "100%", maxWidth: 280, background: "#fff", color: "#0d0d0d", border: "none", borderRadius: 4, padding: "10px 0", fontSize: 12, fontFamily: "inherit", fontWeight: 700, letterSpacing: 1, cursor: "pointer" }}>ENTER</button>
    </div>
  );
}

const STATUSES = [
  { value: "booked", label: "Booked", color: "#00e676", bg: "#00e67615" },
  { value: "callback", label: "Call Back", color: "#ffab40", bg: "#ffab4015" },
  { value: "follow_up", label: "Follow Up", color: "#40c4ff", bg: "#40c4ff15" },
  { value: "not_interested", label: "Not Interested", color: "#ff5252", bg: "#ff525215" },
  { value: "no_answer", label: "No Answer", color: "#9e9e9e", bg: "#9e9e9e15" },
];

const METHODS = [
  { value: "call", label: "📞 Call" },
  { value: "walk_in", label: "🚶 Walk-in" },
];

const blankForm = {
  business: "", contact: "", method: "call", status: "no_answer", follow_up_date: "", notes: "",
};

function getStatusMeta(val) {
  return STATUSES.find((s) => s.value === val) || STATUSES[4];
}

export default function App() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem("lt_auth"));
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [view, setView] = useState("log");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (authed) fetchLeads();
  }, [authed]);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (!error) setLeads(data || []);
    setLoading(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function handleSubmit() {
    if (!form.business.trim()) return;
    if (editId !== null) {
      const { error } = await supabase.from("leads").update(form).eq("id", editId);
      if (!error) { showToast("Updated"); setEditId(null); setForm(blankForm); fetchLeads(); }
    } else {
      const { error } = await supabase.from("leads").insert([form]);
      if (!error) { showToast("Logged"); setForm(blankForm); fetchLeads(); }
    }
  }

  async function handleDelete(id) {
    await supabase.from("leads").delete().eq("id", id);
    showToast("Deleted");
    fetchLeads();
  }

  function handleEdit(lead) {
    setForm({ business: lead.business, contact: lead.contact || "", method: lead.method, status: lead.status, follow_up_date: lead.follow_up_date || "", notes: lead.notes || "" });
    setEditId(lead.id);
    setView("log");
    window.scrollTo(0, 0);
  }

  function cancelEdit() { setEditId(null); setForm(blankForm); }

  if (!authed) return <PasswordGate onUnlock={() => setAuthed(true)} />;

  const today = new Date().toDateString();
  const todayLeads = leads.filter((l) => new Date(l.created_at).toDateString() === today);
  const counts = STATUSES.reduce((acc, s) => { acc[s.value] = todayLeads.filter((l) => l.status === s.value).length; return acc; }, {});
  const totalToday = todayLeads.length;

  const inputStyle = {
    width: "100%", background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 4, color: "#e0e0e0", padding: "9px 12px", fontSize: 13, fontFamily: "inherit", marginBottom: 10, boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", background: "#0d0d0d", minHeight: "100vh", color: "#e0e0e0", padding: "0 0 80px" }}>
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1e1e1e", position: "sticky", top: 0, background: "#0d0d0d", zIndex: 10 }}>
        <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: "#fff" }}>Lead Tracker</div>
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {["log", "report"].map((v) => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "#fff" : "transparent", color: view === v ? "#0d0d0d" : "#555", border: "1px solid", borderColor: view === v ? "#fff" : "#2a2a2a", borderRadius: 4, padding: "6px 16px", fontSize: 11, fontFamily: "inherit", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", fontWeight: 600 }}>{v}</button>
          ))}
        </div>
      </div>

      {toast && <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: "8px 20px", fontSize: 12, color: "#aaa", zIndex: 100, letterSpacing: 1 }}>{toast}</div>}

      {view === "log" && (
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>{editId ? "✏ Editing Entry" : "+ New Entry"}</div>
            <input placeholder="Business name *" value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} style={inputStyle} />
            <input placeholder="Contact name" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} style={inputStyle} />
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {METHODS.map((m) => (<button key={m.value} onClick={() => setForm({ ...form, method: m.value })} style={{ flex: 1, background: form.method === m.value ? "#1e1e1e" : "transparent", border: "1px solid", borderColor: form.method === m.value ? "#444" : "#1e1e1e", color: form.method === m.value ? "#fff" : "#555", borderRadius: 4, padding: "8px 0", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>{m.label}</button>))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {STATUSES.map((s) => (<button key={s.value} onClick={() => setForm({ ...form, status: s.value })} style={{ background: form.status === s.value ? s.bg : "transparent", border: "1px solid", borderColor: form.status === s.value ? s.color : "#1e1e1e", color: form.status === s.value ? s.color : "#555", borderRadius: 4, padding: "5px 10px", fontSize: 10, fontFamily: "inherit", cursor: "pointer", letterSpacing: 0.5 }}>{s.label}</button>))}
            </div>
            {(form.status === "callback" || form.status === "follow_up") && (
              <input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} style={{ ...inputStyle, colorScheme: "dark" }} />
            )}
            <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: "#fff", color: "#0d0d0d", border: "none", borderRadius: 4, padding: "10px 0", fontSize: 12, fontFamily: "inherit", fontWeight: 700, letterSpacing: 1, cursor: "pointer" }}>{editId ? "UPDATE" : "LOG IT"}</button>
              {editId && <button onClick={cancelEdit} style={{ background: "transparent", color: "#555", border: "1px solid #2a2a2a", borderRadius: 4, padding: "10px 16px", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>CANCEL</button>}
            </div>
          </div>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Today — {totalToday} logged</div>
          {loading && <div style={{ color: "#333", fontSize: 13 }}>Loading...</div>}
          {!loading && todayLeads.length === 0 && <div style={{ color: "#333", fontSize: 13, padding: "20px 0" }}>No entries yet today.</div>}
          {todayLeads.map((lead) => {
            const s = getStatusMeta(lead.status);
            return (
              <div key={lead.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderLeft: `3px solid ${s.color}`, borderRadius: 6, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 2 }}>{lead.business}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{lead.contact && `${lead.contact} · `}{METHODS.find(m => m.value === lead.method)?.label} · {new Date(lead.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                  </div>
                  <span style={{ fontSize: 9, color: s.color, background: s.bg, border: `1px solid ${s.color}40`, borderRadius: 3, padding: "3px 7px", letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap", marginLeft: 8 }}>{s.label}</span>
                </div>
                {lead.notes && <div style={{ fontSize: 11, color: "#666", marginTop: 6, fontStyle: "italic" }}>{lead.notes}</div>}
                {lead.follow_up_date && <div style={{ fontSize: 10, color: "#ffab40", marginTop: 4 }}>↩ Follow up: {new Date(lead.follow_up_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button onClick={() => handleEdit(lead)} style={{ background: "transparent", border: "1px solid #40c4ff40", color: "#40c4ff", borderRadius: 3, padding: "3px 10px", fontSize: 10, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1 }}>Edit</button>
                  <button onClick={() => handleDelete(lead.id)} style={{ background: "transparent", border: "1px solid #ff525240", color: "#ff5252", borderRadius: 3, padding: "3px 10px", fontSize: 10, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1 }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "report" && (
        <div style={{ padding: "20px" }}>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Today's Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
            <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{totalToday}</div>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 1 }}>TOTAL</div>
            </div>
            {STATUSES.map((s) => (
              <div key={s.value} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{counts[s.value]}</div>
                <div style={{ fontSize: 10, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
          {leads.filter(l => l.follow_up_date).length > 0 && (
            <>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Follow-ups Pending</div>
              {leads.filter(l => l.follow_up_date).sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date)).map((lead) => (
                <div key={lead.id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{lead.business}</div>
                    {lead.contact && <div style={{ fontSize: 11, color: "#555" }}>{lead.contact}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: "#ffab40" }}>{new Date(lead.follow_up_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
              ))}
            </>
          )}
          {leads.filter(l => l.status === "booked").length > 0 && (
            <>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", margin: "20px 0 12px" }}>All Booked</div>
              {leads.filter(l => l.status === "booked").map((lead) => (
                <div key={lead.id} style={{ background: "#00e67608", border: "1px solid #00e67620", borderRadius: 6, padding: "10px 14px", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: "#00e676", fontWeight: 600 }}>{lead.business}</div>
                  {lead.contact && <div style={{ fontSize: 11, color: "#555" }}>{lead.contact}</div>}
                  {lead.notes && <div style={{ fontSize: 11, color: "#666", marginTop: 4, fontStyle: "italic" }}>{lead.notes}</div>}
                </div>
              ))}
            </>
          )}
          {totalToday === 0 && !loading && <div style={{ color: "#333", fontSize: 13 }}>Nothing logged yet today.</div>}
        </div>
      )}
    </div>
  );
}

function statCard() {
  return { background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: "14px" };
}

function smallBtnStyle(color) {
  return { background: "transparent", border: `1px solid ${color}40`, color, borderRadius: 3, padding: "3px 10px", fontSize: 10, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1 };
}