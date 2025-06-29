export function generateYearsFromRange(range: [Date, Date]): number[] {
  const [start, end] = range.map(d => d.getFullYear());
  const years = [end];

  let i = end;

  while (i > start) {
    i--;
    years.unshift(i);
  }

  return years;
}