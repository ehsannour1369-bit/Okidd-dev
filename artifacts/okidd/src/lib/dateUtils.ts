export function formatFaDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export function formatFaTime(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fa-IR", {
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatFaDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  const time = d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  return `${date} — ${time}`;
}
