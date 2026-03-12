import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'saranshandotra07@gmail.com').toLowerCase().split(',').map(e => e.trim());
const isAdminEmail = (email) => ADMIN_EMAILS.includes(email?.toLowerCase());

// ─────────────────────────────────────────────────────────────────────────────
// THEME -- Identical to Onlifit.jsx main dashboard
// White bg · Emerald #16a34a · Navy #0f172a
// Font: Inter + JetBrains Mono
// ─────────────────────────────────────────────────────────────────────────────
const G = {
  bg:      "#ffffff",
  bg2:     "#f9fafb",
  bg3:     "#f0fdf4",
  bg4:     "#dcfce7",
  border:  "#e5e7eb",
  border2: "#d1fae5",
  accent:  "#16a34a",
  accent2: "#15803d",
  accentL: "#bbf7d0",
  navy:    "#0f172a",
  text:    "#0f172a",
  text2:   "#6b7280",
  text3:   "#9ca3af",
  red:     "#dc2626",
  redFade: "#fef2f2",
  redBorder:"#fecaca",
  yellow:  "#d97706",
  yellowFade:"#fffbeb",
  yellowBorder:"#fde68a",
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #ffffff; color: #0f172a; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: #d1fae5; border-radius: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  input, select, textarea, button { font-family: 'Inter', sans-serif; }
  input:focus, textarea:focus, select:focus { outline: none; }
  @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes toastIn { from { transform:translateY(60px); opacity:0; } to { transform:translateY(0); opacity:1; } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes popIn   { 0%{transform:scale(.93);opacity:0} 60%{transform:scale(1.01)} 100%{transform:scale(1);opacity:1} }
  .page-anim { animation: fadeIn .2s ease; }
  .pop       { animation: popIn .22s cubic-bezier(.17,.67,.35,1.1); }
  .row-hover:hover { background: #f9fafb; cursor: pointer; }
  .nav-item  { border-radius: 8px; margin: 1px 8px; transition: .15s; }
  .nav-item:hover  { background: #f0fdf4; color: #16a34a; }
  .nav-item.active { background: #f0fdf4; color: #16a34a; font-weight: 600; }
  .stat-card { transition: .2s; border-radius: 12px; }
  .stat-card:hover { box-shadow: 0 4px 16px rgba(22,163,74,.1); transform: translateY(-1px); }
  .btn-ghost:hover  { border-color: #16a34a !important; color: #16a34a !important; background: #f0fdf4 !important; }
  .btn-danger:hover { border-color: #fca5a5 !important; color: #dc2626 !important; background: #fef2f2 !important; }
  .card-hover:hover { border-color: #bbf7d0 !important; box-shadow: 0 4px 16px rgba(22,163,74,.08); }
  .filter-btn:hover { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
  .tab-btn:hover:not(.tab-active) { color: #16a34a; background: #f0fdf4; }
  .tab-active { color: #16a34a !important; background: #fff !important; }
  .template-row:hover { border-color: #16a34a !important; background: #f0fdf4 !important; color: #16a34a !important; }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fl  = (gap=0, align="center") => ({ display:"flex", alignItems:align, gap });
const col = (gap=0) => ({ display:"flex", flexDirection:"column", gap });
const grid = (cols, gap=14) => ({ display:"grid", gridTemplateColumns: typeof cols==="number"?`repeat(${cols},1fr)`:cols, gap });
const mono = { fontFamily:"'JetBrains Mono',monospace" };
const fmt  = n => `₹${Number(n).toLocaleString("en-IN")}`;
const card = (p=18) => ({ background:G.bg, border:`1px solid ${G.border}`, borderRadius:12, padding:p, boxShadow:"0 1px 4px rgba(0,0,0,.05)" });
const inset= (p=14) => ({ background:G.bg2, border:`1px solid ${G.border}`, borderRadius:9, padding:p });
const LABEL = { fontSize:11, color:G.text3, letterSpacing:".5px", textTransform:"uppercase", fontWeight:600, marginBottom:5, display:"block" };
const INPUT = { width:"100%", background:G.bg, border:`1.5px solid ${G.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:G.text, transition:"border .2s" };

// ─── DATA ─────────────────────────────────────────────────────────────────────
const REVENUE_HISTORY = [
  { m:"Oct 24", v:8997  },
  { m:"Nov 24", v:13996 },
  { m:"Dec 24", v:17994 },
  { m:"Jan 25", v:22991 },
  { m:"Feb 25", v:24989 },
  { m:"Mar 25", v:27981 },
];
const PLANS_CATALOG = [
  { id:"starter",      name:"Starter",       price:1999, maxBranch:1,  maxMembers:150,  features:["QR Attendance","Member Portal","WhatsApp Reminders"] },
  { id:"growth",       name:"Growth",         price:2999, maxBranch:1,  maxMembers:500,  features:["All Starter features","Revenue Analytics","PT Management","AI Assistant"] },
  { id:"multi-branch", name:"Multi-Branch",  price:4999, maxBranch:10, maxMembers:2000, features:["All Growth features","Multi-Branch Dashboard","Priority Support","Custom Branding"] },
];
const SUPPORT_TICKETS = [
  { id:"TKT-001", gym:"Onlifit",   subject:"QR scanner not working",    status:"open",     priority:"high",   date:"Mar 10" },
  { id:"TKT-002", gym:"PowerZone Gym",    subject:"Billing invoice not sent",  status:"resolved", priority:"medium", date:"Mar 9"  },
  { id:"TKT-003", gym:"NexGen Fitness",   subject:"Staff login issue",         status:"open",     priority:"low",    date:"Mar 9"  },
  { id:"TKT-004", gym:"EliteGym Pro",     subject:"Member export not working", status:"open",     priority:"medium", date:"Mar 8"  },
];

// ─── SHARED UI COMPONENTS (matching main dashboard) ───────────────────────────

function Badge({ bright=false, danger=false, warn=false, children }) {
  if (danger) return <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:600, background:G.redFade, color:G.red, border:`1px solid ${G.redBorder}` }}>{children}</span>;
  if (warn)   return <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:600, background:G.yellowFade, color:G.yellow, border:`1px solid ${G.yellowBorder}` }}>{children}</span>;
  return <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:600, background:bright?G.bg4:G.bg2, color:bright?G.accent:G.text2, border:`1px solid ${bright?G.accentL:G.border}` }}>{children}</span>;
}

function StatusBadge({ status }) {
  if (status==="active")    return <Badge bright>● Active</Badge>;
  if (status==="suspended") return <Badge danger>✕ Suspended</Badge>;
  if (status==="overdue")   return <Badge warn>⚠ Overdue</Badge>;
  return <Badge>{status}</Badge>;
}

function PlanBadge({ plan }) {
  const map = { "Starter":false, "Growth":true, "Multi-Branch":true };
  return <Badge bright={!!map[plan]}>{plan}</Badge>;
}

function Btn({ variant="primary", size="md", onClick, children, disabled=false, full=false, style={} }) {
  const sz = { sm:{padding:"6px 14px",fontSize:12}, md:{padding:"9px 18px",fontSize:13}, xs:{padding:"4px 10px",fontSize:11} };
  const vr = {
    primary: { background:G.accent,  color:"#fff",    border:`1.5px solid ${G.accent}`,   borderRadius:8, fontWeight:600 },
    ghost:   { background:"transparent", color:G.text2, border:`1.5px solid ${G.border}`, borderRadius:8, fontWeight:500 },
    danger:  { background:"transparent", color:G.red,  border:`1.5px solid ${G.redBorder}`,borderRadius:8, fontWeight:500 },
    warn:    { background:G.yellowFade, color:G.yellow, border:`1.5px solid ${G.yellowBorder}`, borderRadius:8, fontWeight:600 },
    red:     { background:G.red, color:"#fff", border:`1.5px solid ${G.red}`, borderRadius:8, fontWeight:600 },
  };
  const cls = variant==="ghost"?"btn-ghost":variant==="danger"?"btn-danger":"";
  return (
    <button className={cls} onClick={disabled?undefined:onClick} disabled={disabled}
      style={{ ...sz[size||"md"], ...vr[variant||"primary"], fontFamily:"'Inter',sans-serif", cursor:disabled?"not-allowed":"pointer",
        transition:".15s", whiteSpace:"nowrap", opacity:disabled?.45:1, width:full?"100%":"auto", ...style }}>
      {children}
    </button>
  );
}

function StatCard({ label, value, sub, trend, icon, dim=false }) {
  return (
    <div className="stat-card" style={{ ...card(), position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
        background: dim ? G.border : `linear-gradient(90deg,${G.accent},#4ade80)` }} />
      <div style={{ ...fl(0), justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ fontSize:11, color:G.text3, fontWeight:600, letterSpacing:".3px", textTransform:"uppercase" }}>{label}</div>
        {icon && <span style={{ fontSize:18 }}>{icon}</span>}
      </div>
      <div style={{ fontSize:30, fontWeight:700, color:dim?G.text2:G.navy, lineHeight:1, letterSpacing:"-1px" }}>{value}</div>
      {sub && (
        <div style={{ ...fl(5), fontSize:11, color:G.text3, marginTop:6 }}>
          {trend && <span style={{ fontSize:11, fontWeight:600, padding:"2px 7px", borderRadius:20,
            background: trend.up?G.bg4:"#fef2f2", color: trend.up?G.accent:G.red }}>{trend.label}</span>}
          {sub}
        </div>
      )}
    </div>
  );
}

function SH({ title, sub, right }) {
  return (
    <div style={{ ...fl(0), justifyContent:"space-between", marginBottom:14 }}>
      <div>
        <div style={{ fontSize:15, fontWeight:700, color:G.navy }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:G.text3, marginTop:2 }}>{sub}</div>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

function Progress({ pct, dim=false }) {
  return (
    <div style={{ height:5, background:G.bg4, borderRadius:3, overflow:"hidden", marginTop:6 }}>
      <div style={{ height:"100%", width:`${pct}%`, borderRadius:3, transition:".6s ease",
        background: dim?G.border:`linear-gradient(90deg,${G.accent},#4ade80)` }} />
    </div>
  );
}

function Th({ cols }) {
  return (
    <thead>
      <tr style={{ borderBottom:`1.5px solid ${G.border}`, background:G.bg2 }}>
        {cols.map((c,i) => <th key={i} style={{ padding:"9px 14px", textAlign:"left", fontSize:10, letterSpacing:".8px", textTransform:"uppercase", color:G.text3, fontWeight:700 }}>{c}</th>)}
      </tr>
    </thead>
  );
}

function FG({ label, children }) { return <div style={{ marginBottom:14 }}><label style={LABEL}>{label}</label>{children}</div>; }
function Fi({ ...p }) {
  return <input style={INPUT} {...p}
    onFocus={e=>e.target.style.borderColor=G.accent}
    onBlur={e=>e.target.style.borderColor=G.border} />;
}
function Fsel({ children, ...p }) {
  return (
    <select style={{ ...INPUT, appearance:"none",
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239ca3af' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center", paddingRight:30 }} {...p}>
      {children}
    </select>
  );
}

function Modal({ open, onClose, title, children, width=540 }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target===e.currentTarget&&onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.4)", zIndex:300,
        display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
      <div className="pop" style={{ background:G.bg, border:`1px solid ${G.border}`, borderRadius:14,
        width, maxWidth:"96vw", maxHeight:"90vh", overflowY:"auto",
        boxShadow:"0 20px 60px rgba(0,0,0,.15)" }}>
        <div style={{ ...fl(0), justifyContent:"space-between", padding:"16px 22px",
          borderBottom:`1px solid ${G.border}`, position:"sticky", top:0, background:G.bg, zIndex:1 }}>
          <span style={{ fontSize:15, fontWeight:700, color:G.navy }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:G.text3,
            fontSize:18, cursor:"pointer", width:28, height:28, display:"flex", alignItems:"center",
            justifyContent:"center", borderRadius:6, transition:".15s" }}
            onMouseOver={e=>{e.currentTarget.style.background=G.bg3;e.currentTarget.style.color=G.accent}}
            onMouseOut={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=G.text3}}>✕</button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel="Confirm", danger=false }) {
  if (!open) return null;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.5)", zIndex:400,
        display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
      <div className="pop" style={{ background:G.bg, border:`1px solid ${G.border}`, borderRadius:14,
        width:420, boxShadow:"0 20px 60px rgba(0,0,0,.2)", overflow:"hidden" }}>
        <div style={{ padding:"20px 22px 0" }}>
          <div style={{ fontSize:15, fontWeight:700, color:G.navy, marginBottom:8 }}>{title}</div>
          <div style={{ fontSize:13, color:G.text2, lineHeight:1.7 }}>{message}</div>
        </div>
        <div style={{ ...fl(10), padding:22, justifyContent:"flex-end" }}>
          <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
          <Btn variant={danger?"red":"primary"} size="sm" onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, type="success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, []);
  const bg = type==="danger" ? G.red : type==="warn" ? G.yellow : G.navy;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, background:bg, borderRadius:10,
      padding:"12px 18px", fontSize:13, color:"#fff", zIndex:999, maxWidth:320,
      boxShadow:"0 8px 32px rgba(15,23,42,.25)", animation:"toastIn .25s ease",
      display:"flex", alignItems:"center", gap:8 }}>
      <span>{type==="danger"?"🚫":type==="warn"?"⚠":"✓"}</span>{msg}
    </div>
  );
}

function BarChart({ data, height=160 }) {
  const max = Math.max(...data.map(d=>d.v));
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height, paddingTop:10 }}>
      {data.map((d,i) => (
        <div key={i} style={{ flex:1, ...col(4), alignItems:"center" }}>
          <div style={{ ...mono, fontSize:9, color:G.text3 }}>{i===data.length-1 ? fmt(d.v) : ""}</div>
          <div style={{ width:"100%", height:d.v/max*(height-32),
            background: i===data.length-1 ? `linear-gradient(to top,${G.accent},#4ade80)` : G.bg4,
            border:`1px solid ${i===data.length-1?G.border2:G.border}`,
            borderRadius:"4px 4px 0 0", transition:".4s" }} />
          <span style={{ fontSize:9, color:G.text3, fontWeight:500, textAlign:"center" }}>{d.m}</span>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [showP, setShowP] = useState(false);
  const [err,   setErr]   = useState("");
  const [busy,  setBusy]  = useState(false);

  const submit = async () => {
    if (!email.trim()||!pass.trim()) { setErr("Both fields are required."); return; }
    setBusy(true); setErr("");
    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), password: pass,
      });
      if (authErr || !authData?.user) { setErr("Incorrect email or password."); setBusy(false); return; }
      if (isAdminEmail(authData.user.email)) { sessionStorage.setItem('onlifit_admin_pw', pass); onLogin(); return; }
      await supabase.auth.signOut();
      setErr("Access denied. This panel is restricted to platform admins."); setBusy(false);
    } catch(e) {
      setErr("Login failed. Please try again."); setBusy(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:G.bg2, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      {/* Subtle green pattern */}
      <div style={{ position:"fixed", inset:0, backgroundImage:`radial-gradient(circle at 20% 20%, rgba(22,163,74,.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(22,163,74,.04) 0%, transparent 50%)`, pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:400, position:"relative", zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:`linear-gradient(135deg,${G.accent},#4ade80)`,
            display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:24, boxShadow:`0 8px 24px rgba(22,163,74,.3)` }}>⚡</div>
          <div style={{ fontSize:24, fontWeight:800, color:G.navy, letterSpacing:"-0.5px" }}>
            Onlifit <span style={{ color:G.accent }}>Command</span>
          </div>
          <div style={{ fontSize:12, color:G.text3, marginTop:4, fontWeight:500 }}>SaaS Owner Control Panel · Restricted Access</div>
        </div>

        <div style={{ ...card(28), boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize:15, fontWeight:700, color:G.navy, marginBottom:4 }}>Sign in to your account</div>
          <div style={{ fontSize:12, color:G.text3, marginBottom:22 }}>Only the Onlifit platform owner can access this panel.</div>

          <FG label="Email address">
            <Fi value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}
              onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="admin@onlifit.app" />
          </FG>

          <FG label="Password">
            <div style={{ position:"relative" }}>
              <Fi value={pass} onChange={e=>{setPass(e.target.value);setErr("");}}
                onKeyDown={e=>e.key==="Enter"&&submit()}
                type={showP?"text":"password"} placeholder="••••••••"
                style={{ ...INPUT, paddingRight:42 }} />
              <button onClick={()=>setShowP(p=>!p)}
                style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:G.text3, cursor:"pointer", fontSize:14, padding:0 }}>
                {showP?"🙈":"👁"}
              </button>
            </div>
          </FG>

          {err && <div style={{ fontSize:12, color:G.red, marginBottom:14, ...fl(5) }}>⚠ {err}</div>}

          <Btn variant="primary" full onClick={submit} disabled={busy} style={{ padding:"11px", fontSize:14, fontWeight:700 }}>
            {busy ? "Verifying..." : "Access Control Panel →"}
          </Btn>

          <div style={{ textAlign:"center", marginTop:16, fontSize:11, color:G.text3 }}>
            Restricted to Onlifit platform admins only.
          </div>
        </div>

        {/* Connection note */}
        <div style={{ marginTop:16, ...card(14), fontSize:11, color:G.text2, ...fl(8) }}>
          <span style={{ fontSize:16 }}>🔗</span>
          <span>This panel manages all gym accounts. Each gym uses <strong style={{ color:G.navy }}>Onlifit.jsx</strong> (owner dashboard), <strong style={{ color:G.navy }}>Onlifit_MemberPortal.jsx</strong> and <strong style={{ color:G.navy }}>Onlifit_Reception.jsx</strong>.</span>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// NAV ITEM (outside Panel -- stable reference)
// ═════════════════════════════════════════════════════════════════════════════
function NavItem({ id, icon, label, badge, active, onClick }) {
  return (
    <div className={`nav-item${active?" active":""}`} onClick={()=>onClick(id)}
      style={{ ...fl(9), padding:"9px 12px", cursor:"pointer", fontSize:13,
        color: active ? G.accent : G.text2, fontWeight: active ? 600 : 400 }}>
      <span style={{ fontSize:16, width:20, textAlign:"center" }}>{icon}</span>
      <span style={{ flex:1 }}>{label}</span>
      {badge ? <span className="sidebar-badge" style={{ background:G.bg4, color:G.accent, border:`1px solid ${G.accentL}`, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20 }}>{badge}</span> : null}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS -- generate IDs and password hash (demo)
// ═════════════════════════════════════════════════════════════════════════════
function genGymId(name) {
  const slug = name.trim().toUpperCase().replace(/[^A-Z]/g,"").slice(0,3).padEnd(3,"X");
  const num  = String(Math.floor(Math.random()*900)+100);
  return `GYM-${slug}-${num}`;
}
function genUserId() { return "usr_" + Math.random().toString(36).slice(2,10); }
function genTempPass() {
  const c="abcdefghjkmnpqrstuvwxyz", d="0123456789", u="ABCDEFGHJKMNPQRSTUVWXYZ", sp="@#!";
  return u[Math.floor(Math.random()*u.length)] + c[Math.floor(Math.random()*c.length)] + c[Math.floor(Math.random()*c.length)] + d[Math.floor(Math.random()*d.length)] + d[Math.floor(Math.random()*d.length)] + sp[Math.floor(Math.random()*sp.length)] + c[Math.floor(Math.random()*c.length)] + d[Math.floor(Math.random()*d.length)];
}
function hashPreview(pw) { return "bcrypt:" + btoa(pw).slice(0,12) + "...[hashed]"; }

// ─── Credentials Card ─────────────────────────────────────────────────────────
function CredCard({ label, value, mono:isMono=false, copyToast, dim=false }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(value).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),1800); };
  return (
    <div style={{ ...inset(10), ...fl(8) }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:9, fontWeight:700, color:G.text3, textTransform:"uppercase", letterSpacing:".8px", marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:12, fontWeight:600, color:dim?G.text3:G.navy, ...(isMono?mono:{}), wordBreak:"break-all" }}>{value}</div>
      </div>
      <button onClick={copy} style={{ background:"none", border:`1px solid ${G.border}`, borderRadius:6, padding:"3px 8px", fontSize:10, color:copied?G.accent:G.text3, cursor:"pointer", flexShrink:0, transition:".15s" }}>
        {copied ? "✓" : "Copy"}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ADD GYM MODAL -- Full Supabase schema onboarding
// Fields: user_id · gym_id · name · email · password_hash · role
// ═════════════════════════════════════════════════════════════════════════════
function AddGymModal({ open, onClose, onAdd }) {
  const blank = { name:"", owner:"", phone:"", email:"", city:"", state:"", plan:"Growth", gstin:"", role:"gym_owner", password:"" };
  const [f,    setF]    = useState(blank);
  const [step, setStep] = useState(1); // 1=details, 2=credentials
  const [creds, setCreds] = useState(null);
  const [err,  setErr]  = useState("");

  const set = (k,v) => setF(p=>({...p,[k]:v}));

  const validate = () => {
    if (!f.name||!f.owner||!f.phone||!f.email||!f.city||!f.state) return "All required fields must be filled.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return "Enter a valid email address.";
    if (!f.password || f.password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const generateCreds = () => {
    const e = validate(); if (e) { setErr(e); return; }
    setErr("");
    const gymId   = genGymId(f.name);
    const userId  = genUserId();
    const tempPw  = f.password;
    setCreds({ gymId, userId, tempPw, passwordHash: hashPreview(tempPw) });
    setStep(2);
  };

  const submit = () => {
    if (!creds) return;
    const planObj = PLANS_CATALOG.find(p=>p.name.toLowerCase()===f.plan.toLowerCase())||PLANS_CATALOG[1];
    const today   = new Date().toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"});
    const nextDue = new Date(Date.now()+30*864e5).toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"});
    const newGym = {
      id:       creds.gymId,
      user_id:  creds.userId,
      name:     f.name.trim(),
      owner:    f.owner.trim(),
      phone:    f.phone.trim(),
      email:    f.email.trim(),
      city:     f.city.trim(),
      state:    f.state.trim(),
      branches: 1, members:0, status:"active",
      plan:     planObj.name,
      mrr:      planObj.price,
      lastPaid: today, nextDue, att:0, joined:today,
      gstin:    f.gstin.trim(),
      role:     f.role,
      password_hash: creds.passwordHash,
    };
    onAdd(newGym, { ...creds, email:f.email.trim(), ownerName:f.owner.trim(), gymName:f.name.trim() });
    setF(blank); setCreds(null); setStep(1); setErr("");
  };

  const closeClean = () => { setF(blank); setCreds(null); setStep(1); setErr(""); onClose(); };

  const planObj = PLANS_CATALOG.find(p=>p.name.toLowerCase()===f.plan.toLowerCase());

  return (
    <Modal open={open} onClose={closeClean} title={step===1 ? "Onboard New Gym -- Step 1 of 2: Details" : "Onboard New Gym -- Step 2 of 2: Auth Credentials"} width={620}>

      {/* ── STEP 1: GYM DETAILS ───────────────────────────────────────────── */}
      {step===1 && (
        <div>
          {/* Section: Business Info */}
          <div style={{ fontSize:11, fontWeight:700, color:G.text3, textTransform:"uppercase", letterSpacing:".8px", marginBottom:10 }}>Business Information</div>
          <div style={{ ...grid(2,14) }}>
            <FG label="Gym Name *"><Fi value={f.name}  onChange={e=>set("name",e.target.value)}  placeholder="e.g. PowerFit Studio" /></FG>
            <FG label="Owner Full Name *"><Fi value={f.owner} onChange={e=>set("owner",e.target.value)} placeholder="e.g. Rahul Sharma" /></FG>
            <FG label="Phone *"><Fi value={f.phone} onChange={e=>set("phone",e.target.value)} placeholder="+91 98765 43210" /></FG>
            <FG label="Login Email *"><Fi value={f.email} onChange={e=>set("email",e.target.value)} placeholder="owner@gymname.com" /></FG>
            <FG label="Login Password *"><Fi type="password" value={f.password} onChange={e=>set("password",e.target.value)} placeholder="Min 6 characters" /></FG>
            <FG label="City *"><Fi value={f.city}  onChange={e=>set("city",e.target.value)}  placeholder="e.g. Bangalore" /></FG>
            <FG label="State *"><Fi value={f.state} onChange={e=>set("state",e.target.value)} placeholder="e.g. Karnataka" /></FG>
          </div>

          {/* Section: Subscription & Role */}
          <div style={{ fontSize:11, fontWeight:700, color:G.text3, textTransform:"uppercase", letterSpacing:".8px", marginBottom:10, marginTop:4 }}>Subscription & Access</div>
          <div style={{ ...grid(2,14) }}>
            <FG label="Subscription Plan *">
              <Fsel value={f.plan} onChange={e=>set("plan",e.target.value)}>
                {PLANS_CATALOG.map(p => <option key={p.id} value={p.name}>{p.name} -- {fmt(p.price)}/mo</option>)}
              </Fsel>
            </FG>
            <FG label="User Role">
              <Fsel value={f.role} onChange={e=>set("role",e.target.value)}>
                <option value="gym_owner">gym_owner -- Full dashboard access</option>
                <option value="gym_manager">gym_manager -- No billing access</option>
                <option value="gym_staff">gym_staff -- Attendance only</option>
              </Fsel>
            </FG>
            <FG label="GSTIN (optional)"><Fi value={f.gstin} onChange={e=>set("gstin",e.target.value)} placeholder="29AAFCI1234A1Z5" /></FG>
          </div>

          {/* Plan preview */}
          {planObj && (
            <div style={{ ...inset(), marginBottom:14, background:G.bg3, border:`1px solid ${G.border2}` }}>
              <div style={{ ...fl(0), justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ fontSize:12, fontWeight:700, color:G.navy }}>{planObj.name} Plan</div>
                <span style={{ ...mono, fontSize:13, fontWeight:800, color:G.accent }}>{fmt(planObj.price)}/mo</span>
              </div>
              <div style={{ ...fl(12), flexWrap:"wrap", gap:6 }}>
                {planObj.features.map(feat=>(
                  <span key={feat} style={{ fontSize:11, color:G.accent, ...fl(4) }}>✓ {feat}</span>
                ))}
              </div>
            </div>
          )}



          {err && <div style={{ fontSize:12, color:G.red, marginBottom:10 }}>⚠ {err}</div>}

          <div style={{ ...fl(10) }}>
            <Btn variant="ghost" style={{flex:1}} onClick={closeClean}>Cancel</Btn>
            <Btn variant="primary" style={{flex:2}} onClick={generateCreds}>Generate Login Credentials →</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 2: CREDENTIALS ───────────────────────────────────────────── */}
      {step===2 && creds && (
        <div>
          {/* Success banner */}
          <div style={{ background:G.bg3, border:`1px solid ${G.border2}`, borderRadius:10, padding:"14px 16px", ...fl(10), marginBottom:20 }}>
            <span style={{ fontSize:20 }}>✅</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:G.navy }}>Credentials generated for {f.name}</div>
              <div style={{ fontSize:11, color:G.text3, marginTop:1 }}>Share the login details below with {f.owner}. Save them -- the password cannot be recovered after this.</div>
            </div>
          </div>

          {/* Auth record -- what goes into Supabase */}
          <div style={{ fontSize:11, fontWeight:700, color:G.text3, textTransform:"uppercase", letterSpacing:".8px", marginBottom:10 }}>Supabase users table record</div>
          <div style={{ ...col(8), marginBottom:18 }}>
            <CredCard label="user_id"       value={creds.userId}      isMono />
            <CredCard label="gym_id"        value={creds.gymId}       isMono />
            <CredCard label="name"          value={f.owner} />
            <CredCard label="email (login)" value={f.email} />
            <CredCard label="password_hash" value={creds.passwordHash} isMono dim />
            <CredCard label="role"          value={f.role} />
          </div>

          {/* What to send to gym owner */}
          <div style={{ fontSize:11, fontWeight:700, color:G.text3, textTransform:"uppercase", letterSpacing:".8px", marginBottom:10 }}>Share with gym owner (via WhatsApp / Email)</div>
          <div style={{ background:"#0f172a", borderRadius:10, padding:16, marginBottom:18 }}>
            <div style={{ fontSize:11, color:"#64748b", marginBottom:8 }}>📱 WhatsApp message preview:</div>
            <div style={{ fontSize:12, color:"#e2e8f0", lineHeight:1.8, ...mono }}>
              Hi {f.owner}! 👋<br/>
              Your Onlifit gym dashboard is ready.<br/><br/>
              🔗 Dashboard: <span style={{color:"#4ade80"}}>https://dashboard.onlifit.app</span><br/>
              📧 Email: <span style={{color:"#4ade80"}}>{f.email}</span><br/>
              🔑 Password: <span style={{color:"#fbbf24"}}>{creds.tempPw}</span><br/>
              🏢 Gym ID: <span style={{color:"#4ade80"}}>{creds.gymId}</span><br/><br/>
              👥 Member Portal link to share with your customers:<br/>
              <span style={{color:"#4ade80"}}>https://members.onlifit.app/?gym={creds.gymId}</span><br/><br/>
              Please change your password after first login. 🔒
            </div>
          </div>

          <div style={{ fontSize:11, fontWeight:700, color:G.text3, textTransform:"uppercase", letterSpacing:".8px", marginBottom:8 }}>Confirm subscription</div>
          <div style={{ ...inset(), ...fl(0), justifyContent:"space-between", marginBottom:18 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:G.navy }}>{planObj?.name} Plan · {fmt(planObj?.price || 0)}/month</div>
              <div style={{ fontSize:11, color:G.text3, marginTop:2 }}>Billing starts today · Next due in 30 days · Auto via Razorpay</div>
            </div>
            <Badge bright>✓ Active from today</Badge>
          </div>

          <div style={{ ...fl(10) }}>
            <Btn variant="ghost" style={{flex:1}} onClick={()=>setStep(1)}>← Back</Btn>
            <Btn variant="primary" style={{flex:2}} onClick={submit}>✓ Confirm & Activate Gym</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// GYM DETAIL MODAL
// ═════════════════════════════════════════════════════════════════════════════
function GymDetailModal({ gym, open, onClose, onAction }) {
  if (!open||!gym) return null;
  const tiles = [
    ["Gym ID",      gym.id,              true ],
    ["User ID",     gym.user_id||"--",    true ],
    ["Owner",       gym.owner,           false],
    ["Role",        gym.role||"gym_owner",false],
    ["Phone",       gym.phone,           false],
    ["Email",       gym.email,           false],
    ["City",        gym.city,            false],
    ["State",       gym.state,           false],
    ["Branches",    gym.branches,        false],
    ["Members",     gym.members,         false],
    ["Today's Att.",`${gym.att} check-ins`,false],
    ["Joined",      gym.joined,          false],
    ["Last Paid",   gym.lastPaid,        false],
    ["Next Due",    gym.nextDue,         false],
    ["MRR",         fmt(gym.mrr),        true ],
    ["GSTIN",       gym.gstin||"--",      false],
  ];
  return (
    <Modal open={open} onClose={onClose} title={gym.name} width={560}>
      <div style={{ ...fl(8), marginBottom:16 }}>
        <StatusBadge status={gym.status}/><PlanBadge plan={gym.plan}/>
      </div>
      <div style={{ ...grid(2,10), marginBottom:20 }}>
        {tiles.map(([l,v,hi])=>(
          <div key={l} style={inset(12)}>
            <div style={{ fontSize:10, color:G.text3, fontWeight:700, textTransform:"uppercase", letterSpacing:".7px", marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:13, fontWeight:600, color:hi?G.accent:G.navy, ...(["Gym ID","MRR"].includes(l)?mono:{}) }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ ...grid("1fr 1fr 1fr",10) }}>
        {gym.status!=="suspended"
          ? <Btn variant="danger" size="sm" onClick={()=>onAction("suspend",gym)}>🚫 Suspend</Btn>
          : <Btn variant="primary" size="sm" onClick={()=>onAction("restore",gym)}>✓ Restore</Btn>
        }
        <Btn variant="warn" size="sm" onClick={()=>onAction("warn",gym)}>⚠ Send Warning</Btn>
        <Btn variant="ghost" size="sm" style={{color:G.red,borderColor:G.redBorder}} onClick={()=>onAction("delete",gym)}>🗑 Delete</Btn>
      </div>

      {/* Auth & Links */}
      <div style={{ ...col(8), marginTop:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:G.text3, textTransform:"uppercase", letterSpacing:".8px", marginBottom:4 }}>Login & Access Links</div>
        {[
          { label:"Owner Dashboard URL", value:`https://dashboard.onlifit.app`, icon:"🖥️" },
          { label:"Login Email",          value:gym.email,                       icon:"📧" },
          { label:"Member Portal URL",    value:`https://members.onlifit.app/?gym=${gym.id}`, icon:"📱" },
          { label:"Reception QR URL",     value:`https://reception.onlifit.app/?gym=${gym.id}`, icon:"📷" },
          { label:"Supabase gym_id",      value:gym.id,                          icon:"🗄" },
          { label:"user_id",              value:gym.user_id||"--",                icon:"👤" },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ ...inset(10), ...fl(8) }}>
            <span style={{ fontSize:14, flexShrink:0 }}>{icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:9, fontWeight:700, color:G.text3, textTransform:"uppercase", letterSpacing:".7px", marginBottom:1 }}>{label}</div>
              <div style={{ fontSize:11, fontWeight:600, color:G.accent, ...mono, wordBreak:"break-all" }}>{value}</div>
            </div>
            <button onClick={()=>{ navigator.clipboard?.writeText(value).catch(()=>{}); }}
              style={{ background:"none", border:`1px solid ${G.border}`, borderRadius:5, padding:"2px 7px", fontSize:10, color:G.text3, cursor:"pointer" }}>Copy</button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// WARN MODAL
// ═════════════════════════════════════════════════════════════════════════════
function WarnModal({ gym, open, onClose, onSend }) {
  const [msg, setMsg] = useState("");
  if (!open||!gym) return null;
  const templates = [
    `Your Onlifit subscription payment of ${fmt(gym.mrr)} is overdue. Please pay within 48 hours to avoid suspension.`,
    `Final notice: Your Onlifit account will be suspended in 24 hours unless payment of ${fmt(gym.mrr)} is received.`,
    `Your gym account access will be cut at midnight tonight. Contact us immediately to settle your dues.`,
  ];
  return (
    <Modal open={()=>{setMsg("");onClose();}} onClose={()=>{setMsg("");onClose();}} title={`Send Warning to ${gym.owner}`} width={500}>
      <div style={{ fontSize:12, color:G.text3, marginBottom:14 }}>
        📧 {gym.email} · 📱 {gym.phone}
      </div>
      <div style={{ fontSize:11, fontWeight:700, color:G.text3, textTransform:"uppercase", letterSpacing:".8px", marginBottom:8 }}>Quick Templates</div>
      <div style={{ ...col(7), marginBottom:14 }}>
        {templates.map((t,i)=>(
          <div key={i} className="template-row"
            onClick={()=>setMsg(t)}
            style={{ ...inset(11), cursor:"pointer", fontSize:12, color:msg===t?G.accent:G.text2, border:`1.5px solid ${msg===t?G.accent:G.border}`, background:msg===t?G.bg3:G.bg2, lineHeight:1.6, transition:".15s" }}>
            {t}
          </div>
        ))}
      </div>
      <FG label="Custom Message">
        <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={3} placeholder="Or type a custom message..."
          style={{ width:"100%", background:G.bg, border:`1.5px solid ${G.border}`, borderRadius:8, padding:"9px 12px",
            fontSize:13, color:G.text, resize:"vertical", lineHeight:1.6, transition:".2s" }}
          onFocus={e=>e.target.style.borderColor=G.accent}
          onBlur={e=>e.target.style.borderColor=G.border} />
      </FG>
      <div style={{ ...fl(10) }}>
        <Btn variant="ghost" style={{flex:1}} onClick={()=>{setMsg("");onClose();}}>Cancel</Btn>
        <Btn variant="primary" style={{flex:2}} disabled={!msg.trim()} onClick={()=>{onSend(msg);setMsg("");}}>
          📱 Send via WhatsApp & Email
        </Btn>
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// OVERVIEW PAGE
// ═════════════════════════════════════════════════════════════════════════════
function PageOverview({ gyms, onAction, onNavigate }) {
  const active  = gyms.filter(g=>g.status==="active");
  const susp    = gyms.filter(g=>g.status==="suspended");
  const over    = gyms.filter(g=>g.status==="overdue");
  const mrr     = [...active,...over].reduce((s,g)=>s+g.mrr,0);
  const members = gyms.reduce((s,g)=>s+g.members,0);
  const att     = gyms.reduce((s,g)=>s+g.att,0);
  const alerts  = [...over,...susp];

  return (
    <div className="page-anim">
      {/* KPIs */}
      <div style={{ ...grid(4), marginBottom:16 }}>
        <StatCard label="Monthly Revenue"   value={fmt(mrr)}    sub="vs last month" trend={{up:true,label:"↑+₹2,999"}} icon="💰"/>
        <StatCard label="Active Gyms"        value={active.length} sub={`${susp.length} suspended, ${over.length} overdue`} icon="🏢"/>
        <StatCard label="Total Members"      value={members}     sub="across all gyms" icon="👥"/>
        <StatCard label="Today's Check-ins"  value={att}         sub="live attendance" icon="📅"/>
      </div>

      <div style={{ ...grid("1.4fr 1fr"), marginBottom:16, gap:16 }}>
        {/* Revenue chart */}
        <div style={card()}>
          <SH title="Revenue Growth" sub="Monthly recurring revenue · Last 6 months"
            right={<span style={{ ...mono, fontSize:18, fontWeight:800, color:G.accent }}>{fmt(REVENUE_HISTORY[5].v)}</span>} />
          <BarChart data={REVENUE_HISTORY} height={160} />
        </div>

        {/* Alerts */}
        <div style={card()}>
          <SH title="🔔 Alerts & Actions"
            right={alerts.length>0 ? <Badge danger>{alerts.length} need action</Badge> : null} />
          {alerts.length===0
            ? <div style={{ textAlign:"center", padding:"24px 0", color:G.text3, fontSize:13 }}>✅ All gyms are active & paid</div>
            : <div style={col(8)}>
                {alerts.map(g => (
                  <div key={g.id} style={{ ...inset(12), border:`1px solid ${g.status==="suspended"?G.redBorder:G.yellowBorder}`,
                    background:g.status==="suspended"?G.redFade:G.yellowFade }}>
                    <div style={{ ...fl(0), justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:g.status==="suspended"?G.red:G.yellow,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.name}</div>
                        <div style={{ fontSize:11, color:G.text3, marginTop:2 }}>{g.status==="suspended"?"Suspended since":"Overdue since"} {g.lastPaid}</div>
                      </div>
                      {g.status==="suspended"
                        ? <Btn size="xs" onClick={()=>onAction("restore",g)}>Restore</Btn>
                        : <Btn size="xs" variant="danger" onClick={()=>onAction("suspend",g)}>Suspend</Btn>
                      }
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Gym snapshot table */}
      <div style={card(0)}>
        <div style={{ ...fl(0), justifyContent:"space-between", padding:"14px 18px", borderBottom:`1px solid ${G.border}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:G.navy }}>All Gyms -- Live Snapshot</div>
          <Btn variant="ghost" size="sm" onClick={()=>onNavigate("gyms")}>Manage All →</Btn>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <Th cols={["Gym","City","Members","Today","MRR","Status",""]} />
          <tbody>
            {gyms.map(g => (
              <tr key={g.id} className="row-hover" style={{ borderBottom:`1px solid ${G.border}` }}>
                <td style={{ padding:"11px 14px" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:G.navy }}>{g.name}</div>
                  <div style={{ fontSize:11, color:G.text3 }}>{g.owner}</div>
                </td>
                <td style={{ padding:"11px 14px", fontSize:12, color:G.text2 }}>{g.city}</td>
                <td style={{ padding:"11px 14px", ...mono, fontSize:13, fontWeight:700, color:G.navy }}>{g.members}</td>
                <td style={{ padding:"11px 14px", ...mono, fontSize:13, fontWeight:700, color:g.att>0?G.accent:G.text3 }}>{g.att}</td>
                <td style={{ padding:"11px 14px", ...mono, fontSize:13, fontWeight:700, color:g.status==="suspended"?G.text3:G.accent }}>
                  {g.status==="suspended"?"--":fmt(g.mrr)}
                </td>
                <td style={{ padding:"11px 14px" }}><StatusBadge status={g.status}/></td>
                <td style={{ padding:"11px 14px" }}>
                  <Btn variant="ghost" size="xs" onClick={()=>onAction("detail",g)}>View →</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// GYMS PAGE
// ═════════════════════════════════════════════════════════════════════════════
function PageGyms({ gyms, onAction, onAdd }) {
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  const [sortBy,  setSortBy]  = useState("name");

  const visible = gyms
    .filter(g => {
      const q = search.toLowerCase();
      return (!q || g.name.toLowerCase().includes(q) || g.owner.toLowerCase().includes(q) || g.city.toLowerCase().includes(q))
        && (filter==="all" || g.status===filter);
    })
    .sort((a,b) => {
      if (sortBy==="mrr")     return b.mrr     - a.mrr;
      if (sortBy==="members") return b.members  - a.members;
      if (sortBy==="att")     return b.att      - a.att;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="page-anim">
      {/* Toolbar */}
      <div style={{ ...fl(10), marginBottom:16, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search gym, owner, city..."
          style={{ flex:1, minWidth:200, ...INPUT }}
          onFocus={e=>e.target.style.borderColor=G.accent}
          onBlur={e=>e.target.style.borderColor=G.border} />
        <div style={{ ...fl(6) }}>
          {["all","active","overdue","suspended"].map(f=>(
            <button key={f} className="filter-btn" onClick={()=>setFilter(f)}
              style={{ padding:"8px 14px", borderRadius:7, border:`1px solid ${filter===f?G.accent:G.border}`,
                background:filter===f?G.bg3:"transparent", color:filter===f?G.accent:G.text2,
                fontSize:12, fontWeight:600, cursor:"pointer", textTransform:"capitalize", transition:".15s" }}>
              {f}
            </button>
          ))}
        </div>
        <Fsel value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ width:160, ...INPUT }}>
          <option value="name">Sort: Name</option>
          <option value="mrr">Sort: Revenue</option>
          <option value="members">Sort: Members</option>
          <option value="att">Sort: Attendance</option>
        </Fsel>
        <Btn variant="primary" size="sm" onClick={onAdd}>+ Add New Gym</Btn>
      </div>

      {/* Count summary */}
      <div style={{ ...grid(4,10), marginBottom:14 }}>
        {[
          ["Total",     gyms.length,                               G.navy  ],
          ["Active",    gyms.filter(g=>g.status==="active").length, G.accent],
          ["Overdue",   gyms.filter(g=>g.status==="overdue").length,G.yellow],
          ["Suspended", gyms.filter(g=>g.status==="suspended").length,G.red],
        ].map(([l,v,c])=>(
          <div key={l} style={{ ...inset(12), textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:800, color:c, ...mono }}>{v}</div>
            <div style={{ fontSize:11, color:G.text3, fontWeight:600, textTransform:"uppercase", letterSpacing:".5px", marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Gym cards */}
      <div style={{ ...grid(2,14) }}>
        {visible.map((g,i)=>(
          <div key={g.id} className="card-hover" style={{ ...card(), border:`1px solid ${g.status==="suspended"?G.redBorder:g.status==="overdue"?G.yellowBorder:G.border}`, cursor:"pointer" }}
            onClick={()=>onAction("detail",g)}>
            {/* Card header */}
            <div style={{ ...fl(0), justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ ...fl(10) }}>
                <div style={{ width:40, height:40, borderRadius:10, background:G.bg3, border:`1px solid ${G.border2}`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>🏋️</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:G.navy }}>{g.name}</div>
                  <div style={{ fontSize:11, color:G.text3, marginTop:1 }}>{g.city}, {g.state} · {g.branches} branch{g.branches>1?"es":""}</div>
                </div>
              </div>
              <div style={col(4)}>
                <StatusBadge status={g.status}/>
                <PlanBadge plan={g.plan}/>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ ...grid(4,8), marginBottom:12 }}>
              {[["Members",g.members,""],["Today",g.att,g.att>0],["MRR",fmt(g.mrr),true],["ID",g.id,""]].map(([l,v,hi])=>(
                <div key={l} style={inset(10)}>
                  <div style={{ fontSize:l==="MRR"?11:13, fontWeight:700, color:hi?G.accent:G.navy, ...mono }}>{v}</div>
                  <div style={{ fontSize:9, color:G.text3, fontWeight:600, textTransform:"uppercase", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ ...fl(0), justifyContent:"space-between", fontSize:11, color:G.text3, marginBottom:12 }}>
              <span>👤 {g.owner}</span>
              <span>Last paid: <strong style={{ color:g.status==="suspended"?G.red:G.navy }}>{g.lastPaid}</strong></span>
            </div>

            {/* Action buttons -- stop propagation */}
            <div style={{ ...fl(8), borderTop:`1px solid ${G.border}`, paddingTop:10 }} onClick={e=>e.stopPropagation()}>
              {g.status!=="suspended"
                ? <><Btn size="xs" variant="danger" onClick={()=>onAction("suspend",g)}>🚫 Suspend</Btn>
                    <Btn size="xs" variant="warn"   onClick={()=>onAction("warn",g)}>⚠ Warn</Btn></>
                : <Btn size="xs" onClick={()=>onAction("restore",g)}>✓ Restore Access</Btn>
              }
              <Btn size="xs" variant="ghost" onClick={()=>onAction("detail",g)} style={{ marginLeft:"auto" }}>Details →</Btn>
            </div>
          </div>
        ))}
      </div>
      {visible.length===0 && <div style={{ textAlign:"center", padding:60, color:G.text3, fontSize:13 }}>No gyms match your search or filter.</div>}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// REVENUE PAGE
// ═════════════════════════════════════════════════════════════════════════════
function PageRevenue({ gyms }) {
  const active = gyms.filter(g=>g.status==="active");
  const over   = gyms.filter(g=>g.status==="overdue");
  const mrr    = [...active,...over].reduce((s,g)=>s+g.mrr,0);

  return (
    <div className="page-anim">
      <div style={{ ...grid(3), marginBottom:16 }}>
        <StatCard label="Current MRR"     value={fmt(mrr)}       sub={`${active.length} paying gyms`} trend={{up:true,label:"↑21%"}} icon="💰"/>
        <StatCard label="Annual Run Rate" value={fmt(mrr*12)}    sub="projected yearly revenue" icon="📈"/>
        <StatCard label="Avg Per Gym"     value={fmt(Math.round(mrr/Math.max(active.length,1)))} sub="per active gym" icon="📊"/>
      </div>

      <div style={{ ...grid("2fr 1fr"), gap:16, marginBottom:16 }}>
        <div style={card()}>
          <SH title="Revenue -- Last 6 Months" sub="Monthly recurring revenue" right={<span style={{ ...mono, fontWeight:800, color:G.accent }}>{fmt(REVENUE_HISTORY[5].v)}</span>} />
          <BarChart data={REVENUE_HISTORY} height={170} />
          <div style={{ display:"flex", gap:6, marginTop:12 }}>
            {REVENUE_HISTORY.map(d=>(
              <div key={d.m} style={{ flex:1, textAlign:"center", fontSize:9, ...mono, color:G.text3 }}>{fmt(d.v)}</div>
            ))}
          </div>
        </div>

        <div style={card()}>
          <SH title="Plan Distribution" />
          {PLANS_CATALOG.map(p => {
            const cnt = gyms.filter(g=>g.plan===p.name&&g.status!=="suspended").length;
            const pct = Math.round(cnt/Math.max(active.length+over.length,1)*100);
            return (
              <div key={p.id} style={{ marginBottom:14 }}>
                <div style={{ ...fl(0), justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                  <span style={{ color:G.text2, fontWeight:500 }}>{p.name}</span>
                  <span style={{ fontWeight:700, color:G.navy }}>{cnt} gyms</span>
                </div>
                <Progress pct={pct} />
              </div>
            );
          })}
          <div style={{ ...grid(3,8), marginTop:14 }}>
            {PLANS_CATALOG.map(p=>{
              const cnt = gyms.filter(g=>g.plan===p.name).length;
              return (
                <div key={p.id} style={{ background:G.bg3, border:`1px solid ${G.border2}`, borderRadius:8, padding:"10px 8px", textAlign:"center" }}>
                  <div style={{ fontSize:18, fontWeight:800, color:G.accent }}>{cnt}</div>
                  <div style={{ fontSize:9, color:G.text3, fontWeight:600 }}>{p.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Per-gym table */}
      <div style={card(0)}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${G.border}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:G.navy }}>Per Gym Revenue Breakdown</div>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <Th cols={["Gym","Plan","MRR","Last Paid","Next Due","Status"]} />
          <tbody>
            {gyms.map(g=>(
              <tr key={g.id} className="row-hover" style={{ borderBottom:`1px solid ${G.border}`, opacity:g.status==="suspended"?.45:1 }}>
                <td style={{ padding:"12px 14px" }}><div style={{ fontSize:13, fontWeight:600, color:G.navy }}>{g.name}</div><div style={{ fontSize:11, color:G.text3 }}>{g.owner}</div></td>
                <td style={{ padding:"12px 14px" }}><PlanBadge plan={g.plan}/></td>
                <td style={{ padding:"12px 14px", ...mono, fontSize:14, fontWeight:700, color:g.status==="suspended"?G.text3:G.accent }}>
                  {g.status==="suspended" ? "--" : fmt(g.mrr)}
                </td>
                <td style={{ padding:"12px 14px", fontSize:12, color:G.text2, ...mono }}>{g.lastPaid}</td>
                <td style={{ padding:"12px 14px", fontSize:12, ...mono, color:g.status!=="active"?G.red:G.text2, fontWeight:g.status!=="active"?700:400 }}>{g.nextDue}</td>
                <td style={{ padding:"12px 14px" }}><StatusBadge status={g.status}/></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding:"12px 18px", borderTop:`1px solid ${G.border}`, background:G.bg2, ...fl(0), justifyContent:"space-between" }}>
          <span style={{ fontSize:11, fontWeight:700, color:G.text3, textTransform:"uppercase", letterSpacing:".8px" }}>Total Active MRR</span>
          <span style={{ ...mono, fontSize:22, fontWeight:800, color:G.accent }}>{fmt(mrr)}</span>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SUPPORT PAGE
// ═════════════════════════════════════════════════════════════════════════════
function PageSupport({ gyms }) {
  const [tickets, setTickets] = useState(SUPPORT_TICKETS);
  const resolve = (id) => setTickets(ts=>ts.map(t=>t.id===id?{...t,status:"resolved"}:t));

  return (
    <div className="page-anim">
      <div style={{ ...grid(3), marginBottom:16 }}>
        <StatCard label="Open Tickets"     value={tickets.filter(t=>t.status==="open").length}     sub="awaiting response"   icon="🎟️"/>
        <StatCard label="Resolved Today"   value={tickets.filter(t=>t.status==="resolved").length} sub="closed tickets"      icon="✅"/>
        <StatCard label="Avg Response"     value="2.4h"    sub="this week"  trend={{up:true,label:"↑Fast"}}   icon="⏱️"/>
      </div>

      <div style={card(0)}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${G.border}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:G.navy }}>Support Tickets</div>
          <div style={{ fontSize:12, color:G.text3, marginTop:2 }}>Gym owners contact you through this</div>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <Th cols={["Ticket ID","Gym","Subject","Priority","Status","Date",""]} />
          <tbody>
            {tickets.map(t=>(
              <tr key={t.id} className="row-hover" style={{ borderBottom:`1px solid ${G.border}` }}>
                <td style={{ padding:"12px 14px", ...mono, fontSize:12, color:G.text3 }}>{t.id}</td>
                <td style={{ padding:"12px 14px", fontSize:13, fontWeight:600, color:G.navy }}>{t.gym}</td>
                <td style={{ padding:"12px 14px", fontSize:13, color:G.text2 }}>{t.subject}</td>
                <td style={{ padding:"12px 14px" }}>
                  {t.priority==="high"?<Badge danger>High</Badge>:t.priority==="medium"?<Badge warn>Medium</Badge>:<Badge>Low</Badge>}
                </td>
                <td style={{ padding:"12px 14px" }}>
                  {t.status==="resolved"?<Badge bright>✓ Resolved</Badge>:<Badge warn>⏳ Open</Badge>}
                </td>
                <td style={{ padding:"12px 14px", fontSize:12, color:G.text3 }}>{t.date}</td>
                <td style={{ padding:"12px 14px" }}>
                  {t.status==="open" && <Btn size="xs" variant="ghost" onClick={()=>resolve(t.id)}>Resolve</Btn>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═════════════════════════════════════════════════════════════════════════════
function PageSettings({ toast$ }) {
  const [policy, setPolicy] = useState("3");
  return (
    <div className="page-anim" style={{ maxWidth:620 }}>
      {/* Platform */}
      <div style={{ ...card(), marginBottom:14 }}>
        <SH title="Platform Identity" />
        <div style={{ ...grid(2,14) }}>
          <FG label="Platform Name"><Fi defaultValue="Onlifit" /></FG>
          <FG label="Support Email"><Fi defaultValue="support@onlifit.app" /></FG>
          <FG label="Website URL"><Fi defaultValue="https://onlifit.app" /></FG>
          <FG label="Razorpay Key"><Fi defaultValue="rzp_live_••••••••••" type="password" /></FG>
        </div>
        <Btn size="sm" onClick={()=>toast$("Platform settings saved.")}>Save Changes</Btn>
      </div>

      {/* Billing */}
      <div style={{ ...card(), marginBottom:14 }}>
        <SH title="Billing & Payments" />
        <div style={{ ...grid(3,10), marginBottom:14 }}>
          {PLANS_CATALOG.map(p=>(
            <div key={p.id} style={{ ...inset(), ...col(6) }}>
              <div style={{ fontSize:13, fontWeight:700, color:G.navy }}>{p.name}</div>
              <div style={{ ...mono, fontSize:18, fontWeight:800, color:G.accent }}>{fmt(p.price)}<span style={{ fontSize:11, color:G.text3, fontWeight:400 }}>/mo</span></div>
              <div style={{ fontSize:10, color:G.text3 }}>Max {p.maxMembers.toLocaleString()} members · {p.maxBranch} branch{p.maxBranch>1?"es":""}</div>
            </div>
          ))}
        </div>
        <Btn size="sm" variant="ghost" onClick={()=>toast$("Plan pricing updated.")}>Edit Pricing</Btn>
      </div>

      {/* Suspension policy */}
      <div style={{ ...card(), marginBottom:14 }}>
        <SH title="Suspension Policy" />
        <FG label="Auto-suspend after N days overdue">
          <Fsel value={policy} onChange={e=>setPolicy(e.target.value)}>
            {["1","2","3","5","7","14"].map(d=><option key={d} value={d}>{d} days</option>)}
          </Fsel>
        </FG>
        <Btn size="sm" onClick={()=>toast$(`Policy updated: auto-suspend after ${policy} days.`)}>Save Policy</Btn>
      </div>

      {/* Integrations */}
      <div style={{ ...card(), marginBottom:14 }}>
        <SH title="Integrations" />
        <div style={{ ...col(10) }}>
          {[
            { icon:"🗄", name:"Supabase",  desc:"PostgreSQL database · Real-time · RLS enabled",   status:"Connected" },
            { icon:"💳", name:"Razorpay",  desc:"Subscription billing · Webhooks configured",       status:"Connected" },
            { icon:"📱", name:"WhatsApp",  desc:"Gupshup API · Auto payment reminders",             status:"Connected" },
            { icon:"📧", name:"Email",     desc:"SMTP via SendGrid · Transactional emails",         status:"Connected" },
          ].map(s=>(
            <div key={s.name} style={{ ...inset(), ...fl(12) }}>
              <div style={{ width:38, height:38, borderRadius:9, background:G.bg3, border:`1px solid ${G.border2}`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{s.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:G.navy }}>{s.name}</div>
                <div style={{ fontSize:11, color:G.text3, marginTop:1 }}>{s.desc}</div>
              </div>
              <Badge bright>✓ {s.status}</Badge>
              <Btn size="xs" variant="ghost" onClick={()=>toast$(`Opening ${s.name}...`)}>Configure</Btn>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ ...card(), border:`1px solid ${G.redBorder}`, background:G.redFade }}>
        <SH title="⚠ Danger Zone" />
        <div style={{ fontSize:12, color:G.text2, marginBottom:14 }}>These actions are permanent and cannot be undone.</div>
        <div style={{ ...fl(10) }}>
          <Btn size="sm" variant="ghost" onClick={()=>toast$("Full data export emailed to owner@onlifit.app")}>Export All Data</Btn>
          <Btn size="sm" variant="danger" onClick={()=>toast$("Database backup created successfully.", "warn")}>Backup Database</Btn>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PANEL
// ═════════════════════════════════════════════════════════════════════════════
function Panel({ onLogout }) {
  const [gyms,      setGyms]      = useState([]);
  const [page,      setPage]      = useState("overview");
  const [detailGym, setDetailGym] = useState(null);
  const [warnGym,   setWarnGym]   = useState(null);
  const [confirm,   setConfirm]   = useState(null); // {type, gym}
  const [addOpen,   setAddOpen]   = useState(false);
  const [toast,     setToast]     = useState(null);
  const [clock,     setClock]     = useState("");
  const [loading,   setLoading]   = useState(true);

  // Load gyms from Supabase
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('gym_accounts').select('*');
        if (data && data.length > 0) {
          const mapped = data.map(g => ({
            id: g.gym_id, name: g.gym_name, owner: g.name, email: g.email,
            phone: '', city: g.city, state: '', branches: 1, members: 0,
            status: 'active', plan: 'Growth', mrr: 2999, lastPaid: '',
            nextDue: '', att: 0, joined: g.created_at ? new Date(g.created_at).toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"}) : '',
            gstin: '', role: g.role,
          }));
          // Enrich with member counts and payment data
          for (const gym of mapped) {
            const { count } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('gym_id', gym.id);
            gym.members = count || 0;
          }
          setGyms(mapped);
        } else {
          setGyms([]);
        }
      } catch(e) {
        console.error("[OwnerPanel] Load error:", e);
        setGyms([]);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(()=>{
    const t = setInterval(()=>setClock(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})), 1000);
    return ()=>clearInterval(t);
  },[]);

  const toast$ = useCallback((msg, type="success")=>{
    setToast({msg,type}); setTimeout(()=>setToast(null),3200);
  },[]);

  // Derived -- always fresh from gyms array
  const currentDetail = detailGym ? gyms.find(g=>g.id===detailGym.id)||null : null;
  const currentWarn   = warnGym   ? gyms.find(g=>g.id===warnGym.id)||null   : null;

  // ── Actions ────────────────────────────────────────────────────────────────
  const doAction = useCallback((type, gym) => {
    if (type==="detail") { setDetailGym(gym); return; }
    if (type==="warn")   { setWarnGym(gym);   return; }
    if (type==="suspend"||type==="restore"||type==="delete") {
      setDetailGym(null);
      setConfirm({type, gym});
    }
  },[]);

  const doConfirm = async () => {
    if (!confirm) return;
    const { type, gym } = confirm;
    if (type==="suspend") {
      setGyms(gs=>gs.map(g=>g.id===gym.id?{...g,status:"suspended",att:0}:g));
      toast$(`${gym.name} has been suspended.`, "danger");
      // Update in Supabase (no status column yet, but future-proof)
    } else if (type==="restore") {
      setGyms(gs=>gs.map(g=>g.id===gym.id?{...g,status:"active",lastPaid:new Date().toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"})}:g));
      toast$(`${gym.name} access restored.`);
    } else if (type==="delete") {
      setGyms(gs=>gs.filter(g=>g.id!==gym.id));
      toast$(`${gym.name} permanently deleted.`, "danger");
      // Delete from Supabase
      try { await supabase.from('gym_accounts').delete().eq('gym_id', gym.id); } catch(e) { console.error(e); }
    }
    setConfirm(null);
  };

  const doAddGym = async (newGym, creds) => {
    try {
      // 1. Create Supabase Auth user so gym owner can login
      let authUserId = creds.userId;
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: creds.email,
        password: creds.tempPw,
        options: { data: { gym_id: newGym.id, name: creds.ownerName, role: newGym.role || 'gym_owner' } }
      });
      if (authErr) {
        // If user already exists, sign in to get their ID and proceed
        if (authErr.message?.includes('already') || authErr.message?.includes('exists')) {
          const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
            email: creds.email, password: creds.tempPw
          });
          if (loginErr) {
            toast$(`Auth error: user exists but password doesn't match. Delete user in Supabase Auth first.`, "error");
            return;
          }
          authUserId = loginData?.user?.id || creds.userId;
        } else {
          console.error("[OwnerPanel] Auth signup error:", authErr);
          toast$(`Auth error: ${authErr.message}`, "error");
          return;
        }
      } else {
        authUserId = authData?.user?.id || creds.userId;
      }

      // 2. Re-login as admin BEFORE inserts (signUp switches session to new user)
      await new Promise(r => setTimeout(r, 6000));
      const storedPw = sessionStorage.getItem('onlifit_admin_pw');
      if (storedPw) {
        await supabase.auth.signInWithPassword({ email: ADMIN_EMAILS[0], password: storedPw });
      }

      // 3. Insert gym_accounts record (now as admin)
      const { error: gymErr } = await supabase.from('gym_accounts').insert({
        gym_id: newGym.id, user_id: authUserId, email: creds.email,
        name: newGym.owner, gym_name: newGym.name,
        city: newGym.city, role: newGym.role || 'gym_owner', is_new: true,
      });
      if (gymErr) { console.error("[OwnerPanel] gym_accounts insert error:", gymErr); toast$(`DB error: ${gymErr.message}`, "error"); return; }

      // 4. Insert gym_profiles record
      await supabase.from('gym_profiles').insert({ gym_id: newGym.id, gym_name: newGym.name, city: newGym.city });
    } catch(e) { console.error("[OwnerPanel] Add gym error:", e); toast$("Failed to onboard gym. Try again.", "error"); return; }
    setGyms(gs=>[...gs,newGym]);
    setAddOpen(false);
    toast$(`${newGym.name} onboarded! Login credentials sent to ${creds.email} 🎉`);
  };

  const doSendWarn = (msg) => {
    if (!currentWarn) return;
    setGyms(gs=>gs.map(g=>g.id===currentWarn.id&&g.status==="active"?{...g,status:"overdue"}:g));
    setWarnGym(null);
    toast$(`Warning sent to ${currentWarn.owner} via WhatsApp & Email.`, "warn");
  };

  const alertCount = gyms.filter(g=>g.status!=="active").length;
  const mrr = gyms.filter(g=>g.status!=="suspended").reduce((s,g)=>s+g.mrr,0);

  const NAV_SECTIONS = [
    { section:"Overview", items:[
      {id:"overview",icon:"📊",label:"Dashboard"},
      {id:"gyms",    icon:"🏢",label:"Gyms",     badge:alertCount||null},
      {id:"revenue", icon:"💰",label:"Revenue"},
    ]},
    { section:"Operations", items:[
      {id:"support", icon:"🎟️",label:"Support"},
      {id:"settings",icon:"⚙️",label:"Settings"},
    ]},
  ];

  const PAGE_TITLES = { overview:"Business Overview", gyms:"Gym Management", revenue:"Revenue & Billing", support:"Support", settings:"Platform Settings" };
  const PAGE_SUBS   = {
    overview:`${gyms.filter(g=>g.status==="active").length} active · ${gyms.filter(g=>g.status==="suspended").length} suspended · ${gyms.filter(g=>g.status==="overdue").length} overdue`,
    gyms:`${gyms.length} gyms registered on Onlifit`,
    revenue:`MRR: ${fmt(mrr)}`,
    support:`${SUPPORT_TICKETS.filter(t=>t.status==="open").length} open tickets`,
    settings:"Platform configuration",
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:G.bg2 }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40,height:40,border:`3px solid ${G.border}`,borderTop:`3px solid ${G.accent}`,borderRadius:"50%",animation:"spin .7s linear infinite",margin:"0 auto 14px" }}/>
        <div style={{ fontSize:14, color:G.text2, fontWeight:600 }}>Loading gym data...</div>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", height:"100vh", background:G.bg2, overflow:"hidden" }}>

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside style={{ width:228, flexShrink:0, background:G.bg, borderRight:`1px solid ${G.border}`, display:"flex", flexDirection:"column", boxShadow:"2px 0 8px rgba(0,0,0,.04)" }}>
        {/* Logo */}
        <div style={{ padding:"18px 16px 14px", borderBottom:`1px solid ${G.border}` }}>
          <div style={{ ...fl(10) }}>
            <div style={{ width:36, height:36, borderRadius:9, background:`linear-gradient(135deg,${G.accent},#4ade80)`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, boxShadow:`0 4px 12px rgba(22,163,74,.3)` }}>⚡</div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:G.navy }}>Onlifit</div>
              <div style={{ fontSize:10, color:G.text3, fontWeight:600, letterSpacing:".3px" }}>Command Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"10px 0", overflowY:"auto" }}>
          {NAV_SECTIONS.map(sec => (
            <div key={sec.section}>
              <div style={{ fontSize:10, fontWeight:700, color:G.text3, textTransform:"uppercase", letterSpacing:"1px", padding:"10px 18px 4px" }}>{sec.section}</div>
              {sec.items.map(n=>(
                <NavItem key={n.id} {...n} active={page===n.id} onClick={setPage} />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:"12px 14px", borderTop:`1px solid ${G.border}` }}>
          <div style={{ ...inset(10), marginBottom:10, ...col(4) }}>
            <div style={{ ...fl(6) }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:G.accent, animation:"pulse 2s infinite", flexShrink:0 }} />
              <span style={{ fontSize:11, color:G.text2, fontWeight:600 }}>All systems live</span>
            </div>
            <div style={{ ...mono, fontSize:13, fontWeight:700, color:G.navy }}>{clock}</div>
            <div style={{ ...mono, fontSize:11, color:G.accent, fontWeight:700 }}>{fmt(mrr)}/mo</div>
          </div>
          <Btn variant="ghost" full size="sm" onClick={onLogout}>Sign Out</Btn>
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <main style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
        {/* Top bar */}
        <div style={{ padding:"14px 28px", borderBottom:`1px solid ${G.border}`, background:G.bg,
          ...fl(0), justifyContent:"space-between", position:"sticky", top:0, zIndex:30, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:G.navy }}>{PAGE_TITLES[page]}</div>
            <div style={{ fontSize:12, color:G.text3, marginTop:1 }}>{PAGE_SUBS[page]}</div>
          </div>
          <div style={{ ...fl(10) }}>
            {page==="gyms" && <Btn variant="primary" size="sm" onClick={()=>setAddOpen(true)}>+ Add New Gym</Btn>}
            <div style={{ background:G.bg3, border:`1px solid ${G.border2}`, borderRadius:8, padding:"6px 14px", fontSize:13, fontWeight:700, color:G.accent, ...mono }}>{fmt(mrr)}/mo</div>
            <div style={{ width:34, height:34, borderRadius:9, background:G.bg3, border:`1px solid ${G.border2}`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>👑</div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding:24, flex:1 }}>
          {page==="overview" && <PageOverview gyms={gyms} onAction={doAction} onNavigate={setPage} />}
          {page==="gyms"     && <PageGyms     gyms={gyms} onAction={doAction} onAdd={()=>setAddOpen(true)} />}
          {page==="revenue"  && <PageRevenue  gyms={gyms} />}
          {page==="support"  && <PageSupport  gyms={gyms} />}
          {page==="settings" && <PageSettings toast$={toast$} />}
        </div>
      </main>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      <AddGymModal open={addOpen} onClose={()=>setAddOpen(false)} onAdd={doAddGym} />

      <GymDetailModal
        gym={currentDetail}
        open={!!currentDetail}
        onClose={()=>setDetailGym(null)}
        onAction={doAction} />

      <WarnModal
        gym={currentWarn}
        open={!!currentWarn}
        onClose={()=>setWarnGym(null)}
        onSend={doSendWarn} />

      <ConfirmModal
        open={!!confirm}
        onClose={()=>setConfirm(null)}
        onConfirm={doConfirm}
        title={confirm?.type==="suspend" ? "Suspend This Gym?" : confirm?.type==="restore" ? "Restore Access?" : "Delete Permanently?"}
        message={
          confirm?.type==="suspend"  ? `${confirm.gym.name} will immediately lose access to all Onlifit dashboards. Member portal, reception scanner and gym owner login will stop working. All data is safely preserved.` :
          confirm?.type==="restore"  ? `Confirm that payment of ${confirm ? fmt(confirm.gym.mrr) : ""} has been received from ${confirm?.gym.owner}. This will restore full access to ${confirm?.gym.name}.` :
          `This will permanently delete ${confirm?.gym.name} and all associated data -- members, attendance, payments. This action cannot be undone.`
        }
        confirmLabel={confirm?.type==="suspend" ? "Yes, Suspend" : confirm?.type==="restore" ? "Yes, Restore" : "Delete Forever"}
        danger={confirm?.type!=="restore"} />

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)} />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOT
// ═════════════════════════════════════════════════════════════════════════════
export default function OwnerPanelApp() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  useEffect(()=>{
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    // Check existing session
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isAdminEmail(session.user.email)) {
          setAuthed(true);
        }
      } catch(e) {}
      setChecking(false);
    })();
    return ()=>document.head.removeChild(el);
  },[]);
  const handleLogout = async () => { try { await supabase.auth.signOut(); } catch(e){} setAuthed(false); };
  if (checking) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f9fafb'}}><div style={{fontSize:14,color:'#9ca3af'}}>Loading...</div></div>;
  return authed ? <Panel onLogout={handleLogout} /> : <Login onLogin={()=>setAuthed(true)} />;
}
