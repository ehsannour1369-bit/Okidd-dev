import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { showToast } from "../../lib/toast";
import { Plus, Trash2, Bell, Filter, ChevronDown } from "lucide-react";

interface Notification {
  id: number; title: string; body: string; targetRole: string;
  branchId?: number; gradeLevelId?: number; classId?: number; createdAt?: string;
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

const roleLabel = (r: string) => ({ student: "دانش‌آموز", teacher: "معلم", parent: "والدین" } as any)[r] ?? r;

const roleColor = (r: string) => ({
  student: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)", text: "#60a5fa" },
  teacher: { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.3)", text: "#15803d" },
  parent: { bg: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,0.3)", text: "#fb923c" },
} as any)[r] ?? { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.30)", text: "#4338ca" };

export default function SchoolNotifications() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "", body: "", targetRole: "student",
    branchId: "", gradeLevelId: "", gradeId: "", classId: "",
  });

  const reset = () => {
    setForm({ title: "", body: "", targetRole: "student", branchId: "", gradeLevelId: "", gradeId: "", classId: "" });
    setShowForm(false);
  };

  const { data: notifs = [] } = useQuery<Notification[]>({
    queryKey: ["notifications", user?.schoolId],
    queryFn: () => api.get(`/notifications?schoolId=${user?.schoolId}`),
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

  // Name lookup maps for displaying in list
  const branchMap = Object.fromEntries(branches.map((b: any) => [b.id, b.name]));
  const glMap = Object.fromEntries(gradeLevels.map((g: any) => [g.id, g.name]));
  const classMap = Object.fromEntries(classes.map((c: any) => [c.id, c.name]));

  // All grade-levels and classes for all branches (for the list view lookups)
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

  const hasStudentOrParent = form.targetRole === "student" || form.targetRole === "parent";

  return (
    <div>
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

            {/* Cascading filters */}
            {hasStudentOrParent && (
              <div style={{ background: "rgba(245,243,255,0.65)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <Filter size={14} style={{ color: "#4f46e5" }} />
                  <span style={{ color: "#3730a3", fontSize: 13, fontWeight: 600 }}>محدوده ارسال (اختیاری)</span>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  <SelectRow
                    label="شعبه"
                    value={form.branchId}
                    onChange={v => setForm({ ...form, branchId: v, gradeLevelId: "", gradeId: "", classId: "" })}
                    options={branches}
                    placeholder="— همه شعبه‌ها —"
                  />
                  {form.branchId && (
                    <SelectRow
                      label="مقطع تحصیلی"
                      value={form.gradeLevelId}
                      onChange={v => setForm({ ...form, gradeLevelId: v, gradeId: "", classId: "" })}
                      options={gradeLevels}
                      placeholder="— همه مقاطع —"
                    />
                  )}
                  {form.gradeLevelId && (
                    <SelectRow
                      label="پایه"
                      value={form.gradeId}
                      onChange={v => setForm({ ...form, gradeId: v, classId: "" })}
                      options={grades}
                      placeholder="— همه پایه‌ها —"
                    />
                  )}
                  {form.gradeId && (
                    <SelectRow
                      label="کلاس"
                      value={form.classId}
                      onChange={v => setForm({ ...form, classId: v })}
                      options={classes}
                      placeholder="— همه کلاس‌های این پایه —"
                    />
                  )}

                  {/* Summary badge */}
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
              <button onClick={reset} style={{
                flex: 1, padding: "11px 0", background: "transparent",
                border: "1px solid rgba(124,58,237,0.5)", borderRadius: 10,
                color: "#a855f7", fontFamily: "Vazirmatn, sans-serif", cursor: "pointer",
              }}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[...notifs].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).map(n => {
          const rc = roleColor(n.targetRole);
          return (
            <div key={n.id} style={{
              background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0,
              }}>
                <Bell size={18} style={{ color: "#a855f7" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 15 }}>{n.title}</div>
                  <span style={{ background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 999, padding: "2px 8px", fontSize: 11, color: rc.text, whiteSpace: "nowrap" }}>
                    {roleLabel(n.targetRole)}
                  </span>
                </div>
                <p style={{ color: "#3730a3", fontSize: 13, margin: "0 0 6px", lineHeight: 1.6 }}>{n.body}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                  {n.createdAt && <span style={{ color: "#4f46e5", fontSize: 11 }}>{new Date(n.createdAt).toLocaleDateString("fa-IR")}</span>}
                  {n.branchId && !n.classId && !n.gradeLevelId && (
                    <span style={{ fontSize: 11, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 999, padding: "1px 7px", color: "#93c5fd" }}>شعبه: {allBranchMap[n.branchId] ?? n.branchId}</span>
                  )}
                  {n.gradeLevelId && !n.classId && (
                    <span style={{ fontSize: 11, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 999, padding: "1px 7px", color: "#93c5fd" }}>مقطع: {allGlMap[n.gradeLevelId] ?? n.gradeLevelId}</span>
                  )}
                  {n.classId && (
                    <span style={{ fontSize: 11, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 999, padding: "1px 7px", color: "#3730a3" }}>کلاس: {allClassMap[n.classId] ?? n.classId}</span>
                  )}
                  {!n.branchId && !n.gradeLevelId && !n.classId && (
                    <span style={{ fontSize: 11, color: "#6b7280" }}>همه مدرسه</span>
                  )}
                </div>
              </div>
              <button onClick={() => { if (confirm("این اعلان حذف شود؟")) deleteMut.mutate(n.id); }}
                style={{
                  background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)",
                  borderRadius: 8, color: "#f87171", padding: "5px 8px", cursor: "pointer", flexShrink: 0,
                }}>
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        {notifs.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#4f46e5" }}>
            <Bell size={40} style={{ opacity: 0.4, display: "block", margin: "0 auto 10px" }} />
            <p style={{ margin: 0 }}>هیچ اعلانی ارسال نشده</p>
          </div>
        )}
      </div>
    </div>
  );
}
