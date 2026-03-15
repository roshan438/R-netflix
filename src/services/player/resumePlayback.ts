export function shouldMarkCompleted(progressSeconds: number, durationSeconds: number) {
  if (!durationSeconds) return false;
  return progressSeconds / durationSeconds >= 0.92;
}

export function getResumeLabel(progressSeconds: number, durationSeconds: number) {
  const remaining = Math.max(durationSeconds - progressSeconds, 0);
  const minutes = Math.ceil(remaining / 60);
  return minutes > 0 ? `${minutes} min left` : "Almost done";
}
