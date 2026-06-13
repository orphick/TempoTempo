import useToastStore from "../store/useToastStore";

const ICONS = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

const COLORS = {
  success: {
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.3)",
    icon: "#4ade80",
  },
  error: {
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.3)",
    icon: "#f87171",
  },
  info: {
    bg: "rgba(139,124,248,0.12)",
    border: "rgba(139,124,248,0.3)",
    icon: "#a99ef9",
  },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        left: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => {
        const c = COLORS[toast.type] || COLORS.info;
        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: "12px",
              padding: "14px 18px",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              minWidth: "280px",
              maxWidth: "360px",
              pointerEvents: "all",
              cursor: "pointer",
              animation: "slideIn 0.25s ease",
            }}
          >
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: `${c.icon}20`,
                color: c.icon,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {ICONS[toast.type]}
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "Vazirmatn, sans-serif",
                lineHeight: 1.5,
              }}
            >
              {toast.message}
            </span>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
