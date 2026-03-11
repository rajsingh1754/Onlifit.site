import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import OwnerPanel from "./Onlifit_OwnerPanel"
import Reception from "./Onlifit_Reception"
import MemberPortal from "./Onlifit_MemberPortal"
import OnlifitFull from "./Onlifit_Full"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnlifitFull />} />
        <Route path="/owner" element={<OwnerPanel />} />
        <Route path="/reception" element={<Reception />} />
        <Route path="/member" element={<MemberPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App