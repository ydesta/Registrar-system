import { ThemeType } from "./KpiCard";

export interface Deadline {
  title: string;
  date: string;
  icon: string;
  iconTheme: ThemeType;
  iconBg: string;
  progress: number;
  progressStatus: 'active' | 'normal' | 'exception' | 'success';
  progressColor: string;
  status: string;
  statusColor: string;
}