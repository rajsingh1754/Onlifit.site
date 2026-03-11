import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { supabase } from "./supabase"
import OwnerPanel from "./Onlifit_OwnerPanel"
import Reception from "./Onlifit_Reception"
import MemberPortal from "./Onlifit_MemberPortal"
import OnlifitFull from "./Onlifit_Full"

function ProtectedRoute({ children, allowedRoles }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'denied'
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setStatus('denied'); return; }
      if (!allowedRoles) { setStatus('ok'); return; }
      const { data } = await supabase.from('gym_accounts').select('role').eq('email', session.user.email).single();
      setStatus(data && allowedRoles.includes(data.role) ? 'ok' : 'denied');
    })();
  }, []);
  if (status === 'loading') return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif',color:'#6b7280'}}>Checking access...</div>;
  if (status === 'denied') return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnlifitFull />} />
        <Route path="/owner" element={<ProtectedRoute allowedRoles={['super_admin']}><OwnerPanel /></ProtectedRoute>} />
        <Route path="/reception" element={<ProtectedRoute allowedRoles={['gym_owner','receptionist']}><Reception /></ProtectedRoute>} />
        <Route path="/member" element={<MemberPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App