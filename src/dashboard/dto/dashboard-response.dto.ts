export class SummaryStatisticsDto {
  totalPickups: number;
  totalPickupsChange: number; // percentage change vs last month
  reviewStatus: number; // count of in-progress items
  revenueEarned: number; // in EGP
  revenueChange: number; // percentage change
  mealsDonated: number; // this month
}

export class PendingPickupDto {
  id: string;
  type: 'order' | 'donation';
  scheduledDate: Date;
  description: string;
  status: string;
}

export class MaterialBreakdownDto {
  materialType: string;
  quantity: number;
  percentage: number;
  unit: string;
}

export class TopRecycledMaterialsDto {
  total: number;
  unit: string;
  breakdown: MaterialBreakdownDto[];
}

export class MonthlyRecyclingDto {
  total: number; // in tons
  unit: string;
  change: number; // percentage change vs last month
}

export class RecentActivityDto {
  id: string;
  type: 'order' | 'donation';
  title: string;
  description: string;
  timestamp: Date;
  status: string;
}

export class DashboardResponseDto {
  summary: SummaryStatisticsDto;
  pendingPickups: PendingPickupDto[];
  topRecycledMaterials: TopRecycledMaterialsDto;
  monthlyRecycling: MonthlyRecyclingDto;
  recentActivity: RecentActivityDto[];
}

