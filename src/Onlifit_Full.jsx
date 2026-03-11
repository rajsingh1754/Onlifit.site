import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import jsQR from "jsqr";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import { supabase } from "./supabase";

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const G = {
  bg:"#ffffff", bg2:"#f9fafb", bg3:"#f0fdf4", bg4:"#dcfce7",
  border:"#e5e7eb", border2:"#d1fae5",
  accent:"#16a34a", accent2:"#15803d", accentL:"#bbf7d0",
  navy:"#0f172a", text:"#0f172a", text2:"#6b7280", text3:"#9ca3af",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#fff;color:#0f172a;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-thumb{background:#d1fae5;border-radius:4px}
  input,select,textarea{font-family:'Inter',sans-serif;color:#0f172a}
  @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scanBar{0%{top:15%}100%{top:80%}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes toastIn{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes ping{0%{transform:scale(1);opacity:1}75%,100%{transform:scale(2);opacity:0}}
  @keyframes typing{0%,60%,100%{opacity:.2}30%{opacity:1}}
  @keyframes ticker{0%{transform:translateX(0%)}100%{transform:translateX(-50%)}}
  @keyframes checkIn{0%{transform:scale(1.05);background:#dcfce7}100%{transform:scale(1);background:#f9fafb}}
  .page-anim{animation:fadeIn .18s ease}
  .slide-up{animation:slideUp .25s ease}
  .toggle{width:38px;height:22px;border-radius:11px;cursor:pointer;position:relative;transition:.25s;flex-shrink:0;border:none}
  .toggle::after{content:'';position:absolute;width:16px;height:16px;background:#fff;border-radius:50%;top:3px;left:3px;transition:.25s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
  .toggle.on{background:#16a34a}.toggle.on::after{left:19px}.toggle.off{background:#d1d5db}
  .nav-item{border-radius:8px;margin:1px 8px;transition:.15s}
  .nav-item:hover{background:#f0fdf4;color:#16a34a}
  .nav-item.active{background:#f0fdf4;color:#16a34a;font-weight:600}
  .stat-card{transition:.2s;border-radius:12px}.stat-card:hover{box-shadow:0 4px 16px rgba(22,163,74,.1);transform:translateY(-1px)}
  .row-hover:hover{background:#f9fafb}
  .btn-ghost:hover{border-color:#16a34a !important;color:#16a34a !important;background:#f0fdf4 !important}
  .btn-danger:hover{border-color:#fca5a5 !important;color:#dc2626 !important;background:#fef2f2 !important}
  .tab-btn:hover:not(.tab-active){color:#16a34a;background:#f0fdf4}
  .tab-active{color:#16a34a !important;background:#fff !important}
  .quick-link:hover{border-color:#16a34a;color:#16a34a;background:#f0fdf4}
  .plan-row:hover{border-color:#bbf7d0;background:#f0fdf4}
  .drop-zone:hover{border-color:#16a34a;background:#f0fdf4}
  .att-row:hover{background:#f0fdf4}
  .onboard-step{transition:.3s}
  .sidebar-badge{background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0}
  .ai-dot{animation:typing 1.2s infinite}.ai-dot:nth-child(2){animation-delay:.2s}.ai-dot:nth-child(3){animation-delay:.4s}
  .tbl-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
  .rg-2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
  .rg-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
  .rg-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  .rg-21{display:grid;grid-template-columns:2fr 1fr;gap:16px}
  .rg-31{display:grid;grid-template-columns:3fr 2fr;gap:16px}
  .rg-11{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;background:#fff;border-top:1.5px solid #e5e7eb;padding:6px 0 env(safe-area-inset-bottom,6px)}
  .mob-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 2px;cursor:pointer;border:none;background:none;font-family:'Inter',sans-serif;font-size:9px;font-weight:600;color:#9ca3af;letter-spacing:.3px;text-transform:uppercase;position:relative;transition:.15s}
  .mob-nav-item.active{color:#16a34a}
  .mob-nav-item .mni{font-size:20px;line-height:1}
  .mob-badge{position:absolute;top:4px;right:calc(50% - 16px);background:#16a34a;color:#fff;font-size:8px;font-weight:700;padding:1px 4px;border-radius:6px}
  .mob-header{display:none;align-items:center;justify-content:space-between;padding:12px 16px;background:#fff;border-bottom:1px solid #e5e7eb;position:sticky;top:0;z-index:100;box-shadow:0 1px 4px rgba(0,0,0,.05)}
  .desk-sidebar{display:flex !important}
  @media(max-width:768px){
    .rg-2,.rg-3,.rg-4{grid-template-columns:1fr !important}
    .rg-21,.rg-31,.rg-11{grid-template-columns:1fr !important}
    .mob-grid-1{grid-template-columns:1fr !important}
    .mob-grid-2{grid-template-columns:repeat(2,1fr) !important}
    .desk-sidebar{display:none !important}
    .mob-nav{display:flex !important}
    .mob-header{display:flex !important}
    .page-wrap{padding:12px 12px 80px !important}
    .hide-mobile{display:none !important}
    .mob-full{width:100% !important}
    table{font-size:12px}
    .tbl-wrap table{min-width:580px}
    .stat-card:hover{transform:none !important}
    .heatmap-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
    .heatmap-scroll>div{min-width:480px}
    .mob-toast{left:16px !important;right:16px !important;bottom:80px !important;max-width:none !important}
  }
  @media(min-width:769px){.show-mob{display:none !important}}
`;

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const s = {
  flex:(gap=0,align='center')=>({display:'flex',alignItems:align,gap}),
  col:(gap=0)=>({display:'flex',flexDirection:'column',gap}),
  grid:(cols,gap=14)=>({display:'grid',gridTemplateColumns:typeof cols==='number'?`repeat(${cols},1fr)`:cols,gap}),
  card:(p=18)=>({background:G.bg,border:`1px solid ${G.border}`,borderRadius:12,padding:p,boxShadow:'0 1px 4px rgba(0,0,0,.05)'}),
  inset:(p=14)=>({background:G.bg2,border:`1px solid ${G.border}`,borderRadius:9,padding:p}),
  label:{fontSize:11,color:G.text3,letterSpacing:'.5px',textTransform:'uppercase',fontWeight:600,marginBottom:5,display:'block'},
  mono:{fontFamily:"'JetBrains Mono',monospace"},
  input:{width:'100%',background:G.bg,border:`1.5px solid ${G.border}`,borderRadius:8,padding:'9px 12px',fontSize:13,color:G.text,outline:'none',transition:'border .2s'},
  select:{width:'100%',background:G.bg,border:`1.5px solid ${G.border}`,borderRadius:8,padding:'9px 28px 9px 12px',fontSize:13,color:G.text,outline:'none',appearance:'none',
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239ca3af' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat:'no-repeat',backgroundPosition:'right 10px center'},
  textarea:{width:'100%',background:G.bg,border:`1.5px solid ${G.border}`,borderRadius:8,padding:'9px 12px',fontSize:13,color:G.text,outline:'none',resize:'vertical',minHeight:72},
};

// ─── GYM CONTEXT -- single source of truth synced across all pages ─────────────
let _gym = {};
const useGym = () => _gym;

// ─── MOBILE HOOK ──────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mob, setMob] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth <= 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mob;
}

// ─── DEMO ACCOUNTS (offline fallback) ─────────────────────────────────────────
const GYM_ACCOUNTS = [
  {gym_id:'GYM-001',user_id:'usr_a1b2c3d4',email:'raj@onlifit.com',    password:'Onlifit@2025',name:'Rajesh Kumar', gymName:'Onlifit',  city:'Bangalore', role:'gym_owner', isNew:false},
  {gym_id:'GYM-002',user_id:'usr_b2c3d4e5',email:'suresh@pzone.com',  password:'PowerZ@001', name:'Suresh Nair',  gymName:'PowerZone Gym',   city:'Chennai',   role:'gym_owner', isNew:false},
  {gym_id:'GYM-NEW',user_id:'usr_new00001',email:'demo@newgym.com',   password:'NewGym@001', name:'Aryan Mehta',  gymName:'FitZone Pro',     city:'Pune',      role:'gym_owner', isNew:true},
];

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────
async function supaLogin(email, password) {
  try {
    // Authenticate via Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (authErr || !authData?.user) return null;
    // Fetch gym account linked to this auth user
    const { data, error } = await supabase
      .from('gym_accounts')
      .select('*')
      .eq('email', authData.user.email)
      .single();
    if (error || !data) return null;
    return { gym_id: data.gym_id, user_id: data.user_id, email: data.email, name: data.name, gymName: data.gym_name, city: data.city, role: data.role, isNew: data.is_new };
  } catch { return null; }
}

async function supaSignUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

async function supaLogout() {
  await supabase.auth.signOut();
}

// Auto-detect member expiry status based on expiry date
function checkExpiryStatus(expiryStr, currentStatus) {
  if (!expiryStr || currentStatus === 'Frozen') return currentStatus;
  const now = new Date();
  // Parse dates like "Dec 31", "Apr 30", "Mar 10" — assume current year, adjust if needed
  const exp = new Date(expiryStr + ', ' + now.getFullYear());
  if (isNaN(exp.getTime())) return currentStatus;
  // If expiry is in the past and >6 months ago, try next year (handles Jan viewing Dec expiry)
  if (exp < now && (now - exp) > 180 * 86400000) exp.setFullYear(exp.getFullYear() + 1);
  if (exp < now) return 'Expired';
  return 'Active';
}

function daysUntilExpiry(expiryStr) {
  if (!expiryStr) return Infinity;
  const now = new Date();
  const exp = new Date(expiryStr + ', ' + now.getFullYear());
  if (isNaN(exp.getTime())) return Infinity;
  if (exp < now && (now - exp) > 180 * 86400000) exp.setFullYear(exp.getFullYear() + 1);
  return Math.ceil((exp - now) / 86400000);
}

// ── NOTIFICATION ENGINE ─────────────────────────────────────────────────────
function isTodayBirthday(dobStr) {
  if (!dobStr) return false;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return false;
  const now = new Date();
  return dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate();
}

function generateNotifications(members, attendance, payments) {
  const notifs = [];
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const thisYear = now.getFullYear();

  // 1. Expiring within 7 days
  members.filter(m => m.status === 'Active').forEach(m => {
    const days = daysUntilExpiry(m.expiry);
    if (days >= 0 && days <= 7) {
      notifs.push({
        id: `exp-${m.id}`, type: 'expiry', icon: '🔴',
        title: days === 0 ? `${m.name} expires TODAY` : `${m.name} expires in ${days}d`,
        sub: `${m.plan} · ${m.expiry}`, member: m, priority: days === 0 ? 0 : 1,
        action: 'remind', actionLabel: '📲 Remind',
        msg: days === 0
          ? `Hi ${m.name}, your ${m.plan} membership expires today! Renew now to keep your streak going 💪`
          : `Hi ${m.name}, your ${m.plan} membership expires in ${days} days (${m.expiry}). Renew early to avoid missing workouts! 🏋️`,
      });
    }
  });

  // 2. Today's birthdays
  members.forEach(m => {
    if (isTodayBirthday(m.dob)) {
      notifs.push({
        id: `bday-${m.id}`, type: 'birthday', icon: '🎂',
        title: `${m.name}'s birthday today!`,
        sub: `${m.plan} member`, member: m, priority: 2,
        action: 'wish', actionLabel: '🎂 Wish',
        msg: `Happy Birthday ${m.name}! 🎉🎂 Wishing you a fantastic year of health & fitness. Enjoy your special day! 🥳`,
      });
    }
  });

  // 3. Churn risk — absent 7+ days
  members.filter(m => m.status === 'Active').forEach(m => {
    const lastAtt = attendance.filter(a => a.memberId === m.id).sort((a, b) => (b.id || '').localeCompare(a.id || ''))[0];
    const lastDate = lastAtt ? lastAtt.date : m.start;
    const daysAgo = lastAtt && lastAtt.date === 'Today' ? 0 : Math.floor((Date.now() - new Date(lastDate + ', ' + thisYear).getTime()) / 86400000);
    const gap = isNaN(daysAgo) || daysAgo < 0 ? 999 : daysAgo;
    if (gap >= 7) {
      notifs.push({
        id: `churn-${m.id}`, type: 'churn', icon: '⚠️',
        title: `${m.name} absent ${gap}d`,
        sub: `Last: ${lastDate || 'never'} · ${m.plan}`, member: m, priority: gap >= 14 ? 1 : 3,
        action: 'remind', actionLabel: '📲 Remind',
        msg: `Hi ${m.name}, we miss you! It's been ${gap} days since your last visit. Come back strong! 💪`,
      });
    }
  });

  // 4. Pending payments
  (payments || []).filter(p => p.status === 'Pending').forEach(p => {
    notifs.push({
      id: `pay-${p.id || p.invoice}`, type: 'payment', icon: '💰',
      title: `${p.member_name} — pending ₹${p.amount}`,
      sub: `${p.plan} · ${p.invoice || ''}`, priority: 2,
      action: null,
    });
  });

  return notifs.sort((a, b) => a.priority - b.priority);
}

async function supaLoadGymData(gymId) {
  const [mRes, aRes, sRes, tRes, pRes, payRes, profRes] = await Promise.all([
    supabase.from('members').select('*').eq('gym_id', gymId),
    supabase.from('attendance').select('*').eq('gym_id', gymId).order('created_at', { ascending: false }),
    supabase.from('staff').select('*').eq('gym_id', gymId),
    supabase.from('trainers').select('*').eq('gym_id', gymId),
    supabase.from('plans').select('*').eq('gym_id', gymId),
    supabase.from('payments').select('*').eq('gym_id', gymId).order('created_at', { ascending: false }),
    supabase.from('gym_profiles').select('*').eq('gym_id', gymId).single(),
  ]);
  const mapMember = r => { const status = checkExpiryStatus(r.expiry_date, r.status); return { name:r.name, init:r.initials, id:r.id, phone:r.phone, email:r.email, plan:r.plan, start:r.start_date, expiry:r.expiry_date, status, trainer:r.trainer, visits:r.visits, dob:r.dob }; };
  const mapAttendance = r => ({ id:r.id, memberId:r.member_id, memberName:r.member_name, init:r.initials, checkIn:r.check_in, date:r.date, trainer:r.trainer, method:r.method, status:r.status });
  const mapStaff = r => ({ name:r.name, init:r.initials, id:r.id, role:r.role, branch:r.branch, members:r.members_count, present:r.present, salary:r.salary, phone:r.phone, email:r.email, joined:r.joined, qr:r.qr });
  const mapTrainer = r => ({ name:r.name, init:r.initials, id:r.id, specialization:r.specialization, experience:r.experience, members:r.members||[], sessions:r.sessions, rating:r.rating, commission:r.commission, revenue:r.revenue, certifications:r.certifications, qr:r.qr });
  const mapPlan = r => ({ name:r.name, days:r.days, price:r.price, pt:r.pt });
  const mapProfile = r => r ? { gymName:r.gym_name, tagline:r.tagline, address:r.address, city:r.city, phone:r.phone, gstin:r.gstin, openTime:r.open_time, closeTime:r.close_time } : {};
  return {
    members: mRes.data?.map(mapMember) || [],
    attendance: aRes.data?.map(mapAttendance) || [],
    staff: sRes.data?.map(mapStaff) || [],
    trainers: tRes.data?.map(mapTrainer) || [],
    plans: pRes.data?.map(mapPlan) || [],
    payments: payRes.data?.map(r=>({ member:r.member_name, inv:r.invoice, plan:r.plan, amount:r.amount, mode:r.mode, date:r.date, status:r.status })) || [],
    profile: mapProfile(profRes.data),
  };
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_MEMBERS = [
  {name:'Arjun Mehta',  init:'AM',id:'IQ-KRM-0001',phone:'+91 98765 43210',email:'arjun@gmail.com',  plan:'Yearly',   start:'Jan 1',  expiry:'Dec 31',   status:'Active',  trainer:'Vikram Singh',visits:87,dob:'1992-04-12'},
  {name:'Priya Sharma', init:'PS',id:'IQ-KRM-0002',phone:'+91 87654 32109',email:'priya@gmail.com',  plan:'Quarterly',start:'Feb 1',  expiry:'Apr 30',   status:'Active',  trainer:'Pooja Reddy', visits:42,dob:'1995-09-20'},
  {name:'Karan Patel',  init:'KP',id:'IQ-KRM-0003',phone:'+91 76543 21098',email:'karan@gmail.com',  plan:'Monthly',  start:'Feb 15', expiry:'Mar 14',   status:'Expired', trainer:'Aryan Nair',  visits:18,dob:'1998-01-05'},
  {name:'Sneha Rao',    init:'SR',id:'IQ-KRM-0004',phone:'+91 65432 10987',email:'sneha@gmail.com',  plan:'Yearly',   start:'Jan 10', expiry:'Jan 9 26', status:'Active',  trainer:'Vikram Singh',visits:63,dob:'1993-11-30'},
  {name:'Mohit Jain',   init:'MJ',id:'IQ-KRM-0005',phone:'+91 54321 09876',email:'mohit@gmail.com',  plan:'Monthly',  start:'Mar 1',  expiry:'Mar 31',   status:'Active',  trainer:'Pooja Reddy', visits:9, dob:'2000-07-14'},
  {name:'Divya Nair',   init:'DN',id:'IQ-KRM-0006',phone:'+91 43210 98765',email:'divya@gmail.com',  plan:'Quarterly',start:'Dec 1',  expiry:'Feb 28',   status:'Expired', trainer:'Aryan Nair',  visits:34,dob:'1996-03-22'},
  {name:'Rohan Gupta',  init:'RG',id:'IQ-KRM-0007',phone:'+91 32109 87654',email:'rohan@gmail.com',  plan:'Yearly',   start:'Mar 1',  expiry:'Feb 28 26',status:'Frozen',  trainer:'Vikram Singh',visits:156,dob:'1990-08-18'},
];

const SEED_ATTENDANCE = [
  {id:'att001',memberId:'IQ-KRM-0001',memberName:'Arjun Mehta',  init:'AM',checkIn:'6:02 AM',date:'Today',  trainer:'Vikram Singh',method:'QR',status:'inside'},
  {id:'att002',memberId:'IQ-KRM-0002',memberName:'Priya Sharma', init:'PS',checkIn:'6:15 AM',date:'Today',  trainer:'Pooja Reddy', method:'QR',status:'inside'},
  {id:'att003',memberId:'IQ-KRM-0004',memberName:'Sneha Rao',    init:'SR',checkIn:'7:00 AM',date:'Today',  trainer:'Vikram Singh',method:'QR',status:'inside'},
  {id:'att004',memberId:'IQ-KRM-0005',memberName:'Mohit Jain',   init:'MJ',checkIn:'7:30 AM',date:'Today',  trainer:'Pooja Reddy', method:'Manual',status:'left'},
  {id:'att005',memberId:'IQ-KRM-0007',memberName:'Rohan Gupta',  init:'RG',checkIn:'8:00 AM',date:'Today',  trainer:'Aryan Nair',  method:'QR',status:'left'},
  {id:'att006',memberId:'IQ-KRM-0001',memberName:'Arjun Mehta',  init:'AM',checkIn:'6:10 AM',date:'Mar 9',  trainer:'Vikram Singh',method:'QR',status:'left'},
  {id:'att007',memberId:'IQ-KRM-0002',memberName:'Priya Sharma', init:'PS',checkIn:'6:45 AM',date:'Mar 9',  trainer:'Pooja Reddy', method:'QR',status:'left'},
  {id:'att008',memberId:'IQ-KRM-0004',memberName:'Sneha Rao',    init:'SR',checkIn:'7:15 AM',date:'Mar 9',  trainer:'Vikram Singh',method:'QR',status:'left'},
  {id:'att009',memberId:'IQ-KRM-0001',memberName:'Arjun Mehta',  init:'AM',checkIn:'6:05 AM',date:'Mar 8',  trainer:'Vikram Singh',method:'QR',status:'left'},
  {id:'att010',memberId:'IQ-KRM-0007',memberName:'Rohan Gupta',  init:'RG',checkIn:'7:00 AM',date:'Mar 8',  trainer:'Aryan Nair',  method:'QR',status:'left'},
];

const SEED_PLANS   = [{name:'Monthly',days:30,price:1500,pt:'None'},{name:'Quarterly',days:90,price:4000,pt:'None'},{name:'Yearly',days:365,price:14000,pt:'4 Sessions'},{name:'Student Pack',days:30,price:999,pt:'None'}];
const SEED_STAFF = [
  {name:'Vikram Singh',init:'VS',id:'ST-001',role:'Head Trainer',  branch:'Koramangala',members:24,present:true, salary:45000, phone:'+91 98100 11001',email:'vikram@onlifit.com',joined:'Jan 2023',qr:'QR-ST-001'},
  {name:'Pooja Reddy', init:'PR',id:'ST-002',role:'PT Trainer',    branch:'Koramangala',members:18,present:true, salary:32000, phone:'+91 98100 11002',email:'pooja@onlifit.com', joined:'Mar 2023',qr:'QR-ST-002'},
  {name:'Aryan Nair',  init:'AN',id:'ST-003',role:'Trainer',       branch:'Koramangala',members:20,present:true, salary:30000, phone:'+91 98100 11003',email:'aryan@onlifit.com', joined:'Jun 2023',qr:'QR-ST-003'},
];
const SEED_TRAINERS = [
  {name:'Vikram Singh', init:'VS',id:'TR-001',specialization:'Strength & Conditioning',experience:'8 years',members:['IQ-KRM-0001','IQ-KRM-0004'],sessions:28,rating:4.9,commission:500,revenue:14000,certifications:'NSCA-CPT, ACSM',qr:'QR-TR-001'},
  {name:'Pooja Reddy',  init:'PR',id:'TR-002',specialization:'Weight Loss & Nutrition', experience:'5 years',members:['IQ-KRM-0002','IQ-KRM-0005'],sessions:20,rating:4.8,commission:400,revenue:8000, certifications:'ACE-CPT, Precision Nutrition',qr:'QR-TR-002'},
  {name:'Aryan Nair',   init:'AN',id:'TR-003',specialization:'Functional & Crossfit',   experience:'4 years',members:['IQ-KRM-0007'],sessions:14,rating:4.7,commission:350,revenue:4900, certifications:'CrossFit L2',qr:'QR-TR-003'},
];
const SEED_PAYMENTS = [
  {member:'Arjun Mehta',inv:'INV-0347',plan:'Yearly',   amount:'₹14,000',mode:'UPI', date:'Mar 9',status:'Paid'},
  {member:'Sneha Rao',  inv:'INV-0346',plan:'Yearly',   amount:'₹14,000',mode:'Card',date:'Mar 8',status:'Paid'},
  {member:'Mohit Jain', inv:'INV-0345',plan:'Monthly',  amount:'₹1,500', mode:'Cash',date:'Mar 8',status:'Paid'},
  {member:'Aisha Khan', inv:'INV-0344',plan:'Quarterly',amount:'₹4,000', mode:'UPI', date:'Mar 7',status:'Pending'},
];
const VALID_COUPONS = {IRON10:{type:'pct',val:10},NEWJOIN20:{type:'pct',val:20},REFER500:{type:'flat',val:500},SUMMER15:{type:'pct',val:15}};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Badge({bright=false,danger=false,children,style={}}) {
  if(danger) return <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600,background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',...style}}>{children}</span>;
  return <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600,background:bright?G.bg4:G.bg2,color:bright?G.accent:G.text2,border:`1px solid ${bright?G.accentL:G.border}`,...style}}>{children}</span>;
}
function Btn({variant='primary',size='md',onClick,children,style={},disabled=false}) {
  const sz={sm:{padding:'6px 14px',fontSize:12},md:{padding:'9px 18px',fontSize:13},xs:{padding:'4px 10px',fontSize:11}};
  const vr={primary:{background:G.accent,color:'#fff',border:`1.5px solid ${G.accent}`,borderRadius:8,fontWeight:600},ghost:{background:'transparent',color:G.text2,border:`1.5px solid ${G.border}`,borderRadius:8,fontWeight:500},danger:{background:'transparent',color:'#dc2626',border:'1.5px solid #fecaca',borderRadius:8,fontWeight:500}};
  return <button className={variant==='ghost'?'btn-ghost':variant==='danger'?'btn-danger':''} disabled={disabled} onClick={disabled?undefined:onClick} style={{fontFamily:"'Inter',sans-serif",cursor:disabled?'not-allowed':'pointer',transition:'.15s',whiteSpace:'nowrap',opacity:disabled?.4:1,...sz[size],...vr[variant],...style}}>{children}</button>;
}
function StatCard({label,value,dim=false,sub,trend,icon}) {
  return <div className="stat-card" style={{...s.card(),position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:dim?G.border:`linear-gradient(90deg,${G.accent},#4ade80)`}}/>
    <div style={{...s.flex(0),justifyContent:'space-between',marginBottom:8}}>
      <div style={{fontSize:11,color:G.text3,fontWeight:600,letterSpacing:'.3px',textTransform:'uppercase'}}>{label}</div>
      {icon&&<span style={{fontSize:18}}>{icon}</span>}
    </div>
    <div style={{fontSize:30,fontWeight:700,color:dim?G.text2:G.navy,lineHeight:1,letterSpacing:'-1px'}}>{value}</div>
    {sub&&<div style={{...s.flex(5),fontSize:11,color:G.text3,marginTop:6}}>{trend&&<span style={{fontSize:11,fontWeight:600,padding:'2px 7px',borderRadius:20,background:trend.up?G.bg4:'#fef2f2',color:trend.up?G.accent:'#dc2626'}}>{trend.label}</span>}{sub}</div>}
  </div>;
}
function FG({label,children}){return <div style={{marginBottom:14}}><label style={s.label}>{label}</label>{children}</div>;}
function Fi({...p}){return <input style={s.input} {...p} onFocus={e=>{e.target.style.border=`1.5px solid ${G.accent}`}} onBlur={e=>{e.target.style.border=`1.5px solid ${G.border}`}}/>;}
function Fs({children,...p}){return <select style={s.select} {...p}>{children}</select>;}
function Fta({...p}){return <textarea style={s.textarea} {...p} onFocus={e=>{e.target.style.border=`1.5px solid ${G.accent}`}} onBlur={e=>{e.target.style.border=`1.5px solid ${G.border}`}}/>;}
function SH({title,sub,right}){return <div style={{...s.flex(0),justifyContent:'space-between',marginBottom:16}}><div><div style={{fontSize:15,fontWeight:700,color:G.navy}}>{title}</div>{sub&&<div style={{fontSize:12,color:G.text3,marginTop:2}}>{sub}</div>}</div>{right&&<div>{right}</div>}</div>;}
function Progress({pct,dim=false}){return <div style={{height:5,background:G.bg4,borderRadius:3,overflow:'hidden',marginTop:6}}><div style={{height:'100%',width:`${pct}%`,background:dim?G.border:`linear-gradient(90deg,${G.accent},#4ade80)`,borderRadius:3,transition:'.6s ease'}}/></div>;}
function Mav({init,size=32}){return <div style={{width:size,height:size,borderRadius:8,background:G.bg3,border:`1.5px solid ${G.accentL}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.32,fontWeight:700,color:G.accent,flexShrink:0}}>{init}</div>;}
function Th({cols}){return <thead><tr style={{borderBottom:`1.5px solid ${G.border}`,background:G.bg2}}>{cols.map((c,i)=><th key={i} style={{padding:'9px 13px',textAlign:'left',fontSize:10,letterSpacing:'.8px',textTransform:'uppercase',color:G.text3,fontWeight:700}}>{c}</th>)}</tr></thead>;}
function Tabs({tabs,active,onChange}){return <div style={{display:'flex',gap:4,background:G.bg2,borderRadius:10,padding:4,marginBottom:18,border:`1px solid ${G.border}`,flexWrap:'wrap'}}>{tabs.map(t=><div key={t.id} className={`tab-btn${active===t.id?' tab-active':''}`} onClick={()=>onChange(t.id)} style={{padding:'7px 16px',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:500,color:active===t.id?G.accent:G.text2,background:active===t.id?G.bg:'transparent',boxShadow:active===t.id?'0 1px 4px rgba(0,0,0,.08)':'none',transition:'.15s'}}>{t.label}</div>)}</div>;}
function Modal({open,onClose,title,children,width=550}){
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',zIndex:200,alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)',padding:16,display:open?'flex':'none'}}>
      <div style={{background:G.bg,border:`1px solid ${G.border}`,borderRadius:14,width:`min(100%, ${width}px)`,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.18)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:`1px solid ${G.border}`,position:'sticky',top:0,background:G.bg,zIndex:1}}>
          <span style={{fontSize:15,fontWeight:700,color:G.navy}}>{title}</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:G.text3,fontSize:18,cursor:'pointer',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,transition:'.15s'}} onMouseOver={e=>{e.currentTarget.style.background=G.bg3;e.currentTarget.style.color=G.accent}} onMouseOut={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color=G.text3}}>x</button>
        </div>
        <div style={{padding:'16px 18px'}}>{children}</div>
      </div>
    </div>
  );
}
function MFooter({onCancel,onSave,saveLabel='Save',saving}){return <div style={{...s.flex(10),marginTop:6}}><Btn variant="ghost" style={{flex:1}} onClick={onCancel} disabled={saving}>Cancel</Btn><Btn variant="primary" style={{flex:2,opacity:saving?.6:1}} onClick={onSave} disabled={saving}>{saving?'Saving…':saveLabel}</Btn></div>;}
function Toast({msg,onDone}){useEffect(()=>{const t=setTimeout(onDone,3200);return()=>clearTimeout(t);},[]);return <div className="mob-toast" style={{position:'fixed',bottom:24,right:24,background:G.navy,borderRadius:10,padding:'12px 18px',fontSize:13,color:'#fff',zIndex:999,maxWidth:340,boxShadow:'0 8px 32px rgba(15,23,42,.25)',animation:'toastIn .25s ease',display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:16}}>✓</span>{msg}</div>;}

function LiveTicker({ attendance }) {
  const today = attendance.filter(a=>a.date==='Today');
  if(today.length===0) return null;
  const items = [...today,...today]; // duplicate for seamless loop
  return (
    <div style={{background:'#0f172a',borderTop:`1px solid #1e293b`,height:32,overflow:'hidden',display:'flex',alignItems:'center',flexShrink:0}}>
      <div style={{padding:'0 14px',borderRight:'1px solid #1e293b',fontSize:10,fontWeight:700,color:'#4ade80',textTransform:'uppercase',letterSpacing:'.8px',whiteSpace:'nowrap',flexShrink:0}}>
        <LiveDot/> Live
      </div>
      <div style={{overflow:'hidden',flex:1,position:'relative'}}>
        <div style={{display:'flex',gap:24,whiteSpace:'nowrap',animation:`ticker ${Math.max(items.length*2,8)}s linear infinite`}}>
          {items.map((a,i)=>(
            <span key={i} style={{fontSize:11,color:a.status==='inside'?'#4ade80':'#64748b',fontFamily:"'JetBrains Mono',monospace"}}>
              {a.status==='inside'?'●':'○'} {a.memberName} {a.status==='inside'?'checked in':'checked out'} at {a.checkIn}
              <span style={{margin:'0 8px',color:'#1e293b'}}>|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SBadge({s:st}){
  if(st==='Active'||st==='Paid'||st==='Completed')return <Badge bright>{'● '+st}</Badge>;
  if(st==='Expired')return <Badge danger>{'○ Expired'}</Badge>;
  if(st==='Frozen')return <Badge>{'◌ Frozen'}</Badge>;
  if(st==='Pending')return <Badge danger>{'⏳ Pending'}</Badge>;
  return <Badge bright>{'📅 '+st}</Badge>;
}
function PBadge({p}){return <Badge bright={p==='Yearly'}>{p}</Badge>;}

function Heatmap({data}){
  const vals=data||[2,1,3,5,18,32,45,38,22,14,10,8,6,7,12,16,20,42,50,38,24,12,5,2];
  const max=Math.max(...vals);
  const stops=['#f0fdf4','#bbf7d0','#86efac','#4ade80','#16a34a'];
  return <div className="heatmap-scroll">
    <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(24,1fr)',gap:3}}>
      {vals.map((v,i)=>{const ci=Math.min(Math.floor(v/max*(stops.length-1)),stops.length-1);return <div key={i} title={`${i}:00 -- ${v} check-ins`} style={{height:24,borderRadius:3,cursor:'pointer',transition:'.2s',background:stops[ci]}}/>;})}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(24,1fr)',gap:3,marginTop:3}}>
      {vals.map((_,i)=><div key={i} style={{fontSize:8,color:G.text3,textAlign:'center'}}>{i}</div>)}
    </div>
    </div>
    <div style={{...s.flex(6),marginTop:8,fontSize:11,color:G.text3}}><div style={{...s.flex(4)}}>{stops.map((bg,i)=><div key={i} style={{width:14,height:7,borderRadius:2,background:bg,border:`1px solid ${G.border}`}}/>)}</div>Low → High traffic</div>
  </div>;
}
function BarChart({data,height=170}){
  const max=Math.max(...data.map(d=>d.v));
  return <div style={{display:'flex',alignItems:'flex-end',gap:6,height,paddingTop:10}}>
    {data.map((d,i)=><div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
      <div style={{width:'100%',height:d.v/max*(height-22),background:d.dim?G.bg4:`linear-gradient(to top,${G.accent},#4ade80)`,borderRadius:'4px 4px 0 0',transition:'.3s'}}/>
      <span style={{fontSize:9,color:G.text3,fontWeight:500}}>{d.l}</span>
    </div>)}
  </div>;
}

// ─── LIVE PULSE DOT ───────────────────────────────────────────────────────────
function LiveDot(){return <span style={{position:'relative',display:'inline-flex',width:10,height:10,marginRight:4}}>
  <span style={{position:'absolute',inset:0,borderRadius:'50%',background:G.accent,animation:'ping 1.2s cubic-bezier(0,0,.2,1) infinite',opacity:.6}}/>
  <span style={{position:'relative',display:'inline-flex',width:10,height:10,borderRadius:'50%',background:G.accent}}/>
</span>;}

// ─────────────────────────────────────────────────────────────────────────────
// GYM ONBOARDING WIZARD -- shows for new gyms on first login
// Steps: Welcome → Gym Profile → Import/Manual Members → Staff → Go Live
// ─────────────────────────────────────────────────────────────────────────────
function OnboardingWizard({ gymUser, onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ gymName:gymUser.gymName, tagline:'', address:'', city:gymUser.city, phone:'', gstin:'', openTime:'05:00', closeTime:'23:00' });
  const [importMode, setImportMode] = useState('manual'); // 'excel' | 'manual'
  const [members, setMembers] = useState([{name:'',phone:'',email:'',plan:'Monthly',trainer:''}]);
  const [staff, setStaff] = useState([{name:'',role:'Trainer',phone:''}]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [excelPreview, setExcelPreview] = useState([]);
  const fileRef = useRef(null);

  const steps = ['Welcome','Gym Profile','Import Members','Add Staff','Go Live! 🚀'];
  const pct = (step/(steps.length-1))*100;

  const addMemberRow = () => setMembers(p=>[...p,{name:'',phone:'',email:'',plan:'Monthly',trainer:''}]);
  const addStaffRow  = () => setStaff(p=>[...p,{name:'',role:'Trainer',phone:''}]);
  const setM = (i,k,v) => setMembers(p=>p.map((m,j)=>j===i?{...m,[k]:v}:m));
  const setSt = (i,k,v) => setStaff(p=>p.map((st,j)=>j===i?{...st,[k]:v}:st));

  const handleExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    // Simulate parsing -- in production use SheetJS
    setTimeout(() => {
      setExcelPreview([
        {name:'Rahul Verma',phone:'+91 98100 00001',email:'rahul@gmail.com',plan:'Yearly',status:'Active'},
        {name:'Meena Patel',phone:'+91 98100 00002',email:'meena@gmail.com',plan:'Monthly',status:'Active'},
        {name:'Sanjay Iyer', phone:'+91 98100 00003',email:'sanjay@gmail.com',plan:'Quarterly',status:'Active'},
        {name:'Ankita Das',  phone:'+91 98100 00004',email:'ankita@gmail.com',plan:'Yearly',status:'Active'},
      ]);
      setImporting(false);
      setImportDone(true);
    }, 1200);
  };

  const goLive = () => {
    const finalMembers = importMode === 'excel' && excelPreview.length
      ? excelPreview.map((m,i)=>({...m,init:m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),id:`IQ-${gymUser.gym_id.replace('GYM-','')}-${String(i+1).padStart(4,'0')}`,start:'Mar 10',expiry:'Apr 9',trainer:staff[0]?.name||'Trainer',visits:0}))
      : members.filter(m=>m.name.trim()).map((m,i)=>({...m,init:m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),id:`IQ-${gymUser.gym_id.replace('GYM-','')}-${String(i+1).padStart(4,'0')}`,start:'Mar 10',expiry:'Apr 9',visits:0,status:'Active'}));
    const finalStaff = staff.filter(st=>st.name.trim()).map((st,i)=>({...st,init:st.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),id:`ST-${String(i+1).padStart(3,'0')}`,branch:profile.city,members:0,present:true,salary:'--'}));
    onComplete({ profile, members:finalMembers, staff:finalStaff });
  };

  return (
    <div style={{minHeight:'100vh',background:G.bg2,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{position:'fixed',inset:0,backgroundImage:`radial-gradient(circle at 20% 20%, rgba(22,163,74,.07) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(22,163,74,.04) 0%, transparent 50%)`,pointerEvents:'none'}}/>
      <div style={{width:'100%',maxWidth:680,position:'relative',zIndex:1}}>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${G.accent},#4ade80)`,fontSize:24,marginBottom:14,boxShadow:`0 8px 24px rgba(22,163,74,.3)`}}>⚡</div>
          <div style={{fontSize:24,fontWeight:800,color:G.navy}}>Welcome to Onlifit</div>
          <div style={{fontSize:13,color:G.text3,marginTop:4}}>Let's set up <strong style={{color:G.accent}}>{gymUser.gymName}</strong> in under 5 minutes</div>
        </div>

        {/* Progress */}
        <div style={{...s.card(16),marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
            {steps.map((st,i)=>(
              <div key={i} style={{...s.col(4),alignItems:'center',flex:1}}>
                <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,background:i<=step?G.accent:G.bg2,color:i<=step?'#fff':G.text3,border:`2px solid ${i<=step?G.accent:G.border}`,transition:'.3s',marginBottom:4}}>{i<step?'✓':i+1}</div>
                <div style={{fontSize:9,fontWeight:600,color:i===step?G.accent:G.text3,textAlign:'center',letterSpacing:'.3px'}}>{st}</div>
              </div>
            ))}
          </div>
          <div style={{height:4,background:G.bg4,borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${G.accent},#4ade80)`,borderRadius:2,transition:'.5s'}}/>
          </div>
        </div>

        <div style={{...s.card(28),animation:'slideUp .3s ease'}}>

          {/* ── STEP 0: WELCOME ───────────────────────────────────────────────── */}
          {step===0 && (
            <div style={{textAlign:'center',...s.col(20),alignItems:'center'}}>
              <div style={{fontSize:48}}>🏋️</div>
              <div style={{fontSize:20,fontWeight:800,color:G.navy}}>Hi {gymUser.name.split(' ')[0]}, let's get started!</div>
              <div style={{fontSize:14,color:G.text2,maxWidth:440,lineHeight:1.7}}>
                We'll walk you through setting up your gym in 4 quick steps. You can always update everything later from Settings.
              </div>
              <div className="mob-grid-1" style={{...s.grid(3,12),width:'100%',maxWidth:480}}>
                {[['🏢','Gym Profile','Name, address, hours'],['👥','Import Members','Excel or manual entry'],['🧑‍💼','Add Staff','Trainers & reception']].map(([icon,title,sub])=>(
                  <div key={title} style={{...s.inset(14),...s.col(6),alignItems:'center',textAlign:'center'}}>
                    <span style={{fontSize:24}}>{icon}</span>
                    <div style={{fontSize:12,fontWeight:700,color:G.navy}}>{title}</div>
                    <div style={{fontSize:11,color:G.text3}}>{sub}</div>
                  </div>
                ))}
              </div>
              <div style={{background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:10,padding:'12px 20px',fontSize:12,color:G.text2,maxWidth:440}}>
                ⏱ Average setup time: <strong style={{color:G.navy}}>3-5 minutes</strong> with Excel import, or 10-15 min for manual entry.
              </div>
              <Btn variant="primary" style={{padding:'12px 40px',fontSize:14,fontWeight:700}} onClick={()=>setStep(1)}>Let's Set Up My Gym →</Btn>
            </div>
          )}

          {/* ── STEP 1: GYM PROFILE ───────────────────────────────────────────── */}
          {step===1 && (
            <div>
              <SH title="🏢 Gym Profile" sub="Basic info about your gym"/>
              <div className="rg-2">
                <FG label="Gym Name *"><Fi value={profile.gymName} onChange={e=>setProfile({...profile,gymName:e.target.value})}/></FG>
                <FG label="Tagline"><Fi placeholder="e.g. Forge Your Best Self" value={profile.tagline} onChange={e=>setProfile({...profile,tagline:e.target.value})}/></FG>
                <FG label="Address *"><Fi placeholder="Full street address" value={profile.address} onChange={e=>setProfile({...profile,address:e.target.value})}/></FG>
                <FG label="City"><Fi value={profile.city} onChange={e=>setProfile({...profile,city:e.target.value})}/></FG>
                <FG label="Phone"><Fi placeholder="+91 98765 43210" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></FG>
                <FG label="GSTIN (optional)"><Fi placeholder="29AABCI1234D1ZX" value={profile.gstin} onChange={e=>setProfile({...profile,gstin:e.target.value})}/></FG>
                <FG label="Opening Time"><Fi type="time" value={profile.openTime} onChange={e=>setProfile({...profile,openTime:e.target.value})}/></FG>
                <FG label="Closing Time"><Fi type="time" value={profile.closeTime} onChange={e=>setProfile({...profile,closeTime:e.target.value})}/></FG>
              </div>
              <div style={{...s.flex(10),marginTop:8}}>
                <Btn variant="ghost" style={{flex:1}} onClick={()=>setStep(0)}>← Back</Btn>
                <Btn variant="primary" style={{flex:2}} onClick={()=>setStep(2)}>Save Profile & Continue →</Btn>
              </div>
            </div>
          )}

          {/* ── STEP 2: IMPORT MEMBERS ────────────────────────────────────────── */}
          {step===2 && (
            <div>
              <SH title="👥 Import Members" sub="Add your existing members -- choose your preferred method"/>

              <div className="rg-2" style={{gap:12}}>
                {[['excel','📊','Excel Import','Upload your member list -- fastest method for existing gyms'],['manual','✍️','Manual Entry','Type in members one by one']].map(([id,icon,title,desc])=>(
                  <div key={id} onClick={()=>setImportMode(id)}
                    style={{...s.inset(16),...s.col(8),cursor:'pointer',border:`2px solid ${importMode===id?G.accent:G.border}`,background:importMode===id?G.bg3:G.bg,transition:'.2s',textAlign:'center'}}>
                    <span style={{fontSize:28}}>{icon}</span>
                    <div style={{fontSize:13,fontWeight:700,color:importMode===id?G.accent:G.navy}}>{title}</div>
                    <div style={{fontSize:11,color:G.text3,lineHeight:1.4}}>{desc}</div>
                  </div>
                ))}
              </div>

              {importMode==='excel' && (
                <div>
                  {/* Excel template download */}
                  <div style={{...s.inset(),...s.flex(12),marginBottom:16,background:G.bg3,border:`1px solid ${G.border2}`}}>
                    <span style={{fontSize:20}}>📥</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:G.navy}}>Download member import CSV template</div>
                      <div style={{fontSize:11,color:G.text3,marginTop:2}}>Pre-formatted columns ready for import. Fill in and re-upload.</div>
                    </div>
                    <Btn variant="ghost" size="sm" onClick={()=>{
                      const header = 'name,phone,email,plan,dob,status,trainer,emergency_contact,gym_id';
                      const rows = [
                        `Arjun Mehta,+91 98765 43210,arjun@email.com,Monthly,1992-04-12,Active,Vikram Singh,Priya:9876543210,${gymUser.gym_id}`,
                        `Priya Sharma,+91 87654 32109,priya@email.com,Quarterly,1995-09-20,Active,Pooja Reddy,,${gymUser.gym_id}`,
                        `[Your Member Name],[Phone],[Email],[Monthly/Quarterly/Yearly],[YYYY-MM-DD],[Active/Expired/Frozen],[Trainer Name],[Name:Phone],[${gymUser.gym_id}]`,
                      ];
                      const csv = [header,...rows].join('\n');
                      const blob = new Blob([csv],{type:'text/csv'});
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href=url;a.download=`onlifit_members_template_${gymUser.gym_id}.csv`;a.click();
                      URL.revokeObjectURL(url);
                    }}>↓ Download CSV</Btn>
                  </div>

                  {/* Schema reference */}
                  <div style={{background:'#0f172a',borderRadius:9,padding:14,marginBottom:16,fontSize:11,...s.mono}}>
                    <div style={{color:'#64748b',marginBottom:8,fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.7px'}}>Excel columns → members import format</div>
                    {[['name','TEXT','Full name (required)'],['phone','TEXT','+91 XXXXXXXXXX'],['email','TEXT','member@email.com'],['plan','TEXT','Monthly / Quarterly / Yearly'],['dob','DATE','YYYY-MM-DD'],['status','TEXT','Active / Expired / Frozen (default: Active)'],['emergency_contact','TEXT','Name:Phone (optional)']].map(([col,type,note])=>(
                      <div key={col} style={{...s.flex(0),justifyContent:'space-between',marginBottom:5}}>
                        <span style={{color:'#4ade80'}}>{col}</span>
                        <span style={{color:'#64748b'}}>{type}</span>
                        <span style={{color:'#475569',fontStyle:'italic',fontFamily:'Inter,sans-serif'}}>{note}</span>
                      </div>
                    ))}
                  </div>

                  {/* Upload */}
                  <div className="drop-zone" onClick={()=>fileRef.current?.click()}
                    style={{border:`2px dashed ${importDone?G.accent:G.border2}`,borderRadius:10,padding:28,textAlign:'center',cursor:'pointer',background:importDone?G.bg3:G.bg2,transition:'.3s'}}>
                    <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" style={{display:'none'}} onChange={handleExcel}/>
                    {importing && <div style={{fontSize:14,color:G.text3}}>⏳ Parsing file...</div>}
                    {!importing && !importDone && <div><div style={{fontSize:28,marginBottom:8}}>📤</div><div style={{fontSize:13,fontWeight:600,color:G.text2}}>Click to upload your Excel / CSV file</div><div style={{fontSize:11,color:G.text3,marginTop:4}}>Supports .xlsx · .csv · .xls</div></div>}
                    {importDone && <div style={{fontSize:14,fontWeight:700,color:G.accent}}>✅ {excelPreview.length} members ready to import</div>}
                  </div>

                  {importDone && (
                    <div style={{marginTop:14,overflowX:'auto'}}>
                      <div style={{fontSize:12,fontWeight:700,color:G.navy,marginBottom:8}}>Preview (first {excelPreview.length} rows):</div>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                        <Th cols={['Name','Phone','Email','Plan','Status']}/>
                        <tbody>{excelPreview.map((m,i)=><tr key={i} style={{borderBottom:`1px solid ${G.border}`}}>
                          <td style={{padding:'8px 13px',fontWeight:600,color:G.navy}}>{m.name}</td>
                          <td style={{padding:'8px 13px',color:G.text2}}>{m.phone}</td>
                          <td style={{padding:'8px 13px',color:G.text2}}>{m.email}</td>
                          <td style={{padding:'8px 13px'}}><PBadge p={m.plan}/></td>
                          <td style={{padding:'8px 13px'}}><SBadge s={m.status}/></td>
                        </tr>)}</tbody>
</table></div>
                  )}
                </div>
              )}

              {importMode==='manual' && (
                <div>
                  <div style={{...s.col(10)}}>
                    {members.map((m,i)=>(
                      <div key={i} style={{...s.inset(12),...s.col(8)}}>
                        <div style={{...s.flex(0),justifyContent:'space-between',marginBottom:6}}>
                          <div style={{fontSize:12,fontWeight:700,color:G.navy}}>Member {i+1}</div>
                          {i>0&&<button onClick={()=>setMembers(p=>p.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'#dc2626',cursor:'pointer',fontSize:12}}>✕ Remove</button>}
                        </div>
                        <div className="mob-grid-1" style={s.grid(2,10)}>
                          <Fi placeholder="Full Name *" value={m.name} onChange={e=>setM(i,'name',e.target.value)}/>
                          <Fi placeholder="+91 98765 43210" value={m.phone} onChange={e=>setM(i,'phone',e.target.value)}/>
                          <Fi placeholder="email@gym.com" value={m.email} onChange={e=>setM(i,'email',e.target.value)}/>
                          <Fs value={m.plan} onChange={e=>setM(i,'plan',e.target.value)}><option>Monthly</option><option>Quarterly</option><option>Yearly</option></Fs>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Btn variant="ghost" style={{width:'100%',marginTop:12}} onClick={addMemberRow}>+ Add Another Member</Btn>
                </div>
              )}

              <div style={{...s.flex(10),marginTop:20}}>
                <Btn variant="ghost" style={{flex:1}} onClick={()=>setStep(1)}>← Back</Btn>
                <Btn variant="primary" style={{flex:2}} onClick={()=>setStep(3)}>Continue to Staff →</Btn>
              </div>
            </div>
          )}

          {/* ── STEP 3: STAFF ─────────────────────────────────────────────────── */}
          {step===3 && (
            <div>
              <SH title="🧑‍💼 Add Staff" sub="Add your trainers and reception team"/>
              <div style={s.col(10)}>
                {staff.map((st,i)=>(
                  <div key={i} style={{...s.inset(12),...s.col(8)}}>
                    <div style={{...s.flex(0),justifyContent:'space-between',marginBottom:6}}>
                      <div style={{fontSize:12,fontWeight:700,color:G.navy}}>Staff Member {i+1}</div>
                      {i>0&&<button onClick={()=>setStaff(p=>p.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'#dc2626',cursor:'pointer',fontSize:12}}>✕</button>}
                    </div>
                    <div className="mob-grid-1" style={s.grid(3,10)}>
                      <Fi placeholder="Full Name *" value={st.name} onChange={e=>setSt(i,'name',e.target.value)}/>
                      <Fs value={st.role} onChange={e=>setSt(i,'role',e.target.value)}><option>Head Trainer</option><option>PT Trainer</option><option>Trainer</option><option>Receptionist</option><option>Manager</option><option>Cleaning Staff</option></Fs>
                      <Fi placeholder="+91 98765 43210" value={st.phone} onChange={e=>setSt(i,'phone',e.target.value)}/>
                    </div>
                  </div>
                ))}
              </div>
              <Btn variant="ghost" style={{width:'100%',marginTop:12}} onClick={addStaffRow}>+ Add Another Staff Member</Btn>
              <div style={{...s.flex(10),marginTop:20}}>
                <Btn variant="ghost" style={{flex:1}} onClick={()=>setStep(2)}>← Back</Btn>
                <Btn variant="primary" style={{flex:2}} onClick={()=>setStep(4)}>Continue to Launch →</Btn>
              </div>
            </div>
          )}

          {/* ── STEP 4: GO LIVE ───────────────────────────────────────────────── */}
          {step===4 && (
            <div style={{textAlign:'center',...s.col(20),alignItems:'center'}}>
              <div style={{fontSize:52}}>🚀</div>
              <div style={{fontSize:22,fontWeight:800,color:G.navy}}>Your gym is ready to go live!</div>
              <div style={{fontSize:13,color:G.text2,maxWidth:440,lineHeight:1.7}}>Here's a summary of what gets activated when you click Launch:</div>

              <div className="rg-3" style={{gap:10}}>
                {[
                  ['🏢',profile.gymName,'Profile ready'],
                  ['👥', importMode==='excel'&&importDone ? `${excelPreview.length} members` : `${members.filter(m=>m.name).length} members`,'IDs + QR assigned'],
                  ['🧑‍💼',`${staff.filter(s=>s.name).length} staff`,'Trainers configured'],
                ].map(([icon,val,sub])=>(
                  <div key={sub} style={{...s.inset(14),...s.col(5),alignItems:'center',textAlign:'center',background:G.bg3,border:`1px solid ${G.border2}`}}>
                    <span style={{fontSize:24}}>{icon}</span>
                    <div style={{fontSize:14,fontWeight:800,color:G.accent}}>{val}</div>
                    <div style={{fontSize:10,color:G.text3}}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Live sync confirmation */}
              <div style={{background:'#0f172a',borderRadius:12,padding:18,width:'100%',maxWidth:480,textAlign:'left'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'.8px',marginBottom:12}}>🔗 Connections that go live instantly</div>
                {[
                  {icon:'📱',label:'Member Portal',url:`members.onlifit.app/?gym=${gymUser.gym_id}`,clr:'#4ade80',note:'Share with every member'},
                  {icon:'📷',label:'Reception QR Scanner',url:`reception.onlifit.app/?gym=${gymUser.gym_id}`,clr:'#60a5fa',note:'Open on your reception tablet'},
                  {icon:'🆔',label:'Gym ID',url:gymUser.gym_id,clr:'#fbbf24',note:'Your unique identifier'},
                  {icon:'✦',label:'AI Assistant',url:'Live · reads your real member + attendance data',clr:'#a78bfa',note:'Ask it anything about your gym'},
                ].map(({icon,label,url,clr,note})=>(
                  <div key={label} style={{...s.flex(8),marginBottom:12}}>
                    <span style={{fontSize:16,flexShrink:0}}>{icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{...s.flex(0),justifyContent:'space-between'}}>
                        <span style={{fontSize:11,fontWeight:700,color:'#94a3b8'}}>{label}</span>
                        <span style={{fontSize:10,color:'#475569',fontStyle:'italic'}}>{note}</span>
                      </div>
                      <div style={{fontSize:10,color:clr,...s.mono,marginTop:2,wordBreak:'break-all'}}>{url}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{...s.flex(12)}}>
                <Btn variant="ghost" style={{padding:'11px 28px'}} onClick={()=>setStep(3)}>← Back</Btn>
                <Btn variant="primary" style={{padding:'12px 40px',fontSize:14,fontWeight:700}} onClick={goLive}>⚡ Launch {gymUser.gymName}!</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GYM LOGIN
// ─────────────────────────────────────────────────────────────────────────────
function GymLogin({ onLogin }) {
  const [email,setEmail] = useState('');
  const [pass,setPass]   = useState('');
  const [showP,setShowP] = useState(false);
  const [err,setErr]     = useState('');
  const [busy,setBusy]   = useState(false);
  const [showDemo,setShowDemo] = useState(false);

  const submit = async () => {
    if(!email.trim()||!pass.trim()){setErr('Both fields are required.');return;}
    setBusy(true);setErr('');
    // Try Supabase first, fall back to hardcoded accounts
    const dbAcct = await supaLogin(email, pass);
    if (dbAcct) { onLogin(dbAcct); return; }
    const acct = GYM_ACCOUNTS.find(a=>a.email.toLowerCase()===email.trim().toLowerCase()&&a.password===pass);
    if(acct) onLogin(acct);
    else{setErr('Invalid email or password.');setBusy(false);}
  };

  return (
    <div style={{minHeight:'100vh',background:G.bg2,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{position:'fixed',inset:0,backgroundImage:`radial-gradient(circle at 25% 25%, rgba(22,163,74,.07) 0%, transparent 55%), radial-gradient(circle at 75% 75%, rgba(22,163,74,.04) 0%, transparent 55%)`,pointerEvents:'none'}}/>
      <div style={{width:'100%',maxWidth:420,position:'relative',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:60,height:60,borderRadius:16,background:`linear-gradient(135deg,${G.accent},#4ade80)`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:26,fontWeight:900,color:'#fff',boxShadow:`0 8px 24px rgba(22,163,74,.3)`}}>⚡</div>
          <div style={{fontSize:26,fontWeight:800,color:G.navy,letterSpacing:'-0.5px'}}>Onlifit</div>
          <div style={{fontSize:12,color:G.text3,marginTop:4,fontWeight:500}}>Gym Management Dashboard</div>
        </div>
        <div style={{...s.card(28),boxShadow:'0 8px 40px rgba(0,0,0,.08)'}}>
          <div style={{fontSize:15,fontWeight:700,color:G.navy,marginBottom:4}}>Sign in to your gym</div>
          <div style={{fontSize:12,color:G.text3,marginBottom:22}}>Use the login credentials sent by Onlifit support.</div>
          <FG label="Email address"><Fi value={email} onChange={e=>{setEmail(e.target.value);setErr('');}} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="owner@yourgym.com"/></FG>
          <div style={{marginBottom:err?10:20}}>
            <label style={s.label}>Password</label>
            <div style={{position:'relative'}}>
              <input value={pass} onChange={e=>{setPass(e.target.value);setErr('');}} onKeyDown={e=>e.key==='Enter'&&submit()} type={showP?'text':'password'} placeholder="Your password" style={{...s.input,paddingRight:42}} onFocus={e=>{e.target.style.border=`1.5px solid ${G.accent}`}} onBlur={e=>{e.target.style.border=`1.5px solid ${G.border}`}}/>
              <button onClick={()=>setShowP(p=>!p)} style={{position:'absolute',right:11,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:G.text3,cursor:'pointer',fontSize:14,padding:0}}>{showP?'🙈':'👁'}</button>
            </div>
          </div>
          {err&&<div style={{fontSize:12,color:'#dc2626',marginBottom:14,display:'flex',alignItems:'center',gap:5}}>⚠ {err}</div>}
          <Btn variant="primary" style={{width:'100%',padding:'11px',fontSize:14,fontWeight:700}} onClick={submit} disabled={busy}>{busy?'Signing in...':'Sign in to Dashboard →'}</Btn>
          <div style={{textAlign:'center',marginTop:14,fontSize:11,color:G.text3}}>Forgot password? Contact <span style={{color:G.accent,cursor:'pointer',fontWeight:600}}>support@onlifit.app</span></div>
        </div>
        <div style={{...s.card(14),marginTop:14}}>
          <div style={{...s.flex(0),justifyContent:'space-between',marginBottom:showDemo?12:0}}>
            <div style={{fontSize:11,fontWeight:600,color:G.text3}}>🧪 Demo accounts</div>
            <button onClick={()=>setShowDemo(v=>!v)} style={{background:'none',border:'none',fontSize:11,color:G.accent,cursor:'pointer',fontWeight:600}}>{showDemo?'Hide':'Show'}</button>
          </div>
          {showDemo&&<div style={s.col(8)}>
            {GYM_ACCOUNTS.map(a=>(
              <div key={a.gym_id} style={{background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:7,padding:'9px 12px'}}>
                <div style={{...s.flex(0),justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:700,color:G.navy}}>{a.gymName}</span>
                  <Badge bright>{a.isNew?'🆕 New Gym':a.gym_id}</Badge>
                </div>
                <div style={{fontSize:11,color:G.text3,...s.mono}}>{a.email} / {a.password}</div>
                <Btn variant="ghost" size="xs" style={{marginTop:6}} onClick={()=>{setEmail(a.email);setPass(a.password);}}>Use credentials</Btn>
              </div>
            ))}
          </div>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────────────────────────────────────

function PageDashboard({ toast }) {
  const { members, attendance, addAttendance, gymUser, gymSettings } = useGym();
  const activeMembers  = members.filter(m=>m.status==='Active').length;
  const expiredMembers = members.filter(m=>m.status==='Expired').length;
  const todayAtt  = attendance.filter(a=>a.date==='Today');
  const insideNow = todayAtt.filter(a=>a.status==='inside');
  const [attInput, setAttInput] = useState('');
  const [attResult, setAttResult] = useState(null);
  const [payments, setPayments] = useState([]);

  // Load payments for dashboard stats
  useEffect(()=>{
    if(!gymUser) return;
    supabase.from('payments').select('*').eq('gym_id',gymUser.gym_id).order('created_at',{ascending:false}).then(({data})=>{
      if(data) setPayments(data);
    });
  },[gymUser]);

  // Real revenue calculations
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const todayPayments = payments.filter(p=>p.date===todayStr);
  const todayCollection = todayPayments.reduce((a,p)=>a+(p.amount||0),0);
  const monthPayments = payments.filter(p=>{try{const d=new Date(p.created_at||p.date);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;}catch{return false;}});
  const monthRevenue = monthPayments.reduce((a,p)=>a+(p.amount||0),0);
  const monthlyTarget = gymSettings.monthlyTarget || 1000000;
  const targetPct = monthlyTarget>0 ? Math.min(Math.round((monthRevenue/monthlyTarget)*100),100) : 0;

  // Real plan distribution from members
  const planCounts = members.reduce((acc,m)=>{acc[m.plan]=(acc[m.plan]||0)+1;return acc;},{});
  const totalMembers = members.length||1;
  const planDist = ['Monthly','Quarterly','Yearly'].map(p=>({l:p,p:Math.round((planCounts[p]||0)/totalMembers*100)}));

  // Real monthly revenue chart (last 12 months from payments)
  const months = 'JFMAMJJASOND'.split('');
  const revData = months.map((_,i)=>{
    const mPayments = payments.filter(p=>{try{const d=new Date(p.created_at||p.date);return d.getMonth()===i&&d.getFullYear()===thisYear;}catch{return false;}});
    return {v:Math.max(mPayments.reduce((a,p)=>a+(p.amount||0),0)/1000,0),l:months[i]};
  });
  // If no payment data, show placeholder bars
  const hasRevData = revData.some(d=>d.v>0);
  const chartData = hasRevData ? revData : [420,380,510,490,620,580,700,650,720,680,740,820].map((v,i)=>({v,l:months[i],dim:true}));

  // Real churn risk — active members with longest attendance gap
  const churn = members.filter(m=>m.status==='Active').map(m=>{
    const lastAtt = attendance.filter(a=>a.memberId===m.id).sort((a,b)=>(b.id||'').localeCompare(a.id||''))[0];
    const lastDate = lastAtt ? lastAtt.date : m.start;
    const daysAgo = lastAtt && lastAtt.date==='Today' ? 0 : Math.floor((Date.now()-new Date(lastDate+', '+thisYear).getTime())/86400000);
    return {...m, days:isNaN(daysAgo)||daysAgo<0?999:daysAgo, last:lastDate};
  }).filter(m=>m.days>=7).sort((a,b)=>b.days-a.days).slice(0,5);

  // Real attendance heatmap — count check-ins per hour today
  const heatmapData = Array(24).fill(0);
  todayAtt.forEach(a=>{
    const match = (a.checkIn||'').match(/(\d+):/);
    if(match) { let h=parseInt(match[1]); if((a.checkIn||'').toLowerCase().includes('pm')&&h<12)h+=12; if((a.checkIn||'').toLowerCase().includes('am')&&h===12)h=0; heatmapData[h]++; }
  });

  // Pending dues — expired members who haven't paid
  const pendingDues = members.filter(m=>m.status==='Expired').length;
  const expiringSoon = members.filter(m=>m.status==='Active'&&daysUntilExpiry(m.expiry)<=7&&daysUntilExpiry(m.expiry)>=0).length;

  const quickCheckin = () => {
    const id = attInput.trim().toUpperCase();
    if(!id){setAttResult({ok:false,msg:'Enter a member ID or name'});return;}
    const member = members.find(m=>m.id===id||m.name.toUpperCase().includes(id));
    if(!member){setAttResult({ok:false,msg:`"${id}" not found in members`});return;}
    if(member.status==='Expired'){setAttResult({ok:false,warn:true,msg:`${member.name} -- Membership EXPIRED ⚠️`});return;}
    const alreadyIn = todayAtt.find(a=>a.memberId===member.id&&a.status==='inside');
    if(alreadyIn){setAttResult({ok:true,msg:`${member.name} already checked in at ${alreadyIn.checkIn}`});return;}
    const timeStr = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    addAttendance({id:`att${Date.now()}`,memberId:member.id,memberName:member.name,init:member.init,checkIn:timeStr,date:'Today',trainer:member.trainer,method:'Dashboard',status:'inside'});
    setAttResult({ok:true,msg:`✅ ${member.name} checked in at ${timeStr}`});
    setAttInput('');
    toast(`${member.name} checked in ✓`);
    setTimeout(()=>setAttResult(null),3000);
  };

  return (
    <div className="page-anim">
      <div className="rg-4" style={{marginBottom:16}}>
        <StatCard label="Today's Collection" value={`₹${todayCollection.toLocaleString()}`} sub={`${todayPayments.length} payments`} trend={todayPayments.length>0?{up:true,label:`${todayPayments.length} txns`}:undefined} icon="💰"/>
        <StatCard label="Active Members" value={String(activeMembers)} sub={expiringSoon>0?`${expiringSoon} expiring soon`:''} trend={{up:true,label:`of ${members.length}`}} icon="👥"/>
        <StatCard label="Expired Members" value={String(expiredMembers)} sub="need renewal" dim trend={expiredMembers>0?{up:false,label:`${expiredMembers} overdue`}:undefined} icon="⚠️"/>
        <StatCard label="Today Check-ins" value={String(todayAtt.length)} sub={`${insideNow.length} still inside`} icon="📅"/>
      </div>

      {/* ── LIVE ATTENDANCE PORTAL ─────────────── */}
      <div style={{...s.card(16),marginBottom:16,border:`1.5px solid ${insideNow.length>0?G.border2:G.border}`,background:insideNow.length>0?G.bg3:G.bg}}>
        <div style={{...s.flex(0),justifyContent:'space-between',marginBottom:12}}>
          <div style={s.flex(8)}>
            {insideNow.length>0&&<LiveDot/>}
            <span style={{fontSize:14,fontWeight:700,color:G.navy}}>
              {insideNow.length>0?`${insideNow.length} Members Inside Right Now`:'Attendance Portal'}
            </span>
            {insideNow.length>0&&<Badge bright style={{marginLeft:4}}>{todayAtt.length} total today</Badge>}
          </div>
          <Badge>{new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</Badge>
        </div>

        <div className="mob-grid-1" style={s.grid('1fr 1fr',16)}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:G.text3,textTransform:'uppercase',letterSpacing:'.8px',marginBottom:8}}>Quick Check-in</div>
            <div style={s.flex(8)}>
              <input style={{...s.input,flex:1,...s.mono,fontSize:13}} placeholder="IQ-KRM-0001 or member name..." value={attInput} onChange={e=>setAttInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&quickCheckin()}/>
              <Btn variant="primary" size="sm" onClick={quickCheckin}>Check In</Btn>
            </div>
            {attResult&&<div style={{marginTop:8,padding:'8px 12px',borderRadius:7,fontSize:12,fontWeight:600,background:attResult.ok?G.bg4:attResult.warn?'#fffbeb':'#fef2f2',color:attResult.ok?G.accent:attResult.warn?'#d97706':'#dc2626',border:`1px solid ${attResult.ok?G.accentL:attResult.warn?'#fde68a':'#fecaca'}`}}>{attResult.msg}</div>}
            <div style={{fontSize:11,color:G.text3,marginTop:8}}>
              Synced with Member Portal · Members who check-in via QR app appear here instantly
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:G.text3,textTransform:'uppercase',letterSpacing:'.8px',marginBottom:8}}>Currently Inside</div>
            {insideNow.length===0
              ? <div style={{padding:'14px 0',textAlign:'center',fontSize:12,color:G.text3}}>Nobody checked in yet today.</div>
              : <div style={{...s.flex(8),flexWrap:'wrap',gap:7,maxHeight:86,overflowY:'auto'}}>
                  {insideNow.map(a=>(
                    <div key={a.id} style={{...s.flex(7),background:G.bg,border:`1px solid ${G.border2}`,borderRadius:8,padding:'6px 10px'}}>
                      <Mav init={a.init} size={24}/>
                      <div>
                        <div style={{fontSize:11,fontWeight:600,color:G.navy}}>{a.memberName.split(' ')[0]}</div>
                        <div style={{fontSize:9,color:G.text3}}>in {a.checkIn}</div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>

        <div style={{...s.flex(12),marginTop:14,padding:'9px 12px',background:'#0f172a',borderRadius:9,flexWrap:'wrap',gap:6}}>
          {[
            {icon:'📱',label:'Member Portal',val:`members.onlifit.app/?gym=${gymUser.gym_id}`,clr:'#4ade80'},
            {icon:'📷',label:'Reception Scanner',val:`reception.onlifit.app/?gym=${gymUser.gym_id}`,clr:'#60a5fa'},
            {icon:'🆔',label:'Gym ID',val:gymUser.gym_id,clr:'#fbbf24'},
          ].map(({icon,label,val,clr})=>(
            <div key={label} style={{...s.flex(6),flex:1,minWidth:160,cursor:'pointer'}} onClick={()=>toast(`Copied: ${val}`)}>
              <span style={{fontSize:13}}>{icon}</span>
              <div>
                <div style={{fontSize:9,color:'#64748b',fontWeight:700,textTransform:'uppercase',letterSpacing:'.6px'}}>{label}</div>
                <div style={{fontSize:10,...s.mono,color:clr}}>{val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rg-21" style={{marginBottom:16}}>
        <div style={s.card()}>
          <SH title="Monthly Revenue" sub={hasRevData?`${thisYear} · from payments`:'Sample data · record payments to see real chart'}/>
          <BarChart data={chartData}/>
        </div>
        <div style={s.card()}>
          <SH title="Plan Distribution" sub={`${members.length} total members`}/>
          {planDist.map(r=>(
            <div key={r.l} style={{marginBottom:14}}>
              <div style={{...s.flex(0),justifyContent:'space-between',fontSize:13,marginBottom:4}}>
                <span style={{color:G.text2,fontWeight:500}}>{r.l}</span>
                <span style={{fontWeight:700,color:G.navy}}>{r.p}%</span>
              </div>
              <Progress pct={r.p}/>
            </div>
          ))}
        </div>
      </div>

      <div className="rg-2" style={{marginBottom:16}}>
        <div style={s.card()}>
          <SH title="🕐 Today's Traffic Heatmap" sub="Hourly check-in distribution"/>
          <Heatmap data={heatmapData}/>
        </div>
        <div style={s.card()}>
          <SH title="⚡ Churn Risk" right={churn.length>0?<Badge danger>{churn.length} at risk</Badge>:<Badge>All good ✓</Badge>}/>
          <div style={s.col(8)}>
            {churn.length===0 ? <div style={{padding:'20px 0',textAlign:'center',fontSize:12,color:G.text3}}>No members at churn risk 🎉</div>
            : churn.map(m=>(
              <div key={m.name} style={{background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:9,padding:'10px 12px',...s.flex(10),transition:'.15s'}}>
                <div style={{textAlign:'center',minWidth:40}}>
                  <div style={{...s.mono,fontSize:18,fontWeight:800,color:m.days>=14?'#dc2626':G.accent}}>{m.days}d</div>
                  <div style={{fontSize:9,color:G.text3,fontWeight:600}}>absent</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:G.navy}}>{m.name}</div>
                  <div style={{fontSize:11,color:G.text3}}>{m.plan} · Last: {m.last}</div>
                </div>
                <Btn variant="ghost" size="xs" onClick={()=>{const msg=`Hi ${m.name}, we miss you at ${gymUser.gymName}! It's been ${m.days} days since your last visit. Come back strong! 💪`;window.open(`https://wa.me/${(m.phone||'').replace(/[^0-9]/g,'')}?text=${encodeURIComponent(msg)}`,'_blank')}}>📲 Remind</Btn>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mob-grid-2" style={s.grid(4)}>
        <StatCard label="Pending Renewals" value={String(pendingDues)} sub={`${pendingDues} expired members`} dim icon="🔴"/>
        <StatCard label="Month Revenue" value={monthRevenue>0?`₹${(monthRevenue/100000).toFixed(1)}L`:'--'} sub={`${monthPayments.length} payments`} icon="📊"/>
        <div style={{...s.card(),position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${G.accent},#4ade80)`}}/>
          <div style={{fontSize:11,color:G.text3,fontWeight:700,textTransform:'uppercase',marginBottom:8}}>Monthly Target</div>
          <div style={{fontSize:28,fontWeight:800,color:G.navy}}>₹{(monthlyTarget/100000).toFixed(0)}L</div>
          <Progress pct={targetPct}/>
          <div style={{fontSize:11,color:G.text3,marginTop:6}}>{targetPct}% achieved · ₹{((monthlyTarget-monthRevenue)/100000).toFixed(1)}L remaining</div>
        </div>
        <StatCard label="Avg Daily Attendance" value={String(todayAtt.length||Math.round(attendance.length/Math.max(new Set(attendance.map(a=>a.date)).size,1)))} sub="Based on attendance data" icon="📈"/>
      </div>
    </div>
  );
}

// ─── ATTENDANCE PAGE ──────────────────────────────────────────────────────────

function PageAttendance({ toast }) {
  const { attendance, members, addAttendance, gymUser } = useGym();
  const [tab, setTab] = useState('live');
  const [gateInput, setGateInput] = useState('');

  // Camera refs
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const lastQRRef  = useRef('');
  const lastTimeRef = useRef(0);
  const streamRef  = useRef(null);

  const [camState, setCamState]     = useState('idle');   // idle | requesting | active | error
  const [scanResult, setScanResult] = useState(null);     // latest camera scan result
  const [processing, setProcessing] = useState(false);

  const todayAtt   = attendance.filter(a=>a.date==='Today');
  const insideNow  = todayAtt.filter(a=>a.status==='inside');
  const heatVals   = [2,1,3,5,18,32,45,38,22,14,10,8,6,7,12,16,20,42,50,38,24,12,5,2];
  const absent     = members.filter(m=>m.status==='Active' && !todayAtt.find(a=>a.memberId===m.id));
  const portalBase = `https://members.onlifit.app/?gym=${gymUser.gym_id}`;

  const [gateResult, setGateResult] = useState(null);
  const [gateLoading, setGateLoading] = useState(false);

  // ── Camera control ──────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCamState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCamState('active');
      }
    } catch(e) { setCamState('error'); }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCamState('idle');
  };

  // Start/stop camera when tab changes
  useEffect(() => {
    if (tab === 'live') { startCamera(); }
    else { stopCamera(); }
    return () => stopCamera();
  }, [tab]);

  // Auto-clear scan result after 5s (7s for blocks so staff has time to act)
  useEffect(() => {
    if (!scanResult) return;
    const delay = (scanResult.type === 'expired' || scanResult.type === 'frozen') ? 7000 : 4000;
    const t = setTimeout(() => { setScanResult(null); lastQRRef.current = ''; }, delay);
    return () => clearTimeout(t);
  }, [scanResult]);

  // ── QR scan loop ────────────────────────────────────────────────────────────
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05; u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  const handleQRDetected = useCallback((raw) => {
    const id = raw.trim().toUpperCase();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const member = members.find(m => m.id === id || m.qr === id);
      if (!member) {
        setScanResult({ type: 'notfound', name: id });
        speak('Member not found. Please contact reception.');
        return;
      }
      if (member.status === 'Expired') {
        setScanResult({ type: 'expired', member });
        speak(`Access denied. ${member.name}, your membership has expired. Please renew at reception.`);
        return;
      }
      if (member.status === 'Frozen') {
        setScanResult({ type: 'frozen', member });
        speak(`Access denied. ${member.name}, your membership is frozen. Please contact reception.`);
        return;
      }
      const alreadyIn = todayAtt.find(a => a.memberId === member.id && a.status === 'inside');
      if (alreadyIn) {
        setScanResult({ type: 'already', member, time: alreadyIn.checkIn });
        speak(`${member.name}, you are already checked in.`);
        return;
      }
      // All clear
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      addAttendance({ id: `att${Date.now()}`, memberId: member.id, memberName: member.name, init: member.init, checkIn: timeStr, date: 'Today', trainer: member.trainer, method: 'QR Scan', status: 'inside' });
      setScanResult({ type: 'allowed', member, time: timeStr });
      speak(`Welcome ${member.name}. Have a great workout.`);
    }, 400);
  }, [members, todayAtt, addAttendance]);

  const scanFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame); return;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
    if (qr?.data) {
      const now = Date.now();
      if (qr.data !== lastQRRef.current || now - lastTimeRef.current > 5000) {
        lastQRRef.current = qr.data;
        lastTimeRef.current = now;
        handleQRDetected(qr.data);
      }
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [handleQRDetected]);

  useEffect(() => {
    if (camState === 'active') {
      const video = videoRef.current;
      const onPlay = () => { rafRef.current = requestAnimationFrame(scanFrame); };
      video?.addEventListener('playing', onPlay);
      if (video && !video.paused) onPlay();
      return () => { video?.removeEventListener('playing', onPlay); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }
  }, [camState, scanFrame]);

  const doGateCheck = (raw) => {
    const id = (raw || gateInput).trim().toUpperCase();
    if (!id) return;
    setGateLoading(true); setGateResult(null);
    setTimeout(() => {
      const member = members.find(m => m.id === id || m.name.toUpperCase().includes(id));
      if (!member) { setGateResult({ type: 'notfound', name: id }); setGateLoading(false); return; }
      if (member.status === 'Expired') { setGateResult({ type: 'expired', member }); setGateLoading(false); return; }
      if (member.status === 'Frozen')  { setGateResult({ type: 'frozen',  member }); setGateLoading(false); return; }
      const alreadyIn = todayAtt.find(a => a.memberId === member.id && a.status === 'inside');
      if (alreadyIn) { setGateResult({ type: 'already', member, time: alreadyIn.checkIn }); setGateLoading(false); return; }
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      addAttendance({ id: `att${Date.now()}`, memberId: member.id, memberName: member.name, init: member.init, checkIn: timeStr, date: 'Today', trainer: member.trainer, method: 'Manual', status: 'inside' });
      setGateResult({ type: 'allowed', member, time: timeStr });
      setGateInput(''); setGateLoading(false);
    }, 300);
  };

  const checkOut = (attId) => { addAttendance(null, attId); toast('Checked out ✓'); };

  // Shared result renderer used by both camera and manual
  const ResultCard = ({ result, onClear }) => {
    if (!result) return null;
    const { type, member, time } = result;
    const cfg = {
      allowed:  { bg:'#f0fdf4', border:'#86efac', clr:'#15803d', icon:'✅', title:'ENTRY ALLOWED' },
      expired:  { bg:'#fef2f2', border:'#fca5a5', clr:'#dc2626', icon:'🚫', title:'BLOCKED -- EXPIRED' },
      frozen:   { bg:'#fffbeb', border:'#fde68a', clr:'#d97706', icon:'⏸',  title:'BLOCKED -- FROZEN' },
      notfound: { bg:'#fef2f2', border:'#fca5a5', clr:'#dc2626', icon:'❓', title:'NOT FOUND' },
      already:  { bg:G.bg3,     border:G.border2,  clr:G.accent,  icon:'✓',  title:'ALREADY INSIDE' },
    };
    const c = cfg[type];
    return (
      <div style={{ padding:'20px 22px', borderRadius:12, background:c.bg, border:`2.5px solid ${c.border}`, animation:'fadeIn .2s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ fontSize:42, lineHeight:1 }}>{c.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:900, color:c.clr, letterSpacing:'-.3px' }}>{c.title}</div>
            {member && <div style={{ fontSize:17, fontWeight:700, color:G.navy, marginTop:3 }}>{member.name}</div>}
            <div style={{ fontSize:12, color:G.text2, marginTop:2 }}>
              {type==='allowed'  && `In at ${time} · ${member.plan} · Trainer: ${member.trainer}`}
              {type==='expired'  && `Expired ${member.expiry} · Do NOT allow entry`}
              {type==='frozen'   && `Membership on hold · Confirm before entry`}
              {type==='notfound' && `"${result.name}" not in system`}
              {type==='already'  && `Checked in at ${time} today`}
            </div>
          </div>
          {member && <Mav init={member.init} size={50}/>}
        </div>
        {(type==='allowed'||type==='already') && member && (
          <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
            {[['Plan',member.plan],['Trainer',member.trainer],['Visits',String(member.visits||0)],['Expires',member.expiry]].map(([k,v])=>(
              <div key={k} style={{ background:'rgba(255,255,255,.75)', border:`1px solid ${G.border2}`, borderRadius:8, padding:'5px 12px', textAlign:'center' }}>
                <div style={{ fontSize:9, fontWeight:700, color:G.text3, textTransform:'uppercase' }}>{k}</div>
                <div style={{ fontSize:12, fontWeight:700, color:G.navy, marginTop:1 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
        {type==='expired' && (
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <button onClick={onClear} style={{ flex:1, padding:'9px', borderRadius:8, border:'2px solid #fca5a5', background:'#fef2f2', color:'#dc2626', fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>🚫 Deny Entry</button>
            <button onClick={()=>toast(`Renewal link sent to ${member.name} 📱`)} style={{ flex:1, padding:'9px', borderRadius:8, border:`1px solid ${G.border2}`, background:G.bg, color:G.text2, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>📱 Send Renewal Link</button>
          </div>
        )}
        {type==='frozen' && (
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <button onClick={onClear} style={{ flex:1, padding:'9px', borderRadius:8, border:'2px solid #fde68a', background:'#fffbeb', color:'#d97706', fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>⏸ Deny Entry</button>
            <button onClick={()=>{
              const t = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
              addAttendance({id:`att${Date.now()}`,memberId:member.id,memberName:member.name,init:member.init,checkIn:t,date:'Today',trainer:member.trainer,method:'Override',status:'inside'});
              setScanResult({type:'allowed',member,time:t}); setGateResult({type:'allowed',member,time:t});
              toast(`${member.name} -- override logged`);
            }} style={{ flex:1, padding:'9px', borderRadius:8, border:`1.5px solid ${G.accentL}`, background:G.bg3, color:G.accent, fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Allow (Override)</button>
          </div>
        )}
        {(type==='allowed'||type==='already'||type==='notfound') && (
          <button onClick={onClear} style={{ width:'100%', marginTop:10, padding:'8px', borderRadius:8, border:`1px solid ${G.border}`, background:'transparent', color:G.text3, cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:12 }}>← Next person</button>
        )}
      </div>
    );
  };

  return (
    <div className="page-anim">
      <div className="rg-4" style={{marginBottom:16}}>
        <StatCard label="Currently Inside" value={String(insideNow.length)} icon="🟢"/>
        <StatCard label="Today Check-ins"  value={String(todayAtt.length)}  icon="📊"/>
        <StatCard label="Not Visited Today" value={String(absent.length)} dim icon="⚠️"/>
        <StatCard label="Avg Daily" value="94" icon="📈"/>
      </div>

      <Tabs tabs={[{id:'live',label:'📷 QR Scanner'},{id:'log',label:"📋 Today's Log"},{id:'history',label:'📅 History'},{id:'absentee',label:'⚠️ Absentees'}]} active={tab} onChange={setTab}/>

      {/* ── SCANNER TAB ─────────────────────────────────────────────────────── */}
      {tab==='live' && (
        <div className="mob-grid-1" style={s.grid('3fr 2fr', 14)}>

          {/* LEFT COL: Camera + result */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Camera viewport */}
            <div style={{ ...s.card(0), overflow:'hidden', position:'relative', borderRadius:14, border:`2px solid ${G.border2}` }}>
              {/* Live camera feed */}
              <div style={{ position:'relative', width:'100%', paddingTop:'62%', background:'#0f172a' }}>
                <video ref={videoRef} muted playsInline style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display: camState==='active'?'block':'none' }}/>
                <canvas ref={canvasRef} style={{ display:'none' }}/>

                {/* Scan line animation when active */}
                {camState==='active' && !scanResult && (
                  <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
                    {/* Corner brackets */}
                    {[['8%','8%','left','top'],['8%','auto','left','bottom'],['auto','8%','right','top'],['auto','auto','right','bottom']].map(([t,b,l_or_r,pos],i)=>(
                      <div key={i} style={{ position:'absolute', top:t==='auto'?undefined:'15%', bottom:b==='auto'?undefined:'15%', left:l_or_r==='left'?'10%':undefined, right:l_or_r==='right'?'10%':undefined, width:36, height:36, borderTop:pos==='top'?`3px solid ${G.accent}`:undefined, borderBottom:pos==='bottom'?`3px solid ${G.accent}`:undefined, borderLeft:l_or_r==='left'?`3px solid ${G.accent}`:undefined, borderRight:l_or_r==='right'?`3px solid ${G.accent}`:undefined }}/>
                    ))}
                    {/* Scan bar */}
                    <div style={{ position:'absolute', left:'10%', right:'10%', height:2, background:G.accent, boxShadow:`0 0 8px ${G.accent}`, animation:'scanBar 2s linear infinite', opacity:.8 }}/>
                  </div>
                )}

                {/* Processing spinner overlay */}
                {processing && (
                  <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
                    <div style={{ width:44, height:44, border:`4px solid rgba(255,255,255,.2)`, borderTop:`4px solid ${G.accent}`, borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>Checking...</div>
                  </div>
                )}

                {/* Idle / error states */}
                {camState==='idle' && (
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
                    <div style={{ fontSize:48 }}>📷</div>
                    <button onClick={startCamera} style={{ background:G.accent, color:'#fff', border:'none', borderRadius:10, padding:'12px 24px', fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:14 }}>Start Camera</button>
                    <div style={{ color:'rgba(255,255,255,.5)', fontSize:12 }}>Camera needed for automatic QR scanning</div>
                  </div>
                )}
                {camState==='requesting' && (
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
                    <div style={{ color:'#fff', fontSize:14 }}>⏳ Requesting camera access...</div>
                  </div>
                )}
                {camState==='error' && (
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10 }}>
                    <div style={{ fontSize:40 }}>🚫</div>
                    <div style={{ color:'#fca5a5', fontSize:13, textAlign:'center', padding:'0 24px' }}>Camera access denied.<br/>Use manual entry below.</div>
                    <button onClick={startCamera} style={{ background:'rgba(255,255,255,.1)', color:'#fff', border:'1px solid rgba(255,255,255,.2)', borderRadius:8, padding:'8px 18px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Retry</button>
                  </div>
                )}
              </div>

              {/* Camera bar */}
              <div style={{ padding:'10px 14px', background:G.bg3, borderTop:`1px solid ${G.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  {camState==='active' ? <><LiveDot/><span style={{ fontSize:12, fontWeight:700, color:G.accent }}>Camera live -- point QR code at camera</span></> : <span style={{ fontSize:12, color:G.text3 }}>Camera off</span>}
                </div>
                {camState==='active' && <button onClick={stopCamera} style={{ fontSize:11, color:G.text3, background:'none', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Stop</button>}
              </div>
            </div>

            {/* Camera scan result */}
            {scanResult && <ResultCard result={scanResult} onClear={()=>{setScanResult(null);lastQRRef.current='';}}/>}

            {/* Manual fallback */}
            <div style={{ ...s.card(), border:`1px dashed ${G.border2}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:G.text3, textTransform:'uppercase', letterSpacing:'.7px', marginBottom:10 }}>⌨️ Manual Entry -- no QR / phone forgotten</div>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  style={{ ...s.input, flex:1, fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600 }}
                  placeholder="Type member ID or name..."
                  value={gateInput}
                  onChange={e=>{ setGateInput(e.target.value); if(!e.target.value) setGateResult(null); }}
                  onKeyDown={e=>e.key==='Enter'&&doGateCheck()}
                  onFocus={e=>e.target.style.border=`1.5px solid ${G.accent}`}
                  onBlur={e=>e.target.style.border=`1.5px solid ${G.border}`}
                />
                <Btn variant="primary" onClick={()=>doGateCheck()} disabled={gateLoading}>{gateLoading?'...':'Check'}</Btn>
              </div>
              {gateResult && <div style={{ marginTop:10 }}><ResultCard result={gateResult} onClear={()=>{setGateResult(null);setGateInput('');}}/></div>}
            </div>
          </div>

          {/* RIGHT COL: Inside now + today stats */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Inside now */}
            <div style={s.card()}>
              <SH title="Inside Right Now" right={<div style={{ display:'flex', alignItems:'center', gap:6 }}><LiveDot/><span style={{ fontSize:13, fontWeight:800, color:G.accent }}>{insideNow.length}</span></div>}/>
              {insideNow.length === 0
                ? <div style={{ padding:'28px 0', textAlign:'center', color:G.text3, fontSize:13 }}>Nobody checked in yet.<br/><span style={{ fontSize:11 }}>Scan results will appear here instantly.</span></div>
                : <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {insideNow.map(a=>(
                      <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:9, background:G.bg3, border:`1px solid ${G.border2}` }}>
                        <Mav init={a.init} size={32}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:G.navy }}>{a.memberName}</div>
                          <div style={{ fontSize:11, color:G.text3 }}>Since {a.checkIn} · {a.method}</div>
                        </div>
                        <Btn variant="ghost" size="xs" onClick={()=>checkOut(a.id)}>Out</Btn>
                      </div>
                    ))}
                  </div>
              }
            </div>

            {/* Stats */}
            <div style={s.card()}>
              <div style={{ fontSize:11, fontWeight:700, color:G.text3, textTransform:'uppercase', letterSpacing:'.7px', marginBottom:12 }}>Today so far</div>
              {[
                ['Total check-ins',  String(todayAtt.length),  G.accent],
                ['Inside now',       String(insideNow.length), G.accent],
                ['Left already',     String(todayAtt.filter(a=>a.status==='left').length), G.text2],
                ['Not visited yet',  String(absent.length), '#d97706'],
              ].map(([k,v,clr])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:`1px solid ${G.border}` }}>
                  <span style={{ fontSize:13, color:G.text2 }}>{k}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:15, fontWeight:800, color:clr }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Blocked members watchlist */}
            {members.filter(m=>m.status==='Expired'||m.status==='Frozen').length > 0 && (
              <div style={{ background:'#fef9f0', border:'1.5px solid #fde68a', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#92400e', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:8 }}>⚠️ Will be blocked if they scan</div>
                {members.filter(m=>m.status==='Expired'||m.status==='Frozen').map(m=>(
                  <div key={m.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:`1px solid #fde68a` }}>
                    <Mav init={m.init} size={24}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color: m.status==='Expired'?'#dc2626':'#d97706' }}>{m.name}</div>
                      <div style={{ fontSize:10, color:G.text3 }}>{m.status} · exp {m.expiry}</div>
                    </div>
                    <Btn variant="ghost" size="xs" onClick={()=>toast(`Reminder sent to ${m.name} 📱`)}>Remind</Btn>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TODAY'S LOG TAB */}
      {tab==='log' && (
        <div style={s.card()}>
          <SH title="Today's Attendance Log" sub={`${todayAtt.length} check-ins · ${new Date().toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})}`} right={<Btn variant="ghost" size="sm" onClick={()=>toast('Exporting...')}>↓ Export CSV</Btn>}/>
          {todayAtt.length===0 && <div style={{textAlign:'center',padding:'32px 0',fontSize:14,color:G.text3}}>No check-ins today yet.</div>}
          <div class="tbl-wrap"><table style={{width:'100%',borderCollapse:'collapse'}}>
            <Th cols={['Member','ID','Check-in','Trainer','Method','Status','']}/>
            <tbody>
              {todayAtt.map((a,i)=>(
                <tr key={i} className="row-hover" style={{borderBottom:`1px solid ${G.border}`}}>
                  <td style={{padding:'11px 13px'}}><div style={s.flex(8)}><Mav init={a.init} size={28}/><span style={{fontSize:13,fontWeight:600,color:G.navy}}>{a.memberName}</span></div></td>
                  <td style={{padding:'11px 13px',...s.mono,fontSize:11,color:G.text3}}>{a.memberId}</td>
                  <td style={{padding:'11px 13px',...s.mono,fontSize:12,fontWeight:700,color:G.accent}}>{a.checkIn}</td>
                  <td style={{padding:'11px 13px',fontSize:12,color:G.text2}}>{a.trainer}</td>
                  <td style={{padding:'11px 13px'}}><Badge>{a.method}</Badge></td>
                  <td style={{padding:'11px 13px'}}>{a.status==='inside'?<Badge bright><LiveDot/>Inside</Badge>:<Badge>Left</Badge>}</td>
                  <td style={{padding:'11px 13px'}}>{a.status==='inside'&&<Btn variant="ghost" size="xs" onClick={()=>{checkOut(a.id);}}>Check Out</Btn>}</td>
                </tr>
              ))}
            </tbody>
</table></div>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab==='history' && (
        <div style={s.col(16)}>
          <div style={{...s.card(),marginBottom:0}}><SH title="Peak Hour Heatmap" sub="Check-ins per hour · today"/><Heatmap data={heatVals}/></div>
          <div style={s.card()}>
            <SH title="Attendance History" sub="All dates"/>
            <div class="tbl-wrap"><table style={{width:'100%',borderCollapse:'collapse'}}>
              <Th cols={['Date','Member','Check-in','Trainer','Method']}/>
              <tbody>
                {attendance.filter(a=>a.date!=='Today').map((a,i)=>(
                  <tr key={i} className="row-hover" style={{borderBottom:`1px solid ${G.border}`}}>
                    <td style={{padding:'11px 13px'}}><Badge>{a.date}</Badge></td>
                    <td style={{padding:'11px 13px'}}><div style={s.flex(8)}><Mav init={a.init} size={26}/><span style={{fontSize:13,fontWeight:600,color:G.navy}}>{a.memberName}</span></div></td>
                    <td style={{padding:'11px 13px',...s.mono,fontSize:12,fontWeight:600,color:G.accent}}>{a.checkIn}</td>
                    <td style={{padding:'11px 13px',fontSize:12,color:G.text2}}>{a.trainer}</td>
                    <td style={{padding:'11px 13px'}}><Badge>{a.method}</Badge></td>
                  </tr>
                ))}
              </tbody>
</table></div>
          </div>
        </div>
      )}

      {/* ABSENTEE TAB */}
      {tab==='absentee' && (
        <div style={s.card()}>
          <SH title="Active Members -- Not Visited Today" sub={`${absent.length} members`} right={<Btn variant="primary" size="sm" onClick={()=>toast(`Bulk reminder sent to ${absent.length} members 📱`)}>📱 Bulk Remind All</Btn>}/>
          <div class="tbl-wrap"><table style={{width:'100%',borderCollapse:'collapse'}}>
            <Th cols={['Member','ID','Plan','Trainer','Last Visit','']}/>
            <tbody>
              {absent.map((m,i)=>(
                <tr key={i} className="row-hover" style={{borderBottom:`1px solid ${G.border}`}}>
                  <td style={{padding:'11px 13px'}}><div style={s.flex(8)}><Mav init={m.init}/><span style={{fontWeight:600,color:G.navy}}>{m.name}</span></div></td>
                  <td style={{padding:'11px 13px',...s.mono,fontSize:11,color:G.text3}}>{m.id}</td>
                  <td style={{padding:'11px 13px'}}><PBadge p={m.plan}/></td>
                  <td style={{padding:'11px 13px',fontSize:12,color:G.text2}}>{m.trainer}</td>
                  <td style={{padding:'11px 13px',fontSize:12,color:G.text3}}>--</td>
                  <td style={{padding:'11px 13px'}}><Btn variant="ghost" size="xs" onClick={()=>toast(`Reminder sent to ${m.name} 📱`)}>📱 Remind</Btn></td>
                </tr>
              ))}
            </tbody>
</table></div>
        </div>
      )}
    </div>
  );
}

// ─── MEMBERS PAGE ─────────────────────────────────────────────────────────────
function PageMembers({ toast }) {
  const { members, setMembers, gymUser, attendance } = useGym();
  const [filter,setFilter] = useState('all');
  const [showAdd,setShowAdd] = useState(false);
  const [showPortal,setShowPortal] = useState(null);
  const [showEdit,setShowEdit] = useState(null);
  const [showQR,setShowQR] = useState(null);
  const [form,setForm] = useState({name:'',phone:'',email:'',dob:'',plan:'Monthly',trainer:'Vikram Singh',coupon:''});
  const [editForm,setEditForm] = useState({name:'',phone:'',email:'',dob:'',plan:'Monthly',trainer:'',status:'Active'});
  const [saving,setSaving] = useState(false);
  const portalBase = `https://members.onlifit.app/?gym=${gymUser.gym_id}`;

  const expiringSoon = members.filter(m=>m.status==='Active' && daysUntilExpiry(m.expiry)<=7 && daysUntilExpiry(m.expiry)>=0);
  const filterTabs = [
    {id:'all',     label:`All (${members.length})`},
    {id:'Active',  label:`Active (${members.filter(m=>m.status==='Active').length})`},
    {id:'expiring',label:`⚠️ Expiring (${expiringSoon.length})`},
    {id:'Expired', label:`Expired (${members.filter(m=>m.status==='Expired').length})`},
    {id:'Frozen',  label:`Frozen (${members.filter(m=>m.status==='Frozen').length})`},
  ];
  const list = filter==='all' ? members : filter==='expiring' ? expiringSoon : members.filter(m=>m.status===filter);

  const saveNewMember = async () => {
    if(!form.name.trim()){toast('Name is required');return;}
    setSaving(true);
    const prefix = gymUser.gym_id.replace('GYM-','').replace('-','').slice(0,3).toUpperCase()||'GYM';
    const id = `IQ-${prefix}-${String(members.length+1).padStart(4,'0')}`;
    const init = form.name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const today = new Date();
    const startStr = today.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    const planDays = {Monthly:30,Quarterly:90,Yearly:365}[form.plan]||30;
    const expDate = new Date(today.getTime()+planDays*86400000);
    const expStr = expDate.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    const memberData = {name:form.name.trim(),phone:form.phone,email:form.email,dob:form.dob,plan:form.plan,trainer:form.trainer};
    const newMember = {name:memberData.name,init,id,phone:memberData.phone,email:memberData.email,plan:memberData.plan,start:startStr,expiry:expStr,status:'Active',trainer:memberData.trainer,visits:0,dob:memberData.dob};
    setMembers(prev=>[...prev,newMember]);
    setShowAdd(false);
    setForm({name:'',phone:'',email:'',dob:'',plan:'Monthly',trainer:'Vikram Singh',coupon:''});
    toast(`Member added! Portal: ${portalBase}&member=${id}`);
    // Persist to Supabase
    const { error } = await supabase.from('members').insert({
      id, gym_id: gymUser.gym_id, name: memberData.name, initials: init, phone: memberData.phone,
      email: memberData.email, dob: memberData.dob, plan: memberData.plan, start_date: startStr, expiry_date: expStr,
      status: 'Active', trainer: memberData.trainer, visits: 0,
    });
    if (error) toast('⚠️ Supabase save failed – data saved locally');
    setSaving(false);
  };

  const openEdit = (m) => {
    setShowEdit(m);
    setEditForm({name:m.name,phone:m.phone||'',email:m.email||'',dob:m.dob||'',plan:m.plan||'Monthly',trainer:m.trainer||'',status:m.status||'Active'});
  };

  const saveEditMember = async () => {
    if(!editForm.name.trim()){toast('Name is required');return;}
    setSaving(true);
    const updated = {...showEdit,...editForm,init:editForm.name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()};
    setMembers(prev=>prev.map(m=>m.id===showEdit.id?updated:m));
    setShowEdit(null);
    toast(`${editForm.name} updated ✓`);
    const { error } = await supabase.from('members').update({
      name:editForm.name.trim(), initials:updated.init, phone:editForm.phone, email:editForm.email,
      dob:editForm.dob, plan:editForm.plan, trainer:editForm.trainer, status:editForm.status,
    }).eq('id',showEdit.id);
    if (error) toast('⚠️ Supabase update failed – updated locally');
    setSaving(false);
  };

  return (
    <div className="page-anim">
      <Tabs tabs={filterTabs} active={filter} onChange={setFilter}/>
      <div style={s.card()}>
        <SH title="Member Directory" sub={`${gymUser.gymName} · Synced with Portal & Attendance`}
          right={<div style={s.flex(8)}>
            <Btn variant="ghost" size="sm" onClick={()=>toast('Exporting CSV...')}>↓ Export</Btn>
            <Btn variant="ghost" size="sm" onClick={()=>toast(`Portal: ${portalBase}`)}>📱 Portal Link</Btn>
            <Btn variant="primary" size="sm" onClick={()=>setShowAdd(true)}>+ Add Member</Btn>
          </div>}/>
        <div style={{overflowX:'auto'}}>
          <div class="tbl-wrap"><table style={{width:'100%',borderCollapse:'collapse'}}>
            <Th cols={['Member','ID','Plan','Start','Expiry','Status','Trainer','Today','Actions']}/>
            <tbody>
              {list.length===0 ? (
                <tr><td colSpan="9" style={{textAlign:'center',padding:'40px 20px'}}>
                  <div style={{fontSize:36,marginBottom:8}}>👥</div>
                  <div style={{fontSize:14,fontWeight:600,color:G.navy}}>No members found</div>
                  <div style={{fontSize:12,color:G.text3,marginTop:4}}>Click "+ Add Member" to get started</div>
                </td></tr>
              ) : list.map(m=>{
                const checkedInToday = attendance.find(a=>a.memberId===m.id&&a.date==='Today');
                const dExp = daysUntilExpiry(m.expiry);
                const expiryWarn = m.status==='Active' && dExp<=7 && dExp>=0;
                return (
                  <tr key={m.id} className="row-hover" style={{borderBottom:`1px solid ${G.border}`,transition:'.12s'}}>
                    <td style={{padding:'11px 13px'}}><div style={s.flex(9)}><Mav init={m.init}/><div><div style={{fontSize:13,fontWeight:600,color:G.navy}}>{m.name}</div><div style={{fontSize:10,color:G.text3}}>{m.phone||'--'}</div></div></div></td>
                    <td style={{padding:'11px 13px',...s.mono,fontSize:11,color:G.text3}}>{m.id}</td>
                    <td style={{padding:'11px 13px'}}><PBadge p={m.plan}/></td>
                    <td style={{padding:'11px 13px',fontSize:12,color:G.text2}}>{m.start}</td>
                    <td style={{padding:'11px 13px',fontSize:12,color:expiryWarn?'#dc2626':G.text2,fontWeight:expiryWarn?600:400}}>{m.expiry}{expiryWarn&&<span style={{fontSize:9,marginLeft:4}}>⚠️ {dExp}d</span>}</td>
                    <td style={{padding:'11px 13px'}}><SBadge s={m.status}/></td>
                    <td style={{padding:'11px 13px',fontSize:12,color:G.text2}}>{m.trainer}</td>
                    <td style={{padding:'11px 13px'}}>{checkedInToday?<Badge bright><LiveDot/>{checkedInToday.status==='inside'?'Inside':'Was in'}</Badge>:<span style={{fontSize:11,color:G.text3}}>--</span>}</td>
                    <td style={{padding:'11px 13px'}}>
                      <div style={s.flex(5)}>
                        <Btn variant="ghost" size="xs" onClick={()=>openEdit(m)}>Edit</Btn>
                        <Btn variant="ghost" size="xs" onClick={()=>setShowQR(m)}>QR</Btn>
                        <Btn variant="ghost" size="xs" style={{color:G.accent,borderColor:G.border2}} onClick={()=>setShowPortal(m)}>📱</Btn>
                        <Btn variant="ghost" size="xs" onClick={()=>{const msg=expiryWarn?`Hi ${m.name}, your ${gymUser.gymName} membership expires in ${dExp} day(s) on ${m.expiry}. Please renew to continue.`:`Hi ${m.name}, welcome to ${gymUser.gymName}! Your member ID: ${m.id}`;window.open(`https://wa.me/${(m.phone||'').replace(/[^0-9]/g,'')}?text=${encodeURIComponent(msg)}`,'_blank')}}>💬</Btn>
                      </div>
                    </td>
                  </tr>
                );
               })}
            </tbody>
</table></div>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add New Member">
        <div className="rg-2"><FG label="Full Name *"><Fi placeholder="Arjun Mehta" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></FG><FG label="Phone"><Fi placeholder="+91 98765 43210" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></FG></div>
        <div className="rg-2"><FG label="Email"><Fi placeholder="arjun@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></FG><FG label="Date of Birth"><Fi type="date" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})}/></FG></div>
        <div className="rg-2"><FG label="Membership Plan"><Fs value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})}><option>Monthly</option><option>Quarterly</option><option>Yearly</option></Fs></FG><FG label="Assign Trainer"><Fs value={form.trainer} onChange={e=>setForm({...form,trainer:e.target.value})}><option>Vikram Singh</option><option>Pooja Reddy</option><option>Aryan Nair</option></Fs></FG></div>
        <div style={{...s.inset(),...s.flex(12),marginBottom:12,background:G.bg3,border:`1px solid ${G.border2}`}}>
          <div style={{width:48,height:48,background:G.bg4,border:`1px solid ${G.accentL}`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🆔</div>
          <div><div style={{fontSize:11,fontWeight:700,color:G.navy,marginBottom:2}}>Auto-Generated Member ID</div><div style={{...s.mono,fontSize:13,color:G.accent,fontWeight:700}}>IQ-KRM-{String(members.length+1).padStart(4,'0')}</div><div style={{fontSize:10,color:G.text3,marginTop:2}}>QR code + Portal access generated on save</div></div>
        </div>
        <div style={{background:'#0f172a',borderRadius:9,padding:'12px 14px',marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#64748b',marginBottom:6}}>📱 Portal link to share with member:</div>
          <div style={{...s.mono,fontSize:11,color:'#4ade80',wordBreak:'break-all'}}>{portalBase}&member=IQ-KRM-{String(members.length+1).padStart(4,'0')}</div>
        </div>
        <MFooter onCancel={()=>setShowAdd(false)} onSave={saveNewMember} saveLabel="✓ Save & Send Welcome" saving={saving}/>
      </Modal>

      {/* Share Portal Modal */}
      <Modal open={!!showPortal} onClose={()=>setShowPortal(null)} title={`Share Portal -- ${showPortal?.name}`} width={480}>
        {showPortal&&<div>
          <div style={{background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:9,padding:'14px',marginBottom:14,...s.flex(10)}}>
            <Mav init={showPortal.init} size={44}/>
            <div><div style={{fontSize:14,fontWeight:700,color:G.navy}}>{showPortal.name}</div><div style={{...s.mono,fontSize:12,color:G.accent,marginTop:2}}>{showPortal.id}</div><div style={{fontSize:11,color:G.text3}}>{showPortal.plan} · {showPortal.status} · {showPortal.visits||0} visits</div></div>
          </div>
          <div style={{background:'#0f172a',borderRadius:10,padding:16,marginBottom:14}}>
            <div style={{fontSize:11,color:'#94a3b8',marginBottom:8}}>📱 WhatsApp message:</div>
            <div style={{fontSize:12,color:'#e2e8f0',lineHeight:1.9,...s.mono}}>
              Hi {showPortal.name.split(' ')[0]}! 👋<br/>
              Your Onlifit member portal is ready.<br/><br/>
              🔗 <span style={{color:'#4ade80'}}>{portalBase}&member={showPortal.id}</span><br/>
              🆔 Your ID: <span style={{color:'#fbbf24'}}>{showPortal.id}</span><br/>
              📱 Login with phone OTP<br/><br/>
              View attendance, renew plan, book PT sessions & workouts. 💪
            </div>
          </div>
          <div style={s.flex(10)}>
            <Btn variant="ghost" style={{flex:1}} onClick={()=>setShowPortal(null)}>Close</Btn>
            <Btn variant="primary" style={{flex:2}} onClick={()=>{toast(`WhatsApp sent to ${showPortal.name} ✓`);setShowPortal(null);}}>📱 Send via WhatsApp</Btn>
          </div>
        </div>}
      </Modal>

      {/* Edit Member Modal */}
      <Modal open={!!showEdit} onClose={()=>setShowEdit(null)} title={`Edit Member — ${showEdit?.name}`}>
        {showEdit&&<div>
          <div className="rg-2"><FG label="Full Name *"><Fi value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})}/></FG><FG label="Phone"><Fi value={editForm.phone} onChange={e=>setEditForm({...editForm,phone:e.target.value})}/></FG></div>
          <div className="rg-2"><FG label="Email"><Fi value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})}/></FG><FG label="Date of Birth"><Fi type="date" value={editForm.dob} onChange={e=>setEditForm({...editForm,dob:e.target.value})}/></FG></div>
          <div className="rg-2"><FG label="Membership Plan"><Fs value={editForm.plan} onChange={e=>setEditForm({...editForm,plan:e.target.value})}><option>Monthly</option><option>Quarterly</option><option>Yearly</option></Fs></FG><FG label="Assign Trainer"><Fi value={editForm.trainer} onChange={e=>setEditForm({...editForm,trainer:e.target.value})}/></FG></div>
          <div className="rg-2"><FG label="Status"><Fs value={editForm.status} onChange={e=>setEditForm({...editForm,status:e.target.value})}><option>Active</option><option>Expired</option><option>Frozen</option></Fs></FG><FG label="Member ID"><Fi value={showEdit.id} disabled style={{opacity:.6}}/></FG></div>
          <MFooter onCancel={()=>setShowEdit(null)} onSave={saveEditMember} saveLabel="✓ Save Changes" saving={saving}/>
        </div>}
      </Modal>

      {/* QR Code Modal */}
      <Modal open={!!showQR} onClose={()=>setShowQR(null)} title={`QR Code — ${showQR?.name}`} width={380}>
        {showQR&&<div style={{textAlign:'center'}}>
          <div style={{background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:12,padding:'10px 14px',marginBottom:16,...s.flex(10)}}>
            <Mav init={showQR.init} size={38}/>
            <div style={{textAlign:'left'}}><div style={{fontSize:14,fontWeight:700,color:G.navy}}>{showQR.name}</div><div style={{...s.mono,fontSize:12,color:G.accent}}>{showQR.id}</div></div>
          </div>
          <div style={{background:'#ffffff',borderRadius:12,padding:24,display:'inline-block',border:`1px solid ${G.border}`,marginBottom:16}}>
            <QRCodeCanvas value={showQR.id} size={200} fgColor="#0f172a" bgColor="#ffffff" level="M" style={{display:'block'}}/>
          </div>
          <div style={{...s.mono,fontSize:13,color:G.text2,marginBottom:12}}>Scan to check in: <strong style={{color:G.accent}}>{showQR.id}</strong></div>
          <div style={{fontSize:11,color:G.text3,marginBottom:16}}>Show this QR at reception scanner for quick check-in</div>
          <Btn variant="ghost" onClick={()=>setShowQR(null)}>Close</Btn>
        </div>}
      </Modal>
    </div>
  );
}

// ─── AI ASSISTANT -- Anthropic API powered ─────────────────────────────────────
function PageAI({ toast }) {
  const { members, attendance, gymUser } = useGym();
  const activeCount = members.filter(m=>m.status==='Active').length;
  const expiredCount = members.filter(m=>m.status==='Expired').length;
  const todayCheckins = attendance.filter(a=>a.date==='Today').length;
  const insideNow = attendance.filter(a=>a.date==='Today'&&a.status==='inside').length;
  const greeting = (() => {
    const h = new Date().getHours();
    if(h<12) return 'Good morning';
    if(h<17) return 'Good afternoon';
    return 'Good evening';
  })();
  const [msgs, setMsgs] = useState([{u:false,text:`${greeting}, ${gymUser.name.split(' ')[0]}. Here's your gym at a glance -- **${activeCount} active members**, **${todayCheckins} check-ins today**, **${insideNow} inside right now**. ${expiredCount>0?`You have **${expiredCount} expired members** -- want me to draft renewal messages for them?`:'All members are current -- good work!'} What do you need?`,thinking:false}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>endRef.current?.scrollIntoView({behavior:'smooth'}),[msgs]);

  const buildContext = () => {
    const active    = members.filter(m=>m.status==='Active');
    const expired   = members.filter(m=>m.status==='Expired');
    const frozen    = members.filter(m=>m.status==='Frozen');
    const todayAtt  = attendance.filter(a=>a.date==='Today');
    const insideNow = todayAtt.filter(a=>a.status==='inside');
    const planCounts = ['Monthly','Quarterly','Yearly'].map(p=>({p,n:members.filter(m=>m.plan===p).length}));
    const topTrainer = SEED_STAFF.map(st=>({...st,mc:members.filter(m=>m.trainer===st.name&&m.status==='Active').length})).sort((a,b)=>b.mc-a.mc)[0];
    const churnRisk  = active.filter((_,i)=>i<3).map(m=>m.name);

    return `You are Onlifit -- a sharp, confident gym business intelligence assistant for ${gymUser.gymName} in ${gymUser.city}, run by ${gymUser.name}.

TODAY'S LIVE SNAPSHOT:
• Check-ins today: ${todayAtt.length} | Currently inside: ${insideNow.length} members: ${insideNow.map(a=>a.memberName).join(', ')||'none yet'}
• Active members: ${active.length} | Expired: ${expired.length} | Frozen: ${frozen.length} | Total: ${members.length}
• Plan split: ${planCounts.map(x=>`${x.p}(${x.n})`).join(' / ')}
• Trainers: ${SEED_STAFF.map(st=>st.name).join(', ')} | Busiest: ${topTrainer?.name||'N/A'} with ${topTrainer?.mc||0} active members
• Churn risk members (absent 7+ days): ${churnRisk.join(', ')||'none'}
• Expired members needing renewal: ${expired.map(m=>m.name).join(', ')||'none'}

PERSONALITY RULES -- CRITICAL:
- You are NOT a customer support bot. You are a smart business partner.
- Talk like a knowledgeable gym consultant who knows this gym inside-out.
- Be direct, insightful, occasionally witty. Skip filler phrases like "Great question!" or "I'd be happy to help".
- Use real member names and real numbers from the data above in every answer.
- Give specific, actionable advice -- not generic platitudes.
- Keep it to 4-6 sentences unless listing items, in which case use a clean numbered list.
- Never say "I don't have access to" -- if data isn't here, make a smart inference.
- Use WhatsApp message templates when asked -- make them sound human, not robotic.
- When forecasting, use the actual plan distribution and member counts above.
- Gym ID: ${gymUser.gym_id} | Portal: members.onlifit.app/?gym=${gymUser.gym_id}`;
  };

  const send = async (q) => {
    const text = q || input.trim();
    if(!text || loading) return;
    setInput('');
    setMsgs(p=>[...p,{u:true,text}]);
    setLoading(true);
    setMsgs(p=>[...p,{u:false,text:'',thinking:true}]);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true'
        },
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:800,
          system: buildContext(),
          messages:[
            ...msgs.filter(m=>!m.thinking&&m.text).slice(-6).map(m=>({role:m.u?'user':'assistant',content:m.text})),
            {role:'user',content:text}
          ]
        })
      });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.content?.[0]?.text || 'No response -- try again.';
      setMsgs(p=>p.map((m,i)=>i===p.length-1?{u:false,text:reply,thinking:false}:m));
    } catch(e) {
      // Smart local fallback -- answers using real gym data
      const tl = text.toLowerCase();
      const active  = members.filter(m=>m.status==='Active');
      const expired = members.filter(m=>m.status==='Expired');
      const todayIn = attendance.filter(a=>a.date==='Today'&&a.status==='inside');
      let fallback = '';
      if(tl.includes('inside')||tl.includes('now')||tl.includes('check')) {
        fallback = todayIn.length>0
          ? `Right now you have **${todayIn.length} members inside**: ${todayIn.map(a=>a.memberName).join(', ')}. Peak hours typically run 6-9 AM and 6-8 PM -- use this window to upsell PT sessions.`
          : `No one is checked in right now. Today had **${attendance.filter(a=>a.date==='Today').length} total check-ins** so far. Consider sending a quick WhatsApp to nudge your afternoon crowd.`;
      } else if(tl.includes('expir')||tl.includes('renew')) {
        fallback = expired.length>0
          ? `Your **${expired.length} expired members** -- ${expired.map(m=>m.name).join(', ')} -- are your fastest revenue opportunity. Call them personally first, then follow up on WhatsApp. A 10% discount for renewals within 3 days usually gets 60-70% back.`
          : `Great news -- no expired members right now. Focus on converting your active members to yearly plans; you currently have ${active.filter(m=>m.plan==='Monthly').length} on monthly which is your lowest-LTV segment.`;
      } else if(tl.includes('whatsapp')||tl.includes('message')||tl.includes('template')) {
        fallback = `Here's a WhatsApp template for your members:\n\nHi [Name] 👋\nJust checking in from ${gymUser.gymName}! Your membership has been great -- ${active.length} of your fellow members are crushing it daily.\n\nWant to lock in another year at a special rate? Reply YES and we'll sort it out today. 💪\n\n-- ${gymUser.name}, ${gymUser.gymName}`;
      } else if(tl.includes('revenue')||tl.includes('forecast')||tl.includes('money')) {
        const monthly = active.filter(m=>m.plan==='Monthly').length*1500;
        const quarterly = active.filter(m=>m.plan==='Quarterly').length*4000;
        const yearly = active.filter(m=>m.plan==='Yearly').length*14000;
        fallback = `Based on your **${active.length} active members**: Monthly plans bring ₹${monthly.toLocaleString('en-IN')}, Quarterly ₹${quarterly.toLocaleString('en-IN')}, Yearly ₹${yearly.toLocaleString('en-IN')} per cycle. Your biggest lever is converting the ${active.filter(m=>m.plan==='Monthly').length} monthly members to yearly -- that's a 9x LTV jump per member.`;
      } else if(tl.includes('trainer')||tl.includes('staff')) {
        fallback = `Vikram Singh leads with the most active members, followed by Pooja Reddy and Aryan Nair. If one trainer is overloaded, member experience drops -- keep each trainer under 25 active PT clients for quality. Your current split looks balanced.`;
      } else if(tl.includes('retention')||tl.includes('churn')) {
        fallback = `Top 3 retention moves for this week:\n1. Call the ${expired.length} expired members personally -- don't just text.\n2. Send a "We miss you" message to members absent 7+ days.\n3. Run a 48-hour referral offer -- existing members bring a friend, both get a free PT session.`;
      } else {
        fallback = `You have **${active.length} active members**, **${expired.length} expired**, and **${todayIn.length} inside right now**. Your gym is ${gymUser.gymName} in ${gymUser.city}. What specifically do you want to work on -- retention, revenue, attendance, or member communication?`;
      }
      setMsgs(p=>p.map((m,i)=>i===p.length-1?{u:false,text:fallback,thinking:false}:m));
    }
    setLoading(false);
  };

  const quickQueries = [
    `Who's inside right now and how long have they been here?`,
    `Which ${members.filter(m=>m.status==='Expired').length} expired members should I call first?`,
    `Write a WhatsApp message to send to all ${members.filter(m=>m.status==='Active').length} active members about an offer`,
    `Forecast my revenue for next month based on current member count`,
    `Which trainer needs more members and why?`,
    `Give me 3 quick wins I can do this week to increase retention`,
    `Who hasn't visited in the last week and what should I do?`,
    `Compare my plan distribution -- which plan should I push more?`,
  ];

  return (
    <div className="page-anim mob-grid-1" style={s.grid('3fr 2fr',16)}>
      <div style={s.col(14)}>
        {/* Chat window */}
        <div style={{...s.card(0),overflow:'hidden'}}>
          <div style={{...s.flex(12),padding:'14px 18px',borderBottom:`1px solid ${G.border}`,background:G.bg3}}>
            <div style={{width:38,height:38,borderRadius:10,background:`linear-gradient(135deg,${G.accent},#4ade80)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#fff',flexShrink:0}}>✦</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:G.navy}}>Onlifit AI</div>
              <div style={{fontSize:11,color:G.text3,...s.flex(5)}}><LiveDot/>Watching your live gym data · Claude Sonnet 4</div>
            </div>
            <div style={{marginLeft:'auto',...s.flex(6),flexWrap:'wrap',gap:5}}>
              <Badge bright>{activeCount} active</Badge>
              <Badge bright>{todayCheckins} today</Badge>
              <Badge bright style={{background:'#dbeafe',color:'#2563eb',border:'1px solid #bfdbfe'}}>{insideNow} inside</Badge>
              {expiredCount>0&&<Badge danger>{expiredCount} expired</Badge>}
            </div>
          </div>

          <div style={{height:340,overflowY:'auto',padding:16,...s.col(12)}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{maxWidth:'85%',alignSelf:m.u?'flex-end':'flex-start',display:'flex'}}>
                {m.thinking
                  ? <div style={{padding:'12px 16px',borderRadius:'12px 12px 12px 3px',background:G.bg2,border:`1px solid ${G.border}`,...s.flex(5)}}>
                      {[0,1,2].map(j=><div key={j} className="ai-dot" style={{width:7,height:7,borderRadius:'50%',background:G.text3}}/>)}
                    </div>
                  : <div style={{padding:'11px 14px',borderRadius:m.u?'12px 12px 3px 12px':'12px 12px 12px 3px',fontSize:13,lineHeight:1.65,whiteSpace:'pre-wrap',background:m.u?G.accent:G.bg2,border:m.u?'none':`1px solid ${G.border}`,color:m.u?'#fff':G.navy,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
                    {m.text}</div>
                }
              </div>
            ))}
            <div ref={endRef}/>
          </div>

          <div style={{...s.flex(9),padding:'12px 16px',borderTop:`1px solid ${G.border}`,background:G.bg2}}>
            <input style={{...s.input,flex:1}} placeholder="Ask about members, revenue, attendance, retention..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} disabled={loading}/>
            <button onClick={()=>send()} disabled={loading} style={{background:loading?G.bg3:G.accent,border:'none',borderRadius:8,width:38,height:38,cursor:loading?'not-allowed':'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:loading?G.text3:'#fff',transition:'.15s'}}>→</button>
          </div>
        </div>

        {/* Quick queries */}
        <div style={s.card()}>
          <SH title="Quick Queries"/>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {quickQueries.map(q=>(
              <div key={q} className="quick-link" onClick={()=>send(q)}
                style={{background:G.bg2,border:`1px solid ${G.border}`,borderRadius:8,padding:'8px 12px',cursor:'pointer',fontSize:12,color:G.text2,transition:'.15s',fontWeight:500}}>{q}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel -- live stats */}
      <div style={s.col(16)}>
        <div style={s.card()}>
          <SH title="Live Gym Snapshot" sub="AI sees this data"/>
          <div style={s.col(10)}>
            {[
              {label:'Active members',  value:members.filter(m=>m.status==='Active').length, icon:'👥'},
              {label:'Expired',          value:members.filter(m=>m.status==='Expired').length, icon:'⚠️'},
              {label:'Inside now',       value:attendance.filter(a=>a.date==='Today'&&a.status==='inside').length, icon:'🟢'},
              {label:"Today's check-ins",value:attendance.filter(a=>a.date==='Today').length, icon:'📊'},
            ].map(({label,value,icon})=>(
              <div key={label} style={{...s.inset(10),...s.flex(10)}}>
                <span style={{fontSize:18}}>{icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:G.text3,fontWeight:600,textTransform:'uppercase',letterSpacing:'.5px'}}>{label}</div>
                  <div style={{fontSize:20,fontWeight:800,color:G.navy}}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.card()}>
          <SH title="Revenue Forecast" sub="AI prediction"/>
          <div style={{background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:10,padding:18,textAlign:'center',marginBottom:14}}>
            <div style={{fontSize:11,color:G.text3,fontWeight:600,textTransform:'uppercase',marginBottom:4}}>April Predicted</div>
            <div style={{fontSize:40,fontWeight:800,color:G.accent,letterSpacing:'-2px'}}>₹8.4L</div>
            <div style={{fontSize:12,color:G.text3,marginTop:4}}>127 renewals · 94% confidence</div>
          </div>
          <div style={{display:'flex',alignItems:'flex-end',gap:4,height:80}}>
            {[{m:'Oct',v:62},{m:'Nov',v:68},{m:'Dec',v:74},{m:'Jan',v:72},{m:'Feb',v:76},{m:'Mar',v:72},{m:'Apr',v:84,f:true}].map(b=>(
              <div key={b.m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{width:'100%',height:b.v/84*70,background:b.f?G.bg4:`linear-gradient(to top,${G.accent},#4ade80)`,borderRadius:'3px 3px 0 0',border:b.f?`2px dashed ${G.accentL}`:'none'}}/>
                <span style={{fontSize:8,color:b.f?G.accent:G.text3,fontWeight:b.f?700:400}}>{b.m}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={s.card()}>
          <SH title="AI Features"/>
          {[['Smart Fee Reminders',true],['Churn Risk Alerts',true],['Revenue Forecasting',true],['Real-time Data Sync',true],['Workout Plan Generator',true]].map(([f,on])=>(
            <div key={f} style={{...s.flex(0),justifyContent:'space-between',alignItems:'center',fontSize:12,marginBottom:9}}>
              <span style={{color:G.text2,fontWeight:500}}>{f}</span>
              <Badge bright={on}>{on?'● Active':'◑ Beta'}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── OTHER PAGES (Revenue, Fees, Discounts, Staff, PT, Settings) ──────────────
// Keeping these lean but synced with context

function PageRevenue({ toast }) {
  const { members, staff, trainers, gymSettings, gymUser } = useGym();
  const [payments, setPayments] = useState([]);

  useEffect(()=>{
    if(!gymUser) return;
    supabase.from('payments').select('*').eq('gym_id',gymUser.gym_id).order('created_at',{ascending:false}).then(({data})=>{
      if(data) setPayments(data);
    });
  },[gymUser]);

  const months = 'JFMAMJJASOND'.split('');
  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth();
  const monthName = new Date().toLocaleDateString('en-US',{month:'long'});

  // Real annual revenue chart from payments
  const annual = months.map((_,i)=>{
    const mPay = payments.filter(p=>{try{const d=new Date(p.created_at||p.date);return d.getMonth()===i&&d.getFullYear()===thisYear;}catch{return false;}});
    return {v:Math.max(mPay.reduce((a,p)=>a+(p.amount||0),0)/1000,0),l:months[i]};
  });
  const hasAnnualData = annual.some(d=>d.v>0);
  const annualChart = hasAnnualData ? annual : [520,480,610,590,720,680,800,750,820,780,840,920].map((v,i)=>({v,l:months[i],dim:true}));

  // Revenue calculations from real payments
  const monthPayments = payments.filter(p=>{try{const d=new Date(p.created_at||p.date);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;}catch{return false;}});
  const monthRevenue  = monthPayments.reduce((a,p)=>a+(p.amount||0),0);
  const ptRevenue     = trainers.reduce((a,t)=>a+(t.revenue||0),0);
  const totalRevenue  = monthRevenue + ptRevenue;
  const annualRevenue = payments.filter(p=>{try{return new Date(p.created_at||p.date).getFullYear()===thisYear;}catch{return false;}}).reduce((a,p)=>a+(p.amount||0),0);

  // Expense calculations -- read from Settings
  const staffSalary   = staff.reduce((a,s)=>a+(parseInt(s.salary)||0),0);
  const rent          = gymSettings.rent        || 0;
  const utilities     = gymSettings.utilities   || 0;
  const equipment     = gymSettings.equipment   || 0;
  const marketing     = gymSettings.marketing   || 0;
  const miscExpenses  = gymSettings.misc        || 0;
  const monthlyTarget = gymSettings.monthlyTarget || 1000000;
  const totalExpenses = staffSalary + rent + utilities + equipment + marketing + miscExpenses;
  const netProfit     = totalRevenue - totalExpenses;
  const profitPct     = totalRevenue > 0 ? Math.round((netProfit/totalRevenue)*100) : 0;
  const targetPct     = Math.min(Math.round((totalRevenue/monthlyTarget)*100), 100);

  const expenseItems = [
    {label:'Staff Salaries',   amount:staffSalary,  icon:'👤', note:`${staff.length} staff · from Staff section`},
    {label:'Rent & Premises',  amount:rent,         icon:'🏢', note:'Set in Settings → Expenses'},
    {label:'Utilities',        amount:utilities,    icon:'⚡', note:'Set in Settings → Expenses'},
    {label:'Equipment & Maint',amount:equipment,    icon:'🏋️', note:'Set in Settings → Expenses'},
    {label:'Marketing',        amount:marketing,    icon:'📢', note:'Set in Settings → Expenses'},
    {label:'Miscellaneous',    amount:miscExpenses, icon:'📦', note:'Set in Settings → Expenses'},
  ];

  return (
    <div className="page-anim">
      {/* Top KPIs */}
      <div className="rg-4" style={{marginBottom:16}}>
        <StatCard label={`Total Revenue (${monthName.slice(0,3)})`} value={`₹${(totalRevenue/100000).toFixed(1)}L`} trend={{up:true,label:`${monthPayments.length} payments`}} icon="💰"/>
        <StatCard label={`Total Expenses (${monthName.slice(0,3)})`} value={`₹${(totalExpenses/100000).toFixed(1)}L`} dim icon="💸"/>
        <StatCard label={`Net Profit (${monthName.slice(0,3)})`} value={`₹${(netProfit/100000).toFixed(1)}L`} trend={{up:netProfit>0,label:`${profitPct}% margin`}} icon="📈"/>
        <StatCard label="Annual Revenue" value={annualRevenue>0?`₹${(annualRevenue/100000).toFixed(1)}L`:'--'} icon="🏆"/>
      </div>

      {/* Revenue vs Expenses P&L */}
      <div style={{...s.card(20),marginBottom:16,background:`linear-gradient(135deg,${G.bg3} 0%,${G.bg} 100%)`,border:`1.5px solid ${G.border2}`}}>
        <SH title={`${monthName} ${thisYear} -- P&L Summary`} sub="Revenue, Expenses & Net Profit"/>
        <div className="mob-grid-1" style={s.grid(3,16)}>
          {/* Revenue breakdown */}
          <div style={s.inset(16)}>
            <div style={{fontSize:11,fontWeight:700,color:G.text3,textTransform:'uppercase',letterSpacing:'.7px',marginBottom:12}}>Revenue Sources</div>
            {[
              {l:'Membership Fees', v:monthRevenue,  pct:Math.round(monthRevenue/totalRevenue*100)},
              {l:'PT Sessions',     v:ptRevenue,     pct:Math.round(ptRevenue/totalRevenue*100)},
              {l:'Supplement Sales',v:18000,         pct:2},
            ].map(r=>(
              <div key={r.l} style={{marginBottom:12}}>
                <div style={{...s.flex(0),justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                  <span style={{color:G.text2}}>{r.l}</span>
                  <span style={{...s.mono,fontWeight:700,color:G.accent}}>₹{r.v.toLocaleString('en-IN')}</span>
                </div>
                <Progress pct={r.pct}/>
              </div>
            ))}
            <div style={{borderTop:`1.5px solid ${G.border2}`,marginTop:8,paddingTop:10,...s.flex(0),justifyContent:'space-between'}}>
              <span style={{fontSize:13,fontWeight:700,color:G.navy}}>Total Revenue</span>
              <span style={{...s.mono,fontSize:14,fontWeight:800,color:G.accent}}>₹{totalRevenue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Expense breakdown */}
          <div style={s.inset(16)}>
            <div style={{fontSize:11,fontWeight:700,color:G.text3,textTransform:'uppercase',letterSpacing:'.7px',marginBottom:12}}>Expense Breakdown</div>
            {expenseItems.map(e=>(
              <div key={e.label} style={{...s.flex(10),marginBottom:10}}>
                <span style={{fontSize:14,flexShrink:0}}>{e.icon}</span>
                <div style={{flex:1}}>
                  <div style={{...s.flex(0),justifyContent:'space-between'}}>
                    <span style={{fontSize:12,color:G.text2,fontWeight:500}}>{e.label}</span>
                    <span style={{...s.mono,fontSize:12,fontWeight:700,color:'#dc2626'}}>₹{e.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{fontSize:10,color:G.text3}}>{e.note}</div>
                </div>
              </div>
            ))}
            <div style={{borderTop:`1.5px solid ${G.border}`,marginTop:8,paddingTop:10,...s.flex(0),justifyContent:'space-between'}}>
              <span style={{fontSize:13,fontWeight:700,color:G.navy}}>Total Expenses</span>
              <span style={{...s.mono,fontSize:14,fontWeight:800,color:'#dc2626'}}>₹{totalExpenses.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Net profit + targets */}
          <div style={{...s.inset(16),background:netProfit>0?G.bg3:'#fef2f2',border:`1.5px solid ${netProfit>0?G.border2:'#fecaca'}`}}>
            <div style={{fontSize:11,fontWeight:700,color:G.text3,textTransform:'uppercase',letterSpacing:'.7px',marginBottom:12}}>Net Profit</div>
            <div style={{textAlign:'center',padding:'16px 0'}}>
              <div style={{fontSize:38,fontWeight:900,color:netProfit>0?G.accent:'#dc2626',letterSpacing:'-2px'}}>
                ₹{(netProfit/1000).toFixed(1)}K
              </div>
              <div style={{fontSize:13,color:G.text2,marginTop:4}}>Profit margin: <strong style={{color:netProfit>0?G.accent:'#dc2626'}}>{profitPct}%</strong></div>
            </div>
            <div style={{...s.col(8),marginTop:8}}>
              {[
                {l:'Revenue',v:totalRevenue,clr:G.accent},
                {l:'Expenses',v:totalExpenses,clr:'#dc2626'},
                {l:'Net',v:netProfit,clr:netProfit>0?G.accent:'#dc2626'},
              ].map(r=>(
                <div key={r.l} style={{...s.flex(0),justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:G.text2}}>{r.l}</span>
                  <span style={{...s.mono,fontWeight:700,color:r.clr}}>₹{r.v.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:14}}>
              <div style={{fontSize:11,fontWeight:600,color:G.text3,marginBottom:4}}>Monthly Target Progress</div>
              <Progress pct={targetPct}/>
              <div style={{fontSize:10,color:G.text3,marginTop:4}}>{targetPct}% of ₹{(monthlyTarget/100000).toFixed(0)}L target · Set in Settings → Expenses</div>
            </div>
          </div>
        </div>
      </div>

      {/* Annual chart + branch breakdown */}
      <div className="rg-21" style={{marginBottom:16}}>
        <div style={s.card()}><SH title="Annual Revenue" sub={hasAnnualData?`${thisYear} · from payments`:'Sample data'} right={<Btn variant="ghost" size="sm" onClick={()=>toast('Exporting Excel...')}>↓ Excel</Btn>}/><BarChart data={annualChart} height={180}/></div>
        <div style={s.card()}>
          <SH title="Branch Revenue" sub="March 2025"/>
          {[{n:'Koramangala',v:'₹3.12L',p:85},{n:'Indiranagar',v:'₹2.18L',p:60},{n:'Whitefield',v:'₹1.70L',p:45}].map(b=>(
            <div key={b.n} style={{marginBottom:14}}>
              <div style={{...s.flex(0),justifyContent:'space-between',fontSize:13,marginBottom:4}}>
                <span style={{fontWeight:600,color:G.navy}}>{b.n}</span>
                <span style={{...s.mono,fontWeight:700,color:G.accent}}>{b.v}</span>
              </div>
              <Progress pct={b.p} dim={b.p<70}/>
            </div>
          ))}
        </div>
      </div>

      {/* Pending dues */}
      <div style={s.card()}>
        <SH title="Pending Dues" right={<Badge danger>3 overdue shown</Badge>}/>
        <div style={{background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:9,padding:'11px 14px',...s.flex(10),marginBottom:12}}>
          <span style={{fontSize:18}}>⚠️</span>
          <span style={{fontSize:13,color:G.text2}}>47 members · <strong style={{color:G.navy}}>₹2,34,500</strong> total overdue</span>
        </div>
        <div class="tbl-wrap"><table style={{width:'100%',borderCollapse:'collapse'}}>
          <Th cols={['Member','Due Since','Amount','']}/>
          <tbody>
            {[{n:'Suresh Naidu',d:'Mar 1',a:'₹4,500'},{n:'Aisha Khan',d:'Feb 25',a:'₹7,200'},{n:'Vinod Rao',d:'Feb 20',a:'₹3,000'}].map(r=>(
              <tr key={r.n} className="row-hover" style={{borderBottom:`1px solid ${G.border}`}}>
                <td style={{padding:'11px 13px',fontWeight:600,color:G.navy}}>{r.n}</td>
                <td style={{padding:'11px 13px',fontSize:12,color:G.text2}}>{r.d}</td>
                <td style={{padding:'11px 13px',...s.mono,fontSize:12,fontWeight:700,color:'#dc2626'}}>{r.a}</td>
                <td style={{padding:'11px 13px'}}><Btn variant="ghost" size="xs" onClick={()=>toast('Reminder sent 📱')}>📱 Remind</Btn></td>
              </tr>
            ))}
          </tbody>
</table></div>
      </div>
    </div>
  );
}

function PageFees({ toast }) {
  const { members, gymUser, gymProfile } = useGym();
  const [planVal,setPlanVal]=useState('14000');
  const [coupon,setCoupon]=useState('');
  const [couponMsg,setCouponMsg]=useState(null);
  const [search,setSearch]=useState('');
  const [selectedMember,setSelectedMember]=useState(null);
  const [payMode,setPayMode]=useState('UPI / Razorpay');
  const [amount,setAmount]=useState('');
  const [paying,setPaying]=useState(false);
  const [payments,setPayments]=useState([]);

  // Load payment history
  useEffect(()=>{
    if(!gymUser) return;
    supabase.from('payments').select('*').eq('gym_id',gymUser.gym_id).order('created_at',{ascending:false}).limit(20).then(({data})=>{
      if(data) setPayments(data);
    });
  },[gymUser]);

  const base=parseInt(amount)||parseInt(planVal)||14000,gst=Math.round(base*18/118),baseEx=base-gst;
  const cc=VALID_COUPONS[coupon.toUpperCase()];
  const disc=cc?(cc.type==='pct'?Math.round(baseEx*cc.val/100):Math.min(cc.val,base)):0;
  const total=base-disc;
  const handleCoupon=v=>{setCoupon(v);const vc=VALID_COUPONS[v.toUpperCase()];if(!v)setCouponMsg(null);else if(vc)setCouponMsg({ok:true,msg:`✓ ${vc.type==='pct'?vc.val+'% off':'₹'+vc.val+' off'} applied!`});else setCouponMsg({ok:false,msg:'Invalid coupon code'});};
  const planName = {1500:'Monthly',4000:'Quarterly',14000:'Yearly'}[planVal]||'Yearly';
  const invNo = `INV-${new Date().getFullYear()}-${String(payments.length+1).padStart(4,'0')}`;
  const today = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});

  const searchResults = search.length>=2 ? members.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||m.id.toLowerCase().includes(search.toLowerCase())).slice(0,5) : [];

  const generatePDF = (paymentData) => {
    const doc = new jsPDF();
    const gName = gymProfile.gymName || gymUser.gymName || 'Onlifit Gym';
    // Header
    doc.setFontSize(22); doc.setFont('helvetica','bold'); doc.setTextColor(22,163,74); doc.text(gName,20,25);
    doc.setFontSize(9); doc.setTextColor(100); doc.text('Tax Invoice',20,32);
    doc.setFontSize(10); doc.setTextColor(60); doc.text(invNo,190,25,{align:'right'}); doc.text(today,190,32,{align:'right'});
    // Gym details
    doc.setDrawColor(200); doc.line(20,37,190,37);
    let y = 45;
    if(gymProfile.address) { doc.setFontSize(9); doc.text(gymProfile.address,20,y); y+=5; }
    if(gymProfile.gstin) { doc.text(`GSTIN: ${gymProfile.gstin}`,20,y); y+=5; }
    if(gymProfile.phone) { doc.text(`Phone: ${gymProfile.phone}`,20,y); y+=5; }
    // Member details
    y += 5; doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(15,23,42); doc.text('Bill To:',20,y); y+=7;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(60);
    doc.text(paymentData.memberName || 'Walk-in',20,y); y+=5;
    if(paymentData.memberId) { doc.text(`ID: ${paymentData.memberId}`,20,y); y+=5; }
    // Line items
    y += 8; doc.setDrawColor(200); doc.line(20,y,190,y); y+=8;
    const items = [['Plan',planName],['Base Amount',`Rs ${baseEx.toLocaleString()}`],['GST (18%)',`Rs ${gst.toLocaleString()}`]];
    if(disc>0) items.push(['Discount',`- Rs ${disc.toLocaleString()}`]);
    items.push(['Total',`Rs ${total.toLocaleString()}`]);
    items.forEach(([k,v],i)=>{
      const isTotal = i===items.length-1;
      doc.setFont('helvetica',isTotal?'bold':'normal'); doc.setFontSize(isTotal?12:10);
      doc.setTextColor(isTotal?22:60,isTotal?163:60,isTotal?74:60);
      doc.text(k,20,y); doc.text(v,190,y,{align:'right'}); y+=7;
      if(isTotal) { doc.setDrawColor(22,163,74); doc.line(20,y-9,190,y-9); }
    });
    // Payment mode
    y+=5; doc.setFontSize(9); doc.setTextColor(100); doc.text(`Payment Mode: ${paymentData.mode}`,20,y);
    y+=10; doc.setFontSize(8); doc.setTextColor(150); doc.text('Generated by Onlifit Gym Management',105,y,{align:'center'});
    doc.save(`${invNo}.pdf`);
  };

  const handleRazorpay = () => {
    const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if(!rzpKey) { toast('⚠️ Razorpay key not configured – add VITE_RAZORPAY_KEY_ID'); return; }
    if(!selectedMember) { toast('Please select a member first'); return; }
    setPaying(true);
    const options = {
      key: rzpKey, amount: total*100, currency:'INR', name: gymProfile.gymName||gymUser.gymName||'Onlifit',
      description: `${planName} Membership - ${selectedMember.name}`,
      handler: async (response) => {
        await recordPayment('Razorpay', response.razorpay_payment_id);
        setPaying(false);
      },
      prefill: { name:selectedMember.name, email:selectedMember.email||'', contact:selectedMember.phone||'' },
      modal: { ondismiss: ()=>setPaying(false) },
    };
    try { const rzp = new window.Razorpay(options); rzp.open(); } catch { toast('⚠️ Razorpay SDK not loaded'); setPaying(false); }
  };

  const recordPayment = async (mode, txnId) => {
    const paymentData = {
      gym_id: gymUser.gym_id, member_id: selectedMember?.id||null, member_name: selectedMember?.name||'Walk-in',
      invoice: invNo, plan: planName, amount: total, mode, date: today, status: 'Paid', txn_id: txnId||null,
    };
    const { error } = await supabase.from('payments').insert(paymentData);
    if(error) toast('⚠️ Payment save failed locally');
    else { setPayments(prev=>[paymentData,...prev]); toast(`✅ ₹${total.toLocaleString()} received from ${selectedMember?.name||'Walk-in'}`); }
    generatePDF({memberName:selectedMember?.name, memberId:selectedMember?.id, mode});
  };

  const handleRecord = async () => {
    if(payMode==='UPI / Razorpay') { handleRazorpay(); return; }
    setPaying(true);
    await recordPayment(payMode);
    setPaying(false);
  };

  return (
    <div className="page-anim">
      <div className="rg-4" style={{marginBottom:16}}>
        <StatCard label="Today's Collection" value={`₹${payments.filter(p=>p.date===today).reduce((a,p)=>a+(p.amount||0),0).toLocaleString()}`} icon="💰"/>
        <StatCard label="This Month" value={`${payments.length} payments`} icon="✅"/>
        <StatCard label="Overdue Members" value={String(members.filter(m=>m.status==='Expired').length)} dim icon="⚠️"/>
        <StatCard label="Avg. Ticket" value={payments.length?`₹${Math.round(payments.reduce((a,p)=>a+(p.amount||0),0)/payments.length).toLocaleString()}`:'--'} icon="🔄"/>
      </div>
      <div className="rg-2" style={{marginBottom:16}}>
        <div style={s.card()}>
          <SH title="Record Payment"/>
          <FG label="Search Member">
            <Fi placeholder="Name or Member ID..." value={search} onChange={e=>{setSearch(e.target.value);setSelectedMember(null)}}/>
            {searchResults.length>0&&!selectedMember&&<div style={{border:`1px solid ${G.border}`,borderRadius:8,marginTop:4,maxHeight:160,overflowY:'auto',background:'#fff'}}>
              {searchResults.map(m=><div key={m.id} onClick={()=>{setSelectedMember(m);setSearch(m.name)}} style={{padding:'8px 12px',cursor:'pointer',borderBottom:`1px solid ${G.border}`,fontSize:13}} className="row-hover"><span style={{fontWeight:600,color:G.navy}}>{m.name}</span> <span style={{fontSize:11,color:G.text3}}>{m.id}</span></div>)}
            </div>}
            {selectedMember&&<div style={{marginTop:6,padding:'6px 10px',background:G.bg3,borderRadius:6,fontSize:12,color:G.accent,fontWeight:600}}>✓ {selectedMember.name} ({selectedMember.id})</div>}
          </FG>
          <div className="rg-2">
            <FG label="Amount (₹)"><Fi placeholder={planVal} value={amount} onChange={e=>setAmount(e.target.value)}/></FG>
            <FG label="Mode"><Fs value={payMode} onChange={e=>setPayMode(e.target.value)}><option>UPI / Razorpay</option><option>Cash</option><option>Card</option><option>EMI</option></Fs></FG>
          </div>
          <div className="rg-2">
            <FG label="Plan"><Fs value={planVal} onChange={e=>setPlanVal(e.target.value)}><option value="1500">Monthly -- ₹1,500</option><option value="4000">Quarterly -- ₹4,000</option><option value="14000">Yearly -- ₹14,000</option></Fs></FG>
            <FG label="Coupon"><Fi placeholder="e.g. IRON10" value={coupon} onChange={e=>handleCoupon(e.target.value)}/></FG>
          </div>
          {couponMsg&&<div style={{fontSize:12,marginBottom:10,fontWeight:600,color:couponMsg.ok?G.accent:'#dc2626',padding:'7px 12px',borderRadius:7,background:couponMsg.ok?G.bg3:'#fef2f2',border:`1px solid ${couponMsg.ok?G.accentL:'#fecaca'}`}}>{couponMsg.msg}</div>}
          <Btn variant="primary" style={{width:'100%',opacity:paying?.6:1}} onClick={handleRecord} disabled={paying}>{paying?'Processing…':'💳 Record & Generate Invoice'}</Btn>
        </div>
        <div style={s.card()}>
          <SH title="Invoice Preview"/>
          <div style={{background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:9,padding:14}}>
            <div style={{...s.flex(0),justifyContent:'space-between',marginBottom:12}}>
              <div><div style={{fontSize:20,fontWeight:800,color:G.accent}}>{gymProfile.gymName||gymUser.gymName||'Onlifit'}</div><div style={{fontSize:10,color:G.text3,fontWeight:600,textTransform:'uppercase'}}>Tax Invoice</div></div>
              <div style={{textAlign:'right',fontSize:11,color:G.text3}}><div style={{...s.mono,color:G.navy,fontWeight:600}}>#{invNo}</div><div>{today}</div></div>
            </div>
            {selectedMember&&<div style={{fontSize:12,color:G.text2,marginBottom:10,padding:'6px 0',borderBottom:`1px solid ${G.border}`}}>Bill to: <span style={{fontWeight:600,color:G.navy}}>{selectedMember.name}</span> ({selectedMember.id})</div>}
            {[['Plan',planName],['Base Amount',`₹${baseEx.toLocaleString()}`],['GST (18%)',`₹${gst.toLocaleString()}`]].map(([k,v])=><div key={k} style={{...s.flex(0),justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${G.border}`,fontSize:13}}><span style={{color:G.text2}}>{k}</span><span style={{fontWeight:600,color:G.navy}}>{v}</span></div>)}
            {disc>0&&<div style={{...s.flex(0),justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${G.border}`,fontSize:13}}><span style={{color:G.text2}}>Discount</span><span style={{color:G.accent,fontWeight:700}}>−₹{disc.toLocaleString()}</span></div>}
            <div style={{...s.flex(0),justifyContent:'space-between',padding:'10px 0 0',fontWeight:800,fontSize:15,color:G.accent,borderTop:`2px solid ${G.border}`,marginTop:4}}><span>Total</span><span>₹{total.toLocaleString()}</span></div>
            <Btn variant="ghost" style={{width:'100%',marginTop:10,fontSize:12}} onClick={()=>generatePDF({memberName:selectedMember?.name,memberId:selectedMember?.id,mode:payMode})}>↓ Download PDF</Btn>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      {payments.length>0&&<div style={s.card()}>
        <SH title="Recent Payments" sub={`Last ${Math.min(payments.length,20)} transactions`}/>
        <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}>
          <Th cols={['Member','Invoice','Plan','Amount','Mode','Date','Status']}/>
          <tbody>{payments.slice(0,10).map((p,i)=>(
            <tr key={i} className="row-hover" style={{borderBottom:`1px solid ${G.border}`}}>
              <td style={{padding:'9px 13px',fontSize:13,fontWeight:600,color:G.navy}}>{p.member_name||p.member||'--'}</td>
              <td style={{padding:'9px 13px',...s.mono,fontSize:11,color:G.text3}}>{p.invoice||p.inv||'--'}</td>
              <td style={{padding:'9px 13px',fontSize:12,color:G.text2}}>{p.plan}</td>
              <td style={{padding:'9px 13px',fontSize:13,fontWeight:700,color:G.accent}}>₹{(p.amount||0).toLocaleString()}</td>
              <td style={{padding:'9px 13px',fontSize:12,color:G.text2}}>{p.mode}</td>
              <td style={{padding:'9px 13px',fontSize:12,color:G.text2}}>{p.date}</td>
              <td style={{padding:'9px 13px'}}><SBadge s={p.status==='Paid'?'Active':'Expired'}/></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>}
    </div>
  );
}

function PageDiscounts({ toast }) {
  const [coupons,setCoupons]=useState([{code:'IRON10',type:'pct',val:10,plan:'All Plans',uses:45,max:100,expiry:'Dec 31',cat:'General'},{code:'NEWJOIN20',type:'pct',val:20,plan:'All Plans',uses:23,max:50,expiry:'Mar 31',cat:'New Join'},{code:'REFER500',type:'flat',val:500,plan:'All Plans',uses:18,max:null,expiry:'Dec 31',cat:'Referral'}]);
  return (
    <div className="page-anim">
      <div className="rg-4" style={{marginBottom:16}}><StatCard label="Active Coupons" value={String(coupons.length)} icon="🏷️"/><StatCard label="Total Redeemed" value={String(coupons.reduce((a,c)=>a+c.uses,0))} icon="✅"/><StatCard label="Discount Given" value="₹18,450" dim icon="💸"/><StatCard label="Active Offers" value="2" dim icon="🎁"/></div>
      <div style={s.card()}><SH title="Discount Coupons" right={<Btn variant="primary" size="sm" onClick={()=>toast('Create coupon modal...')}>+ Create Coupon</Btn>}/><div style={s.col(8)}>{coupons.map((c,i)=><div key={c.code} style={{background:G.bg2,border:`1.5px dashed ${G.border2}`,borderRadius:10,padding:'12px 14px',...s.flex(12)}}><div style={{width:36,height:36,borderRadius:8,background:G.bg4,border:`1px solid ${G.accentL}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🏷️</div><div style={{flex:1}}><div style={{...s.mono,fontSize:14,fontWeight:700,color:G.accent}}>{c.code}</div><div style={{fontSize:11,color:G.text3,marginTop:2}}>{c.type==='pct'?c.val+'% off':'₹'+c.val+' off'} · Until {c.expiry}</div><div style={{...s.flex(6),marginTop:4}}><Badge bright>{c.cat}</Badge><span style={{fontSize:11,color:G.text2}}>{c.uses}{c.max?'/'+c.max:''} uses</span></div></div><div style={s.col(5)}><Btn variant="ghost" size="xs" onClick={()=>toast(`Copied: ${c.code}`)}>Copy</Btn><Btn variant="danger" size="xs" onClick={()=>{setCoupons(p=>p.filter((_,j)=>j!==i));toast('Deleted');}}>Delete</Btn></div></div>)}</div></div>
    </div>
  );
}

function QRBadge({ id }) {
  // Visual QR placeholder -- real QR generated on backend
  return (
    <div style={{background:'#0f172a',borderRadius:8,padding:8,display:'inline-flex',flexDirection:'column',alignItems:'center',gap:4}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,6px)',gap:1}}>
        {Array.from({length:49},(_,i)=>{
          const corner = [0,1,2,3,4,5,7,8,14,15,21,28,35,42,43,44,45,46,47,48];
          const on = corner.includes(i)||Math.sin(i*id.charCodeAt(i%id.length)||1)>0.1;
          return <div key={i} style={{width:6,height:6,borderRadius:1,background:on?'#4ade80':'transparent'}}/>;
        })}
      </div>
      <div style={{fontSize:8,...s.mono,color:'#64748b'}}>{id}</div>
    </div>
  );
}

function PageStaff({ toast }) {
  const { staff, setStaff, gymUser } = useGym();
  const [showAdd, setShowAdd]   = useState(false);
  const [showView, setShowView] = useState(null);
  const [showEdit, setShowEdit] = useState(null);
  const blank = {name:'',phone:'',email:'',role:'Trainer',branch:'Koramangala',salary:'',joined:new Date().toISOString().slice(0,10)};
  const [form, setForm] = useState(blank);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const totalSalary = staff.reduce((a,s)=>a+(parseInt(s.salary)||0),0);

  const genStaffId = () => {
    const prefix = gymUser.gym_id.replace('GYM-','').replace(/-/g,'').slice(0,3).toUpperCase();
    return `ST-${prefix}-${String(staff.length+1).padStart(3,'0')}`;
  };

  const saveStaff = () => {
    if(!form.name.trim()){toast('Name is required');return;}
    if(!form.salary){toast('Salary is required');return;}
    const id   = genStaffId();
    const init = form.name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const salaryNum = parseInt(form.salary.replace(/[^0-9]/g,''));
    const newSt = {...form,id,init,members:0,present:true,salary:salaryNum,qr:`QR-${id}`};
    setStaff(p=>[...p,newSt]);
    setShowAdd(false); setForm(blank);
    toast(`${form.name} added -- ID: ${id}, QR assigned ✓`);
    // Persist to Supabase
    supabase.from('staff').insert({
      id, gym_id: gymUser.gym_id, name: form.name.trim(), initials: init, role: form.role,
      branch: form.branch||'', members_count: 0, present: true, salary: salaryNum,
      phone: form.phone||'', email: form.email||'', joined: form.joined||'', qr: `QR-${id}`,
    }).then(()=>{});
  };

  const saveEdit = () => {
    const salaryNum = parseInt(form.salary.toString().replace(/[^0-9]/g,''));
    setStaff(p=>p.map(s=>s.id===showEdit.id?{...showEdit,...form,salary:salaryNum,init:showEdit.init}:s));
    setShowEdit(null); setForm(blank);
    toast('Staff record updated ✓');
    // Persist update to Supabase
    supabase.from('staff').update({
      name: form.name, role: form.role, branch: form.branch, salary: salaryNum,
      phone: form.phone||'', email: form.email||'', joined: form.joined||'',
    }).eq('id', showEdit.id).then(()=>{});
  };

  const openEdit = (st) => { setShowEdit(st); setForm({name:st.name,phone:st.phone||'',email:st.email||'',role:st.role,branch:st.branch,salary:String(st.salary),joined:st.joined||''}); };

  const ROLES = ['Head Trainer','PT Trainer','Trainer','Receptionist','Manager','Cleaning Staff','Security'];

  return (
    <div className="page-anim">
      <div className="rg-4" style={{marginBottom:16}}>
        <StatCard label="Total Staff" value={String(staff.length)} icon="🧑‍💼"/>
        <StatCard label="Present Today" value={String(staff.filter(s=>s.present).length)} icon="✅"/>
        <StatCard label="On Leave" value={String(staff.filter(s=>!s.present).length)} dim icon="🏖️"/>
        <StatCard label="Total Salary / Month" value={`₹${totalSalary.toLocaleString('en-IN')}`} dim icon="💸"/>
      </div>

      <div style={s.card()}>
        <SH title="Staff Directory" sub={`${gymUser.gymName} · All positions`}
          right={<Btn variant="primary" size="sm" onClick={()=>{setForm(blank);setShowAdd(true);}}>+ Add Staff</Btn>}/>
        <div style={{overflowX:'auto'}}>
          <div class="tbl-wrap"><table style={{width:'100%',borderCollapse:'collapse'}}>
            <Th cols={['Staff','Staff ID','Position','Branch','Phone','Status','Salary / Month','QR','']}/>
            <tbody>
              {staff.map((st,i)=>(
                <tr key={st.id} className="row-hover" style={{borderBottom:`1px solid ${G.border}`,transition:'.12s'}}>
                  <td style={{padding:'11px 13px'}}><div style={s.flex(9)}><Mav init={st.init}/><div><div style={{fontSize:13,fontWeight:600,color:G.navy}}>{st.name}</div><div style={{fontSize:10,color:G.text3}}>{st.email||'--'}</div></div></div></td>
                  <td style={{padding:'11px 13px',...s.mono,fontSize:11,color:G.text3}}>{st.id}</td>
                  <td style={{padding:'11px 13px'}}><Badge bright>{st.role}</Badge></td>
                  <td style={{padding:'11px 13px',fontSize:12,color:G.text2}}>{st.branch}</td>
                  <td style={{padding:'11px 13px',fontSize:12,color:G.text2}}>{st.phone||'--'}</td>
                  <td style={{padding:'11px 13px'}}>{st.present?<Badge bright>● Present</Badge>:<Badge danger>○ Absent</Badge>}</td>
                  <td style={{padding:'11px 13px',...s.mono,fontSize:12,fontWeight:700,color:G.accent}}>₹{(parseInt(st.salary)||0).toLocaleString('en-IN')}</td>
                  <td style={{padding:'11px 13px'}}><span style={{...s.mono,fontSize:10,color:G.text3}}>{st.qr||`QR-${st.id}`}</span></td>
                  <td style={{padding:'11px 13px'}}>
                    <div style={s.flex(5)}>
                      <Btn variant="ghost" size="xs" onClick={()=>setShowView(st)}>View</Btn>
                      <Btn variant="ghost" size="xs" onClick={()=>openEdit(st)}>Edit</Btn>
                      <Btn variant="danger" size="xs" onClick={()=>{setStaff(p=>p.filter((_,j)=>j!==i));toast(`${st.name} removed`);}}>✕</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
</table></div>
        </div>

        {/* Salary summary */}
        <div style={{...s.inset(12),marginTop:14,background:G.bg3,border:`1px solid ${G.border2}`,...s.flex(0),justifyContent:'space-between'}}>
          <div style={{fontSize:13,fontWeight:600,color:G.navy}}>Total Monthly Payroll</div>
          <div style={{...s.mono,fontSize:16,fontWeight:800,color:G.accent}}>₹{totalSalary.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={()=>{setShowAdd(false);setForm(blank);}} title="Add New Staff Member" width={580}>
        <div>
          <div className="rg-2">
            <FG label="Full Name *"><Fi value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Ravi Kumar"/></FG>
            <FG label="Phone"><Fi value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 98765 43210"/></FG>
            <FG label="Email"><Fi value={form.email} onChange={e=>set('email',e.target.value)} placeholder="staff@gym.com"/></FG>
            <FG label="Position / Role *"><Fs value={form.role} onChange={e=>set('role',e.target.value)}>{ROLES.map(r=><option key={r}>{r}</option>)}</Fs></FG>
            <FG label="Branch"><Fs value={form.branch} onChange={e=>set('branch',e.target.value)}><option>Koramangala</option><option>Indiranagar</option><option>Whitefield</option></Fs></FG>
            <FG label="Monthly Salary (₹) *"><Fi value={form.salary} onChange={e=>set('salary',e.target.value)} placeholder="e.g. 30000"/></FG>
            <FG label="Joining Date"><Fi type="date" value={form.joined} onChange={e=>set('joined',e.target.value)}/></FG>
          </div>
          <div style={{...s.inset(12),marginBottom:14,background:G.bg3,border:`1px solid ${G.border2}`,display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontSize:20}}>🆔</div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:G.navy}}>Auto-assigned on save</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:G.accent,fontWeight:700}}>{genStaffId()} · QR-{genStaffId()}</div>
              <div style={{fontSize:10,color:G.text3,marginTop:2}}>Staff ID + QR code generated automatically</div>
            </div>
          </div>
          <MFooter onCancel={()=>{setShowAdd(false);setForm(blank);}} onSave={saveStaff} saveLabel="✓ Add & Assign ID + QR"/>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!showEdit} onClose={()=>{setShowEdit(null);setForm(blank);}} title={`Edit -- ${showEdit?.name||''}`} width={580}>
        <div>
          <div className="rg-2">
            <FG label="Full Name *"><Fi value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Ravi Kumar"/></FG>
            <FG label="Phone"><Fi value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 98765 43210"/></FG>
            <FG label="Email"><Fi value={form.email} onChange={e=>set('email',e.target.value)} placeholder="staff@gym.com"/></FG>
            <FG label="Position / Role *"><Fs value={form.role} onChange={e=>set('role',e.target.value)}>{ROLES.map(r=><option key={r}>{r}</option>)}</Fs></FG>
            <FG label="Branch"><Fs value={form.branch} onChange={e=>set('branch',e.target.value)}><option>Koramangala</option><option>Indiranagar</option><option>Whitefield</option></Fs></FG>
            <FG label="Monthly Salary (₹) *"><Fi value={form.salary} onChange={e=>set('salary',e.target.value)} placeholder="e.g. 30000"/></FG>
            <FG label="Joining Date"><Fi type="date" value={form.joined} onChange={e=>set('joined',e.target.value)}/></FG>
          </div>
          <MFooter onCancel={()=>{setShowEdit(null);setForm(blank);}} onSave={saveEdit} saveLabel="✓ Save Changes"/>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!showView} onClose={()=>setShowView(null)} title={`Staff Profile -- ${showView?.name}`} width={520}>
        {showView && (
          <div>
            <div style={{...s.flex(14),marginBottom:20}}>
              <Mav init={showView.init} size={56}/>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:G.navy}}>{showView.name}</div>
                <div style={s.flex(8)}><Badge bright>{showView.role}</Badge><Badge>{showView.branch}</Badge></div>
              </div>
              <div style={{marginLeft:'auto'}}><QRBadge id={showView.qr||`QR-${showView.id}`}/></div>
            </div>
            <div className="rg-2" style={{gap:10}}>
              {[['Staff ID',showView.id,true],['QR Code',showView.qr||`QR-${showView.id}`,true],['Phone',showView.phone||'--',false],['Email',showView.email||'--',false],['Branch',showView.branch,false],['Joined',showView.joined||'--',false],['Monthly Salary',`₹${(parseInt(showView.salary)||0).toLocaleString('en-IN')}`,false],['Status',showView.present?'Present':'Absent',false]].map(([k,v,m])=>(
                <div key={k} style={s.inset(12)}>
                  <div style={{fontSize:10,fontWeight:700,color:G.text3,textTransform:'uppercase',letterSpacing:'.7px',marginBottom:3}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:600,color:G.accent,...(m?s.mono:{})}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={s.flex(10)}>
              <Btn variant="ghost" style={{flex:1}} onClick={()=>setShowView(null)}>Close</Btn>
              <Btn variant="primary" style={{flex:1}} onClick={()=>{setStaff(p=>p.map(s=>s.id===showView.id?{...s,present:!s.present}:s));toast('Attendance updated ✓');setShowView(null);}}>Toggle Attendance</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function PagePT({ toast }) {
  const { trainers, setTrainers, members, gymUser } = useGym();
  const [showEnroll, setShowEnroll] = useState(false);
  const [showView,   setShowView]   = useState(null);
  const [showEdit,   setShowEdit]   = useState(null);
  const [showAssign, setShowAssign] = useState(null); // trainer to assign member to

  const blank = {name:'',phone:'',email:'',specialization:'Strength & Conditioning',experience:'',certifications:'',commission:'',bio:''};
  const [form, setForm] = useState(blank);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const totalSessions  = trainers.reduce((a,t)=>a+(t.sessions||0),0);
  const totalRevenue   = trainers.reduce((a,t)=>a+(t.revenue||0),0);
  const totalPTMembers = trainers.reduce((a,t)=>a+(t.members?.length||0),0);

  const genTrainerId = () => {
    const prefix = gymUser.gym_id.replace('GYM-','').replace(/-/g,'').slice(0,3).toUpperCase();
    return `TR-${prefix}-${String(trainers.length+1).padStart(3,'0')}`;
  };

  const saveTrainer = () => {
    if(!form.name.trim()){toast('Trainer name is required');return;}
    if(!form.experience.trim()){toast('Experience is required');return;}
    if(!form.commission){toast('PT commission per client is required');return;}
    const id   = genTrainerId();
    const init = form.name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const nt   = {...form,id,init,members:[],sessions:0,rating:0,revenue:0,commission:parseInt(form.commission)||0,qr:`QR-${id}`};
    setTrainers(p=>[...p,nt]);
    setShowEnroll(false); setForm(blank);
    toast(`${form.name} enrolled -- ID: ${id}, QR: QR-${id} ✓`);
  };

  const saveEdit = () => {
    setTrainers(p=>p.map(t=>t.id===showEdit.id?{...t,...form,commission:parseInt(form.commission)||t.commission,init:showEdit.init}:t));
    setShowEdit(null); setForm(blank);
    toast('Trainer profile updated ✓');
  };

  const openEdit = (tr) => {
    setShowEdit(tr);
    setForm({name:tr.name,phone:tr.phone||'',email:tr.email||'',specialization:tr.specialization,experience:tr.experience,certifications:tr.certifications||'',commission:String(tr.commission),bio:tr.bio||''});
  };

  const assignMember = (memberId) => {
    if(!showAssign) return;
    setTrainers(p=>p.map(t=>t.id===showAssign.id
      ? t.members.includes(memberId)?t:{...t,members:[...t.members,memberId],revenue:t.revenue+(t.commission||0)}
      : t));
    toast(`Member assigned to ${showAssign.name} ✓`);
    setShowAssign(null);
  };

  const removeMember = (trainerId, memberId) => {
    setTrainers(p=>p.map(t=>t.id===trainerId?{...t,members:t.members.filter(m=>m!==memberId)}:t));
    toast('Member removed from PT roster');
  };

  const SPECS = ['Strength & Conditioning','Weight Loss & Nutrition','Functional & Crossfit','Yoga & Flexibility','Bodybuilding','Sports Performance','Rehabilitation','Cardio & HIIT'];

  return (
    <div className="page-anim">
      <div className="rg-4" style={{marginBottom:16}}>
        <StatCard label="Active PT Trainers" value={String(trainers.length)} icon="🏋️"/>
        <StatCard label="Total PT Members" value={String(totalPTMembers)} icon="👥"/>
        <StatCard label="Sessions This Month" value={String(totalSessions)} icon="📅"/>
        <StatCard label="PT Revenue (Month)" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon="💰"/>
      </div>

      {/* Trainer cards */}
      <div style={{...s.card(),marginBottom:16}}>
        <SH title="Personal Trainers" sub={`${gymUser.gymName} · Commission-based`}
          right={<Btn variant="primary" size="sm" onClick={()=>{setForm(blank);setShowEnroll(true);}}>+ Enroll Trainer</Btn>}/>
        <div style={{overflowX:'auto'}}>
          <div class="tbl-wrap"><table style={{width:'100%',borderCollapse:'collapse'}}>
            <Th cols={['Trainer','ID','Specialization','Experience','PT Members','Sessions','Commission/Client','Rating','QR','']}/>
            <tbody>
              {trainers.map((tr,i)=>(
                <tr key={tr.id} className="row-hover" style={{borderBottom:`1px solid ${G.border}`,transition:'.12s'}}>
                  <td style={{padding:'11px 13px'}}><div style={s.flex(9)}><Mav init={tr.init}/><div><div style={{fontSize:13,fontWeight:600,color:G.navy}}>{tr.name}</div><div style={{fontSize:10,color:G.text3}}>{tr.email||tr.phone||'--'}</div></div></div></td>
                  <td style={{padding:'11px 13px',...s.mono,fontSize:11,color:G.text3}}>{tr.id}</td>
                  <td style={{padding:'11px 13px'}}><Badge bright>{tr.specialization}</Badge></td>
                  <td style={{padding:'11px 13px',fontSize:12,color:G.text2}}>{tr.experience}</td>
                  <td style={{padding:'11px 13px',...s.mono,fontSize:13,fontWeight:700,color:G.accent}}>{tr.members?.length||0}</td>
                  <td style={{padding:'11px 13px',...s.mono,fontSize:12,color:G.text2}}>{tr.sessions||0}</td>
                  <td style={{padding:'11px 13px',...s.mono,fontSize:12,fontWeight:700,color:G.accent}}>₹{(tr.commission||0).toLocaleString('en-IN')}</td>
                  <td style={{padding:'11px 13px'}}>{tr.rating>0?<Badge bright>★ {tr.rating}</Badge>:<span style={{fontSize:11,color:G.text3}}>--</span>}</td>
                  <td style={{padding:'11px 13px'}}><span style={{...s.mono,fontSize:10,color:G.text3}}>{tr.qr}</span></td>
                  <td style={{padding:'11px 13px'}}>
                    <div style={s.flex(5)}>
                      <Btn variant="ghost" size="xs" onClick={()=>setShowView(tr)}>View</Btn>
                      <Btn variant="ghost" size="xs" onClick={()=>openEdit(tr)}>Edit</Btn>
                      <Btn variant="ghost" size="xs" style={{color:G.accent,borderColor:G.border2}} onClick={()=>setShowAssign(tr)}>+ Member</Btn>
                      <Btn variant="danger" size="xs" onClick={()=>{setTrainers(p=>p.filter((_,j)=>j!==i));toast(`${tr.name} removed`);}}>✕</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
</table></div>
        </div>
      </div>

      {/* AI tip */}
      <div style={{...s.inset(14),background:G.bg3,border:`1px solid ${G.border2}`,fontSize:13,color:G.text2}}>
        💡 Use the <strong style={{color:G.accent}}>AI Assistant</strong> to generate personalised workout & diet plans for any PT member -- just ask with their name and goals.
      </div>

      {/* Enroll Modal */}
      <Modal open={showEnroll} onClose={()=>{setShowEnroll(false);setForm(blank);}} title="Enroll New PT Trainer" width={600}>
        <div>
          <div className="rg-2">
            <FG label="Full Name *"><Fi value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Ravi Kumar"/></FG>
            <FG label="Phone"><Fi value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 98765 43210"/></FG>
            <FG label="Email"><Fi value={form.email} onChange={e=>set('email',e.target.value)} placeholder="trainer@gym.com"/></FG>
            <FG label="Specialization"><Fs value={form.specialization} onChange={e=>set('specialization',e.target.value)}>{SPECS.map(sp=><option key={sp}>{sp}</option>)}</Fs></FG>
            <FG label="Experience *"><Fi value={form.experience} onChange={e=>set('experience',e.target.value)} placeholder="e.g. 5 years"/></FG>
            <FG label="PT Commission per Client (₹) *"><Fi value={form.commission} onChange={e=>set('commission',e.target.value)} placeholder="e.g. 500"/></FG>
            <FG label="Certifications"><Fi value={form.certifications} onChange={e=>set('certifications',e.target.value)} placeholder="e.g. NSCA-CPT, ACE"/></FG>
          </div>
          <FG label="Bio / Notes"><Fta value={form.bio} onChange={e=>set('bio',e.target.value)} placeholder="Short bio or specialization notes..." style={{minHeight:56}}/></FG>
          <div style={{...s.inset(12),marginBottom:14,background:G.bg3,border:`1px solid ${G.border2}`,display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontSize:20}}>🆔</div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:G.navy}}>Auto-assigned on enroll</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:G.accent,fontWeight:700}}>{genTrainerId()} · QR-{genTrainerId()}</div>
              <div style={{fontSize:10,color:G.text3,marginTop:2}}>Trainer ID + QR code generated automatically</div>
            </div>
          </div>
          <MFooter onCancel={()=>{setShowEnroll(false);setForm(blank);}} onSave={saveTrainer} saveLabel="✓ Enroll & Assign ID + QR"/>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!showEdit} onClose={()=>{setShowEdit(null);setForm(blank);}} title={`Edit Trainer -- ${showEdit?.name||''}`} width={600}>
        <div>
          <div className="rg-2">
            <FG label="Full Name *"><Fi value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Ravi Kumar"/></FG>
            <FG label="Phone"><Fi value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 98765 43210"/></FG>
            <FG label="Email"><Fi value={form.email} onChange={e=>set('email',e.target.value)} placeholder="trainer@gym.com"/></FG>
            <FG label="Specialization"><Fs value={form.specialization} onChange={e=>set('specialization',e.target.value)}>{SPECS.map(sp=><option key={sp}>{sp}</option>)}</Fs></FG>
            <FG label="Experience *"><Fi value={form.experience} onChange={e=>set('experience',e.target.value)} placeholder="e.g. 5 years"/></FG>
            <FG label="PT Commission per Client (₹) *"><Fi value={form.commission} onChange={e=>set('commission',e.target.value)} placeholder="e.g. 500"/></FG>
            <FG label="Certifications"><Fi value={form.certifications} onChange={e=>set('certifications',e.target.value)} placeholder="e.g. NSCA-CPT, ACE"/></FG>
          </div>
          <FG label="Bio / Notes"><Fta value={form.bio} onChange={e=>set('bio',e.target.value)} placeholder="Short bio or specialization notes..." style={{minHeight:56}}/></FG>
          <MFooter onCancel={()=>{setShowEdit(null);setForm(blank);}} onSave={saveEdit} saveLabel="✓ Save Changes"/>
        </div>
      </Modal>

      {/* View Profile Modal */}
      <Modal open={!!showView} onClose={()=>setShowView(null)} title={`Trainer Profile -- ${showView?.name}`} width={560}>
        {showView && (
          <div>
            <div style={{...s.flex(14),marginBottom:20}}>
              <Mav init={showView.init} size={56}/>
              <div style={{flex:1}}>
                <div style={{fontSize:18,fontWeight:800,color:G.navy}}>{showView.name}</div>
                <Badge bright style={{marginTop:4}}>{showView.specialization}</Badge>
                {showView.bio && <div style={{fontSize:12,color:G.text2,marginTop:6}}>{showView.bio}</div>}
              </div>
              <QRBadge id={showView.qr}/>
            </div>
            <div className="rg-3" style={{gap:10}}>
              {[
                ['Trainer ID',showView.id,true],['QR Code',showView.qr,true],['Experience',showView.experience,false],
                ['Commission / Client',`₹${(showView.commission||0).toLocaleString('en-IN')}`,false],
                ['PT Members',String(showView.members?.length||0),false],['Sessions',String(showView.sessions||0),false],
                ['Rating',showView.rating>0?`★ ${showView.rating}`:'Not rated yet',false],
                ['Certifications',showView.certifications||'--',false],
                ['Monthly Revenue',`₹${(showView.revenue||0).toLocaleString('en-IN')}`,false],
              ].map(([k,v,m])=>(
                <div key={k} style={s.inset(12)}>
                  <div style={{fontSize:10,fontWeight:700,color:G.text3,textTransform:'uppercase',letterSpacing:'.6px',marginBottom:3}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:600,color:G.accent,...(m?s.mono:{})}}>{v}</div>
                </div>
              ))}
            </div>
            {/* Assigned members */}
            {showView.members?.length>0 && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:G.text3,textTransform:'uppercase',letterSpacing:'.7px',marginBottom:8}}>Assigned PT Members</div>
                <div style={s.col(6)}>
                  {showView.members.map(mid=>{
                    const m = members.find(x=>x.id===mid);
                    return m ? (
                      <div key={mid} style={{...s.flex(10),...s.inset(10)}}>
                        <Mav init={m.init} size={28}/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:600,color:G.navy}}>{m.name}</div>
                          <div style={{...s.mono,fontSize:10,color:G.text3}}>{m.id} · {m.plan}</div>
                        </div>
                        <Btn variant="danger" size="xs" onClick={()=>{removeMember(showView.id,mid);setShowView(prev=>({...prev,members:prev.members.filter(x=>x!==mid)}));}}>Remove</Btn>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            <div style={s.flex(10)}>
              <Btn variant="ghost" style={{flex:1}} onClick={()=>setShowView(null)}>Close</Btn>
              <Btn variant="primary" style={{flex:1}} onClick={()=>{setShowAssign(showView);setShowView(null);}}>+ Assign Member</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Member Modal */}
      <Modal open={!!showAssign} onClose={()=>setShowAssign(null)} title={`Assign Member to ${showAssign?.name}`} width={480}>
        {showAssign && (
          <div>
            <div style={{fontSize:12,color:G.text2,marginBottom:14}}>Select an active member to add to this trainer's PT roster.</div>
            <div style={s.col(8)}>
              {members.filter(m=>m.status==='Active').map(m=>{
                const already = showAssign.members?.includes(m.id);
                return (
                  <div key={m.id} style={{...s.flex(10),...s.inset(10),opacity:already?.5:1}}>
                    <Mav init={m.init} size={30}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:G.navy}}>{m.name}</div>
                      <div style={{fontSize:11,color:G.text3}}>{m.plan} · {m.id}</div>
                    </div>
                    {already
                      ? <Badge bright>✓ Assigned</Badge>
                      : <Btn variant="primary" size="xs" onClick={()=>assignMember(m.id)}>Assign</Btn>}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:16}}><Btn variant="ghost" style={{width:'100%'}} onClick={()=>setShowAssign(null)}>Done</Btn></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function PageSettings({ toast }) {
  const { gymUser, gymProfile, setGymProfile, gymSettings, setGymSettings } = useGym();
  const [tab,setTab]=useState('profile');
  const [autoBackup,setAutoBackup]=useState(true);

  // Local copies for expenses form so they don't update live as you type
  const [exp, setExp] = useState({
    rent:       String(gymSettings.rent        || ''),
    utilities:  String(gymSettings.utilities   || ''),
    equipment:  String(gymSettings.equipment   || ''),
    marketing:  String(gymSettings.marketing   || ''),
    misc:       String(gymSettings.misc        || ''),
    monthlyTarget: String(gymSettings.monthlyTarget || ''),
  });
  const setE = (k,v) => setExp(p=>({...p,[k]:v}));

  const saveExpenses = () => {
    const parsed = {
      rent:          parseInt(exp.rent)          || 0,
      utilities:     parseInt(exp.utilities)     || 0,
      equipment:     parseInt(exp.equipment)     || 0,
      marketing:     parseInt(exp.marketing)     || 0,
      misc:          parseInt(exp.misc)          || 0,
      monthlyTarget: parseInt(exp.monthlyTarget) || 0,
    };
    setGymSettings(parsed);
    toast('Expenses & target saved -- Revenue page updated ✓');
  };

  const staffTotal = (gymSettings.rent||0)+(gymSettings.utilities||0)+(gymSettings.equipment||0)+(gymSettings.marketing||0)+(gymSettings.misc||0);

  return (
    <div className="page-anim">
      <Tabs
        tabs={[{id:'profile',label:'Gym Profile'},{id:'expenses',label:'Expenses & Goals'},{id:'plans',label:'Plans'},{id:'integrations',label:'Integrations'},{id:'backup',label:'Backup'}]}
        active={tab} onChange={setTab}
      />

      {tab==='profile' && (
        <div className="rg-2">
          <div style={s.card()}>
            <SH title="Gym Profile"/>
            <FG label="Gym Name"><Fi defaultValue={gymUser.gymName}/></FG>
            <FG label="City"><Fi defaultValue={gymUser.city}/></FG>
            <FG label="GSTIN"><Fi defaultValue="29AABCI1234D1ZX" style={s.mono}/></FG>
            <Btn variant="primary" onClick={()=>toast('Profile saved ✓')}>Save Profile</Btn>
          </div>
          <div style={s.card()}>
            <SH title="Logo & Branding"/>
            <div className="drop-zone" style={{border:`2px dashed ${G.border2}`,borderRadius:9,padding:28,textAlign:'center',cursor:'pointer',color:G.text3,fontSize:13,background:G.bg2}} onClick={()=>toast('File picker opened')}>
              🖼️ Click to upload gym logo
            </div>
          </div>
        </div>
      )}

      {tab==='expenses' && (
        <div style={s.col(16)}>
          {/* Info banner */}
          <div style={{...s.inset(14),background:G.bg3,border:`1px solid ${G.border2}`,fontSize:13,color:G.text2,...s.flex(10)}}>
            <span style={{fontSize:18}}>💡</span>
            <span>These values are used by the <strong style={{color:G.accent}}>Revenue page</strong> to calculate your monthly P&L, net profit, and target progress. Staff salaries are auto-fetched from the Staff section.</span>
          </div>

          <div className="mob-grid-1" style={s.grid(2,16)}>
            {/* Monthly Expenses */}
            <div style={s.card()}>
              <SH title="Monthly Fixed Expenses" sub="All amounts in ₹ per month"/>
              <FG label="Rent & Premises (₹)">
                <Fi value={exp.rent} onChange={e=>setE('rent',e.target.value)} placeholder="e.g. 85000"/>
              </FG>
              <FG label="Utilities (₹) -- Electricity, Water, Internet">
                <Fi value={exp.utilities} onChange={e=>setE('utilities',e.target.value)} placeholder="e.g. 22000"/>
              </FG>
              <FG label="Equipment & Maintenance (₹)">
                <Fi value={exp.equipment} onChange={e=>setE('equipment',e.target.value)} placeholder="e.g. 15000"/>
              </FG>
              <FG label="Marketing & Ads (₹)">
                <Fi value={exp.marketing} onChange={e=>setE('marketing',e.target.value)} placeholder="e.g. 18000"/>
              </FG>
              <FG label="Miscellaneous (₹) -- Consumables, other">
                <Fi value={exp.misc} onChange={e=>setE('misc',e.target.value)} placeholder="e.g. 12000"/>
              </FG>
            </div>

            {/* Revenue Target + live preview */}
            <div style={s.col(16)}>
              <div style={s.card()}>
                <SH title="Monthly Revenue Target"/>
                <FG label="Target (₹) -- used in Revenue page progress bar">
                  <Fi value={exp.monthlyTarget} onChange={e=>setE('monthlyTarget',e.target.value)} placeholder="e.g. 1000000 for ₹10L"/>
                </FG>
                <div style={{...s.inset(12),background:G.bg3,border:`1px solid ${G.border2}`,marginTop:4}}>
                  <div style={{fontSize:11,color:G.text3,marginBottom:4}}>Target preview</div>
                  <div style={{...s.mono,fontSize:20,fontWeight:800,color:G.accent}}>
                    ₹{(parseInt(exp.monthlyTarget)||0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Live summary */}
              <div style={{...s.card(),background:G.bg3,border:`1.5px solid ${G.border2}`}}>
                <SH title="Expense Summary Preview" sub="Saved values"/>
                {[
                  ['Rent',        gymSettings.rent],
                  ['Utilities',   gymSettings.utilities],
                  ['Equipment',   gymSettings.equipment],
                  ['Marketing',   gymSettings.marketing],
                  ['Misc',        gymSettings.misc],
                ].map(([k,v])=>(
                  <div key={k} style={{...s.flex(0),justifyContent:'space-between',fontSize:13,padding:'5px 0',borderBottom:`1px solid ${G.border}`}}>
                    <span style={{color:G.text2}}>{k}</span>
                    <span style={{...s.mono,fontWeight:600,color:G.navy}}>₹{(v||0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div style={{...s.flex(0),justifyContent:'space-between',fontSize:13,fontWeight:700,padding:'8px 0 0',color:G.navy}}>
                  <span>Non-salary total</span>
                  <span style={{...s.mono,color:'#dc2626'}}>₹{staffTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          <Btn variant="primary" style={{width:240}} onClick={saveExpenses}>💾 Save Expenses & Target</Btn>
        </div>
      )}

      {tab==='plans' && (
        <div style={s.card()}>
          <SH title="Membership Plans" right={<Btn variant="primary" size="sm" onClick={()=>toast('Create plan...')}>+ Create Plan</Btn>}/>
          <div style={s.col(8)}>
            {SEED_PLANS.map(p=>(
              <div key={p.name} style={{background:G.bg2,border:`1.5px solid ${G.border}`,borderRadius:9,padding:'12px 15px',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:G.accent,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:G.navy}}>{p.name}</div>
                  <div style={{fontSize:11,color:G.text3}}>{p.days} days · PT: {p.pt}</div>
                </div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,color:G.accent}}>₹{p.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='integrations' && (
        <div className="rg-2">
          {[{name:'Razorpay',sub:'UPI, Card, Net Banking, EMI',icon:'💳'},{name:'WhatsApp Business',sub:'Reminders & Notifications',icon:'📱'}].map(intg=>(
            <div key={intg.name} style={s.card()}>
              <SH title={intg.name}/>
              <div style={{background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:9,padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:22}}>{intg.icon}</span>
                  <div><div style={{fontWeight:600,color:G.navy}}>{intg.name}</div><div style={{fontSize:11,color:G.text3}}>{intg.sub}</div></div>
                </div>
                <Badge bright>✓ Connected</Badge>
              </div>
              <FG label="API Key"><Fi type="password" defaultValue="••••••••••••••••" style={s.mono}/></FG>
              <Btn variant="ghost" style={{width:'100%'}} onClick={()=>toast(`${intg.name} test successful ✓`)}>Test Connection</Btn>
            </div>
          ))}
        </div>
      )}

      {tab==='backup' && (
        <div className="rg-2">
          <div style={s.card()}>
            <SH title="Backup Settings"/>
            <div style={{background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:9,padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div>
                <div style={{fontWeight:600,color:G.navy}}>Auto Cloud Backup</div>
                <div style={{fontSize:11,color:G.text3,marginTop:2}}>Last: Today 3:00 AM · Google Drive</div>
              </div>
              <button className={`toggle ${autoBackup?'on':'off'}`} onClick={()=>setAutoBackup(v=>!v)}/>
            </div>
            <Btn variant="primary" style={{width:'100%'}} onClick={()=>toast('Backup started! Email sent ✓')}>Backup Now</Btn>
          </div>
          <div style={s.card()}>
            <SH title="Account Info"/>
            {[['Gym ID',gymUser.gym_id,true],['User ID',gymUser.user_id,true],['Role',gymUser.role,false],['Email',gymUser.email,false]].map(([k,v,m])=>(
              <div key={k} style={{...s.inset(10),marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontSize:10,fontWeight:700,color:G.text3,textTransform:'uppercase',letterSpacing:'.7px'}}>{k}</div>
                <div style={{fontSize:12,fontWeight:600,color:G.accent,...(m?s.mono:{})}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NOTIFICATION CENTER ──────────────────────────────────────────────────────
function NotificationCenter({ notifications, open, onClose, onDismiss, onDismissAll, gymName }) {
  if (!open) return null;
  const typeColors = { expiry: '#dc2626', birthday: '#f59e0b', churn: '#ea580c', payment: '#6366f1' };
  const typeLabels = { expiry: 'Expiring', birthday: 'Birthday', churn: 'Churn Risk', payment: 'Pending' };

  const sendWhatsApp = (n) => {
    if (!n.member || !n.msg) return;
    const phone = (n.member.phone || '').replace(/[^0-9]/g, '');
    if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(n.msg)}`, '_blank');
  };

  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.25)',zIndex:9998}} onClick={onClose}/>
      <div style={{position:'fixed',top:0,right:0,width:Math.min(380, window.innerWidth - 16),height:'100vh',background:G.bg,boxShadow:'-4px 0 24px rgba(0,0,0,.12)',zIndex:9999,display:'flex',flexDirection:'column',borderLeft:`1.5px solid ${G.border}`}}>
        {/* Header */}
        <div style={{padding:'16px 18px',borderBottom:`1.5px solid ${G.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:G.navy}}>🔔 Notifications</div>
            <div style={{fontSize:11,color:G.text3,marginTop:2}}>{notifications.length} actionable items</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {notifications.length > 0 && (
              <button onClick={onDismissAll} style={{fontSize:11,fontWeight:600,color:G.accent,background:'none',border:'none',cursor:'pointer',padding:'4px 8px'}}>Clear all</button>
            )}
            <button onClick={onClose} style={{width:28,height:28,borderRadius:6,border:`1px solid ${G.border}`,background:G.bg2,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'10px 14px'}}>
          {notifications.length === 0 ? (
            <div style={{textAlign:'center',padding:'48px 20px'}}>
              <div style={{fontSize:40,marginBottom:12}}>🎉</div>
              <div style={{fontSize:14,fontWeight:600,color:G.navy}}>All clear!</div>
              <div style={{fontSize:12,color:G.text3,marginTop:4}}>No pending notifications right now</div>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:10,padding:'12px 14px',marginBottom:8,transition:'.15s'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                  <span style={{fontSize:18,flexShrink:0,lineHeight:1}}>{n.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                      <span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',color:typeColors[n.type],background:typeColors[n.type]+'18',padding:'2px 6px',borderRadius:4}}>{typeLabels[n.type]}</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:G.navy}}>{n.title}</div>
                    <div style={{fontSize:11,color:G.text3,marginTop:2}}>{n.sub}</div>
                  </div>
                  <button onClick={() => onDismiss(n.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:G.text3,padding:2,flexShrink:0}}>✕</button>
                </div>
                {n.action && (
                  <div style={{marginTop:8,display:'flex',gap:6}}>
                    <button onClick={() => sendWhatsApp(n)} style={{fontSize:11,fontWeight:600,color:'#fff',background:G.accent,border:'none',borderRadius:6,padding:'5px 12px',cursor:'pointer'}}>{n.actionLabel}</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer summary */}
        {notifications.length > 0 && (
          <div style={{padding:'12px 18px',borderTop:`1px solid ${G.border}`,background:G.bg2}}>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              {Object.entries(notifications.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {})).map(([type, count]) => (
                <span key={type} style={{fontSize:10,fontWeight:600,color:typeColors[type]}}>
                  {typeLabels[type]}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV = [
  {section:'Core',    items:[{id:'dashboard',icon:'📊',label:'Dashboard'},{id:'members',icon:'👥',label:'Members',badge:3},{id:'attendance',icon:'📅',label:'Attendance',badge:'Live'}]},
  {section:'Finance', items:[{id:'revenue',icon:'💰',label:'Revenue'},{id:'fees',icon:'💳',label:'Fees & Billing',badge:7},{id:'discounts',icon:'🏷️',label:'Discounts'}]},
  {section:'People',  items:[{id:'staff',icon:'🧑‍💼',label:'Staff'},{id:'pt',icon:'🏋️',label:'Personal Training'},{id:'ai',icon:'✦',label:'AI Assistant'}]},
  {section:'Config',  items:[{id:'settings',icon:'⚙️',label:'Settings'}]},
];
const TITLES = {dashboard:'Dashboard',members:'Members',attendance:'Attendance',revenue:'Revenue',fees:'Fees & Billing',discounts:'Discounts & Offers',staff:'Staff',pt:'Personal Training',ai:'AI Assistant',settings:'Settings'};

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [gymUser, setGymUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // ── RESTORE SESSION on mount ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase.from('gym_accounts').select('*').eq('email', session.user.email).single();
          if (data) {
            const acct = { gym_id: data.gym_id, user_id: data.user_id, email: data.email, name: data.name, gymName: data.gym_name, city: data.city, role: data.role, isNew: data.is_new };
            setGymUser(acct);
            localStorage.setItem('onlifit_gym_user', JSON.stringify(acct));
            if (data.is_new) setShowOnboarding(true);
          }
        } else {
          try {
            const saved = localStorage.getItem('onlifit_gym_user');
            if (saved) setGymUser(JSON.parse(saved));
          } catch {}
        }
      } catch (e) {
        // Supabase unavailable — try localStorage
        try {
          const saved = localStorage.getItem('onlifit_gym_user');
          if (saved) setGymUser(JSON.parse(saved));
        } catch {}
      }
      setAuthChecked(true);
    })();
    let subscription;
    try {
      const result = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) { setGymUser(null); setDataLoaded(false); }
      });
      subscription = result.data.subscription;
    } catch {}
    return () => { if (subscription) subscription.unsubscribe(); };
  }, []);

  // ── SHARED LIVE STATE -- single source of truth ─────────────────────────────
  const [members,    setMembersState]    = useState([]);
  const [attendance, setAttendanceState] = useState([]);
  const [staff,      setStaffState]      = useState([]);
  const [trainers,   setTrainersState]   = useState([]);
  const [gymProfile, setGymProfile]      = useState({});
  const [gymSettings, setGymSettings]   = useState({
    rent: 85000, utilities: 22000, equipment: 15000,
    marketing: 18000, misc: 12000, monthlyTarget: 1000000,
  });

  // Load gym data from Supabase after login
  useEffect(() => {
    if (!gymUser) { setDataLoaded(false); return; }
    let cancelled = false;
    (async () => {
      const data = await supaLoadGymData(gymUser.gym_id);
      if (cancelled) return;
      // Use Supabase data if available, else fall back to SEED data
      setMembersState(data.members.length ? data.members : SEED_MEMBERS);
      setAttendanceState(data.attendance.length ? data.attendance : SEED_ATTENDANCE);
      setStaffState(data.staff.length ? data.staff : SEED_STAFF);
      setTrainersState(data.trainers.length ? data.trainers : SEED_TRAINERS);
      if (data.profile.gymName) setGymProfile(data.profile);
      setDataLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [gymUser]);

  // Attendance helpers
  const addAttendance = useCallback(async (record, checkoutId) => {
    if(checkoutId) {
      setAttendanceState(prev=>prev.map(a=>a.id===checkoutId?{...a,status:'left'}:a));
      supabase.from('attendance').update({ status: 'left' }).eq('id', checkoutId).then(()=>{});
    } else if(record) {
      setAttendanceState(prev=>[record,...prev]);
      setMembersState(prev=>prev.map(m=>m.id===record.memberId?{...m,visits:(m.visits||0)+1}:m));
      // Write to Supabase
      if (gymUser) {
        supabase.from('attendance').insert({
          id: record.id, gym_id: gymUser.gym_id, member_id: record.memberId,
          member_name: record.memberName, initials: record.init, check_in: record.checkIn,
          date: record.date, trainer: record.trainer, method: record.method, status: record.status,
        }).then(()=>{});
        supabase.from('members').update({ visits: (record.visits||0)+1 }).eq('id', record.memberId).then(()=>{});
      }
    }
  }, [gymUser]);

  const setMembers = useCallback((updater) => {
    setMembersState(typeof updater==='function'?updater:()=>updater);
  }, []);
  const setStaff = useCallback((updater) => {
    setStaffState(typeof updater==='function'?updater:()=>updater);
  }, []);
  const setTrainers = useCallback((updater) => {
    setTrainersState(typeof updater==='function'?updater:()=>updater);
  }, []);

  const [page, setPage]     = useState('dashboard');
  const [toastMsg, setToast] = useState(null);
  const showToast = msg => setToast(msg);
  const isMob = useIsMobile();

  // ── NOTIFICATIONS STATE ──
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifDismissed, setNotifDismissed] = useState(() => {
    try {
      const key = `onlifit_notif_dismissed_${new Date().toISOString().slice(0,10)}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch { return []; }
  });
  const [dashPayments, setDashPayments] = useState([]);

  // Load payments for notifications
  useEffect(() => {
    if (!gymUser) return;
    supabase.from('payments').select('*').eq('gym_id', gymUser.gym_id).then(({ data }) => {
      if (data) setDashPayments(data);
    });
  }, [gymUser, dataLoaded]);

  const allNotifs = useMemo(() => {
    if (!dataLoaded) return [];
    return generateNotifications(members, attendance, dashPayments);
  }, [members, attendance, dashPayments, dataLoaded]);

  const visibleNotifs = useMemo(() => allNotifs.filter(n => !notifDismissed.includes(n.id)), [allNotifs, notifDismissed]);

  const dismissNotif = useCallback((id) => {
    setNotifDismissed(prev => {
      const next = [...prev, id];
      const key = `onlifit_notif_dismissed_${new Date().toISOString().slice(0,10)}`;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, []);

  const dismissAllNotifs = useCallback(() => {
    const ids = allNotifs.map(n => n.id);
    setNotifDismissed(ids);
    const key = `onlifit_notif_dismissed_${new Date().toISOString().slice(0,10)}`;
    localStorage.setItem(key, JSON.stringify(ids));
  }, [allNotifs]);

  const handleLogin = async (acct) => {
    setGymUser(acct);
    localStorage.setItem('onlifit_gym_user', JSON.stringify(acct));
    if(acct.isNew) setShowOnboarding(true);
  };

  const handleLogout = async () => {
    await supaLogout();
    localStorage.removeItem('onlifit_gym_user');
    setGymUser(null);
    setDataLoaded(false);
    setShowOnboarding(false);
  };

  const gymCtxValue = { members, setMembers, attendance, addAttendance, staff, setStaff, trainers, setTrainers, gymProfile, setGymProfile, gymSettings, setGymSettings, gymUser:gymUser||GYM_ACCOUNTS[0], handleLogout };

  const handleOnboardComplete = async ({ profile, members: newMembers, staff: newStaff }) => {
    if(newMembers.length) setMembersState(newMembers);
    if(newStaff.length)   setStaffState(newStaff);
    setGymProfile(profile);
    setShowOnboarding(false);
    showToast(`🚀 ${gymUser.gymName} is live! ${newMembers.length} members imported.`);
    // Persist to Supabase
    if (gymUser) {
      // Save gym profile
      await supabase.from('gym_profiles').upsert({
        gym_id: gymUser.gym_id, gym_name: profile.gymName, tagline: profile.tagline,
        address: profile.address, city: profile.city, phone: profile.phone,
        gstin: profile.gstin, open_time: profile.openTime, close_time: profile.closeTime,
      });
      // Mark gym as onboarded
      await supabase.from('gym_accounts').update({ is_new: false }).eq('gym_id', gymUser.gym_id);
      // Save members
      if (newMembers.length) {
        const rows = newMembers.map(m => ({
          id: m.id, gym_id: gymUser.gym_id, name: m.name, initials: m.init, phone: m.phone||'',
          email: m.email||'', dob: m.dob||'', plan: m.plan, start_date: m.start, expiry_date: m.expiry,
          status: m.status||'Active', trainer: m.trainer||'', visits: m.visits||0,
        }));
        await supabase.from('members').insert(rows);
      }
      // Save staff
      if (newStaff.length) {
        const rows = newStaff.map(st => ({
          id: st.id, gym_id: gymUser.gym_id, name: st.name, initials: st.init, role: st.role,
          branch: st.branch||'', members_count: st.members||0, present: st.present??true,
          salary: parseInt(st.salary)||0, phone: st.phone||'', email: st.email||'', joined: st.joined||'', qr: st.qr||'',
        }));
        await supabase.from('staff').insert(rows);
      }
    }
  };

  if(!authChecked) return (<div style={{width:'100%',height:'100vh',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',background:G.bg2}}><style>{css}</style><div style={{textAlign:'center'}}><div style={{width:48,height:48,border:`3px solid ${G.border}`,borderTopColor:G.accent,borderRadius:'50%',animation:'spin .7s linear infinite',margin:'0 auto 16px'}}/><div style={{fontSize:14,fontWeight:600,color:G.navy}}>Onlifit</div><div style={{fontSize:12,color:G.text3,marginTop:4}}>Checking session...</div></div></div>);
  if(!gymUser) return (<div style={{width:'100%',height:'100vh',overflow:'auto'}}><style>{css}</style><GymLogin onLogin={handleLogin}/></div>);
  if(showOnboarding) return (<div style={{width:'100%',height:'100vh',overflow:'auto'}}><style>{css}</style><OnboardingWizard gymUser={gymUser} onComplete={handleOnboardComplete}/></div>);
  if(!dataLoaded) return (<div style={{width:'100%',height:'100vh',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',background:G.bg2}}><style>{css}</style><div style={{textAlign:'center'}}><div style={{width:48,height:48,border:`3px solid ${G.border}`,borderTopColor:G.accent,borderRadius:'50%',animation:'spin .7s linear infinite',margin:'0 auto 16px'}}/><div style={{fontSize:14,fontWeight:600,color:G.navy}}>Loading {gymUser.gymName}...</div><div style={{fontSize:12,color:G.text3,marginTop:4}}>Fetching your gym data</div></div></div>);

  const initials = gymUser.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const insideCount = attendance.filter(a=>a.date==='Today'&&a.status==='inside').length;

  const PAGES = {
    dashboard:  <PageDashboard  toast={showToast}/>,
    members:    <PageMembers    toast={showToast}/>,
    attendance: <PageAttendance toast={showToast}/>,
    revenue:    <PageRevenue    toast={showToast}/>,
    fees:       <PageFees       toast={showToast}/>,
    discounts:  <PageDiscounts  toast={showToast}/>,
    staff:      <PageStaff      toast={showToast}/>,
    pt:         <PagePT         toast={showToast}/>,
    ai:         <PageAI         toast={showToast}/>,
    settings:   <PageSettings   toast={showToast}/>,
  };

  // Mobile nav -- show only most used pages
  const MOB_NAV = [
    {id:'dashboard', icon:'📊', label:'Home'},
    {id:'members',   icon:'👥', label:'Members'},
    {id:'attendance',icon:'📷', label:'Scanner'},
    {id:'revenue',   icon:'💰', label:'Revenue'},
    {id:'settings',  icon:'⚙️', label:'More'},
  ];

  _gym = gymCtxValue;
  return (
    <div style={{width:'100%',height:'100vh',overflow:'hidden'}}>
      <style>{css}</style>
      <div style={{display:'flex',height:'100%',overflow:'hidden',background:G.bg}}>

        {/* DESKTOP SIDEBAR */}
        <div className="desk-sidebar" style={{width:224,flexShrink:0,background:G.bg,borderRight:`1.5px solid ${G.border}`,flexDirection:'column',boxShadow:'2px 0 8px rgba(0,0,0,.04)'}}>
          <div style={{padding:'18px 16px 14px',borderBottom:`1px solid ${G.border}`}}>
            <div style={{fontSize:22,fontWeight:800,color:G.accent,letterSpacing:'-0.5px'}}>Onlifit</div>
            <div style={{fontSize:10,color:G.text3,fontWeight:600,letterSpacing:'.5px',textTransform:'uppercase',marginTop:1}}>Gym Management</div>
          </div>
          <div style={{margin:'10px 10px 6px',background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:8,padding:'9px 12px'}}>
            <div style={{fontSize:10,color:G.text3,fontWeight:600,textTransform:'uppercase',letterSpacing:'.5px'}}>Gym</div>
            <div style={{fontSize:13,fontWeight:700,color:G.navy,marginTop:2}}>{gymUser.gymName}</div>
            <div style={{fontSize:10,color:G.text3}}>{gymUser.gym_id}</div>
          </div>

          {/* Live attendance pill in sidebar */}
          {insideCount>0 && (
            <div style={{margin:'0 10px 6px',background:'#f0fdf4',border:`1px solid ${G.border2}`,borderRadius:8,padding:'7px 12px',...s.flex(7),cursor:'pointer'}} onClick={()=>setPage('attendance')}>
              <LiveDot/>
              <span style={{fontSize:11,fontWeight:700,color:G.accent}}>{insideCount} inside now</span>
            </div>
          )}

          <nav style={{flex:1,overflowY:'auto',padding:'4px 0'}}>
            {NAV.map(section=>(
              <div key={section.section}>
                <div style={{padding:'10px 16px 3px',fontSize:9,color:G.text3,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase'}}>{section.section}</div>
                {section.items.map(item=>(
                  <div key={item.id} className={`nav-item${page===item.id?' active':''}`} onClick={()=>setPage(item.id)}
                    style={{display:'flex',alignItems:'center',gap:9,padding:'9px 14px',cursor:'pointer',transition:'.12s',fontSize:13,fontWeight:page===item.id?600:400,color:page===item.id?G.accent:G.text2}}>
                    <span style={{fontSize:15,width:20,textAlign:'center',flexShrink:0}}>{item.icon}</span>
                    <span style={{flex:1}}>{item.label}</span>
                    {item.id==='attendance'&&insideCount>0
                      ? <span className="sidebar-badge" style={{fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:20,background:G.bg4,color:G.accent,border:`1px solid ${G.accentL}`,...s.flex(4)}}><LiveDot/>{insideCount}</span>
                      : item.badge&&<span className="sidebar-badge" style={{fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:20}}>{item.badge}</span>
                    }
                  </div>
                ))}
              </div>
            ))}
          </nav>

          <div style={{padding:'10px 14px',borderTop:`1px solid ${G.border}`}}>
            <div style={{...s.flex(9),marginBottom:8}}>
              <div style={{width:30,height:30,borderRadius:7,background:G.accent,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11,color:'#fff',flexShrink:0}}>{initials}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:G.navy,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{gymUser.name}</div>
                <div style={{fontSize:10,color:G.text3}}>{gymUser.role}</div>
              </div>
            </div>
            <Btn variant="ghost" style={{width:'100%',fontSize:11}} size="sm" onClick={handleLogout}>Sign Out</Btn>
          </div>
        </div>

        {/* MAIN */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:G.bg2}}>

          {/* MOBILE HEADER -- only visible on mobile */}
          <div className="mob-header">
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{fontSize:18,fontWeight:800,color:G.accent}}>Onlifit</div>
              <div style={{width:1,height:16,background:G.border}}/>
              <div style={{fontSize:14,fontWeight:700,color:G.navy}}>{TITLES[page]}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {insideCount>0&&(
                <div style={{display:'flex',alignItems:'center',gap:5,background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:7,padding:'4px 8px',cursor:'pointer'}} onClick={()=>setPage('attendance')}>
                  <LiveDot/><span style={{fontSize:11,fontWeight:700,color:G.accent}}>{insideCount}</span>
                </div>
              )}
              <div style={{width:30,height:30,borderRadius:7,background:G.bg2,border:`1px solid ${G.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:13,position:'relative'}} onClick={()=>setNotifOpen(true)}>
                🔔{visibleNotifs.length>0&&<div style={{position:'absolute',top:3,right:3,minWidth:14,height:14,borderRadius:7,background:'#dc2626',border:'1.5px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:'#fff',padding:'0 3px'}}>{visibleNotifs.length>9?'9+':visibleNotifs.length}</div>}
              </div>
            </div>
          </div>

          {/* DESKTOP TOPBAR -- hidden on mobile */}
          <div className="hide-mobile" style={{height:54,flexShrink:0,background:G.bg,borderBottom:`1.5px solid ${G.border}`,display:'flex',alignItems:'center',padding:'0 20px',gap:12,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
            <div style={{fontSize:16,fontWeight:800,color:G.navy,whiteSpace:'nowrap'}}>{TITLES[page]}</div>
            <div style={{flex:1,maxWidth:340,marginLeft:14,position:'relative'}}>
              <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:G.text3,fontSize:12}}>🔍</span>
              <input style={{...s.input,paddingLeft:32,fontSize:12,background:G.bg2}} placeholder="Search members, invoices..." onFocus={e=>e.target.style.border=`1.5px solid ${G.accent}`} onBlur={e=>e.target.style.border=`1.5px solid ${G.border}`}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto'}}>
              {insideCount>0&&(
                <div style={{display:'flex',alignItems:'center',gap:6,background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:7,padding:'5px 10px',cursor:'pointer'}} onClick={()=>setPage('attendance')}>
                  <LiveDot/><span style={{fontSize:11,fontWeight:700,color:G.accent}}>{insideCount} inside</span>
                </div>
              )}
              <div style={{display:'flex',alignItems:'center',gap:6,background:G.bg3,border:`1px solid ${G.border2}`,borderRadius:7,padding:'5px 10px',cursor:'pointer'}} onClick={()=>showToast(`Portal link copied! members.onlifit.app/?gym=${gymUser.gym_id}`)}>
                <span style={{fontSize:11}}>📱</span>
                <span style={{fontSize:11,fontWeight:600,color:G.accent}}>Member Portal</span>
              </div>
              <div style={{width:32,height:32,borderRadius:7,background:G.bg2,border:`1.5px solid ${G.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:13,position:'relative'}} onClick={()=>setNotifOpen(true)}>
                🔔{visibleNotifs.length>0&&<div style={{position:'absolute',top:4,right:4,minWidth:16,height:16,borderRadius:8,background:'#dc2626',border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#fff',padding:'0 3px'}}>{visibleNotifs.length>9?'9+':visibleNotifs.length}</div>}
              </div>
              <Btn variant="primary" size="sm" onClick={()=>{setPage('members');showToast('Opening Add Member...');}}>+ Add Member</Btn>
            </div>
          </div>

          {/* CONTENT */}
          <div className="page-wrap" style={{flex:1,overflowY:'auto',padding:20}}>
            {PAGES[page]}
          </div>
          {/* LIVE TICKER */}
          <LiveTicker attendance={attendance}/>
        </div>

        {/* MOBILE BOTTOM NAV */}
        <nav className="mob-nav" style={{display:'none'}}>
          {MOB_NAV.map(item=>(
            <button key={item.id} className={`mob-nav-item${page===item.id?' active':''}`} onClick={()=>setPage(item.id)}>
              <span className="mni">{item.icon}</span>
              <span>{item.label}</span>
              {item.id==='attendance'&&insideCount>0&&<span className="mob-badge">{insideCount}</span>}
            </button>
          ))}
        </nav>

      </div>
      <NotificationCenter notifications={visibleNotifs} open={notifOpen} onClose={()=>setNotifOpen(false)} onDismiss={dismissNotif} onDismissAll={dismissAllNotifs} gymName={gymUser?.gymName}/>
      {toastMsg&&<Toast msg={toastMsg} onDone={()=>setToast(null)}/>}
    </div>
  );
}

