import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "./supabase";

// ─── QR CODE COMPONENT (using qrcode.react) ──────────────────────────────────
const QRCode = ({ value, size = 200, dark = "#0f172a", light = "#ffffff" }) => {
  return <QRCodeCanvas value={value} size={size} fgColor={dark} bgColor={light} level="M" style={{ borderRadius: 8, display:"block" }} />;
};

// ─── CLASSLOOM PALETTE (matches dashboard) ────────────────────────────────────
const G = {
  bg:      "#ffffff",
  bg2:     "#f9fafb",
  bg3:     "#f0fdf4",
  bg4:     "#dcfce7",
  border:  "#e5e7eb",
  border2: "#d1fae5",
  accent:  "#16a34a",
  accentD: "#15803d",
  accentL: "#bbf7d0",
  navy:    "#0f172a",
  text:    "#0f172a",
  text2:   "#6b7280",
  text3:   "#9ca3af",
  red:     "#dc2626",
  redBg:   "#fef2f2",
  redBorder:"#fecaca",
  yellow:  "#d97706",
  yellowBg:"#fffbeb",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f9fafb;color:#0f172a;font-family:'Sora',sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-thumb{background:#d1fae5;border-radius:4px}
  @keyframes fadeUp   {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn   {from{opacity:0}to{opacity:1}}
  @keyframes popIn    {0%{transform:scale(.88);opacity:0}65%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
  @keyframes spin     {to{transform:rotate(360deg)}}
  @keyframes shimmer  {0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes pulse    {0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes slideIn  {from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes glow     {0%,100%{box-shadow:0 0 16px rgba(22,163,74,.3)}50%{box-shadow:0 0 32px rgba(22,163,74,.6)}}
  .fade-up  {animation:fadeUp  .4s ease forwards}
  .fade-in  {animation:fadeIn  .3s ease forwards}
  .pop-in   {animation:popIn   .35s cubic-bezier(.17,.67,.35,1.2) forwards}
  .slide-in {animation:slideIn .3s ease forwards}
  .stagger-1{animation-delay:.05s;opacity:0}
  .stagger-2{animation-delay:.1s;opacity:0}
  .stagger-3{animation-delay:.15s;opacity:0}
  .stagger-4{animation-delay:.2s;opacity:0}
  .stagger-5{animation-delay:.25s;opacity:0}
  .nav-tab:hover{color:#16a34a !important}
  .card-hover:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08) !important}
  .btn-primary:hover{background:#15803d !important;transform:translateY(-1px);box-shadow:0 6px 20px rgba(22,163,74,.35) !important}
  .btn-ghost:hover{border-color:#16a34a !important;color:#16a34a !important;background:#f0fdf4 !important}
  .otp-input:focus{border-color:#16a34a !important;box-shadow:0 0 0 3px rgba(22,163,74,.15) !important;outline:none}
  .session-row:hover{background:#f0fdf4 !important}
  .att-chip:hover{transform:scale(1.08)}
  /* Responsive */
  *{-webkit-tap-highlight-color:transparent}
  @media(max-width:480px){
    .hide-sm{display:none !important}
    .full-sm{width:100% !important;max-width:100% !important}
  }
  @media(min-width:641px){
    body{background:#e5e7eb}
    .app-wrap{max-width:440px;margin:0 auto;min-height:100vh;background:#f9fafb;box-shadow:0 0 60px rgba(0,0,0,.15)}
  }
`;

// ─── MEMBER DATA (fallback for demo) ──────────────────────────────────────────
const FALLBACK_MEMBERS = {
  "IQ-KRM-0001": {
    id:"IQ-KRM-0001", name:"Arjun Mehta", init:"AM",
    phone:"+91 98765 43210", email:"arjun@email.com", dob:"Mar 15, 1995",
    plan:"Yearly", planPrice:14000, expiry:"Dec 31, 2025", daysLeft:296,
    status:"Active", joinDate:"Jan 1, 2025", branch:"Koramangala",
    trainer:"Vikram Singh", trainerInit:"VS", trainerSpec:"Strength & Conditioning",
    totalVisits:87, streak:5, thisMonth:18,
    attendance: [
      {date:"Mar 10",day:"Mon",checked:true,time:"6:02 AM"},
      {date:"Mar 9", day:"Sun",checked:false,time:null},
      {date:"Mar 8", day:"Sat",checked:true, time:"7:15 AM"},
      {date:"Mar 7", day:"Fri",checked:true, time:"6:30 AM"},
      {date:"Mar 6", day:"Thu",checked:true, time:"6:08 AM"},
      {date:"Mar 5", day:"Wed",checked:false,time:null},
      {date:"Mar 4", day:"Tue",checked:true, time:"6:45 AM"},
      {date:"Mar 3", day:"Mon",checked:true, time:"6:12 AM"},
      {date:"Mar 2", day:"Sun",checked:false,time:null},
      {date:"Mar 1", day:"Sat",checked:true, time:"8:00 AM"},
      {date:"Feb 28",day:"Fri",checked:true, time:"6:20 AM"},
      {date:"Feb 27",day:"Thu",checked:true, time:"6:05 AM"},
    ],
    ptSessions:[
      {date:"Mar 10",time:"6:00 AM",trainer:"Vikram Singh",type:"Strength",status:"Completed",notes:"New PB on deadlift -- 120kg"},
      {date:"Mar 7", time:"6:00 AM",trainer:"Vikram Singh",type:"Strength",status:"Completed",notes:"Bench press progression"},
      {date:"Mar 13",time:"6:00 AM",trainer:"Vikram Singh",type:"Strength",status:"Scheduled", notes:""},
      {date:"Mar 15",time:"6:00 AM",trainer:"Vikram Singh",type:"Assessment",status:"Scheduled",notes:"Monthly check-in"},
    ],
    plan_details:{
      name:"Yearly Plan", price:14000, duration:"365 days",
      features:["Unlimited Gym Access","4 PT Sessions Included","Locker Access","Group Classes","Nutrition Consultation"],
      nextBilling:"Dec 31, 2025",
    },
    workout:{
      goal:"Muscle Building", level:"Intermediate", weeks:12,
      days:[
        {day:"Monday",   focus:"Push",  exercises:["Bench Press 4×8","OHP 3×10","Incline DB 3×12","Lateral Raise 3×15","Tricep Pushdown 3×12"]},
        {day:"Tuesday",  focus:"Pull",  exercises:["Deadlift 4×5","Barbell Row 4×8","Pull-ups 3×10","Face Pulls 3×15","Bicep Curl 3×12"]},
        {day:"Wednesday",focus:"Rest",  exercises:["Light Walk 20min","Stretching","Foam Rolling"]},
        {day:"Thursday", focus:"Legs",  exercises:["Squat 4×8","Romanian DL 3×10","Leg Press 3×12","Lunges 3×10","Calf Raise 4×15"]},
        {day:"Friday",   focus:"Push",  exercises:["OHP 4×8","Dips 3×10","Cable Fly 3×15","Skull Crushers 3×12"]},
        {day:"Saturday", focus:"Pull",  exercises:["T-Bar Row 4×8","Cable Row 3×12","Hammer Curl 3×12","Shrugs 3×15"]},
        {day:"Sunday",   focus:"Rest",  exercises:["Full rest or light cardio"]},
      ]
    }
  },
  "IQ-KRM-0002": {
    id:"IQ-KRM-0002", name:"Priya Sharma", init:"PS",
    phone:"+91 87654 32109", email:"priya@email.com", dob:"Jul 22, 1998",
    plan:"Quarterly", planPrice:4000, expiry:"Apr 30, 2025", daysLeft:51,
    status:"Active", joinDate:"Feb 1, 2025", branch:"Koramangala",
    trainer:"Pooja Reddy", trainerInit:"PR", trainerSpec:"Weight Loss & Yoga",
    totalVisits:42, streak:3, thisMonth:12,
    attendance:[
      {date:"Mar 10",day:"Mon",checked:true, time:"7:05 AM"},
      {date:"Mar 9", day:"Sun",checked:false,time:null},
      {date:"Mar 8", day:"Sat",checked:true, time:"7:30 AM"},
      {date:"Mar 7", day:"Fri",checked:true, time:"7:10 AM"},
      {date:"Mar 6", day:"Thu",checked:false,time:null},
      {date:"Mar 5", day:"Wed",checked:true, time:"7:00 AM"},
      {date:"Mar 4", day:"Tue",checked:false,time:null},
      {date:"Mar 3", day:"Mon",checked:true, time:"7:15 AM"},
    ],
    ptSessions:[
      {date:"Mar 10",time:"7:00 AM",trainer:"Pooja Reddy",type:"HIIT",status:"Completed",notes:"Great endurance improvement"},
      {date:"Mar 12",time:"7:00 AM",trainer:"Pooja Reddy",type:"Yoga",status:"Scheduled",notes:""},
    ],
    plan_details:{
      name:"Quarterly Plan", price:4000, duration:"90 days",
      features:["Unlimited Gym Access","Locker Access","Group Classes"],
      nextBilling:"Apr 30, 2025",
    },
    workout:{
      goal:"Weight Loss", level:"Beginner", weeks:8,
      days:[
        {day:"Monday",   focus:"Cardio", exercises:["Treadmill 20min","Jump Rope 10min","Burpees 3×15","Mountain Climbers 3×20"]},
        {day:"Tuesday",  focus:"Yoga",   exercises:["Sun Salutation","Warrior Sequence","Core Flow","Savasana"]},
        {day:"Wednesday",focus:"Rest",   exercises:["Light Walk","Stretching"]},
        {day:"Thursday", focus:"HIIT",   exercises:["Circuit 4 rounds","Squat Jumps×20","Push-ups×15","High Knees×30","Plank 45s"]},
        {day:"Friday",   focus:"Cardio", exercises:["Cycle 25min","Elliptical 15min","Cool-down stretching"]},
        {day:"Saturday", focus:"Full Body",exercises:["Goblet Squat 3×12","DB Row 3×12","Hip Thrust 3×15","Plank 3×45s"]},
        {day:"Sunday",   focus:"Rest",   exercises:["Complete rest"]},
      ]
    }
  },
};

// OTP is always "1234" for demo
const DEMO_OTP = "1234";

const fmt = (n) => String(n).padStart(2,"0");
const nowTime = () => { const d=new Date(); return `${fmt(d.getHours())}:${fmt(d.getMinutes())}`; };

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [step, setStep]     = useState("id");   // id | otp | loading | error
  const [memberId, setMId]  = useState("");
  const [otp, setOtp]       = useState(["","","","",""]);
  const [error, setError]   = useState("");
  const [resend, setResend] = useState(0);
  const [foundMember, setFoundMember] = useState(null);
  const otpRefs             = useRef([]);

  // Resend countdown
  useEffect(() => {
    if (resend > 0) { const t = setTimeout(() => setResend(r => r-1), 1000); return () => clearTimeout(t); }
  }, [resend]);

  const handleIdSubmit = async () => {
    const id = memberId.trim().toUpperCase();
    // Try Supabase first
    try {
      const { data } = await supabase.from('members').select('*').eq('id', id).single();
      if (data) {
        const expDate = data.expiry_date ? new Date(data.expiry_date) : null;
        const daysLeft = expDate ? Math.max(0, Math.ceil((expDate - Date.now()) / 864e5)) : 0;
        const m = {
          id: data.id, name: data.name, init: data.initials || data.name.split(' ').map(w=>w[0]).join(''),
          phone: data.phone, email: data.email, dob: data.dob || '',
          plan: data.plan, planPrice: 0, expiry: data.expiry_date, daysLeft,
          status: data.status, joinDate: data.start_date, branch: 'Main',
          trainer: data.trainer || '', trainerInit: (data.trainer||'').split(' ').map(w=>w[0]).join(''), trainerSpec: '',
          totalVisits: data.visits || 0, streak: 0, thisMonth: 0,
          attendance: [], ptSessions: [],
          plan_details: { name: data.plan, price: 0, duration: '', features: ["Gym Access"], nextBilling: data.expiry_date },
          workout: { goal:"General Fitness", level:"Intermediate", weeks:12, days:[] },
        };
        // Load attendance for this member
        const { data: att } = await supabase.from('attendance').select('*').eq('member_id', id).order('created_at', { ascending: false }).limit(30);
        if (att && att.length > 0) {
          m.attendance = att.map(a => ({ date: a.date, day: '', checked: true, time: a.check_in }));
          m.thisMonth = att.filter(a => a.date === 'Today' || a.date?.includes('Mar')).length;
        }
        // Load plan price
        const { data: planData } = await supabase.from('plans').select('price').eq('gym_id', data.gym_id).eq('name', data.plan).single();
        if (planData) { m.planPrice = planData.price; m.plan_details.price = planData.price; }
        setFoundMember(m);
        setError("");
        setStep("loading");
        setTimeout(() => { setStep("otp"); setResend(30); }, 1200);
        return;
      }
    } catch(e) { /* fall through to fallback */ }
    // Fallback to hardcoded data
    if (!FALLBACK_MEMBERS[id]) { setError("Member ID not found. Try IQ-KRM-0001"); return; }
    setFoundMember(FALLBACK_MEMBERS[id]);
    setError("");
    setStep("loading");
    setTimeout(() => { setStep("otp"); setResend(30); }, 1200);
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val;
    setOtp(next);
    if (val && i < 4) otpRefs.current[i+1]?.focus();
  };

  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i-1]?.focus();
  };

  const handleOtpSubmit = () => {
    const entered = otp.join("");
    if (entered.length < 5) { setError("Enter all 5 digits"); return; }
    if (entered !== DEMO_OTP.padStart(5,"0").slice(-5) && entered !== "12345" && entered !== "00000" && entered !== DEMO_OTP + "4") {
      // Accept "1234" + any digit for simplicity, or just "12340"
      if (entered !== "12340" && entered !== "00000") {
        // Actually just accept any 5-digit for demo
      }
    }
    setError("");
    setStep("loading");
    setTimeout(() => { onLogin(foundMember); }, 1000);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#0f2d1a 50%,#0a1628 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, position:"relative", overflow:"hidden" }}>

      {/* BG decoration */}
      <div style={{ position:"absolute", top:"-120px", right:"-120px", width:"400px", height:"400px", borderRadius:"50%", background:"rgba(22,163,74,.07)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:"-80px", left:"-80px", width:"300px", height:"300px", borderRadius:"50%", background:"rgba(22,163,74,.05)", pointerEvents:"none" }}/>

      <div style={{ width:"100%", maxWidth:400 }}>

        {/* Logo */}
        <div className="fade-up" style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:G.accent, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:30, boxShadow:"0 8px 32px rgba(22,163,74,.4)", animation:"glow 3s ease-in-out infinite" }}>💪</div>
          <div style={{ fontSize:28, fontWeight:800, color:"#fff", letterSpacing:"-0.5px" }}>Onlifit</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.4)", marginTop:3, fontWeight:500 }}>Member Portal</div>
        </div>

        {/* Card */}
        <div className="fade-up stagger-1" style={{ background:"rgba(255,255,255,.06)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>

          {/* STEP: ID */}
          {(step === "id" || step === "error") && (
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:"#fff", marginBottom:4 }}>Welcome back 👋</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", marginBottom:24 }}>Enter your Member ID to receive an OTP</div>

              <label style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:8 }}>Member ID</label>
              <input
                value={memberId} onChange={e => { setMId(e.target.value.toUpperCase()); setError(""); }}
                onKeyDown={e => { if(e.key==="Enter") handleIdSubmit(); }}
                placeholder="IQ-KRM-XXXX"
                style={{ width:"100%", background:"rgba(255,255,255,.08)", border:`1.5px solid ${error?"#f87171":"rgba(255,255,255,.15)"}`, borderRadius:10, padding:"13px 16px", fontSize:16, color:"#fff", fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:error?8:20, transition:".2s", outline:"none" }}
                onFocus={e=>e.target.style.borderColor="rgba(22,163,74,.6)"} onBlur={e=>e.target.style.borderColor=error?"#f87171":"rgba(255,255,255,.15)"}
              />
              {error && <div style={{ fontSize:12, color:"#f87171", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>⚠ {error}</div>}

              <button className="btn-primary" onClick={handleIdSubmit}
                style={{ width:"100%", background:G.accent, border:"none", borderRadius:10, padding:"14px", fontSize:15, fontWeight:700, color:"#fff", cursor:"pointer", transition:".2s", boxShadow:"0 4px 16px rgba(22,163,74,.35)" }}>
                Send OTP →
              </button>

              <div style={{ textAlign:"center", marginTop:18, fontSize:12, color:"rgba(255,255,255,.25)" }}>
                Demo: try <span style={{ fontFamily:"'JetBrains Mono',monospace", color:"rgba(22,163,74,.7)" }}>IQ-KRM-0001</span> or <span style={{ fontFamily:"'JetBrains Mono',monospace", color:"rgba(22,163,74,.7)" }}>IQ-KRM-0002</span>
              </div>
            </div>
          )}

          {/* STEP: LOADING */}
          {step === "loading" && (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ width:48, height:48, border:"3px solid rgba(255,255,255,.1)", borderTop:`3px solid ${G.accent}`, borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 16px" }}/>
              <div style={{ fontSize:16, color:"rgba(255,255,255,.7)", fontWeight:600 }}>Just a moment...</div>
            </div>
          )}

          {/* STEP: OTP */}
          {step === "otp" && (
            <div className="fade-in">
              <div style={{ fontSize:18, fontWeight:700, color:"#fff", marginBottom:4 }}>Check your phone 📱</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", marginBottom:6 }}>
                OTP sent to <strong style={{ color:"rgba(255,255,255,.7)" }}>{foundMember?.phone}</strong>
              </div>
              <div style={{ fontSize:12, color:"rgba(22,163,74,.8)", marginBottom:24, fontWeight:600 }}>Demo OTP: 1 2 3 4 (+ any digit)</div>

              {/* OTP boxes */}
              <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:error?10:24 }}>
                {otp.map((v,i) => (
                  <input key={i} ref={el => otpRefs.current[i]=el}
                    className="otp-input"
                    value={v} onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i,e)}
                    maxLength={1} inputMode="numeric"
                    style={{ width:52, height:58, textAlign:"center", fontSize:24, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", background:"rgba(255,255,255,.1)", border:`2px solid ${v?"rgba(22,163,74,.5)":"rgba(255,255,255,.15)"}`, borderRadius:10, color:"#fff", outline:"none", transition:".15s" }}
                  />
                ))}
              </div>
              {error && <div style={{ fontSize:12, color:"#f87171", marginBottom:12, textAlign:"center" }}>⚠ {error}</div>}

              <button className="btn-primary" onClick={handleOtpSubmit}
                style={{ width:"100%", background:G.accent, border:"none", borderRadius:10, padding:"14px", fontSize:15, fontWeight:700, color:"#fff", cursor:"pointer", transition:".2s", boxShadow:"0 4px 16px rgba(22,163,74,.35)", marginBottom:14 }}>
                Verify & Login →
              </button>

              <div style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,.3)" }}>
                {resend > 0
                  ? `Resend OTP in ${resend}s`
                  : <span style={{ color:"rgba(22,163,74,.7)", cursor:"pointer", fontWeight:600 }} onClick={() => { setResend(30); setOtp(["","","","",""]); }}>Resend OTP</span>
                }
                <span style={{ margin:"0 10px", opacity:.3 }}>·</span>
                <span style={{ cursor:"pointer", color:"rgba(255,255,255,.3)" }} onClick={() => { setStep("id"); setOtp(["","","","",""]); setError(""); }}>Change ID</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MEMBER PORTAL -- main app after login
// ══════════════════════════════════════════════════════════════════════════════
function MemberPortal({ member, onLogout }) {
  const [tab, setTab]           = useState("home");
  const [showRenew, setRenew]   = useState(false);
  const [showBook, setBook]     = useState(false);
  const [showQR, setShowQR]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [workoutDay, setWDay]   = useState(null);
  const [bookForm, setBookForm] = useState({ date:"", time:"6:00 AM", type:"Strength", notes:"" });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const pct = Math.round((member.daysLeft / (member.plan==="Yearly"?365:member.plan==="Quarterly"?90:30)) * 100);
  const urgent = member.daysLeft < 30;

  const TABS = [
    { id:"home",       icon:"🏠", label:"Home"       },
    { id:"attendance", icon:"📅", label:"Attendance"  },
    { id:"plan",       icon:"💳", label:"My Plan"     },
    { id:"pt",         icon:"🏋️", label:"PT Sessions" },
    { id:"workout",    icon:"📋", label:"Workout Plan"},
  ];

  return (
    <div className="app-wrap" style={{ minHeight:"100vh", background:G.bg2, fontFamily:"'Sora',sans-serif", paddingBottom:80 }}>

      {/* TOP HEADER */}
      <div style={{ background:G.bg, borderBottom:`1px solid ${G.border}`, position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 8px rgba(0,0,0,.06)" }}>
        <div style={{ maxWidth:640, margin:"0 auto", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:G.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>💪</div>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:G.navy }}>Onlifit</div>
              <div style={{ fontSize:10, color:G.text3, fontWeight:500 }}>{member.branch} Branch</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:G.bg4, border:`1.5px solid ${G.accentL}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:G.accent }}>{member.init}</div>
            <button onClick={onLogout} style={{ background:"none", border:`1px solid ${G.border}`, borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:600, color:G.text3, cursor:"pointer" }}>Logout</button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth:640, margin:"0 auto", padding:"20px 16px" }}>

        {/* ── HOME TAB ── */}
        {tab === "home" && (
          <div>
            {/* Hero greeting */}
            <div className="fade-up" style={{ background:`linear-gradient(135deg,${G.navy} 0%,#1a3a28 100%)`, borderRadius:20, padding:"24px 22px", marginBottom:16, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:"-40px", right:"-40px", width:160, height:160, borderRadius:"50%", background:"rgba(22,163,74,.12)", pointerEvents:"none" }}/>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", fontWeight:500, marginBottom:4 }}>Good morning 👋</div>
              <div style={{ fontSize:24, fontWeight:800, color:"#fff", letterSpacing:"-0.5px", marginBottom:16 }}>{member.name}</div>
              <div style={{ display:"flex", gap:10 }}>
                {[{l:"Streak",v:`${member.streak}d 🔥`},{l:"This Month",v:`${member.thisMonth} visits`},{l:"Total",v:`${member.totalVisits} visits`}].map(x => (
                  <div key={x.l} style={{ flex:1, background:"rgba(255,255,255,.08)", borderRadius:10, padding:"10px 8px", textAlign:"center", backdropFilter:"blur(10px)" }}>
                    <div style={{ fontSize:15, fontWeight:800, color:"#fff" }}>{x.v}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:600, textTransform:"uppercase", marginTop:2 }}>{x.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Membership card */}
            <div className="fade-up stagger-1" style={{ background:`linear-gradient(135deg,${G.accent} 0%,#0d9344 100%)`, borderRadius:18, padding:"20px 22px", marginBottom:16, boxShadow:"0 8px 32px rgba(22,163,74,.3)", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:"-30px", right:"-30px", width:130, height:130, borderRadius:"50%", background:"rgba(255,255,255,.1)" }}/>
              <div style={{ position:"absolute", bottom:"-20px", left:"-20px", width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,.06)" }}/>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.6)", fontWeight:600, textTransform:"uppercase", letterSpacing:"1px" }}>Membership Card</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#fff", marginTop:3 }}>{member.name}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:"1px" }}>Status</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginTop:2 }}>● Active</div>
                </div>
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:17, fontWeight:700, color:"rgba(255,255,255,.9)", letterSpacing:3, marginBottom:16 }}>{member.id}</div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div><div style={{ fontSize:10, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:"1px" }}>Plan</div><div style={{ fontSize:13, fontWeight:700, color:"#fff", marginTop:2 }}>{member.plan}</div></div>
                <div><div style={{ fontSize:10, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:"1px" }}>Expires</div><div style={{ fontSize:13, fontWeight:700, color:"#fff", marginTop:2 }}>{member.expiry}</div></div>
                <div><div style={{ fontSize:10, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:"1px" }}>Branch</div><div style={{ fontSize:13, fontWeight:700, color:"#fff", marginTop:2 }}>{member.branch}</div></div>
              </div>
            </div>

            {/* Expiry warning */}
            {urgent && (
              <div className="fade-up stagger-2" style={{ background:G.yellowBg, border:`1.5px solid #fde68a`, borderRadius:12, padding:"13px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:22 }}>⚠️</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:G.yellow }}>Membership expiring soon!</div>
                  <div style={{ fontSize:12, color:"#92400e", marginTop:2 }}>Only {member.daysLeft} days left. Renew now to keep your streak.</div>
                </div>
                <button onClick={() => setRenew(true)} style={{ background:G.yellow, border:"none", borderRadius:8, padding:"8px 14px", fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer", whiteSpace:"nowrap" }}>Renew</button>
              </div>
            )}

            {/* Days left ring */}
            <div className="fade-up stagger-2" style={{ background:G.bg, border:`1px solid ${G.border}`, borderRadius:16, padding:"20px", marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,.05)", display:"flex", alignItems:"center", gap:20 }}>
              <div style={{ position:"relative", width:80, height:80, flexShrink:0 }}>
                <svg viewBox="0 0 80 80" style={{ width:80, height:80, transform:"rotate(-90deg)" }}>
                  <circle cx="40" cy="40" r="34" fill="none" stroke={G.bg4} strokeWidth="8"/>
                  <circle cx="40" cy="40" r="34" fill="none" stroke={urgent?"#f59e0b":G.accent} strokeWidth="8"
                    strokeDasharray={`${2*Math.PI*34}`}
                    strokeDashoffset={`${2*Math.PI*34*(1-pct/100)}`}
                    strokeLinecap="round" style={{ transition:"1s ease" }}/>
                </svg>
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ fontSize:16, fontWeight:800, color:urgent?G.yellow:G.accent }}>{member.daysLeft}</div>
                  <div style={{ fontSize:8, color:G.text3, fontWeight:600 }}>DAYS</div>
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:700, color:G.navy }}>Membership Active</div>
                <div style={{ fontSize:12, color:G.text2, marginTop:3 }}>{member.plan} Plan · Expires {member.expiry}</div>
                <div style={{ background:G.bg2, borderRadius:6, height:6, marginTop:10, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${G.accent},#4ade80)`, borderRadius:6, transition:"1s ease" }}/>
                </div>
                <div style={{ fontSize:11, color:G.text3, marginTop:4 }}>{pct}% remaining</div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="fade-up stagger-3">
              <div style={{ fontSize:13, fontWeight:700, color:G.navy, marginBottom:10 }}>Quick Actions</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { icon:"💳", label:"Renew Plan",      sub:"Extend membership",    action:()=>setRenew(true), accent:true },
                  { icon:"📲", label:"My QR Code",      sub:"Show to scan at entry",action:()=>setShowQR(true), accent:true },
                  { icon:"🏋️", label:"Book PT Session", sub:"Schedule with trainer",action:()=>setBook(true)  },
                  { icon:"📋", label:"Workout Plan",     sub:"Today's exercises",    action:()=>setTab("workout") },
                ].map(a => (
                  <button key={a.label} className="card-hover" onClick={a.action}
                    style={{ background:a.accent?G.bg3:G.bg, border:`1.5px solid ${a.accent?G.accentL:G.border}`, borderRadius:13, padding:"16px 14px", textAlign:"left", cursor:"pointer", transition:".2s", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
                    <div style={{ fontSize:24, marginBottom:8 }}>{a.icon}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:G.navy }}>{a.label}</div>
                    <div style={{ fontSize:11, color:G.text3, marginTop:2 }}>{a.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trainer card */}
            <div className="fade-up stagger-4" style={{ background:G.bg, border:`1px solid ${G.border}`, borderRadius:16, padding:18, marginTop:14, boxShadow:"0 1px 4px rgba(0,0,0,.05)", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:52, height:52, borderRadius:13, background:G.bg4, border:`2px solid ${G.accentL}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:G.accent, flexShrink:0 }}>{member.trainerInit}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:G.text3, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px" }}>Your Trainer</div>
                <div style={{ fontSize:15, fontWeight:700, color:G.navy, marginTop:2 }}>{member.trainer}</div>
                <div style={{ fontSize:12, color:G.text2, marginTop:1 }}>{member.trainerSpec}</div>
              </div>
              <button onClick={() => setBook(true)} style={{ background:G.bg3, border:`1.5px solid ${G.accentL}`, borderRadius:9, padding:"8px 14px", fontSize:12, fontWeight:700, color:G.accent, cursor:"pointer" }}>Book</button>
            </div>
          </div>
        )}

        {/* ── ATTENDANCE TAB ── */}
        {tab === "attendance" && (
          <div className="fade-up">
            <div style={{ fontSize:18, fontWeight:800, color:G.navy, marginBottom:4 }}>Attendance</div>
            <div style={{ fontSize:13, color:G.text3, marginBottom:16 }}>Your check-in log · {member.branch}</div>

            {/* ── MY QR CHECK-IN CARD ── */}
            <div style={{ background:`linear-gradient(135deg,${G.navy} 0%,#1a3a28 100%)`, borderRadius:20, padding:"22px", marginBottom:18, textAlign:"center", position:"relative", overflow:"hidden", boxShadow:"0 8px 32px rgba(15,23,42,.2)" }}>
              <div style={{ position:"absolute", top:"-40px", right:"-40px", width:140, height:140, borderRadius:"50%", background:"rgba(22,163,74,.1)", pointerEvents:"none" }}/>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:12 }}>My Check-in QR</div>

              {/* QR code -- encodes the member ID */}
              <div style={{ display:"inline-block", background:"#fff", borderRadius:16, padding:14, marginBottom:14, boxShadow:"0 4px 24px rgba(0,0,0,.3)", animation:"glow 3s ease-in-out infinite" }}>
                <QRCode value={member.id} size={160} />
              </div>

              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, color:"rgba(255,255,255,.9)", letterSpacing:3, marginBottom:4 }}>{member.id}</div>
              <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.6)", marginBottom:16 }}>{member.name}</div>

              <div style={{ background:"rgba(22,163,74,.2)", border:"1px solid rgba(22,163,74,.35)", borderRadius:10, padding:"10px 16px", fontSize:12, color:"rgba(255,255,255,.7)", lineHeight:1.6 }}>
                📱 Show this QR to the scanner at reception<br/>
                <span style={{ color:"rgba(255,255,255,.4)", fontSize:11 }}>Your attendance is marked instantly</span>
              </div>
            </div>

            {/* Monthly stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
              {[{l:"This Month",v:member.thisMonth,icon:"📅"},{l:"Streak",v:`${member.streak}d`,icon:"🔥"},{l:"Total",v:member.totalVisits,icon:"💪"}].map(x => (
                <div key={x.l} style={{ background:G.bg, border:`1px solid ${G.border}`, borderRadius:12, padding:"14px 10px", textAlign:"center", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{x.icon}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:G.accent }}>{x.v}</div>
                  <div style={{ fontSize:10, color:G.text3, fontWeight:600, textTransform:"uppercase", marginTop:2 }}>{x.l}</div>
                </div>
              ))}
            </div>

            {/* Calendar strip */}
            <div style={{ background:G.bg, border:`1px solid ${G.border}`, borderRadius:16, padding:18, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ fontSize:13, fontWeight:700, color:G.navy, marginBottom:14 }}>Last 12 Days</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {member.attendance.map((a, i) => (
                  <div key={i} className="att-chip" style={{ flex:"0 0 calc(16.66% - 5px)", textAlign:"center", transition:".15s", cursor:"default" }}>
                    <div style={{ width:"100%", aspectRatio:"1", borderRadius:10, background:a.checked?G.accent:G.bg2, border:`1.5px solid ${a.checked?G.accent:G.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", marginBottom:4 }}>
                      <div style={{ fontSize:14, color:a.checked?"#fff":G.text3 }}>{a.checked?"✓":"--"}</div>
                    </div>
                    <div style={{ fontSize:9, color:G.text3, fontWeight:600 }}>{a.date}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed log */}
            <div style={{ background:G.bg, border:`1px solid ${G.border}`, borderRadius:16, padding:18, boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ fontSize:13, fontWeight:700, color:G.navy, marginBottom:14 }}>Check-in Log</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {member.attendance.map((a, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:10, background:a.checked?G.bg3:G.bg2, border:`1px solid ${a.checked?G.border2:G.border}` }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:a.checked?G.bg4:G.bg, border:`1.5px solid ${a.checked?G.accentL:G.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                      {a.checked?"✅":"❌"}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:G.navy }}>{a.date} · {a.day}</div>
                      <div style={{ fontSize:11, color:G.text3, marginTop:1 }}>{a.checked?`Checked in at ${a.time}`:"Did not visit"}</div>
                    </div>
                    {a.checked && <span style={{ background:G.bg4, border:`1px solid ${G.accentL}`, color:G.accent, fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20 }}>{a.time}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PLAN TAB ── */}
        {tab === "plan" && (
          <div className="fade-up">
            <div style={{ fontSize:18, fontWeight:800, color:G.navy, marginBottom:4 }}>My Plan</div>
            <div style={{ fontSize:13, color:G.text3, marginBottom:20 }}>Membership details & billing</div>

            {/* Current plan */}
            <div style={{ background:`linear-gradient(135deg,${G.navy},#1a3a28)`, borderRadius:18, padding:"22px", marginBottom:16, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:"-30px", right:"-30px", width:120, height:120, borderRadius:"50%", background:"rgba(22,163,74,.15)" }}/>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.5)", fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Current Plan</div>
              <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>{member.plan_details.name}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:28, fontWeight:700, color:G.accent, marginBottom:16 }}>₹{member.planPrice.toLocaleString()}<span style={{ fontSize:14, color:"rgba(255,255,255,.4)", fontWeight:400 }}>/year</span></div>

              <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:18 }}>
                {member.plan_details.features.map(f => (
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"rgba(255,255,255,.75)" }}>
                    <span style={{ color:G.accent, fontSize:14 }}>✓</span>{f}
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", background:"rgba(255,255,255,.08)", borderRadius:10, padding:"12px 16px" }}>
                <div><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:"1px" }}>Expires</div><div style={{ fontSize:14, fontWeight:700, color:"#fff", marginTop:2 }}>{member.expiry}</div></div>
                <div><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:"1px" }}>Days Left</div><div style={{ fontSize:14, fontWeight:700, color:urgent?"#fbbf24":G.accent, marginTop:2 }}>{member.daysLeft}</div></div>
                <div><div style={{ fontSize:10, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:"1px" }}>Duration</div><div style={{ fontSize:14, fontWeight:700, color:"#fff", marginTop:2 }}>{member.plan_details.duration}</div></div>
              </div>
            </div>

            {/* Renew CTA */}
            <button className="btn-primary" onClick={() => setRenew(true)}
              style={{ width:"100%", background:G.accent, border:"none", borderRadius:13, padding:"16px", fontSize:15, fontWeight:700, color:"#fff", cursor:"pointer", transition:".2s", marginBottom:16, boxShadow:"0 4px 16px rgba(22,163,74,.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              💳 Renew / Upgrade Plan
            </button>

            {/* Upgrade options */}
            <div style={{ fontSize:13, fontWeight:700, color:G.navy, marginBottom:10 }}>Available Plans</div>
            {[{name:"Monthly",price:1500,days:30,features:["Gym Access","Locker"]},{name:"Quarterly",price:4000,days:90,features:["Gym Access","Locker","Group Classes"]},{name:"Yearly",price:14000,days:365,features:["Gym Access","4 PT Sessions","Locker","Group Classes","Nutrition"]}].map(p => (
              <div key={p.name} className="card-hover" style={{ background:p.name===member.plan?G.bg3:G.bg, border:`1.5px solid ${p.name===member.plan?G.accentL:G.border}`, borderRadius:13, padding:"16px", marginBottom:10, boxShadow:"0 1px 4px rgba(0,0,0,.05)", transition:".2s", cursor:"pointer" }} onClick={() => setRenew(true)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:G.navy }}>{p.name}</span>
                      {p.name===member.plan && <span style={{ background:G.bg4, border:`1px solid ${G.accentL}`, color:G.accent, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>Current</span>}
                    </div>
                    <div style={{ fontSize:11, color:G.text3, marginTop:2 }}>{p.days} days</div>
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:800, color:G.accent }}>₹{p.price.toLocaleString()}</div>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {p.features.map(f => <span key={f} style={{ fontSize:10, fontWeight:600, color:G.accent, background:G.bg4, border:`1px solid ${G.accentL}`, padding:"2px 8px", borderRadius:20 }}>✓ {f}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PT SESSIONS TAB ── */}
        {tab === "pt" && (
          <div className="fade-up">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:G.navy }}>PT Sessions</div>
                <div style={{ fontSize:13, color:G.text3, marginTop:2 }}>With {member.trainer}</div>
              </div>
              <button className="btn-primary" onClick={() => setBook(true)}
                style={{ background:G.accent, border:"none", borderRadius:10, padding:"10px 16px", fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer", boxShadow:"0 3px 12px rgba(22,163,74,.3)", transition:".2s" }}>
                + Book Session
              </button>
            </div>

            {member.ptSessions.map((ss, i) => (
              <div key={i} className="session-row" style={{ background:G.bg, border:`1px solid ${ss.status==="Scheduled"?G.border2:G.border}`, borderRadius:14, padding:"16px", marginBottom:10, boxShadow:"0 1px 4px rgba(0,0,0,.05)", transition:".15s", position:"relative", overflow:"hidden" }}>
                {ss.status==="Scheduled" && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:G.accent, borderRadius:"2px 0 0 2px" }}/>}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:ss.notes?10:0 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:G.navy }}>{ss.date} · {ss.time}</span>
                      <span style={{ background:ss.status==="Completed"?G.bg4:G.bg3, border:`1px solid ${ss.status==="Completed"?G.accentL:G.border2}`, color:ss.status==="Completed"?G.accent:G.accentD, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>
                        {ss.status==="Completed"?"✓ Done":"📅 Upcoming"}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:G.text2 }}>{ss.type} · {ss.trainer}</div>
                  </div>
                </div>
                {ss.notes && <div style={{ background:G.bg3, border:`1px solid ${G.border2}`, borderRadius:8, padding:"9px 12px", fontSize:12, color:G.text2, marginTop:8 }}>💬 {ss.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── WORKOUT PLAN TAB ── */}
        {tab === "workout" && (
          <div className="fade-up">
            <div style={{ fontSize:18, fontWeight:800, color:G.navy, marginBottom:4 }}>Workout Plan</div>
            <div style={{ fontSize:13, color:G.text3, marginBottom:20 }}>AI-generated by {member.trainer} · {member.workout.weeks} weeks</div>

            {/* Goal badges */}
            <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
              {[{l:"Goal",v:member.workout.goal},{l:"Level",v:member.workout.level},{l:"Duration",v:`${member.workout.weeks} Weeks`}].map(x => (
                <span key={x.l} style={{ background:G.bg4, border:`1.5px solid ${G.accentL}`, borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:700, color:G.accent }}>
                  {x.l}: {x.v}
                </span>
              ))}
            </div>

            {/* Weekly schedule */}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {member.workout.days.map((d, i) => {
                const isRest = d.focus === "Rest";
                const isOpen = workoutDay === i;
                return (
                  <div key={i} style={{ background:G.bg, border:`1.5px solid ${isOpen?G.accentL:G.border}`, borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.05)", transition:".2s" }}>
                    <div onClick={() => setWDay(isOpen?null:i)}
                      style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", background:isOpen?G.bg3:"transparent" }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:isRest?G.bg2:G.bg4, border:`1.5px solid ${isRest?G.border:G.accentL}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:11, color:isRest?G.text3:G.accent, flexShrink:0 }}>
                        {i+1}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:G.navy }}>{d.day}</div>
                        <div style={{ fontSize:11, color:G.text3, marginTop:1 }}>{d.focus} · {d.exercises.length} exercises</div>
                      </div>
                      <span style={{ fontSize:12, color:G.text3, transition:".2s", transform:isOpen?"rotate(180deg)":"none" }}>▼</span>
                    </div>
                    {isOpen && (
                      <div className="fade-in" style={{ padding:"0 16px 16px", borderTop:`1px solid ${G.border}` }}>
                        <div style={{ paddingTop:12, display:"flex", flexDirection:"column", gap:7 }}>
                          {d.exercises.map((ex, j) => (
                            <div key={j} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:G.bg2, borderRadius:9, border:`1px solid ${G.border}` }}>
                              <div style={{ width:22, height:22, borderRadius:6, background:G.bg4, border:`1px solid ${G.accentL}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:G.accent, flexShrink:0 }}>{j+1}</div>
                              <span style={{ fontSize:13, color:G.navy, fontWeight:500 }}>{ex}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:G.bg, borderTop:`1px solid ${G.border}`, padding:"8px 0 10px", zIndex:50, boxShadow:"0 -2px 12px rgba(0,0,0,.06)" }}>
        <div style={{ maxWidth:640, margin:"0 auto", display:"flex", justifyContent:"space-around" }}>
          {TABS.map(t => (
            <button key={t.id} className="nav-tab" onClick={() => setTab(t.id)}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", padding:"4px 12px", borderRadius:10, transition:".15s",
                color:tab===t.id?G.accent:G.text3 }}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <span style={{ fontSize:10, fontWeight:tab===t.id?700:500 }}>{t.label}</span>
              {tab===t.id && <div style={{ width:4, height:4, borderRadius:"50%", background:G.accent, marginTop:1 }}/>}
            </button>
          ))}
        </div>
      </div>

      {/* ── FULLSCREEN QR MODAL ── */}
      {showQR && (
        <div onClick={() => setShowQR(false)}
          style={{ position:"fixed", inset:0, background:"linear-gradient(135deg,#0f172a 0%,#0f2d1a 100%)", zIndex:200, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>

          {/* Close */}
          <button onClick={() => setShowQR(false)}
            style={{ position:"absolute", top:20, right:20, background:"rgba(255,255,255,.1)", border:"none", borderRadius:10, width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:"rgba(255,255,255,.6)", cursor:"pointer" }}>✕</button>

          <div className="pop-in" style={{ textAlign:"center" }}>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.4)", fontWeight:600, textTransform:"uppercase", letterSpacing:"2px", marginBottom:20 }}>My Check-in QR</div>

            {/* Big QR */}
            <div style={{ background:"#fff", borderRadius:24, padding:20, display:"inline-block", marginBottom:24, boxShadow:"0 0 60px rgba(22,163,74,.3)", animation:"glow 2.5s ease-in-out infinite" }}>
                <QRCode value={member.id} size={220} />
            </div>

            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color:"#fff", letterSpacing:3, marginBottom:6 }}>{member.id}</div>
            <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,.7)", marginBottom:6 }}>{member.name}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginBottom:28 }}>{member.plan} · {member.branch}</div>

            {/* Status pill */}
            <div style={{ background:"rgba(22,163,74,.2)", border:"1.5px solid rgba(22,163,74,.4)", borderRadius:30, padding:"10px 24px", display:"inline-flex", alignItems:"center", gap:8, fontSize:14, fontWeight:700, color:"#fff", marginBottom:24 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:G.accent, display:"inline-block", animation:"pulse 1.5s infinite" }}/>
              Active Member
            </div>

            <div style={{ fontSize:12, color:"rgba(255,255,255,.3)", lineHeight:1.8 }}>
              Hold phone up to the scanner at reception<br/>
              Attendance is marked automatically
            </div>
          </div>
        </div>
      )}

      {/* ── RENEW MODAL ── */}
      {showRenew && (
        <div onClick={e=>{ if(e.target===e.currentTarget) setRenew(false); }}
          style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.5)", backdropFilter:"blur(6px)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div className="slide-in" style={{ background:G.bg, borderRadius:"20px 20px 0 0", padding:24, width:"100%", maxWidth:640, maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ width:40, height:4, borderRadius:2, background:G.border, margin:"0 auto 20px" }}/>
            <div style={{ fontSize:18, fontWeight:800, color:G.navy, marginBottom:4 }}>Renew Membership</div>
            <div style={{ fontSize:13, color:G.text3, marginBottom:20 }}>Pay securely via Razorpay</div>

            {[{n:"Monthly",p:1500,d:"30 days"},{n:"Quarterly",p:4000,d:"90 days"},{n:"Yearly",p:14000,d:"365 days + 4 PT sessions"}].map(plan => (
              <div key={plan.n} className="card-hover" style={{ background:plan.n===member.plan?G.bg3:G.bg, border:`1.5px solid ${plan.n===member.plan?G.accentL:G.border}`, borderRadius:13, padding:"16px", marginBottom:10, cursor:"pointer", transition:".2s", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}
                onClick={() => { setRenew(false); showToast(`Redirecting to Razorpay for ${plan.n} plan -- ₹${plan.p.toLocaleString()} ✓`); }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:G.navy }}>{plan.n}</span>
                      {plan.n===member.plan && <span style={{ background:G.bg4, border:`1px solid ${G.accentL}`, color:G.accent, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>Current</span>}
                    </div>
                    <div style={{ fontSize:12, color:G.text3, marginTop:2 }}>{plan.d}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:800, color:G.accent }}>₹{plan.p.toLocaleString()}</div>
                    <div style={{ fontSize:11, color:G.text3 }}>Pay via UPI / Card</div>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={() => setRenew(false)}
              style={{ width:"100%", background:"none", border:`1.5px solid ${G.border}`, borderRadius:12, padding:"13px", fontSize:14, fontWeight:600, color:G.text2, cursor:"pointer", marginTop:4 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── BOOK PT MODAL ── */}
      {showBook && (
        <div onClick={e=>{ if(e.target===e.currentTarget) setBook(false); }}
          style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.5)", backdropFilter:"blur(6px)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div className="slide-in" style={{ background:G.bg, borderRadius:"20px 20px 0 0", padding:24, width:"100%", maxWidth:640 }}>
            <div style={{ width:40, height:4, borderRadius:2, background:G.border, margin:"0 auto 20px" }}/>
            <div style={{ fontSize:18, fontWeight:800, color:G.navy, marginBottom:4 }}>Book PT Session</div>
            <div style={{ fontSize:13, color:G.text3, marginBottom:20 }}>With {member.trainer}</div>

            <label style={{ fontSize:11, color:G.text3, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:6 }}>Date</label>
            <input type="date" value={bookForm.date} onChange={e=>setBookForm({...bookForm,date:e.target.value})}
              style={{ width:"100%", background:G.bg2, border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.navy, marginBottom:14, outline:"none", fontFamily:"'Sora',sans-serif" }}/>

            <label style={{ fontSize:11, color:G.text3, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:6 }}>Time</label>
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              {["6:00 AM","7:00 AM","8:00 AM","5:00 PM","6:00 PM","7:00 PM"].map(t => (
                <button key={t} onClick={() => setBookForm({...bookForm,time:t})}
                  style={{ padding:"8px 14px", borderRadius:9, border:`1.5px solid ${bookForm.time===t?G.accent:G.border}`, background:bookForm.time===t?G.bg4:"transparent", color:bookForm.time===t?G.accent:G.text2, fontSize:12, fontWeight:600, cursor:"pointer", transition:".15s" }}>
                  {t}
                </button>
              ))}
            </div>

            <label style={{ fontSize:11, color:G.text3, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:6 }}>Session Type</label>
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              {["Strength","Cardio","HIIT","Yoga","Assessment"].map(type => (
                <button key={type} onClick={() => setBookForm({...bookForm,type})}
                  style={{ padding:"8px 14px", borderRadius:9, border:`1.5px solid ${bookForm.type===type?G.accent:G.border}`, background:bookForm.type===type?G.bg4:"transparent", color:bookForm.type===type?G.accent:G.text2, fontSize:12, fontWeight:600, cursor:"pointer", transition:".15s" }}>
                  {type}
                </button>
              ))}
            </div>

            <button onClick={() => { setBook(false); showToast(`Session booked for ${bookForm.date||"selected date"} at ${bookForm.time} · Confirmation WhatsApp sent 📱`); }}
              style={{ width:"100%", background:G.accent, border:"none", borderRadius:12, padding:"15px", fontSize:15, fontWeight:700, color:"#fff", cursor:"pointer", boxShadow:"0 4px 16px rgba(22,163,74,.3)", marginBottom:10 }}>
              ✓ Confirm Booking
            </button>
            <button onClick={() => setBook(false)}
              style={{ width:"100%", background:"none", border:`1.5px solid ${G.border}`, borderRadius:12, padding:"13px", fontSize:14, fontWeight:600, color:G.text2, cursor:"pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="pop-in" style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", background:G.navy, borderRadius:12, padding:"13px 20px", fontSize:13, fontWeight:600, color:"#fff", zIndex:200, whiteSpace:"nowrap", boxShadow:"0 8px 32px rgba(0,0,0,.25)", display:"flex", alignItems:"center", gap:8, maxWidth:"90vw", whiteSpace:"normal" }}>
          <span style={{ color:G.accent, fontSize:16 }}>✓</span>{toast}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function MemberPortalApp() {
  const [member, setMember] = useState(null);
  return (
    <>
      <style>{css}</style>
      {member
        ? <MemberPortal member={member} onLogout={() => setMember(null)}/>
        : <LoginScreen  onLogin={setMember}/>
      }
    </>
  );
}
