export const normalizeDashboardKey = (value: unknown) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const isSponsorshipOrigin = (value: unknown) => normalizeDashboardKey(value) === "patrocinio";

export const dashboardEntityKey = (prefix: string, id: number | null | undefined, fallback: unknown) => {
  if (id) return `${prefix}:id:${id}`;
  const normalized = normalizeDashboardKey(fallback);
  return normalized ? `${prefix}:name:${normalized}` : null;
};
