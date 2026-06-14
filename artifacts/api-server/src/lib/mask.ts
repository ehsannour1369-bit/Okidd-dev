export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const p = phone.trim();
  if (p.length <= 8) return p;
  return `${p.slice(0, 4)}***${p.slice(-4)}`;
}

export function maskNationalId(id: string | null | undefined): string | null {
  if (!id) return null;
  const s = id.trim();
  if (s.length <= 4) return s;
  return `${"*".repeat(s.length - 4)}${s.slice(-4)}`;
}

export function maskUser<T extends { phone?: string | null; nationalId?: string | null }>(u: T): T {
  return { ...u, phone: maskPhone(u.phone), nationalId: maskNationalId(u.nationalId) };
}
