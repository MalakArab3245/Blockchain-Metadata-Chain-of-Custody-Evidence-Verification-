import { format, parseISO } from "date-fns";

export function formatHash(hash: string | null | undefined): string {
  if (!hash) return "N/A";
  if (hash.length <= 16) return hash;
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  try {
    return format(parseISO(dateString), "yyyy-MM-dd HH:mm:ss");
  } catch (e) {
    return dateString;
  }
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === undefined || bytes === null) return "N/A";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
