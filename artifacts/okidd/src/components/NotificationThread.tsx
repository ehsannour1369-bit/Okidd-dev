import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Send } from "lucide-react";

interface Reply {
  id: number;
  notificationId: number;
  senderId: number;
  senderRole: string;
  senderName: string;
  body: string;
  createdAt: string;
}

interface Props {
  notifId: number;
  currentUserId: number;
  currentUserName: string;
  currentUserRole: string;
  glass?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  teacher: "معلم",
  school_manager: "مدیر مدرسه",
  branch_manager: "مدیر شعبه",
  parent: "والد",
  student: "دانش‌آموز",
  admin: "مدیر کل",
};

export default function NotificationThread({ notifId, currentUserId, currentUserName, currentUserRole, glass }: Props) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const { data: replies = [], isLoading } = useQuery<Reply[]>({
    queryKey: ["notif-replies", notifId],
    queryFn: () => api.get(`/notifications/${notifId}/replies`),
  });

  const sendMut = useMutation({
    mutationFn: (d: any) => api.post(`/notifications/${notifId}/replies`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif-replies", notifId] });
      setBody("");
    },
  });

  function handleSend() {
    if (!body.trim()) return;
    sendMut.mutate({
      senderId: currentUserId,
      senderRole: currentUserRole,
      senderName: currentUserName,
      body: body.trim(),
    });
  }

  const dividerColor = glass ? "rgba(255,255,255,0.3)" : "rgba(139,92,246,0.15)";
  const emptyColor = glass ? "#7c3aed" : "#6b5cf6";
  const textareaStyle: React.CSSProperties = {
    flex: 1,
    background: glass ? "rgba(255,255,255,0.25)" : "rgba(13,10,26,0.5)",
    border: glass ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(139,92,246,0.3)",
    borderRadius: 10,
    color: glass ? "#2d1b69" : "#f8f5ff",
    padding: "8px 12px",
    fontSize: 13,
    fontFamily: "Vazirmatn, sans-serif",
    outline: "none",
    direction: "rtl",
    resize: "none",
  };

  return (
    <div style={{ marginTop: 10, borderTop: `1px solid ${dividerColor}`, paddingTop: 10 }}>
      {isLoading && <p style={{ color: emptyColor, fontSize: 12, margin: "4px 0" }}>در حال بارگذاری...</p>}

      {/* Bubbles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10, maxHeight: 280, overflowY: "auto" }}>
        {!isLoading && replies.length === 0 && (
          <p style={{ color: emptyColor, fontSize: 12, textAlign: "center", margin: "4px 0" }}>هنوز پاسخی نیست — اولین نفر باشید</p>
        )}
        {replies.map(r => {
          const isMe = r.senderId === currentUserId;
          return (
            <div key={r.id} style={{ direction: "ltr", display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "78%",
                background: isMe
                  ? "rgba(124,58,237,0.3)"
                  : (glass ? "rgba(255,255,255,0.45)" : "rgba(30,18,60,0.85)"),
                border: isMe
                  ? "1px solid rgba(124,58,237,0.5)"
                  : (glass ? "1px solid rgba(255,255,255,0.6)" : "1px solid rgba(139,92,246,0.2)"),
                borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                padding: "8px 12px",
                direction: "rtl",
              }}>
                {!isMe && (
                  <div style={{ fontSize: 11, color: glass ? "#7c3aed" : "#a855f7", marginBottom: 3, fontWeight: 600 }}>
                    {r.senderName} · {ROLE_LABELS[r.senderRole] ?? r.senderRole}
                  </div>
                )}
                <p style={{ color: glass ? "#2d1b69" : "#f0e8ff", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{r.body}</p>
                <div style={{ fontSize: 10, color: glass ? "#9333ea" : "#8b5cf6", marginTop: 4, textAlign: "left" }}>
                  {new Date(r.createdAt).toLocaleDateString("fa-IR")} {new Date(r.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply input */}
      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="پاسخ بنویسید... (Enter برای ارسال)"
          rows={2}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          style={textareaStyle}
        />
        <button
          onClick={handleSend}
          disabled={!body.trim() || sendMut.isPending}
          style={{ width: 42, background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !body.trim() ? 0.4 : 1 }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
