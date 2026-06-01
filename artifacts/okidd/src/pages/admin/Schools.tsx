import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { Plus, Power, Edit2, Search, ChevronDown, ChevronUp, GitBranch, Users, Package, X, Trash2, Settings2 } from "lucide-react";

interface BranchDetail {
  branchId: number; branchName: string; studentCount: number;
  managerName: string | null; academicYear: string | null;
}
interface School {
  id: number; name: string; address?: string; phone?: string;
  managerName?: string; managerPhone?: string; managerNationalId?: string;
  status: string; branchCount: number; studentCount: number; teacherCount: number;
  totalPackages: number; branchDetails: BranchDetail[];
}
interface UserCandidate {
  id: number; name: string; phone?: string; nationalId?: string; role: string; email: string;
}

const ACADEMIC_YEARS = ["1401-1402","1402-1403","1403-1404","1404-1405","1405-1406","1406-1407"];
const EDUCATIONAL_LEVELS = ["ابتدایی","متوسطه اول","متوسطه دوم"];

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,252,235,0.90)", border: "1px solid rgba(139,92,246,0.3)",
  borderRadius: 10, color: "#78350f", padding: "10px 14px", fontSize: 14,
  fontFamily: "Vazirmatn, sans-serif", outline: "none", direction: "rtl", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", color: "#92400e", fontSize: 13, fontWeight: 500, marginBottom: 6,
};
const sectionDivider = (title: string) => (
  <div style={{ margin: "20px 0 12px", borderBottom: "1px solid rgba(139,92,246,0.25)", paddingBottom: 6 }}>
    <span style={{ color: "#d97706", fontSize: 13, fontWeight: 700 }}>{title}</span>
  </div>
);

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: any; wide?: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{
        background: "#fffef5", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 20,
        padding: 28, width: "100%", maxWidth: wide ? 680 : 520, maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(180,83,9,0.12)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#78350f", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, color: "#b45309", cursor: "pointer", fontSize: 18, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Vazirmatn" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", readOnly = false }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type} value={value} onChange={e => !readOnly && onChange?.(e.target.value)}
        placeholder={placeholder} readOnly={readOnly}
        style={{ ...inputStyle, background: readOnly ? "rgba(139,92,246,0.06)" : "rgba(255,252,235,0.90)", opacity: readOnly ? 0.7 : 1, cursor: readOnly ? "not-allowed" : "text" }}
        onFocus={e => !readOnly && (e.target.style.borderColor = "#7c3aed")}
        onBlur={e => e.target.style.borderColor = "rgba(180,83,9,0.25)"}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: "pointer", appearance: "none" }}>
        <option value="">انتخاب کنید</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function MultiSelect({ label, selected, onChange, options }: { label: string; selected: string[]; onChange: (v: string[]) => void; options: string[] }) {
  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map(o => (
          <button key={o} onClick={() => toggle(o)} type="button" style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontFamily: "Vazirmatn",
            background: selected.includes(o) ? "rgba(180,83,9,0.20)" : "rgba(255,252,235,0.90)",
            border: `1px solid ${selected.includes(o) ? "#7c3aed" : "rgba(180,83,9,0.25)"}`,
            color: selected.includes(o) ? "#78350f" : "#d97706",
            fontWeight: selected.includes(o) ? 600 : 400, transition: "all 0.15s",
          }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function SaveBtn({ onClick, disabled, label }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: "11px 0", background: disabled ? "rgba(180,83,9,0.20)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
      border: "none", borderRadius: 10, color: "white", fontWeight: 600,
      fontFamily: "Vazirmatn, sans-serif", cursor: disabled ? "not-allowed" : "pointer", fontSize: 14,
    }}>{label}</button>
  );
}
function CancelBtn({ onClick }: any) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "11px 0", background: "transparent",
      border: "1px solid rgba(180,83,9,0.40)", borderRadius: 10, color: "#d97706",
      fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14,
    }}>انصراف</button>
  );
}

