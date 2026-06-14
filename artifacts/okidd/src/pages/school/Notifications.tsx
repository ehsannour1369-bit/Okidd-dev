import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import PageTopBar from "../../components/PageTopBar";
import NotificationThread from "../../components/NotificationThread";
import { showToast } from "../../lib/toast";
import { Plus, Trash2, Bell, Filter, ChevronDown, Calendar, MessageCircle, ChevronUp, Activity, ToggleLeft, ToggleRight, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatFaDateTime } from "../../lib/dateUtils";

interface Notification {
  id: number; title: string; body: string; targetRole: string;
  branchId?: number; gradeLevelId?: number; classId?: number;
  senderId?: number; type?: string; allowReply?: boolean; status?: string; createdAt?: string;
}

const inputStyle = {
  width: "100%", background: "rgba(245,243,255,0.90)", border: "1px solid rgba(139,92,246,0.3)",
  borderRadius: 10, color: "#1e1b4b", padding: "10px 12px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl" as const,
  boxSizing: "border-box" as const,
};

const selectStyle = { ...inputStyle, appearance: "none" as const };

function SelectRow({ label, value, onChange, options, placeholder }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: { id: number; name: string }[];
  placeholder: string;
}) {
  return (
    <div>
      <label style={{ display: "block", color: "#3730a3", fontSize: 13, marginBottom: 5 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <ChevronDown size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#4f46e5", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

const roleLabel = (r: string) => ({ student: "دانش‌آموز", teacher: "معلم", parent: "والدین", branch_manager: "مدیر شعبه", school_manager: "مدیر مدرسه" } as any)[r] ?? r;

const roleColor = (r: string) => ({
  student: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)", text: "#60a5fa" },
  teacher: { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.3)", text: "#15803d" },
  parent: { bg: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,0.3)", text: "#fb923c" },
  branch_manager: { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", text: "#6366f1" },
  school_manager: { bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)", text: "#7c3aed" },
} as any)[r] ?? { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.30)", text: "#4338ca" };

type SectionTab = "manual" | "activity" | "pending";

function isoStartOf(unit: "day" | "week" | "month"): Date {
  const now = new Date();
  if (unit === "day") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (unit === "week") { const d = new Date(now); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default function SchoolNotifications() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [sectionTab, setSectionTab] = useState<SectionTab>("manual");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [activitySearch, setActivitySearch] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState<"all" | "started" | "stopped">("all");
  const [activityDateFilter, setActivityDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  const [form, setForm] = useState({
    title: "", body: "", targetRole: "student",
    branchId: "", gradeLevelId: "", gradeId: "", classId: "",
    allowReply: true,
  });

  const reset = () => {
    setForm({ title: "", body: "", targetRole: "student", branchId: "", gradeLevelId: "", gradeId: "", classId: "", allowReply: true });
    setShowForm(false);
  };

  const { data: rawManual = [] } = useQuery<Notification[]>({
    queryKey: ["notifications-manual", user?.schoolId],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}&type=manual&status=approved`),
    enabled: !!user?.schoolId,
  });
  const { data: rawActivity = [] } = useQuery<Notification[]>({
    queryKey: ["notifications-activity", user?.schoolId],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}&type=activity`),
    enabled: !!user?.schoolId,
  });
  const { data: rawPending = [] } = useQuery<Notification[]>({
    queryKey: ["notifications-pending", user?.schoolId],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}&status=pending`),
    enabled: !!user?.schoolId,
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["branches", user?.schoolId],
    queryFn: () => api.get(`/branches?schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });
  const { data: gradeLevels = [] } = useQuery<any[]>({
    queryKey: ["grade-levels", form.branchId],
    queryFn: () => api.get(`/grade-levels?branchId=${form.branchId}`),
    enabled: !!form.branchId,
  });
  const { data: grades = [] } = useQuery<any[]>({
    queryKey: ["grades", form.gradeLevelId],
    queryFn: () => api.get(`/grades?gradeLevelId=${form.gradeLevelId}`),
    enabled: !!form.gradeLevelId,
  });
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["classes-grade", form.gradeId],
    queryFn: () => api.get(`/classes?gradeId=${form.gradeId}`),
    enabled: !!form.gradeId,
  });

  const branchMap = Object.fromEntries(branches.map((b: any) => [b.id, b.name]));
  const glMap = Object.fromEntries(gradeLevels.map((g: any) => [g.id, g.name]));
  const classMap = Object.fromEntries(classes.map((c: any) => [c.id, c.name]));

  const { data: allGradeLevels = [] } = useQuery<any[]>({
    queryKey: ["all-grade-levels-notif"],
    queryFn: async () => {
      const all = await Promise.all(branches.map((b: any) => api.get(`/grade-levels?branchId=${b.id}`)));
      return all.flat();
    },
    enabled: branches.length > 0,
  });
  const { data: allClasses = [] } = useQuery<any[]>({
    queryKey: ["all-classes-school-notif", user?.schoolId],
    queryFn: () => api.get(`/school-classes?schoolId=${user?.schoolId}`),
    enabled: !!user?.schoolId,
  });

  const allGlMap = Object.fromEntries(allGradeLevels.map((g: any) => [g.id, g.name]));
  const allClassMap = Object.fromEntries(allClasses.map((c: any) => [c.id, c.name]));
  const allBranchMap = Object.fromEntries(branches.map((b: any) => [b.id, b.name]));

  const createMut = useMutation({
    mutationFn: (d: any) => {
      const payload: any = {
        title: d.title, body: d.body, targetRole: d.targetRole, schoolId: user?.schoolId,
        senderId: user?.id, type: "manual", allowReply: d.allowReply,
      };
      if (d.branchId) payload.branchId = parseInt(d.branchId);
      if (d.gradeLevelId) payload.gradeLevelId = parseInt(d.gradeLevelId);
      if (d.classId) payload.classId = parseInt(d.classId);
      return api.post("/notifications", payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); reset(); showToast("اعلان با موفقیت ارسال شد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در ارسال اعلان", "error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/notifications/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); showToast("اعلان حذف شد"); },
    onError: (e: any) => showToast(e?.message ?? "خطا", "error"),
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/status`, { status: "approved" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); showToast("اعلان تایید شد ✓"); },
    onError: () => showToast("خطا در تایید اعلان", "error"),
  });

  const rejectMut = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/status`, { status: "rejected" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); showToast("اعلان رد شد"); },
    onError: () => showToast("خطا در رد اعلان", "error"),
  });

  function toggleExpand(id: number) {
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const manualNotifs = [...rawManual].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  const pendingNotifs = [...rawPending].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  const activityNotifs = [...rawActivity]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .filter(n => {
      if (activitySearch && !n.body.includes(activitySearch) && !n.title.includes(activitySearch)) return false;
      if (activityTypeFilter === "started" && !n.title.includes("شروع")) return false;
      if (activityTypeFilter === "stopped" && !n.title.includes("توقف")) return false;
      if (activityDateFilter !== "all" && n.createdAt) {
        const cutoff = isoStartOf(activityDateFilter === "today" ? "day" : activityDateFilter === "week" ? "week" : "month");
        if (new Date(n.createdAt) < cutoff) return false;
      }
      return true;
    });

  const hasStudentOrParent = form.targetRole === "student" || form.targetRole === "parent";

  const NotifCard = ({ n, isActivity }: { n: Notification; isActivity: boolean }) => {
    const rc = roleColor(n.targetRole);
    const expanded = expandedIds.has(n.id);
    return (
      <div style={{
        background: "rgba(255,255,255,0.88)", border: `1px solid ${isActivity ? "rgba(245,158,11,0.25)" : "rgba(139,92,246,0.2)"}`,
        borderRadius: 14, padding: "16px 18px",
        borderRight: isActivity ? "3px solid rgba(245,158,11,0.5)" : undefined,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: isActivity ? "rgba(245,158,11,0.12)" : "rgba(99,102,241,0.15)",
            border: `1px solid ${isActivity ? "rgba(245,158,11,0.3)" : "rgba(124,58,237,0.3)"}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {isActivity ? <Activity size={16} style={{ color: "#d97706" }} /> : <Bell size={18} style={{ color: "#a855f7" }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 15 }}>{n.title}</div>
              <span style={{ background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 999, padding: "2px 8px", fontSize: 11, color: rc.text, whiteSpace: "nowrap" }}>
                {roleLabel(n.targetRole)}
              </span>
              {!isActivity && n.allowReply === false && (
                <span style={{ background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#6b7280" }}>
                  بدون پاسخ
                </span>
              )}
            </div>
            <p style={{ color: "#3730a3", fontSize: 13, margin: "0 0 6px", lineHeight: 1.6 }}>{n.body}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
              {n.createdAt && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#4f46e5", fontSize: 11 }}>
                  <Calendar size={11} />
                  {formatFaDateTime(n.createdAt)}
                </span>
              )}
              {n.branchId && !n.classId && !n.gradeLevelId && (
                <span style={{ fontSize: 11, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 999, padding: "1px 7px", color: "#93c5fd" }}>شعبه: {allBranchMap[n.branchId!] ?? n.branchId}</span>
              )}
              {n.gradeLevelId && !n.classId && (
                <span style={{ fontSize: 11, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 999, padding: "1px 7px", color: "#93c5fd" }}>مقطع: {allGlMap[n.gradeLevelId!] ?? n.gradeLevelId}</span>
              )}
              {n.classId && (
                <span style={{ fontSize: 11, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 999, padding: "1px 7px", color: "#3730a3" }}>کلاس: {allClassMap[n.classId!] ?? n.classId}</span>
              )}
              {!n.branchId && !n.gradeLevelId && !n.classId && !isActivity && (
                <span style={{ fontSize: 11, color: "#6b7280" }}>همه مدرسه</span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
            {!isActivity && (
              <button onClick={() => toggleExpand(n.id)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: expanded ? "rgba(124,58,237,0.12)" : "rgba(245,243,255,0.8)", border: "1px solid rgba(124,58,237,0.30)", borderRadius: 8, color: "#7c3aed", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 600 }}>
                <MessageCircle size={12} />
                پاسخ‌ها
                {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            )}
            {!isActivity && (
              <button onClick={() => { if (confirm("این اعلان حذف شود؟")) deleteMut.mutate(n.id); }}
                style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#f87171", padding: "5px 8px", cursor: "pointer", flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        {expanded && !isActivity && (
          <NotificationThread
            notifId={n.id}
            currentUserId={user?.id ?? 0}
            currentUserName={user?.name ?? ""}
            currentUserRole="school_manager"
            glass={false}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <PageTopBar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>اعلان‌ها</h1>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
          background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none",
          borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600,
          fontFamily: "Vazirmatn, sans-serif", cursor: "pointer",
        }}>
          <Plus size={16} /> اعلان جدید
        </button>
      </div>

      {showForm && (
        <div style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <h3 style={{ color: "#1e1b4b", fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>ارسال اعلان جدید</h3>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={{ display: "block", color: "#3730a3", fontSize: 13, marginBottom: 5 }}>عنوان</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="عنوان اعلان..." />
            </div>
            <div>
              <label style={{ display: "block", color: "#3730a3", fontSize: 13, marginBottom: 5 }}>متن اعلان</label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="متن پیام را بنویسید..." />
            </div>
            <div>
              <label style={{ display: "block", color: "#3730a3", fontSize: 13, marginBottom: 5 }}>مخاطب</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {[{ v: "student", l: "دانش‌آموزان" }, { v: "parent", l: "والدین" }, { v: "teacher", l: "معلمان" }].map(({ v, l }) => (
                  <button key={v} onClick={() => setForm({ ...form, targetRole: v, branchId: "", gradeLevelId: "", gradeId: "", classId: "" })}
                    style={{
                      padding: "9px 0", borderRadius: 10, border: "1px solid",
                      borderColor: form.targetRole === v ? "#a855f7" : "rgba(139,92,246,0.25)",
                      background: form.targetRole === v ? "rgba(124,58,237,0.25)" : "transparent",
                      color: form.targetRole === v ? "#d8b4fe" : "#4f46e5",
                      fontFamily: "Vazirmatn, sans-serif", fontSize: 13, cursor: "pointer", fontWeight: 600,
                    }}>{l}</button>
                ))}
              </div>
            </div>

            {hasStudentOrParent && (
              <div style={{ background: "rgba(245,243,255,0.65)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <Filter size={14} style={{ color: "#4f46e5" }} />
                  <span style={{ color: "#3730a3", fontSize: 13, fontWeight: 600 }}>محدوده ارسال (اختیاری)</span>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  <SelectRow label="شعبه" value={form.branchId} onChange={v => setForm({ ...form, branchId: v, gradeLevelId: "", gradeId: "", classId: "" })} options={branches} placeholder="— همه شعبه‌ها —" />
                  {form.branchId && <SelectRow label="مقطع تحصیلی" value={form.gradeLevelId} onChange={v => setForm({ ...form, gradeLevelId: v, gradeId: "", classId: "" })} options={gradeLevels} placeholder="— همه مقاطع —" />}
                  {form.gradeLevelId && <SelectRow label="پایه" value={form.gradeId} onChange={v => setForm({ ...form, gradeId: v, classId: "" })} options={grades} placeholder="— همه پایه‌ها —" />}
                  {form.gradeId && <SelectRow label="کلاس" value={form.classId} onChange={v => setForm({ ...form, classId: v })} options={classes} placeholder="— همه کلاس‌های این پایه —" />}
                  {form.branchId && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: "#4338ca" }}>ارسال به:</span>
                      {form.classId
                        ? <span style={{ fontSize: 11, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 999, padding: "2px 8px", color: "#d8b4fe" }}>کلاس {classMap[parseInt(form.classId)] ?? form.classId}</span>
                        : form.gradeId
                          ? <span style={{ fontSize: 11, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 999, padding: "2px 8px", color: "#d8b4fe" }}>پایه {grades.find((g: any) => g.id === parseInt(form.gradeId))?.name ?? form.gradeId}</span>
                          : form.gradeLevelId
                            ? <span style={{ fontSize: 11, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 999, padding: "2px 8px", color: "#d8b4fe" }}>مقطع {glMap[parseInt(form.gradeLevelId)] ?? form.gradeLevelId}</span>
                            : <span style={{ fontSize: 11, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 999, padding: "2px 8px", color: "#d8b4fe" }}>شعبه {branchMap[parseInt(form.branchId)] ?? form.branchId}</span>
                      }
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(245,243,255,0.60)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: "12px 16px" }}>
              <div>
                <div style={{ color: "#3730a3", fontSize: 13, fontWeight: 600 }}>اجازه پاسخ به گیرنده</div>
                <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>آیا گیرنده می‌تواند به این اعلان پاسخ دهد؟</div>
              </div>
              <button onClick={() => setForm({ ...form, allowReply: !form.allowReply })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                {form.allowReply ? <ToggleRight size={32} color="#7c3aed" /> : <ToggleLeft size={32} color="#9ca3af" />}
              </button>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => createMut.mutate(form)} disabled={!form.title || !form.body || createMut.isPending}
                style={{
                  flex: 1, padding: "11px 0",
                  background: form.title && form.body ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(99,102,241,0.20)",
                  border: "none", borderRadius: 10, color: "white", fontWeight: 600,
                  fontFamily: "Vazirmatn, sans-serif", cursor: form.title && form.body ? "pointer" : "not-allowed",
                }}>
                {createMut.isPending ? "در حال ارسال..." : "ارسال اعلان"}
              </button>
              <button onClick={reset} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10, color: "#a855f7", fontFamily: "Vazirmatn, sans-serif", cursor: "pointer" }}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 6, background: "rgba(245,243,255,0.85)", border: "1px solid rgba(139,92,246,0.20)", borderRadius: 14, padding: 5, marginBottom: 18 }}>
        {([
          ["manual", <Bell size={14} />, "اعلان‌های مدیریتی", manualNotifs.length, false],
          ["activity", <Activity size={14} />, "فعالیت دانش‌آموزان", activityNotifs.length, false],
          ["pending", <Clock size={14} />, "در انتظار تایید", pendingNotifs.length, true],
        ] as const).map(([val, Icon, label, count, warn]) => (
          <button key={val} onClick={() => setSectionTab(val as SectionTab)} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
            fontFamily: "Vazirmatn, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: sectionTab === val
              ? warn ? "linear-gradient(135deg,#d97706,#f59e0b)" : "linear-gradient(135deg,#7c3aed,#a855f7)"
              : "transparent",
            color: sectionTab === val ? "white" : warn ? "#d97706" : "#3730a3",
            boxShadow: sectionTab === val ? warn ? "0 4px 14px rgba(217,119,6,0.35)" : "0 4px 14px rgba(124,58,237,0.35)" : "none",
            transition: "all 0.2s",
          }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {Icon} {label}
              {(count as number) > 0 && (
                <span style={{ background: sectionTab === val ? "rgba(255,255,255,0.3)" : warn ? "rgba(217,119,6,0.15)" : "rgba(124,58,237,0.15)", borderRadius: 999, padding: "1px 7px", fontSize: 11 }}>
                  {(count as number).toLocaleString("fa-IR")}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Manual notifications */}
      {sectionTab === "manual" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {manualNotifs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#4f46e5" }}>
              <Bell size={40} style={{ opacity: 0.4, display: "block", margin: "0 auto 10px" }} />
              <p style={{ margin: 0 }}>هیچ اعلان مدیریتی ارسال نشده</p>
            </div>
          ) : manualNotifs.map(n => <NotifCard key={n.id} n={n} isActivity={false} />)}
        </div>
      )}

      {/* Activity notifications with filters */}
      {sectionTab === "activity" && (
        <div>
          {/* Filter bar */}
          <div style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#d97706", pointerEvents: "none" }} />
              <input
                value={activitySearch}
                onChange={e => setActivitySearch(e.target.value)}
                placeholder="جستجو بر اساس نام دانش‌آموز..."
                style={{ width: "100%", background: "rgba(245,243,255,0.9)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, color: "#1e1b4b", padding: "8px 10px 8px 10px", paddingRight: 36, fontSize: 13, fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#92400e", flexShrink: 0 }}>نوع:</span>
              {([["all", "همه"], ["started", "📚 شروع"], ["stopped", "⏸️ توقف"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setActivityTypeFilter(v)}
                  style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid", borderColor: activityTypeFilter === v ? "#d97706" : "rgba(245,158,11,0.3)", background: activityTypeFilter === v ? "rgba(217,119,6,0.15)" : "transparent", color: activityTypeFilter === v ? "#92400e" : "#b45309", fontSize: 12, fontFamily: "Vazirmatn", cursor: "pointer", fontWeight: activityTypeFilter === v ? 700 : 400, flexShrink: 0 }}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#92400e", flexShrink: 0 }}>بازه:</span>
              {([["all", "همه"], ["today", "امروز"], ["week", "این هفته"], ["month", "این ماه"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setActivityDateFilter(v)}
                  style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid", borderColor: activityDateFilter === v ? "#d97706" : "rgba(245,158,11,0.3)", background: activityDateFilter === v ? "rgba(217,119,6,0.15)" : "transparent", color: activityDateFilter === v ? "#92400e" : "#b45309", fontSize: 12, fontFamily: "Vazirmatn", cursor: "pointer", fontWeight: activityDateFilter === v ? 700 : 400, flexShrink: 0 }}>
                  {l}
                </button>
              ))}
              <span style={{ fontSize: 11, color: "#9ca3af", marginRight: "auto", flexShrink: 0 }}>{activityNotifs.length.toLocaleString("fa-IR")} نتیجه</span>
            </div>
          </div>

          {activityNotifs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#d97706" }}>
              <Activity size={40} style={{ opacity: 0.4, display: "block", margin: "0 auto 10px" }} />
              <p style={{ margin: 0 }}>{activitySearch || activityTypeFilter !== "all" || activityDateFilter !== "all" ? "نتیجه‌ای یافت نشد" : "هیچ فعالیت یادگیری ثبت نشده"}</p>
            </div>
          ) : (
            <>
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>
                <Activity size={13} />
                این اعلان‌ها به‌صورت خودکار هنگام شروع و توقف یادگیری دانش‌آموزان ایجاد می‌شوند
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activityNotifs.map(n => <NotifCard key={n.id} n={n} isActivity={true} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* Pending approval notifications */}
      {sectionTab === "pending" && (
        <div>
          {pendingNotifs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#d97706" }}>
              <CheckCircle size={40} style={{ opacity: 0.4, display: "block", margin: "0 auto 10px" }} />
              <p style={{ margin: 0 }}>هیچ اعلانی در انتظار تایید نیست</p>
            </div>
          ) : (
            <>
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={13} />
                این اعلان‌ها توسط معلمان ارسال شده‌اند و نیاز به تایید شما دارند تا به دانش‌آموزان یا والدین نمایش داده شوند
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pendingNotifs.map(n => {
                  const rc = roleColor(n.targetRole);
                  return (
                    <div key={n.id} style={{ background: "rgba(255,255,255,0.88)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 14, padding: "16px 18px", borderRight: "3px solid rgba(217,119,6,0.6)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Clock size={18} style={{ color: "#d97706" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 15 }}>{n.title}</div>
                            <span style={{ background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 999, padding: "2px 8px", fontSize: 11, color: rc.text }}>
                              {roleLabel(n.targetRole)}
                            </span>
                            <span style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "#92400e" }}>
                              در انتظار تایید
                            </span>
                          </div>
                          <p style={{ color: "#3730a3", fontSize: 13, margin: "0 0 6px", lineHeight: 1.6 }}>{n.body}</p>
                          {n.createdAt && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#d97706", fontSize: 11 }}>
                              <Calendar size={11} />
                              {formatFaDateTime(n.createdAt)}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => approveMut.mutate(n.id)}
                            disabled={approveMut.isPending}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 8, color: "#059669", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700 }}>
                            <CheckCircle size={14} /> تایید
                          </button>
                          <button
                            onClick={() => { if (confirm("این اعلان رد شود؟")) rejectMut.mutate(n.id); }}
                            disabled={rejectMut.isPending}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.30)", borderRadius: 8, color: "#ef4444", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 700 }}>
                            <XCircle size={14} /> رد
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
