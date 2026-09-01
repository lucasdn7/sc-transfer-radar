export const normalizeDashboardKey = (value: unknown) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export const isSponsorshipOrigin = (value: unknown) => normalizeDashboardKey(value) === "patrocinio";

export const dashboardEntityKey = (prefix: string, id: number | null | undefined, fallback: unknown) => {
  if (id) return `${prefix}:id:${id}`;
  const normalized = normalizeDashboardKey(fallback);
  return normalized ? `${prefix}:name:${normalized}` : null;
};

export const dashboardBeneficiaryMunicipalityKey = (id: number | null | undefined, name: unknown) => {
  const normalizedName = normalizeDashboardKey(name);

  // The Total dashboard must count beneficiary municipalities as a distinct
  // Supabase union across obras and eventos, not as a sum of repeated records.
  // Prefer the normalized municipality name so duplicated beneficiary rows or
  // mixed id/name references collapse into a single municipality.
  if (normalizedName) return `municipio:name:${normalizedName}`;

  return id ? `municipio:id:${id}` : null;
};
