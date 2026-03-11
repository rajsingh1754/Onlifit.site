import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import ErrorBoundary from "./ErrorBoundary"
import LoadingSpinner from "./LoadingSpinner"

const OnlifitFull = lazy(() => import("./Onlifit_Full"))
const OwnerPanel = lazy(() => import("./Onlifit_OwnerPanel"))
const Reception = lazy(() => import("./Onlifit_Reception"))
const MemberPortal = lazy(() => import("./Onlifit_MemberPortal"))

function LazyRoute({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LazyRoute><OnlifitFull /></LazyRoute>} />
        <Route path="/owner" element={<LazyRoute><OwnerPanel /></LazyRoute>} />
        <Route path="/reception" element={<LazyRoute><Reception /></LazyRoute>} />
        <Route path="/member" element={<LazyRoute><MemberPortal /></LazyRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App