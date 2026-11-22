export const siteBase = import.meta.env.BASE_URL.replace(/\/$/, "");

export function sitePath(path: string) {
  return `${siteBase}${path}`;
}
