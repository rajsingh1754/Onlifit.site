import { useState, useEffect, useRef, useCallback } from "react";
import jsQR from "jsqr";
import { supabase } from "./supabase";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#000;font-family:'Inter',sans-serif}
  @media(max-width:768px){
    body{overflow:auto}
  }
  @keyframes fadeUp  {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn   {0%{transform:scale(.8);opacity:0}65%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
  @keyframes spin    {to{transform:rotate(360deg)}}
  @keyframes pulse   {0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes scanBar {0%{top:8%}100%{top:88%}}
  @keyframes ripple  {0%{transform:scale(1);opacity:.6}100%{transform:scale(2.5);opacity:0}}
  @keyframes ticker  {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @keyframes shake   {0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-10px)}40%,80%{transform:translateX(10px)}}
  @keyframes allowed {0%{box-shadow:0 0 0 0 rgba(22,163,74,.7)}100%{box-shadow:0 0 0 40px rgba(22,163,74,0)}}
  @keyframes denied  {0%{box-shadow:0 0 0 0 rgba(220,38,38,.7)}100%{box-shadow:0 0 0 40px rgba(220,38,38,0)}}
  .pop   {animation:popIn .4s cubic-bezier(.17,.67,.35,1.3) forwards}
  .shake {animation:shake .4s ease}
  video  {object-fit:cover}
  /* Responsive */
  *{-webkit-tap-highlight-color:transparent}
  .rec-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;height:100vh}
  @media(max-width:768px){
    .rec-grid{grid-template-columns:1fr;height:auto;min-height:100vh}
    .rec-right{display:none}
    .rec-full{width:100% !important;max-width:100% !important}
  }
`;

const nowTime = () => new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
const todayFull = () => new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

// jsQR is now imported as an npm module -- always available, no CDN dependency

// ══════════════════════════════════════════════════════════════════════════════
// MAIN RECEPTION SCANNER
// ══════════════════════════════════════════════════════════════════════════════
export default function ReceptionScanner() {
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const overlayRef    = useRef(null);
  const rafRef        = useRef(null);
  const lastScanRef   = useRef("");       // debounce same QR
  const lastTimeRef   = useRef(0);
  const streamRef     = useRef(null);

  const [camState, setCamState]   = useState("idle");   // idle | requesting | active | error
  const [result, setResult]       = useState(null);     // current scan result
  const [log, setLog]             = useState([]);
  const [clock, setClock]         = useState(nowTime());
  const [tab, setTab]             = useState("scanner"); // scanner | log
  const [aiThinking, setAiThink]  = useState(false);
  const [DB, setDB]               = useState({});
  const dbRef                     = useRef({});
  const [gymId, setGymId]         = useState(null);

  // Auth gate states
  const [authState, setAuthState] = useState("checking"); // checking | login | ready
  const [gymName, setGymName]     = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass]   = useState("");
  const [loginErr, setLoginErr]     = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Load gym data after authentication
  const loadGymData = async (email) => {
    try {
      // Use RPC to bypass RLS
      const { data: acctJson, error: acctErr } = await supabase.rpc('get_gym_account', { p_email: email });
      if (acctErr) { console.error("[Reception] get_gym_account error:", acctErr); setAuthState("login"); setLoginErr("Failed to load gym account: " + acctErr.message); return; }
      const acct = acctJson;
      if (!acct?.gym_id) { setAuthState("login"); setLoginErr("No gym account found for this email"); return; }
      setGymId(acct.gym_id);
      setGymName(acct.gym_name || acct.name || acct.gym_id);

      // Use RPC to fetch members (bypasses RLS)
      const { data: members, error: memErr } = await supabase.rpc('get_gym_members', { p_gym_id: acct.gym_id });
      if (memErr) console.warn("[Reception] get_gym_members RPC failed, trying direct:", memErr.message);
      const memberList = memErr ? (await supabase.from('members').select('*').eq('gym_id', acct.gym_id)).data : members;
      if (memberList && memberList.length > 0) {
        const db = {};
        memberList.forEach(r => {
          const expDate = r.expiry_date ? new Date(r.expiry_date) : null;
          const daysLeft = expDate ? Math.max(0, Math.ceil((expDate - Date.now()) / 864e5)) : 0;
          db[r.id] = { id:r.id, name:r.name, init:r.initials||r.name.split(' ').map(w=>w[0]).join(''), plan:r.plan, expiry:r.expiry_date, status:r.status, phone:r.phone, trainer:r.trainer, visits:r.visits||0, daysLeft };
        });
        setDB(db);
      }
      // Load today's attendance (non-critical, don't block on error)
      try {
        const { data: att } = await supabase.from('attendance').select('*').eq('gym_id', acct.gym_id).eq('date', 'Today').order('created_at', { ascending: false });
        if (att && att.length > 0) {
          const logEntries = att.map(a => ({
            id: a.member_id, name: a.member_name, init: a.initials||'', plan: '', time: a.check_in,
            result: a.status === 'inside' ? 'allowed' : 'allowed',
          }));
          setLog(logEntries);
        }
      } catch(ae) { console.warn("[Reception] Attendance load skipped:", ae); }
      setAuthState("ready");
    } catch(e) { console.error("[Reception] Load error:", e); setAuthState("login"); setLoginErr("Failed to load gym data: " + (e.message||e)); }
  };

  // Check existing session on mount
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadGymData(session.user.email);
        } else {
          setAuthState("login");
        }
      } catch(e) { console.error("[Reception] Session check error:", e); setAuthState("login"); }
    })();
  }, []);

  // Handle login
  const handleReceptionLogin = async (e) => {
    e.preventDefault();
    setLoginErr(""); setLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPass });
      if (error) { setLoginErr(error.message); setLoginLoading(false); return; }
      await loadGymData(data.user.email);
    } catch(e) { setLoginErr(e.message || "Login failed"); }
    setLoginLoading(false);
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthState("login"); setGymId(null); setGymName(""); setDB({}); setLog([]);
    stopCamera();
  };

  // Keep dbRef in sync with DB state so scanFrame callback always has latest data
  useEffect(() => { dbRef.current = DB; }, [DB]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(nowTime()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-refresh members every 30s so newly added members are available for scanning
  useEffect(() => {
    if (authState !== "ready" || !gymId) return;
    const t = setInterval(async () => {
      try {
        const { data: members } = await supabase.rpc('get_gym_members', { p_gym_id: gymId });
        if (members && members.length > 0) {
          const db = {};
          members.forEach(r => {
            const expDate = r.expiry_date ? new Date(r.expiry_date) : null;
            const daysLeft = expDate ? Math.max(0, Math.ceil((expDate - Date.now()) / 864e5)) : 0;
            db[r.id] = { id:r.id, name:r.name, init:r.initials||r.name.split(' ').map(w=>w[0]).join(''), plan:r.plan, expiry:r.expiry_date, status:r.status, phone:r.phone, trainer:r.trainer, visits:r.visits||0, daysLeft };
          });
          setDB(db);
        }
      } catch(e) { /* silent refresh */ }
    }, 30000);
    return () => clearInterval(t);
  }, [authState, gymId]);

  // Auto-start camera only after authenticated
  useEffect(() => {
    if (authState !== "ready") return;
    startCamera();
    return () => stopCamera();
  }, [authState]);

  // Auto-clear result after delay
  useEffect(() => {
    if (!result) return;
    const delay = result.status === "Active" ? 4000 : 6000;
    const t = setTimeout(() => {
      setResult(null);
      lastScanRef.current = "";
    }, delay);
    return () => clearTimeout(t);
  }, [result]);

  // ── Camera control ──────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCamState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:"environment", width:{ideal:1280}, height:{ideal:720} }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("[QR-DEBUG] Camera started, readyState:", videoRef.current.readyState);
        setCamState("active");
      }
    } catch(e) {
      console.error("[QR-DEBUG] Camera error:", e);
      setCamState("error");
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  // ── QR scan loop ────────────────────────────────────────────────────────────
  const frameCountRef = useRef(0);
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // DEBUG: log every 120 frames (~2s at 60fps)
    frameCountRef.current++;
    if (frameCountRef.current % 120 === 0) {
      console.log(`[QR-DEBUG] frame=${frameCountRef.current} dims=${imageData.width}x${imageData.height} jsQR=${typeof jsQR}`);
    }

    const qr = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth"
    });

    if (qr?.data) {
      console.log("[QR-DEBUG] DETECTED:", qr.data);
      const now = Date.now();
      // Debounce -- same QR can't fire again within 5s
      if (qr.data !== lastScanRef.current || now - lastTimeRef.current > 5000) {
        lastScanRef.current = qr.data;
        lastTimeRef.current = now;
        handleQRDetected(qr.data);
      }
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, []);

  // Start scanning when camera is active
  useEffect(() => {
    if (camState === "active") {
      const video = videoRef.current;
      const onPlay = () => { rafRef.current = requestAnimationFrame(scanFrame); };
      video?.addEventListener("playing", onPlay);
      if (video && !video.paused) onPlay();
      return () => {
        video?.removeEventListener("playing", onPlay);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
  }, [camState, scanFrame]);

  // ── AI verification ─────────────────────────────────────────────────────────
  const handleQRDetected = (raw) => {
    // Voice feedback
    const speak = (text) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05; u.pitch = 1;
      window.speechSynthesis.speak(u);
    };

    setAiThink(true);
    // Simulate 600ms AI processing
    setTimeout(async () => {
      setAiThink(false);
      const member = dbRef.current[raw.trim()];

      if (!member) {
        setResult({ type:"notfound", raw });
        speak("Member not found. Please contact reception.");
        return;
      }

      const entry = { ...member, time: nowTime(), result: member.status==="Active" ? "allowed" : "denied" };
      setLog(prev => [entry, ...prev]);

      setResult({ type: member.status==="Active"?"allowed": member.status==="Expired"?"expired":"frozen", member });

      // Write attendance to Supabase
      if (gymId && member.status === "Active") {
        try {
          const attId = `att-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
          await supabase.from('attendance').insert({
            id: attId, gym_id: gymId, member_id: member.id,
            member_name: member.name, initials: member.init,
            check_in: nowTime(), date: 'Today', trainer: member.trainer,
            method: 'QR', status: 'inside'
          });
          // Increment visit count
          supabase.from('members').update({ visits: (member.visits||0)+1 }).eq('id', member.id).then(()=>{});
        } catch(e) { console.error("[Reception] Attendance write error:", e); }
      }

      if (member.status === "Active") {
        speak(`Welcome ${member.name}. Have a great workout.`);
      } else if (member.status === "Expired") {
        speak(`Access denied. ${member.name}, your membership has expired. Please contact reception.`);
      } else {
        speak(`Access denied. ${member.name}, your membership is frozen. Please contact reception.`);
      }
    }, 600);
  };

  // ── TEST SCAN (demo button) ──────────────────────────────────────────────────
  const testScan = (id) => handleQRDetected(id);

  const allowed = log.filter(l => l.result==="allowed").length;
  const denied  = log.filter(l => l.result==="denied").length;

  return (
    <>
      <style>{css}</style>

      {/* ── CHECKING SESSION ── */}
      {authState === "checking" && (
        <div style={{ width:"100vw", height:"100vh", background:"#000", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
          <div style={{ width:48,height:48,border:"3px solid rgba(255,255,255,.1)",borderTop:"3px solid #16a34a",borderRadius:"50%",animation:"spin .7s linear infinite" }}/>
          <div style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,.5)" }}>Checking session...</div>
        </div>
      )}

      {/* ── LOGIN SCREEN ── */}
      {authState === "login" && (
        <div style={{ width:"100vw", height:"100vh", background:"#000", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <form onSubmit={handleReceptionLogin} style={{ width:"100%", maxWidth:400, padding:32, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:20 }}>
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ width:64,height:64,borderRadius:16,background:"#16a34a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 16px" }}>📷</div>
              <div style={{ fontSize:22, fontWeight:900, color:"#fff", marginBottom:4 }}>Reception Scanner</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>Login with your gym account to start scanning</div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:6 }}>Email</label>
              <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.06)", color:"#fff", fontSize:14, fontFamily:"'Inter',sans-serif", outline:"none" }}
                placeholder="gym@example.com" />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:6 }}>Password</label>
              <input type="password" required value={loginPass} onChange={e => setLoginPass(e.target.value)}
                style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.06)", color:"#fff", fontSize:14, fontFamily:"'Inter',sans-serif", outline:"none" }}
                placeholder="••••••••" />
            </div>
            {loginErr && <div style={{ background:"rgba(220,38,38,.15)", border:"1px solid rgba(220,38,38,.4)", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#f87171", marginBottom:16 }}>{loginErr}</div>}
            <button type="submit" disabled={loginLoading}
              style={{ width:"100%", padding:"13px", borderRadius:12, border:"none", background: loginLoading?"#065f46":"#16a34a", color:"#fff", fontSize:15, fontWeight:800, cursor: loginLoading?"not-allowed":"pointer", fontFamily:"'Inter',sans-serif", transition:".15s" }}>
              {loginLoading ? "Signing in..." : "🔓 Login & Start Scanner"}
            </button>
            <div style={{ textAlign:"center", marginTop:16, fontSize:11, color:"rgba(255,255,255,.25)" }}>
              Use the same email & password from your gym dashboard
            </div>
          </form>
        </div>
      )}

      {/* ── SCANNER (only after auth) ── */}
      {authState === "ready" && (
      <div style={{ width:"100vw", minHeight:"100vh", background:"#000", display:"flex", flexDirection:"column" }}>

        {/* ── TOP BAR ── */}
        <div style={{ height:56, flexShrink:0, background:"rgba(0,0,0,.85)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", zIndex:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34,height:34,borderRadius:9,background:"#16a34a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>💪</div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>Onlifit — Reception</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.4)" }}>{gymName} · {gymId} · AI Scanner Active</div>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            {/* Live indicator */}
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"rgba(255,255,255,.5)" }}>
              <div style={{ width:7,height:7,borderRadius:"50%",background: camState==="active"?"#16a34a":"#f59e0b", animation:"pulse 1.5s infinite" }}/>
              {camState==="active" ? "Camera Live" : camState==="requesting" ? "Starting..." : "No Camera"}
            </div>

            {/* Stats pills */}
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ background:"rgba(22,163,74,.15)", border:"1px solid rgba(22,163,74,.3)", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:700, color:"#4ade80" }}>✓ {allowed} in</div>
              <div style={{ background:"rgba(220,38,38,.15)", border:"1px solid rgba(220,38,38,.3)", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:700, color:"#f87171" }}>✗ {denied} denied</div>
            </div>

            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:"#16a34a", letterSpacing:2 }}>{clock}</div>

            {/* Logout */}
            <button onClick={handleLogout} style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:700, color:"rgba(255,255,255,.5)", cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Logout</button>
          </div>
        </div>

        {/* ── TAB BAR ── */}
        <div style={{ display:"flex", background:"rgba(0,0,0,.6)", borderBottom:"1px solid rgba(255,255,255,.07)", padding:"0 20px", gap:4, flexShrink:0 }}>
          {[["scanner","📷 Scanner"],["log","📋 Today's Log"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding:"10px 18px", border:"none", background:"transparent", color: tab===id?"#16a34a":"rgba(255,255,255,.4)", fontWeight:700, fontSize:12, cursor:"pointer", borderBottom: tab===id?"2px solid #16a34a":"2px solid transparent", transition:".15s", fontFamily:"'Inter',sans-serif" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ══ SCANNER TAB ══════════════════════════════════════════════════════ */}
        {tab === "scanner" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

            {/* Camera viewport -- full width on mobile, left panel on desktop */}
            <div style={{ position:"relative", background:"#000", overflow:"hidden", height:"min(60vw,420px)", minHeight:260, flex:"0 0 auto" }}
            >

              {/* Video feed */}
              <video ref={videoRef} muted playsInline
                style={{ width:"100%", height:"100%", objectFit:"cover", opacity: camState==="active"?1:.3 }}/>

              {/* Hidden canvas for QR processing */}
              <canvas ref={canvasRef} style={{ display:"none" }}/>

              {/* DEBUG bar */}
              <div style={{ position:"absolute", top:0, left:0, right:0, padding:"4px 8px", background:"rgba(0,0,0,0.7)", color:"#0f0", fontSize:11, fontFamily:"monospace", zIndex:999 }}>
                cam={camState} | jsQR={typeof jsQR} | frames={frameCountRef.current}
              </div>

              {/* Scan overlay -- corner brackets */}
              {camState === "active" && !result && (
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
                  <div style={{ position:"relative", width:"55%", aspectRatio:"1" }}>
                    {/* Corners */}
                    {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h]) => (
                      <div key={v+h} style={{ position:"absolute", [v]:0, [h]:0, width:32, height:32,
                        borderTop: v==="top"?"3px solid #16a34a":"none",
                        borderBottom: v==="bottom"?"3px solid #16a34a":"none",
                        borderLeft:  h==="left" ?"3px solid #16a34a":"none",
                        borderRight: h==="right"?"3px solid #16a34a":"none",
                      }}/>
                    ))}
                    {/* Scan line */}
                    <div style={{ position:"absolute", left:6, right:6, height:2,
                      background:"linear-gradient(90deg,transparent,#16a34a,#4ade80,#16a34a,transparent)",
                      boxShadow:"0 0 8px #16a34a", animation:"scanBar 2s ease-in-out infinite",
                      borderRadius:2 }}/>
                    {/* Center label */}
                    <div style={{ position:"absolute", bottom:"-36px", left:"50%", transform:"translateX(-50%)",
                      fontSize:11, color:"rgba(255,255,255,.5)", whiteSpace:"nowrap", fontWeight:600,
                      letterSpacing:1, textTransform:"uppercase" }}>
                      {aiThinking ? "🤖 AI Verifying..." : "Point member's QR here"}
                    </div>
                  </div>
                </div>
              )}

              {/* AI thinking spinner */}
              {aiThinking && (
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.5)", backdropFilter:"blur(4px)" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ width:56,height:56,border:"3px solid rgba(255,255,255,.1)",borderTop:"3px solid #16a34a",borderRadius:"50%",animation:"spin .6s linear infinite",margin:"0 auto 12px" }}/>
                    <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>AI Verifying...</div>
                  </div>
                </div>
              )}

              {/* Camera error */}
              {camState === "error" && (
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:24 }}>
                  <div style={{ fontSize:48 }}>📷</div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", textAlign:"center" }}>Camera access required</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", textAlign:"center", lineHeight:1.7 }}>Allow camera permission in browser settings, then refresh the page.</div>
                  <button onClick={startCamera} style={{ background:"#16a34a", border:"none", borderRadius:10, padding:"11px 24px", fontSize:14, fontWeight:700, color:"#fff", cursor:"pointer" }}>Try Again</button>
                  {/* Demo fallback */}
                  <div style={{ marginTop:8, fontSize:11, color:"rgba(255,255,255,.3)", textAlign:"center" }}>
                    No camera? Use demo buttons on the right →
                  </div>
                </div>
              )}

              {/* Camera requesting */}
              {camState === "requesting" && (
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
                  <div style={{ width:48,height:48,border:"3px solid rgba(255,255,255,.1)",borderTop:"3px solid #16a34a",borderRadius:"50%",animation:"spin .7s linear infinite" }}/>
                  <div style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,.6)" }}>Starting camera...</div>
                </div>
              )}

              {/* Date strip */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,.7))", padding:"20px 16px 12px", fontSize:11, color:"rgba(255,255,255,.4)" }}>
                {todayFull()}
              </div>
            </div>

            {/* RIGHT -- Result panel */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#0a0a0a", borderLeft:"1px solid rgba(255,255,255,.06)", overflow:"hidden" }}>

              {/* Result area */}
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>

                {/* IDLE */}
                {!result && !aiThinking && (
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:64, marginBottom:16, opacity:.3 }}>🪪</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,.3)", marginBottom:8 }}>Waiting for scan...</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,.2)", lineHeight:1.8 }}>
                      Point member's phone QR<br/>at the camera. AI detects instantly.
                    </div>
                  </div>
                )}

                {/* ALLOWED ✅ */}
                {result?.type === "allowed" && (
                  <div className="pop" style={{ width:"100%", textAlign:"center" }}>
                    <div style={{ width:90,height:90,borderRadius:"50%",background:"rgba(22,163,74,.2)",border:"3px solid #16a34a",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:44,animation:"allowed 1s ease-out" }}>✓</div>
                    <div style={{ fontSize:11, fontWeight:700, color:"rgba(22,163,74,.7)", textTransform:"uppercase", letterSpacing:2, marginBottom:8 }}>✅ Access Granted</div>
                    <div style={{ fontSize:28, fontWeight:900, color:"#fff", letterSpacing:"-0.5px", marginBottom:4 }}>{result.member.name}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"rgba(255,255,255,.3)", marginBottom:20 }}>{result.member.id}</div>

                    {/* Info grid */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                      {[["Plan",result.member.plan],["Expires",result.member.expiry],["Trainer",result.member.trainer],["Visits",result.member.visits+1]].map(([l,v]) => (
                        <div key={l} style={{ background:"rgba(22,163,74,.1)", border:"1px solid rgba(22,163,74,.25)", borderRadius:10, padding:"11px 10px" }}>
                          <div style={{ fontSize:16, fontWeight:800, color:"#4ade80" }}>{v}</div>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", fontWeight:600, textTransform:"uppercase", marginTop:2 }}>{l}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background:"rgba(22,163,74,.15)", border:"1px solid rgba(22,163,74,.3)", borderRadius:10, padding:"10px 16px", fontSize:12, color:"rgba(255,255,255,.5)" }}>
                      Checked in at {nowTime()} · AI verified
                    </div>
                  </div>
                )}

                {/* EXPIRED ❌ */}
                {result?.type === "expired" && (
                  <div className="pop shake" style={{ width:"100%", textAlign:"center" }}>
                    <div style={{ width:90,height:90,borderRadius:"50%",background:"rgba(220,38,38,.2)",border:"3px solid #dc2626",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:44,animation:"denied 1s ease-out" }}>🚫</div>
                    <div style={{ fontSize:11, fontWeight:700, color:"rgba(220,38,38,.8)", textTransform:"uppercase", letterSpacing:2, marginBottom:8 }}>⚠️ ACCESS DENIED</div>
                    <div style={{ fontSize:26, fontWeight:900, color:"#fff", marginBottom:4 }}>{result.member.name}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"rgba(255,255,255,.3)", marginBottom:16 }}>{result.member.id}</div>

                    <div style={{ background:"rgba(220,38,38,.15)", border:"1px solid rgba(220,38,38,.4)", borderRadius:12, padding:"16px", marginBottom:14 }}>
                      <div style={{ fontSize:18, fontWeight:800, color:"#f87171", marginBottom:6 }}>Membership Expired</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", lineHeight:1.7 }}>
                        Expired on <strong style={{ color:"#f87171" }}>{result.member.expiry}</strong><br/>
                        Please renew to continue
                      </div>
                    </div>

                    <div style={{ background:"rgba(255,255,255,.06)", borderRadius:10, padding:"10px 14px", fontSize:12, color:"rgba(255,255,255,.4)" }}>
                      🤖 AI flagged · Staff alerted · Renewal SMS queued
                    </div>
                  </div>
                )}

                {/* FROZEN 🔒 */}
                {result?.type === "frozen" && (
                  <div className="pop shake" style={{ width:"100%", textAlign:"center" }}>
                    <div style={{ width:90,height:90,borderRadius:"50%",background:"rgba(217,119,6,.2)",border:"3px solid #d97706",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:44 }}>⏸</div>
                    <div style={{ fontSize:11, fontWeight:700, color:"rgba(217,119,6,.8)", textTransform:"uppercase", letterSpacing:2, marginBottom:8 }}>⚠️ ACCESS DENIED</div>
                    <div style={{ fontSize:26, fontWeight:900, color:"#fff", marginBottom:4 }}>{result.member.name}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"rgba(255,255,255,.3)", marginBottom:16 }}>{result.member.id}</div>
                    <div style={{ background:"rgba(217,119,6,.15)", border:"1px solid rgba(217,119,6,.4)", borderRadius:12, padding:"16px" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:"#fbbf24" }}>Membership Frozen</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", marginTop:6 }}>Contact reception to unfreeze</div>
                    </div>
                  </div>
                )}

                {/* NOT FOUND */}
                {result?.type === "notfound" && (
                  <div className="pop" style={{ width:"100%", textAlign:"center" }}>
                    <div style={{ fontSize:56, marginBottom:16 }}>🔍</div>
                    <div style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:8 }}>Unknown QR</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", lineHeight:1.7, marginBottom:16 }}>
                      Scanned: <span style={{ fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,.6)" }}>{result.raw}</span><br/>
                      No member found. Contact reception.
                    </div>
                  </div>
                )}
              </div>

              {/* Demo test buttons */}
              <div style={{ borderTop:"1px solid rgba(255,255,255,.07)", padding:"14px 16px", background:"rgba(0,0,0,.4)" }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.2)", fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
                  🎮 Demo -- Simulate Scan
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {Object.values(DB).map(m => (
                    <button key={m.id} onClick={() => testScan(m.id)}
                      style={{
                        padding:"6px 11px", borderRadius:8, border:"none", cursor:"pointer",
                        fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600,
                        background: m.status==="Active"?"rgba(22,163,74,.15)":m.status==="Expired"?"rgba(220,38,38,.15)":"rgba(217,119,6,.15)",
                        color: m.status==="Active"?"#4ade80":m.status==="Expired"?"#f87171":"#fbbf24",
                        transition:".15s"
                      }}>
                      {m.init} -- {m.status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ LOG TAB ══════════════════════════════════════════════════════════ */}
        {tab === "log" && (
          <div style={{ flex:1, overflowY:"auto", padding:20 }}>

            {/* Summary */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
              {[
                { l:"Total Scans",    v:log.length,  color:"#fff"    },
                { l:"Allowed In",     v:allowed,     color:"#4ade80" },
                { l:"AI Denied",      v:denied,      color:"#f87171" },
                { l:"Inside Now",     v:Math.max(allowed-2,0), color:"#60a5fa" },
              ].map(s => (
                <div key={s.l} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"16px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:28, fontWeight:900, color:s.color }}>{s.v}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.35)", fontWeight:600, textTransform:"uppercase", marginTop:4 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* AI alert bar */}
            {denied > 0 && (
              <div style={{ background:"rgba(220,38,38,.1)", border:"1px solid rgba(220,38,38,.3)", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:22 }}>🤖</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#f87171" }}>AI flagged {denied} attempt{denied>1?"s":""} today</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:2 }}>
                    {log.filter(l=>l.result==="denied").map(l=>l.name).join(", ")} -- expired/frozen membership
                  </div>
                </div>
              </div>
            )}

            {/* Log table */}
            <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1.2fr", gap:0, padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,.07)", fontSize:10, fontWeight:700, color:"rgba(255,255,255,.3)", textTransform:"uppercase", letterSpacing:1 }}>
                {["Member","ID","Plan","Time","AI Verdict"].map(h => <div key={h}>{h}</div>)}
              </div>

              {[...log].map((l, i) => (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1.2fr", gap:0, padding:"13px 16px", borderBottom:"1px solid rgba(255,255,255,.04)", background:i===0?"rgba(255,255,255,.03)":"transparent", animation:i===0?"fadeUp .3s ease":"none" }}>
                  {/* Member */}
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32,height:32,borderRadius:8,background:l.result==="allowed"?"rgba(22,163,74,.2)":"rgba(220,38,38,.2)",border:`1px solid ${l.result==="allowed"?"rgba(22,163,74,.4)":"rgba(220,38,38,.4)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:l.result==="allowed"?"#4ade80":"#f87171",flexShrink:0 }}>{l.init}</div>
                    <span style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{l.name}</span>
                  </div>
                  {/* ID */}
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"rgba(255,255,255,.3)", display:"flex", alignItems:"center" }}>{l.id}</div>
                  {/* Plan */}
                  <div style={{ display:"flex", alignItems:"center" }}>
                    <span style={{ background:"rgba(22,163,74,.1)", border:"1px solid rgba(22,163,74,.2)", borderRadius:20, padding:"3px 9px", fontSize:10, fontWeight:600, color:"#4ade80" }}>{l.plan}</span>
                  </div>
                  {/* Time */}
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:"#16a34a", display:"flex", alignItems:"center" }}>{l.time}</div>
                  {/* Verdict */}
                  <div style={{ display:"flex", alignItems:"center" }}>
                    {l.result==="allowed"
                      ? <span style={{ background:"rgba(22,163,74,.15)", border:"1px solid rgba(22,163,74,.35)", borderRadius:20, padding:"4px 10px", fontSize:10, fontWeight:700, color:"#4ade80" }}>✅ Allowed</span>
                      : <span style={{ background:"rgba(220,38,38,.15)", border:"1px solid rgba(220,38,38,.35)", borderRadius:20, padding:"4px 10px", fontSize:10, fontWeight:700, color:"#f87171" }}>🚫 Denied</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BOTTOM TICKER ── */}
        <div style={{ height:36, flexShrink:0, background:"rgba(0,0,0,.7)", borderTop:"1px solid rgba(255,255,255,.06)", overflow:"hidden", display:"flex", alignItems:"center" }}>
          <div style={{ display:"flex", gap:48, animation:`ticker ${Math.max(log.length*6,20)}s linear infinite`, whiteSpace:"nowrap", width:"max-content" }}>
            {[...log,...log].map((l,i) => (
              <span key={i} style={{ fontSize:11, color:"rgba(255,255,255,.35)", fontFamily:"'JetBrains Mono',monospace" }}>
                <span style={{ color:l.result==="allowed"?"#16a34a":"#dc2626" }}>{l.result==="allowed"?"●":"⚠"}</span>
                {" "}{l.name}
                <span style={{ color:"rgba(255,255,255,.2)" }}> · {l.time}</span>
                {l.result==="denied" && <span style={{ color:"#f87171", fontWeight:700 }}> -- DENIED</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
