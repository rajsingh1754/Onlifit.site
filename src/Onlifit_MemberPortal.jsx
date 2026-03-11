import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "./supabase";

const STORAGE_KEY = 'onlifit_member_user';

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
          gym_id: data.gym_id || 'GYM001',
          freeze_start: data.freeze_start || '',
          emergency_contact: data.emergency_contact || '',
          emergency_phone: data.emergency_phone || '',
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
function MemberPortal({ member: initialMember, onLogout }) {
  const [member, setMember] = useState(initialMember);
  const [tab, setTab]           = useState("home");
  const [showRenew, setRenew]   = useState(false);
  const [showQR, setShowQR]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [workoutDay, setWDay]   = useState(null);
  const [payments, setPayments] = useState([]);
  const [loadingPay, setLoadingPay] = useState(false);
  const [paying, setPaying]     = useState(false);
  const [editing, setEditing]   = useState(false);
  const [editForm, setEditForm] = useState({ phone: member.phone||'', email: member.email||'', emergency_contact: member.emergency_contact||'', emergency_phone: member.emergency_phone||'' });
  const [saving, setSaving]     = useState(false);
  const [freezing, setFreezing] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  // Refresh member data from Supabase
  const refreshMember = async () => {
    try {
      const { data } = await supabase.from('members').select('*').eq('id', member.id).single();
      if (data) {
        const expDate = data.expiry_date ? new Date(data.expiry_date) : null;
        const daysLeft = expDate ? Math.max(0, Math.ceil((expDate - Date.now()) / 864e5)) : 0;
        const updated = {
          ...member, phone: data.phone, email: data.email, dob: data.dob||'',
          plan: data.plan, expiry: data.expiry_date, daysLeft, status: data.status,
          visits: data.visits||0, trainer: data.trainer||'',
          freeze_start: data.freeze_start||'',
          emergency_contact: data.emergency_contact||'',
          emergency_phone: data.emergency_phone||'',
        };
        setMember(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch(e) { /* silent */ }
  };

  // Load payment history
  useEffect(() => {
    (async () => {
      setLoadingPay(true);
      try {
        const { data } = await supabase.from('payments').select('*').eq('member_id', member.id).order('created_at', { ascending: false }).limit(50);
        if (data) setPayments(data);
      } catch(e) { /* silent */ }
      setLoadingPay(false);
    })();
  }, [member.id]);

  // ── Razorpay Renewal ──
  const handleRenewPayment = async (plan) => {
    const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!rzpKey) {
      // Fallback: record as cash payment for demo
      await recordRenewal(plan, 'Cash', null);
      return;
    }
    setPaying(true);
    const options = {
      key: rzpKey, amount: plan.price * 100, currency: 'INR',
      name: 'Onlifit', description: `${plan.name} Membership Renewal`,
      handler: async (response) => {
        await recordRenewal(plan, 'Razorpay', response.razorpay_payment_id);
        setPaying(false);
      },
      prefill: { name: member.name, email: member.email||'', contact: member.phone||'' },
      modal: { ondismiss: () => setPaying(false) },
    };
    try { const rzp = new window.Razorpay(options); rzp.open(); }
    catch { showToast('⚠️ Payment gateway not loaded'); setPaying(false); }
  };

  const recordRenewal = async (plan, mode, txnId) => {
    const today = new Date().toISOString().slice(0, 10);
    const invNo = `INV-${Date.now().toString().slice(-6)}`;
    // Calculate new expiry
    const currentExpiry = member.expiry ? new Date(member.expiry) : new Date();
    const base = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(base);
    newExpiry.setDate(newExpiry.getDate() + plan.days);
    const newExpiryStr = newExpiry.toISOString().slice(0, 10);

    // Insert payment record
    const paymentData = {
      gym_id: member.gym_id||'GYM001', member_id: member.id, member_name: member.name,
      invoice: invNo, plan: plan.name, amount: String(plan.price), mode, date: today,
      status: 'Paid', txn_id: txnId||'',
    };
    const { error: payErr } = await supabase.from('payments').insert(paymentData);
    if (payErr) { showToast('⚠️ Payment recording failed'); return; }

    // Update member expiry
    const { error: memErr } = await supabase.from('members').update({
      expiry_date: newExpiryStr, plan: plan.name, status: 'Active',
    }).eq('id', member.id);

    if (memErr) { showToast('⚠️ Membership update failed'); return; }

    setPayments(prev => [paymentData, ...prev]);
    showToast(`✅ ${plan.name} renewed! New expiry: ${newExpiryStr}`);
    setRenew(false);
    await refreshMember();
  };

  // ── Freeze / Unfreeze ──
  const handleFreeze = async () => {
    setFreezing(true);
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('members').update({
      status: 'Frozen', freeze_start: today,
    }).eq('id', member.id);
    if (error) { showToast('⚠️ Freeze failed'); }
    else { showToast('❄️ Membership frozen. Your remaining days are preserved.'); await refreshMember(); }
    setFreezing(false);
  };

  const handleUnfreeze = async () => {
    setFreezing(true);
    // Calculate days frozen and extend expiry
    const freezeStart = member.freeze_start ? new Date(member.freeze_start) : new Date();
    const frozenDays = Math.max(0, Math.ceil((Date.now() - freezeStart) / 864e5));
    const currentExpiry = member.expiry ? new Date(member.expiry) : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + frozenDays);
    const newExpiryStr = newExpiry.toISOString().slice(0, 10);

    const { error } = await supabase.from('members').update({
      status: 'Active', freeze_start: '', expiry_date: newExpiryStr,
    }).eq('id', member.id);
    if (error) { showToast('⚠️ Unfreeze failed'); }
    else { showToast(`✅ Membership active! +${frozenDays} days added. New expiry: ${newExpiryStr}`); await refreshMember(); }
    setFreezing(false);
  };

  // ── Profile Save ──
  const handleProfileSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('members').update({
      phone: editForm.phone, email: editForm.email,
      emergency_contact: editForm.emergency_contact, emergency_phone: editForm.emergency_phone,
    }).eq('id', member.id);
    if (error) { showToast('⚠️ Update failed'); }
    else { showToast('✅ Profile updated!'); setEditing(false); await refreshMember(); }
    setSaving(false);
  };

  const isFrozen = member.status === 'Frozen';
  const pct = Math.round((member.daysLeft / (member.plan==="Yearly"?365:member.plan==="Quarterly"?90:30)) * 100);
  const urgent = member.daysLeft < 30 && !isFrozen;

  const TABS = [
    { id:"home",       icon:"🏠", label:"Home"       },
    { id:"attendance", icon:"📅", label:"Attendance"  },
    { id:"plan",       icon:"💳", label:"My Plan"     },
    { id:"payments",   icon:"💰", label:"Payments"    },
    { id:"profile",    icon:"👤", label:"Profile"     },
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
              {isFrozen && (
                <div style={{ background:"rgba(147,197,253,.15)", border:"1px solid rgba(147,197,253,.3)", borderRadius:10, padding:"8px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:16 }}>❄️</span>
                  <span style={{ fontSize:12, color:"#93c5fd", fontWeight:600 }}>Membership Frozen — your remaining days are paused</span>
                </div>
              )}
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
                  <div style={{ fontSize:13, fontWeight:700, color:isFrozen?"#93c5fd":"#fff", marginTop:2 }}>{isFrozen?"❄️ Frozen":"● Active"}</div>
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
                  { icon:"💰", label:"Payment History", sub:"View past payments",   action:()=>setTab("payments") },
                  { icon:"👤", label:"Edit Profile",    sub:"Update your details",  action:()=>setTab("profile") },
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
              style={{ width:"100%", background:G.accent, border:"none", borderRadius:13, padding:"16px", fontSize:15, fontWeight:700, color:"#fff", cursor:"pointer", transition:".2s", marginBottom:10, boxShadow:"0 4px 16px rgba(22,163,74,.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              💳 Renew / Upgrade Plan
            </button>

            {/* Freeze / Unfreeze */}
            <button onClick={isFrozen ? handleUnfreeze : handleFreeze} disabled={freezing}
              style={{ width:"100%", background:isFrozen?"#dbeafe":"#eff6ff", border:`1.5px solid ${isFrozen?"#93c5fd":"#bfdbfe"}`, borderRadius:13, padding:"14px", fontSize:14, fontWeight:700, color:isFrozen?"#2563eb":"#3b82f6", cursor:"pointer", transition:".2s", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:freezing?.6:1 }}>
              {freezing ? "Processing..." : isFrozen ? "☀️ Unfreeze Membership" : "❄️ Freeze Membership"}
            </button>
            {isFrozen && member.freeze_start && (
              <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"12px 14px", marginBottom:16, fontSize:12, color:"#1e40af", lineHeight:1.6 }}>
                <strong>Frozen since:</strong> {member.freeze_start}<br/>
                <strong>Days frozen:</strong> {Math.max(0, Math.ceil((Date.now() - new Date(member.freeze_start)) / 864e5))}<br/>
                When you unfreeze, these days will be added to your expiry date.
              </div>
            )}

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

        {/* ── PAYMENTS TAB ── */}
        {tab === "payments" && (
          <div className="fade-up">
            <div style={{ fontSize:18, fontWeight:800, color:G.navy, marginBottom:4 }}>Payment History</div>
            <div style={{ fontSize:13, color:G.text3, marginBottom:20 }}>All your transactions</div>

            {/* Summary card */}
            <div style={{ background:`linear-gradient(135deg,${G.navy},#1a3a28)`, borderRadius:16, padding:"20px", marginBottom:18 }}>
              <div style={{ display:"flex", gap:12 }}>
                <div style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:24, fontWeight:800, color:"#fff" }}>{payments.length}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.45)", fontWeight:600, textTransform:"uppercase", marginTop:2 }}>Payments</div>
                </div>
                <div style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:24, fontWeight:800, color:G.accent }}>₹{payments.reduce((s,p)=>s+(parseInt(p.amount)||0),0).toLocaleString()}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.45)", fontWeight:600, textTransform:"uppercase", marginTop:2 }}>Total Paid</div>
                </div>
              </div>
            </div>

            {loadingPay ? (
              <div style={{ textAlign:"center", padding:40 }}>
                <div style={{ width:32, height:32, border:"3px solid "+G.border, borderTop:"3px solid "+G.accent, borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 12px" }}/>
                <div style={{ fontSize:13, color:G.text3 }}>Loading payments...</div>
              </div>
            ) : payments.length === 0 ? (
              <div style={{ textAlign:"center", padding:40, background:G.bg, borderRadius:16, border:`1px solid ${G.border}` }}>
                <div style={{ fontSize:40, marginBottom:12 }}>💳</div>
                <div style={{ fontSize:15, fontWeight:700, color:G.navy, marginBottom:4 }}>No payments yet</div>
                <div style={{ fontSize:13, color:G.text3 }}>Your payment history will appear here</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {payments.map((p, i) => (
                  <div key={i} style={{ background:G.bg, border:`1px solid ${G.border}`, borderRadius:14, padding:"16px", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:G.navy }}>{p.plan || 'Payment'}</div>
                        <div style={{ fontSize:12, color:G.text3, marginTop:2 }}>{p.date} · {p.mode || 'N/A'}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:800, color:G.accent }}>₹{parseInt(p.amount||0).toLocaleString()}</div>
                        <span style={{ background:p.status==='Paid'?G.bg4:G.yellowBg, border:`1px solid ${p.status==='Paid'?G.accentL:'#fde68a'}`, color:p.status==='Paid'?G.accent:G.yellow, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{p.status||'Paid'}</span>
                      </div>
                    </div>
                    {p.invoice && (
                      <div style={{ fontSize:11, color:G.text3, fontFamily:"'JetBrains Mono',monospace" }}>Invoice: {p.invoice}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <div className="fade-up">
            <div style={{ fontSize:18, fontWeight:800, color:G.navy, marginBottom:4 }}>My Profile</div>
            <div style={{ fontSize:13, color:G.text3, marginBottom:20 }}>View and edit your details</div>

            {/* Avatar & ID card */}
            <div style={{ background:G.bg, border:`1px solid ${G.border}`, borderRadius:16, padding:"24px", marginBottom:16, textAlign:"center", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ width:72, height:72, borderRadius:18, background:G.bg4, border:`3px solid ${G.accentL}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:24, color:G.accent, margin:"0 auto 12px" }}>{member.init}</div>
              <div style={{ fontSize:20, fontWeight:800, color:G.navy, marginBottom:4 }}>{member.name}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600, color:G.text3, marginBottom:8 }}>{member.id}</div>
              <div style={{ display:"flex", justifyContent:"center", gap:12, flexWrap:"wrap" }}>
                <span style={{ background:G.bg4, border:`1px solid ${G.accentL}`, color:G.accent, fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20 }}>{member.plan}</span>
                <span style={{ background:isFrozen?"#dbeafe":member.status==='Active'?G.bg4:G.redBg, border:`1px solid ${isFrozen?"#93c5fd":member.status==='Active'?G.accentL:G.redBorder}`, color:isFrozen?"#2563eb":member.status==='Active'?G.accent:G.red, fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20 }}>{member.status}</span>
              </div>
            </div>

            {/* Read-only info */}
            <div style={{ background:G.bg, border:`1px solid ${G.border}`, borderRadius:16, padding:"18px", marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ fontSize:13, fontWeight:700, color:G.navy, marginBottom:14 }}>Membership Info</div>
              {[
                {l:"Member ID", v:member.id},
                {l:"Join Date", v:member.joinDate||'—'},
                {l:"Branch", v:member.branch||'Main'},
                {l:"Trainer", v:member.trainer||'Not assigned'},
                {l:"Plan", v:`${member.plan} — Expires ${member.expiry||'—'}`},
                {l:"Total Visits", v:member.totalVisits||0},
              ].map(item => (
                <div key={item.l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${G.border}` }}>
                  <span style={{ fontSize:12, color:G.text3, fontWeight:600 }}>{item.l}</span>
                  <span style={{ fontSize:12, color:G.navy, fontWeight:600, textAlign:"right", maxWidth:"60%" }}>{item.v}</span>
                </div>
              ))}
            </div>

            {/* Editable fields */}
            <div style={{ background:G.bg, border:`1px solid ${G.border}`, borderRadius:16, padding:"18px", marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:G.navy }}>Contact Details</div>
                {!editing && (
                  <button onClick={() => { setEditing(true); setEditForm({ phone:member.phone||'', email:member.email||'', emergency_contact:member.emergency_contact||'', emergency_phone:member.emergency_phone||'' }); }}
                    style={{ background:G.bg3, border:`1.5px solid ${G.accentL}`, borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:700, color:G.accent, cursor:"pointer" }}>
                    ✏️ Edit
                  </button>
                )}
              </div>

              {editing ? (
                <div>
                  {[
                    {l:"Phone", k:"phone", ph:"+91 98765 43210", type:"tel"},
                    {l:"Email", k:"email", ph:"you@example.com", type:"email"},
                    {l:"Emergency Contact", k:"emergency_contact", ph:"Contact name", type:"text"},
                    {l:"Emergency Phone", k:"emergency_phone", ph:"+91 ...", type:"tel"},
                  ].map(f => (
                    <div key={f.k} style={{ marginBottom:12 }}>
                      <label style={{ fontSize:11, color:G.text3, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:4 }}>{f.l}</label>
                      <input value={editForm[f.k]} onChange={e=>setEditForm({...editForm,[f.k]:e.target.value})} type={f.type} placeholder={f.ph}
                        style={{ width:"100%", background:G.bg2, border:`1.5px solid ${G.border}`, borderRadius:10, padding:"11px 14px", fontSize:14, color:G.navy, outline:"none", fontFamily:"'Sora',sans-serif" }}/>
                    </div>
                  ))}
                  <div style={{ display:"flex", gap:10, marginTop:4 }}>
                    <button onClick={handleProfileSave} disabled={saving}
                      style={{ flex:1, background:G.accent, border:"none", borderRadius:10, padding:"12px", fontSize:14, fontWeight:700, color:"#fff", cursor:"pointer", opacity:saving?.6:1 }}>
                      {saving ? "Saving..." : "✓ Save Changes"}
                    </button>
                    <button onClick={() => setEditing(false)}
                      style={{ flex:1, background:"none", border:`1.5px solid ${G.border}`, borderRadius:10, padding:"12px", fontSize:14, fontWeight:600, color:G.text2, cursor:"pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {[
                    {l:"Phone", v:member.phone||'Not set'},
                    {l:"Email", v:member.email||'Not set'},
                    {l:"Emergency Contact", v:member.emergency_contact||'Not set'},
                    {l:"Emergency Phone", v:member.emergency_phone||'Not set'},
                  ].map(item => (
                    <div key={item.l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${G.border}` }}>
                      <span style={{ fontSize:12, color:G.text3, fontWeight:600 }}>{item.l}</span>
                      <span style={{ fontSize:12, color:G.navy, fontWeight:600 }}>{item.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout */}
            <button onClick={onLogout}
              style={{ width:"100%", background:G.redBg, border:`1.5px solid ${G.redBorder}`, borderRadius:13, padding:"14px", fontSize:14, fontWeight:700, color:G.red, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              🚪 Logout
            </button>
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
            <div style={{ fontSize:13, color:G.text3, marginBottom:20 }}>Select a plan to renew via Razorpay or UPI</div>

            {paying && (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ width:40, height:40, border:"3px solid "+G.border, borderTop:"3px solid "+G.accent, borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 12px" }}/>
                <div style={{ fontSize:14, fontWeight:600, color:G.text2 }}>Processing payment...</div>
              </div>
            )}

            {!paying && [{name:"Monthly",price:1500,days:30,features:["Gym Access","Locker"]},{name:"Quarterly",price:4000,days:90,features:["Gym Access","Locker","Group Classes"]},{name:"Yearly",price:14000,days:365,features:["Gym Access","4 PT Sessions","Locker","Group Classes","Nutrition"]}].map(plan => (
              <div key={plan.name} className="card-hover" style={{ background:plan.name===member.plan?G.bg3:G.bg, border:`1.5px solid ${plan.name===member.plan?G.accentL:G.border}`, borderRadius:13, padding:"16px", marginBottom:10, cursor:"pointer", transition:".2s", boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}
                onClick={() => handleRenewPayment(plan)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:G.navy }}>{plan.name}</span>
                      {plan.name===member.plan && <span style={{ background:G.bg4, border:`1px solid ${G.accentL}`, color:G.accent, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>Current</span>}
                    </div>
                    <div style={{ fontSize:12, color:G.text3, marginTop:2 }}>{plan.days} days</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:800, color:G.accent }}>₹{plan.price.toLocaleString()}</div>
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

      {/* TOAST */}
      {toast && (
        <div className="pop-in" style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", background:G.navy, borderRadius:12, padding:"13px 20px", fontSize:13, fontWeight:600, color:"#fff", zIndex:200, boxShadow:"0 8px 32px rgba(0,0,0,.25)", display:"flex", alignItems:"center", gap:8, maxWidth:"90vw", whiteSpace:"normal" }}>
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

  // Restore session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMember(JSON.parse(saved));
    } catch(e) { /* ignore */ }
  }, []);

  const handleLogin = (m) => {
    setMember(m);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); } catch(e) {}
  };

  const handleLogout = () => {
    setMember(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
  };

  return (
    <>
      <style>{css}</style>
      {member
        ? <MemberPortal member={member} onLogout={handleLogout}/>
        : <LoginScreen  onLogin={handleLogin}/>
      }
    </>
  );
}
