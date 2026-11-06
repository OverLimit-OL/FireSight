export function fieldColor(value: number | null, domain: [number, number] = [0, 1]) {
  if (value === null) return 'var(--muted)'
  value = Math.max(0, Math.min(1, (value - domain[0]) / (domain[1] - domain[0])))
  // Fixed quantitative palette and fixed [0,1] domain across every view and run.
  return `rgb(${Math.round(46 + value * 163)}, ${Math.round(83 + value * 60)}, ${Math.round(118 - value * 35)})`
}
