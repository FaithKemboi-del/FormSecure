export function formatKSh(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE')}`
}

export function savingsPercent(resale: number, gate: number): number {
  if (gate <= 0) return 0
  return Math.max(0, Math.round(((gate - resale) / gate) * 100))
}
