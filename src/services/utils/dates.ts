import dayjs from "dayjs";

export function formatMemoryDate(date: string) {
  return dayjs(date).format("MMMM D, YYYY");
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
