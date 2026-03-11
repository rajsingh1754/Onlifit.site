export default function LoadingSpinner() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100vh", background: "#f8fafc",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <div style={{
        width: 44, height: 44, border: "4px solid #e2e8f0",
        borderTopColor: "#6c47ff", borderRadius: "50%",
        animation: "onlifit-spin 0.8s linear infinite"
      }} />
      <p style={{ color: "#64748b", fontSize: 14, marginTop: 16 }}>Loading…</p>
      <style>{`@keyframes onlifit-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
