export type Month = {
  name: string;
  abbreviation: string;
  index: number
};

export type Months = Month[]

export function generateMonthMap(): Months {
  const months: Months = [];
  const date = new Date();

  for (let i = 0; i < 12; i++) {
    date.setMonth(i);
    const name = date.toLocaleString('default', { month: 'long' });
    const abbreviation = date.toLocaleString('default', { month: 'short' })
    months.push({ name, abbreviation, index: i })
  }

  return months;
}