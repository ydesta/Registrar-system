export type ThemeType = 'fill' | 'outline' | 'twotone';
export interface KpiCard {
  title: string;
  value: number;
  icon: string;
  theme: ThemeType;
  gradient: string;
}