function DuplicateSelector({ candidates, onSelect, onCreateNew }: {
  candidates: UserCandidate[]; onSelect: (u: UserCandidate) => void; onCreateNew: () => void;
}) {
  return (
    <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <p style={{ color: "#fbbf24", fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>
        ⚠️ کاربری با این شماره موبایل یا کد ملی در سیستم وجود دارد.
      </p>
      <p style={{ color: "#92400e", fontSize: 12, margin: "0 0 12px" }}>لطفاً یک کاربر انتخاب کنید یا کاربر جدید بسازید:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {candidates.map(u => (
          <button key={u.id} onClick={() => onSelect(u)} style={{
            background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 10, padding: "10px 14px", cursor: "pointer", textAlign: "right",
            fontFamily: "Vazirmatn", color: "#78350f",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
            <div style={{ fontSize: 12, color: "#d97706", marginTop: 3, display: "flex", gap: 12 }}>
              {u.phone && <span>📱 {u.phone}</span>}
              {u.nationalId && <span>🪪 {u.nationalId}</span>}
              <span style={{ color: "#7c3aed" }}>نقش: {u.role}</span>
            </div>
          </button>
        ))}
      </div>
      <button onClick={onCreateNew} style={{
        width: "100%", padding: "9px 0", background: "transparent",
        border: "1px dashed rgba(139,92,246,0.4)", borderRadius: 10, color: "#d97706",
        fontFamily: "Vazirmatn", fontSize: 13, cursor: "pointer",
      }}>+ ساخت کاربر جدید (نادیده گرفتن تکراری)</button>
    </div>
  );
}

// ─── Branch Form Modal ────────────────────────────────────────────────────────
function BranchModal({ school, onClose, onCreated }: {
  school: School; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "", address: "", phone: "", academicYear: "1403-1404",
    managerName: "", managerPhone: "", managerNationalId: "",
    educationalLevels: [] as string[],
  });
  const [duplicateCandidates, setDuplicateCandidates] = useState<UserCandidate[]>([]);
  const [selectedManagerUserId, setSelectedManagerUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const f = (k: string) => (v: any) => setForm(prev => ({ ...prev, [k]: v }));

  function handleSelectExistingUser(u: UserCandidate) {
    setSelectedManagerUserId(u.id);
    setDuplicateCandidates([]);
    setForm(prev => ({ ...prev, managerName: u.name, managerPhone: u.phone ?? "", managerNationalId: u.nationalId ?? "" }));
  }

  async function handleSubmit() {
    if (!form.name) { setError("نام شعبه الزامی است"); return; }
    setLoading(true); setError("");
    try {
      const payload: any = {
        schoolId: school.id,
        name: form.name,
        address: form.address || null,
        phone: form.phone || null,
        academicYear: form.academicYear,
        managerName: form.managerName || null,
        managerPhone: form.managerPhone || null,
        managerNationalId: form.managerNationalId || null,
        educationalLevels: form.educationalLevels,
      };
      if (selectedManagerUserId) payload.selectedManagerUserId = selectedManagerUserId;
      const result = await api.post("/branches", payload) as any;
      if ((result as any)?.status === "duplicate_found") {
        setDuplicateCandidates((result as any).candidates);
      } else {
        onCreated();
        onClose();
      }
    } catch (e: any) {
      setError(e.message ?? "خطا در ثبت شعبه");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`افزودن شعبه — ${school.name}`} onClose={onClose} wide>
      {duplicateCandidates.length > 0 && (
        <DuplicateSelector
          candidates={duplicateCandidates}
          onSelect={handleSelectExistingUser}
          onCreateNew={() => { setDuplicateCandidates([]); setSelectedManagerUserId(-1); }}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="نام مدرسه" value={school.name} readOnly />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="نام شعبه *" value={form.name} onChange={f("name")} placeholder="مثال: شعبه مرکزی" />
        </div>
        <Field label="آدرس شعبه" value={form.address} onChange={f("address")} placeholder="آدرس کامل" />
        <Field label="شماره تماس شعبه" value={form.phone} onChange={f("phone")} type="tel" placeholder="۰۲۱..." />
        <div style={{ gridColumn: "1/-1" }}>
          <SelectField label="سال تحصیلی" value={form.academicYear} onChange={f("academicYear")} options={ACADEMIC_YEARS} />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <MultiSelect label="مقاطع آموزشی" selected={form.educationalLevels} onChange={f("educationalLevels")} options={EDUCATIONAL_LEVELS} />
        </div>
      </div>

      {sectionDivider("اطلاعات مدیر شعبه")}
      {selectedManagerUserId && selectedManagerUserId > 0 && (
        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, fontSize: 13, color: "#15803d" }}>
          ✓ کاربر موجود انتخاب شد — پنل کاربری جدید ساخته نمی‌شود
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="نام مدیر شعبه" value={form.managerName} onChange={f("managerName")} placeholder="نام و نام خانوادگی" />
        </div>
        <Field label="شماره همراه مدیر" value={form.managerPhone} onChange={f("managerPhone")} type="tel" placeholder="09..." />
        <Field label="کد ملی مدیر" value={form.managerNationalId} onChange={f("managerNationalId")} type="text" placeholder="کد ملی ۱۰ رقمی" />
      </div>

      {sectionDivider("اطلاعات پکیج‌ها")}
      <Field label="تعداد پکیج‌های فعال شعبه" value="۰ (محاسبه خودکار پس از ثبت تراکنش)" readOnly />

      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <SaveBtn onClick={handleSubmit} disabled={loading || !form.name} label={loading ? "در حال ثبت..." : "ثبت شعبه"} />
        <CancelBtn onClick={onClose} />
      </div>
    </Modal>
  );
}

// ─── Details Popup ────────────────────────────────────────────────────────────
function DetailsPopup({ school, onClose }: { school: School; onClose: () => void }) {
  const [openBranch, setOpenBranch] = useState<number | null>(null);
  return (
    <Modal title={`جزییات شعب — ${school.name}`} onClose={onClose}>
      {school.branchDetails.length === 0
        ? <p style={{ color: "#b45309", textAlign: "center", padding: 20 }}>شعبه‌ای ثبت نشده</p>
        : school.branchDetails.map(b => (
          <div key={b.branchId} style={{ marginBottom: 10, border: "1px solid rgba(139,92,246,0.2)", borderRadius: 12, overflow: "hidden" }}>
            <button onClick={() => setOpenBranch(openBranch === b.branchId ? null : b.branchId)} style={{
              width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", background: "rgba(255,252,235,0.90)", border: "none", cursor: "pointer",
              color: "#78350f", fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 600,
            }}>
              <span>{b.branchName}</span>
              {openBranch === b.branchId ? <ChevronUp size={16} style={{ color: "#d97706" }} /> : <ChevronDown size={16} style={{ color: "#d97706" }} />}
            </button>
            {openBranch === b.branchId && (
              <div style={{ padding: "12px 16px", background: "rgba(255,252,235,0.70)", display: "flex", gap: 24, flexWrap: "wrap" }}>
                <Stat icon={<Users size={14} />} label="دانش‌آموزان فعال" value={b.studentCount} color="#d97706" />
                {b.managerName && <Stat icon={<span>👤</span>} label="مدیر شعبه" value={b.managerName} color="#34d399" />}
                {b.academicYear && <Stat icon={<span>📅</span>} label="سال تحصیلی" value={b.academicYear} color="#60a5fa" />}
              </div>
            )}
          </div>
        ))}
    </Modal>
  );
}

function Stat({ icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color }}>{icon}</span>
      <div>
        <div style={{ color: "#b45309", fontSize: 11 }}>{label}</div>
        <div style={{ color: "#78350f", fontSize: 14, fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Active Students Popup ────────────────────────────────────────────────────
function ActiveStudentsPopup({ school, onClose }: { school: School; onClose: () => void }) {
  return (
    <Modal title={`دانش‌آموزان فعال — ${school.name}`} onClose={onClose}>
      <div style={{ background: "rgba(124,58,237,0.08)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#92400e", fontSize: 13 }}>مجموع دانش‌آموزان</span>
        <span style={{ color: "#78350f", fontWeight: 700, fontSize: 16 }}>{school.studentCount}</span>
      </div>
      {school.branchDetails.length === 0
        ? <p style={{ color: "#b45309", textAlign: "center", padding: 16 }}>شعبه‌ای ثبت نشده</p>
        : <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["شعبه","دانش‌آموزان","سال تحصیلی"].map(h => (
                <th key={h} style={{ padding: "8px 12px", color: "#b45309", fontSize: 12, fontWeight: 600, textAlign: "right", background: "rgba(255,252,235,0.65)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {school.branchDetails.map(b => (
              <tr key={b.branchId}>
                <td style={{ padding: "10px 12px", color: "#78350f", fontSize: 14, borderBottom: "1px solid rgba(139,92,246,0.08)", fontWeight: 500 }}>{b.branchName}</td>
                <td style={{ padding: "10px 12px", color: "#d97706", fontSize: 14, borderBottom: "1px solid rgba(139,92,246,0.08)", fontWeight: 600 }}>{b.studentCount}</td>
                <td style={{ padding: "10px 12px", color: "#b45309", fontSize: 13, borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{b.academicYear ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>}
    </Modal>
  );
}

// ─── Total Packages Popup ─────────────────────────────────────────────────────
function TotalPackagesPopup({ school, onClose }: { school: School; onClose: () => void }) {
  const [yearFilter, setYearFilter] = useState("");
  return (
    <Modal title={`کل پکیج‌های خریداری شده — ${school.name}`} onClose={onClose}>
      <div style={{ background: "rgba(124,58,237,0.08)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#92400e", fontSize: 13 }}>مجموع پکیج‌ها (از ابتدا تا کنون)</span>
        <span style={{ color: "#78350f", fontWeight: 700, fontSize: 16 }}>{school.totalPackages}</span>
      </div>
      <SelectField label="فیلتر بر اساس سال تحصیلی" value={yearFilter} onChange={setYearFilter} options={ACADEMIC_YEARS} />
      {school.branchDetails.length === 0
        ? <p style={{ color: "#b45309", textAlign: "center", padding: 16 }}>شعبه‌ای ثبت نشده</p>
        : <div>
          <p style={{ color: "#b45309", fontSize: 12, marginBottom: 10 }}>
            تفکیک پکیج به تفکیک شعبه پس از ثبت تراکنش برای هر شعبه نمایش داده می‌شود.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["شعبه","سال تحصیلی","دانش‌آموزان"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", color: "#b45309", fontSize: 12, fontWeight: 600, textAlign: "right", background: "rgba(255,252,235,0.65)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {school.branchDetails
                .filter(b => !yearFilter || b.academicYear === yearFilter)
                .map(b => (
                  <tr key={b.branchId}>
                    <td style={{ padding: "10px 12px", color: "#78350f", fontSize: 14, borderBottom: "1px solid rgba(139,92,246,0.08)", fontWeight: 500 }}>{b.branchName}</td>
                    <td style={{ padding: "10px 12px", color: "#b45309", fontSize: 13, borderBottom: "1px solid rgba(139,92,246,0.08)" }}>{b.academicYear ?? "—"}</td>
                    <td style={{ padding: "10px 12px", color: "#d97706", fontSize: 14, borderBottom: "1px solid rgba(139,92,246,0.08)", fontWeight: 600 }}>{b.studentCount}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>}
    </Modal>
  );
}

// ─── School Form Modal ────────────────────────────────────────────────────────
function SchoolModal({ editing, onClose, onSuccess }: {
  editing: School | null; onClose: () => void; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "", address: editing?.address ?? "", phone: editing?.phone ?? "",
    managerName: editing?.managerName ?? "",
    managerPhone: editing?.managerPhone ?? "",
    managerNationalId: editing?.managerNationalId ?? "",
  });
  const [duplicateCandidates, setDuplicateCandidates] = useState<UserCandidate[]>([]);
  const [selectedManagerUserId, setSelectedManagerUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const f = (k: string) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));

  function handleSelectExistingUser(u: UserCandidate) {
    setSelectedManagerUserId(u.id);
    setDuplicateCandidates([]);
    setForm(prev => ({ ...prev, managerName: u.name, managerPhone: u.phone ?? "", managerNationalId: u.nationalId ?? "" }));
  }

  async function handleSubmit() {
    if (!form.name) { setError("نام مدرسه الزامی است"); return; }
    setLoading(true); setError("");
    try {
      const payload: any = { ...form };
      if (selectedManagerUserId && selectedManagerUserId > 0) payload.selectedManagerUserId = selectedManagerUserId;
      let result: any;
      if (editing) result = await api.put(`/schools/${editing.id}`, payload) as any;
      else result = await api.post("/schools", payload) as any;

      if ((result as any)?.status === "duplicate_found") {
        setDuplicateCandidates((result as any).candidates);
      } else {
        onSuccess();
        onClose();
        showToast(editing ? "مدرسه بروزرسانی شد ✓" : "مدرسه با موفقیت ثبت شد ✓");
      }
    } catch (e: any) {
      setError(e.message ?? "خطا در ذخیره");
      showToast(e.message ?? "خطا در ذخیره مدرسه", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={editing ? "ویرایش مدرسه" : "افزودن مدرسه"} onClose={onClose} wide>
      {duplicateCandidates.length > 0 && (
        <DuplicateSelector
          candidates={duplicateCandidates}
          onSelect={handleSelectExistingUser}
          onCreateNew={() => { setDuplicateCandidates([]); setSelectedManagerUserId(-1); }}
        />
      )}

      {sectionDivider("اطلاعات مدرسه")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="نام مدرسه *" value={form.name} onChange={f("name")} placeholder="نام مدرسه را وارد کنید" />
        </div>
        <Field label="آدرس" value={form.address} onChange={f("address")} placeholder="آدرس مدرسه" />
        <Field label="تلفن" value={form.phone} onChange={f("phone")} type="tel" placeholder="۰۲۱..." />
      </div>

      {sectionDivider("اطلاعات مدیر مدرسه")}
      {selectedManagerUserId && selectedManagerUserId > 0 && (
        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, fontSize: 13, color: "#15803d" }}>
          ✓ کاربر موجود انتخاب شد — پنل کاربری جدید ساخته نمی‌شود
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="نام مدیر مدرسه" value={form.managerName} onChange={f("managerName")} placeholder="نام و نام خانوادگی مدیر" />
        </div>
        <Field label="شماره موبایل مدیر" value={form.managerPhone} onChange={f("managerPhone")} type="tel" placeholder="09..." />
        <Field label="کد ملی مدیر" value={form.managerNationalId} onChange={f("managerNationalId")} placeholder="کد ملی ۱۰ رقمی" />
      </div>

      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <SaveBtn onClick={handleSubmit} disabled={loading || !form.name} label={loading ? "در حال ذخیره..." : editing ? "بروزرسانی" : "ذخیره"} />
        <CancelBtn onClick={onClose} />
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSchools() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [branchTarget, setBranchTarget] = useState<School | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<School | null>(null);
  const [studentsTarget, setStudentsTarget] = useState<School | null>(null);
  const [packagesTarget, setPackagesTarget] = useState<School | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: schools = [] } = useQuery<School[]>({
    queryKey: ["schools"],
    queryFn: () => api.get("/schools"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/schools/${id}/toggle-status`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["schools"] }); showToast("وضعیت مدرسه تغییر کرد ✓"); },
    onError: (e: any) => showToast(e?.message ?? "خطا در تغییر وضعیت", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/schools/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["schools"] }); setDeleteConfirmId(null); showToast("مدرسه حذف شد ✓"); },
    onError: (e: any) => { showToast(e?.message ?? "خطا در حذف مدرسه", "error"); setDeleteConfirmId(null); },
  });

  const [, navigate] = useLocation();

  function refresh() { qc.invalidateQueries({ queryKey: ["schools"] }); }
  function openCreate() { setEditing(null); setShowSchoolModal(true); }
  function openEdit(s: School) { setEditing(s); setShowSchoolModal(true); }

  const filtered = schools.filter(s => s.name.includes(search) || (s.address ?? "").includes(search));

  const tdStyle: React.CSSProperties = { padding: "12px 14px", borderBottom: "1px solid rgba(139,92,246,0.08)", verticalAlign: "middle" };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#78350f", margin: 0 }}>مدارس</h1>
          <p style={{ color: "#b45309", fontSize: 14, marginTop: 4 }}>{schools.length} مدرسه ثبت شده</p>
        </div>
        <button onClick={openCreate} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
          background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none",
          borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600,
          fontFamily: "Vazirmatn, sans-serif", cursor: "pointer",
          boxShadow: "0 4px 15px rgba(124,58,237,0.4)",
        }}>
          <Plus size={16} /> افزودن مدرسه
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#b45309" }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
          style={{
            width: "100%", background: "rgba(255,255,255,0.80)", border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: 10, color: "#78350f", padding: "10px 40px 10px 14px", fontSize: 14,
            fontFamily: "Vazirmatn, sans-serif", outline: "none",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr>
                {["نام مدرسه","شعبه‌ها","دانش‌آموزان فعال","کل پکیج‌ها","جزییات","وضعیت","عملیات"].map(h => (
                  <th key={h} style={{ textAlign: "right", padding: "12px 14px", color: "#92400e", fontSize: 13, fontWeight: 600, background: "rgba(255,252,235,0.90)", borderBottom: "1px solid rgba(139,92,246,0.15)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(school => (
                <tr key={school.id} style={{ transition: "background 0.15s" }}
                  onMouseOver={e => (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.04)"}
                  onMouseOut={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>

                  {/* Name */}
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: "#78350f", fontSize: 14 }}>{school.name}</div>
                    {school.address && <div style={{ color: "#b45309", fontSize: 12, marginTop: 2 }}>{school.address}</div>}
                    {school.managerName && <div style={{ color: "#d97706", fontSize: 11, marginTop: 2 }}>👤 {school.managerName}</div>}
                  </td>

                  {/* Branches */}
                  <td style={tdStyle}>
                    <span style={{ color: "#92400e", fontWeight: 600 }}>{school.branchCount}</span>
                  </td>

                  {/* Active students — clickable */}
                  <td style={tdStyle}>
                    <button onClick={() => setStudentsTarget(school)} style={{
                      background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)",
                      borderRadius: 8, color: "#d97706", padding: "4px 12px", cursor: "pointer",
                      fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <Users size={13} /> {school.studentCount}
                    </button>
                  </td>

                  {/* Total packages — clickable */}
                  <td style={tdStyle}>
                    <button onClick={() => setPackagesTarget(school)} style={{
                      background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)",
                      borderRadius: 8, color: "#60a5fa", padding: "4px 12px", cursor: "pointer",
                      fontFamily: "Vazirmatn", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <Package size={13} /> {school.totalPackages}
                    </button>
                  </td>

                  {/* Details button */}
                  <td style={tdStyle}>
                    <button onClick={() => setDetailsTarget(school)} style={{
                      background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)",
                      borderRadius: 8, color: "#34d399", padding: "5px 12px", cursor: "pointer",
                      fontFamily: "Vazirmatn", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <ChevronDown size={13} /> جزییات
                    </button>
                  </td>

                  {/* Status */}
                  <td style={tdStyle}>
                    <span style={{
                      background: school.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.15)",
                      color: school.status === "active" ? "#15803d" : "#f87171",
                      border: `1px solid ${school.status === "active" ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`,
                      borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 600,
                    }}>{school.status === "active" ? "فعال" : "غیرفعال"}</span>
                  </td>

                  {/* Actions */}
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                      <button onClick={() => openEdit(school)} title="ویرایش"
                        style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, color: "#d97706", padding: "6px 10px", cursor: "pointer", fontFamily: "Vazirmatn" }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setBranchTarget(school)} title="افزودن شعبه"
                        style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 8, color: "#34d399", padding: "6px 8px", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                        <GitBranch size={14} /> <span style={{ fontSize: 11 }}>شعبه</span>
                      </button>
                      <button onClick={() => navigate(`/admin/branches?school=${school.id}`)} title="مدیریت ساختار (مقطع، پایه، کلاس)"
                        style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 8, color: "#60a5fa", padding: "6px 8px", cursor: "pointer", fontFamily: "Vazirmatn", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                        <Settings2 size={14} /> <span style={{ fontSize: 11 }}>ساختار</span>
                      </button>
                      <button onClick={() => toggleMutation.mutate(school.id)} title={school.status === "active" ? "غیرفعال کردن" : "فعال کردن"}
                        style={{
                          background: school.status === "active" ? "rgba(248,113,113,0.15)" : "rgba(34,197,94,0.15)",
                          border: `1px solid ${school.status === "active" ? "rgba(248,113,113,0.3)" : "rgba(34,197,94,0.3)"}`,
                          borderRadius: 8, color: school.status === "active" ? "#f87171" : "#15803d",
                          padding: "6px 10px", cursor: "pointer", fontFamily: "Vazirmatn",
                        }}>
                        <Power size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirmId(school.id)} title="حذف مدرسه"
                        style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#f87171", padding: "6px 10px", cursor: "pointer" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p style={{ color: "#b45309", textAlign: "center", padding: 30 }}>مدرسه‌ای یافت نشد</p>
        )}
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirmId !== null && (() => {
        const target = schools.find(s => s.id === deleteConfirmId);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fffef5", border: "1px solid rgba(248,113,113,0.5)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
                <h3 style={{ margin: "0 0 8px", color: "#78350f", fontSize: 18, fontWeight: 700 }}>حذف مدرسه</h3>
                <p style={{ margin: 0, color: "#92400e", fontSize: 14 }}>
                  آیا مطمئن هستید که می‌خواهید مدرسه<br />
                  <strong style={{ color: "#f87171" }}>«{target?.name}»</strong> را حذف کنید؟
                </p>
                <p style={{ margin: "10px 0 0", color: "#f87171", fontSize: 12 }}>این عملیات قابل بازگشت نیست.</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => deleteMutation.mutate(deleteConfirmId!)} disabled={deleteMutation.isPending}
                  style={{ flex: 1, padding: "11px 0", background: deleteMutation.isPending ? "rgba(248,113,113,0.3)" : "linear-gradient(135deg, #dc2626, #f87171)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: deleteMutation.isPending ? "not-allowed" : "pointer", fontSize: 14 }}>
                  {deleteMutation.isPending ? "در حال حذف..." : "بله، حذف شود"}
                </button>
                <button onClick={() => setDeleteConfirmId(null)}
                  style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid rgba(180,83,9,0.40)", borderRadius: 10, color: "#d97706", fontWeight: 600, fontFamily: "Vazirmatn, sans-serif", cursor: "pointer", fontSize: 14 }}>
                  انصراف
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modals */}
      {showSchoolModal && (
        <SchoolModal editing={editing} onClose={() => { setShowSchoolModal(false); setEditing(null); }} onSuccess={refresh} />
      )}
      {branchTarget && (
        <BranchModal school={branchTarget} onClose={() => setBranchTarget(null)} onCreated={refresh} />
      )}
      {detailsTarget && (
        <DetailsPopup school={detailsTarget} onClose={() => setDetailsTarget(null)} />
      )}
      {studentsTarget && (
        <ActiveStudentsPopup school={studentsTarget} onClose={() => setStudentsTarget(null)} />
      )}
      {packagesTarget && (
        <TotalPackagesPopup school={packagesTarget} onClose={() => setPackagesTarget(null)} />
      )}
    </div>
  );
}
