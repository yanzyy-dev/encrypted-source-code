export type ProtectionMode = "standard" | "china" | "invisible" | "strong";

export interface ProtectionResult {
  code: string;
  mode: ProtectionMode;
  size: number;
}

export function encodeSource(source: string): string {
  return btoa(unescape(encodeURIComponent(source)));
}
