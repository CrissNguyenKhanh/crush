export interface DevDashboardAccount {
    name: string;
    role: string;
}

export interface DevDashboardSkillTreeNode {
    id: string;
    parentId: string | null;
    name: string;
    description: string;
    level: number;
    currentXp: number;
    userSkillId: string | null;
}

export interface DevDashboardNotificationItem {
    id: string;
    title: string;
    description: string;
    createdAt?: string;
    read?: boolean;
    type?: 'info' | 'success' | 'warning';
}

export interface DevDashboardProjectRow {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: string;
    progress: number;
    statusLabel: string;
    statusColor: string;
    timeRange: string;
    remainingDays: string;
}

export interface DevDashboardSummary {
    totalProjects: number;
    activeProjects: number;
    delayedProjects: number;
    unreadNotifications: number;
    skillCatalog: number;
    masteredSkills: number;
    learningSkills: number;
    lockedSkills: number;
}

export interface DevDashboardChartDatum {
    name: string;
    value: number;
    fill: string;
}