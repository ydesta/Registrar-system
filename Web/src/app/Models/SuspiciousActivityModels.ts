export interface SuspiciousActivityViewModel {
  ipAddress?: string;
  userId?: string;
  username?: string;
  totalSuspiciousAttempts: number;
  totalAttempts: number;
  averageSuspiciousScore: number;
  maxSuspiciousScore: number;
  mostCommonReason?: string;
  mostCommonTool?: string;
  firstSuspiciousActivity: Date;
  lastSuspiciousActivity: Date;
  suspiciousReasons: string[];
  toolUsage: { [key: string]: number };
  statusCodeDistribution: { [key: string]: number };
}

export interface SuspiciousActivityDetailViewModel {
  id: string;
  method?: string;
  path?: string;
  statusCode: number;
  suspiciousScore: number;
  suspiciousReason?: string;
  userAgentTool?: string;
  ipAddress?: string;
  userId?: string;
  username?: string;
  timestamp: Date;
  responseTime: number;
  eventType?: string;
}

export interface SuspiciousActivityStatisticsViewModel {
  totalSuspiciousActivities: number;
  totalSuspiciousIPs: number;
  totalSuspiciousUsers: number;
  suspiciousActivitiesLast24Hours: number;
  suspiciousActivitiesLast7Days: number;
  suspiciousActivitiesLast30Days: number;
  topSuspiciousIPs: { [key: string]: number };
  topSuspiciousUsers: { [key: string]: number };
  topSuspiciousTools: { [key: string]: number };
  topSuspiciousReasons: { [key: string]: number };
  suspiciousActivitiesByHour: { [key: string]: number };
}

export interface IpRiskAssessmentViewModel {
  ipAddress: string;
  riskLevel: string; // Low, Medium, High, Critical
  riskScore: number;
  totalSuspiciousAttempts: number;
  totalFailedAuthAttempts: number;
  totalRequests: number;
  suspiciousPercentage: number;
  firstSeen: Date;
  lastSeen: Date;
  associatedUserIds: string[];
  toolsUsed: string[];
  isBlocked: boolean;
}

export interface UserRiskAssessmentViewModel {
  userId: string;
  username?: string;
  riskLevel: string; // Low, Medium, High, Critical
  riskScore: number;
  totalSuspiciousAttempts: number;
  totalFailedAuthAttempts: number;
  totalRequests: number;
  suspiciousPercentage: number;
  firstSuspiciousActivity: Date;
  lastSuspiciousActivity: Date;
  ipAddresses: string[];
  toolsUsed: string[];
  isBlocked: boolean;
}

export interface SuspiciousActivityFilterParams {
  ipAddress?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  pageIndex?: number;
  pageSize?: number;
}