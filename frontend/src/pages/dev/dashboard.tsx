import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { callFetchAccount, callFetchSkillTree, callFetchSkillsWithoutPaginate, callFetchUserSprintProjects } from '../../api';
import { pmApi } from '../../api/pm';
import DevDashboardActivityPanel from '../../components/dev/dashboard/activity-panel';
import DevDashboardChartsRow from '../../components/dev/dashboard/charts-row';
import DevDashboardHeroCard from '../../components/dev/dashboard/hero-card';
import DevDashboardProjectTable from '../../components/dev/dashboard/project-table';
import DevDashboardStatsRow from '../../components/dev/dashboard/stats-row';
import type {
    DevDashboardAccount,
    DevDashboardChartDatum,
    DevDashboardNotificationItem,
    DevDashboardProjectRow,
    DevDashboardSkillTreeNode,
    DevDashboardSummary,
} from '../../common/types/dev-dashboard';
import type { ProjectItem } from '../../common/types/pm';

const PIE_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1'];

const normalizeStatus = (status?: string) => (status ?? 'default').trim().toLowerCase();

const safeDate = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value?: string | null) => {
    const parsed = safeDate(value ?? undefined);
    if (!parsed) return 'N/A';

    return parsed.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const getStatusMeta = (status?: string) => {
    const normalized = normalizeStatus(status);
    const map: Record<string, { label: string; color: string }> = {
        active: { label: 'Đang chạy', color: 'green' },
        completed: { label: 'Hoàn thành', color: 'blue' },
        delayed: { label: 'Trễ tiến độ', color: 'red' },
        planning: { label: 'Lên kế hoạch', color: 'gold' },
        upcoming: { label: 'Sắp bắt đầu', color: 'cyan' },
        cancelled: { label: 'Đã huỷ', color: 'default' },
        default: { label: 'Khác', color: 'default' },
    };

    return map[normalized] ?? map.default;
};

const getProjectProgress = (project: ProjectItem) => {
    const status = normalizeStatus(project.status);

    if (status === 'completed') return 100;
    if (status === 'cancelled') return 0;

    const startDate = safeDate(project.startDate);
    const endDate = safeDate(project.endDate);

    if (!startDate || !endDate || endDate.getTime() <= startDate.getTime()) {
        if (status === 'active') return 60;
        if (status === 'planning' || status === 'upcoming') return 15;
        if (status === 'delayed') return 75;
        return 0;
    }

    const total = endDate.getTime() - startDate.getTime();
    const elapsed = Math.min(Math.max(Date.now() - startDate.getTime(), 0), total);

    if (status === 'delayed') {
        return Math.min(95, Math.round((elapsed / total) * 100) + 10);
    }

    return Math.round((elapsed / total) * 100);
};

const getRemainingDays = (project: ProjectItem) => {
    const endDate = safeDate(project.endDate);
    if (!endDate) return 'N/A';

    const diffDays = Math.ceil((endDate.getTime() - Date.now()) / 86400000);
    if (diffDays < 0) return `Quá hạn ${Math.abs(diffDays)} ngày`;
    if (diffDays === 0) return 'Hết hạn hôm nay';

    return `${diffDays} ngày còn lại`;
};

const DashboardPage = () => {
    const navigate = useNavigate();

    const [account, setAccount] = useState<DevDashboardAccount>({ name: 'Developer', role: 'DEVELOPER' });
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [skills, setSkills] = useState<ISkills[]>([]);
    const [skillTree, setSkillTree] = useState<DevDashboardSkillTreeNode[]>([]);
    const [notifications, setNotifications] = useState<DevDashboardNotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadDashboard = async () => {
            setLoading(true);
            setError(null);

            const [accountRes, projectsRes, skillsRes, skillTreeRes, notificationsRes] = await Promise.allSettled([
                callFetchAccount(),
                callFetchUserSprintProjects(),
                callFetchSkillsWithoutPaginate(),
                callFetchSkillTree(),
                pmApi.getNotificationHistory(),
            ]);

            if (!active) return;

            if (accountRes.status === 'fulfilled') {
                const accountUser = accountRes.value?.data?.user;
                if (accountUser) {
                    setAccount({
                        name: accountUser.fullName || accountUser.email || 'Developer',
                        role: accountUser.role?.name || 'DEVELOPER',
                    });
                }
            }

            if (projectsRes.status === 'fulfilled') {
                const projectPayload = projectsRes.value?.data?.data ?? projectsRes.value?.data ?? {};
                const projectData = Array.isArray(projectPayload) ? projectPayload : projectPayload.projects ?? [];
                setProjects(Array.isArray(projectData) ? projectData : []);
            } else {
                setProjects([]);
            }
            setSkills(skillsRes.status === 'fulfilled' ? (skillsRes.value?.data?.result ?? []) : []);

            if (skillTreeRes.status === 'fulfilled') {
                const treeData = skillTreeRes.value?.data?.data ?? skillTreeRes.value?.data ?? [];
                setSkillTree(Array.isArray(treeData) ? treeData : []);
            } else {
                setSkillTree([]);
            }

            if (notificationsRes.status === 'fulfilled') {
                const notificationData = notificationsRes.value?.data?.data ?? [];
                const normalized = Array.isArray(notificationData)
                    ? notificationData.map((item: any) => ({
                          id: String(item.id),
                          title: item.title || 'Thông báo',
                          description: item.description || item.message || 'Bạn có một thông báo mới.',
                          createdAt: item.createdAt,
                          read: Boolean(item.read),
                          type: item.type === 'success' || item.type === 'warning' ? item.type : 'info',
                      }))
                    : [];
                setNotifications(normalized);
            } else {
                setNotifications([]);
            }

            if (
                accountRes.status === 'rejected' ||
                projectsRes.status === 'rejected' ||
                skillsRes.status === 'rejected' ||
                skillTreeRes.status === 'rejected' ||
                notificationsRes.status === 'rejected'
            ) {
                setError('Một phần dữ liệu dashboard chưa tải được, nhưng các khối còn lại vẫn hiển thị bình thường.');
            }

            setLoading(false);
        };

        loadDashboard();

        return () => {
            active = false;
        };
    }, []);

    const projectRows = useMemo<DevDashboardProjectRow[]>(() => {
        return projects.map((project) => {
            const meta = getStatusMeta(project.status);
            return {
                ...project,
                progress: getProjectProgress(project),
                statusLabel: meta.label,
                statusColor: meta.color,
                timeRange: `${formatDate(project.startDate)} → ${formatDate(project.endDate)}`,
                remainingDays: getRemainingDays(project),
            };
        });
    }, [projects]);

    const summary = useMemo<DevDashboardSummary>(() => {
        const activeProjects = projectRows.filter((project) => normalizeStatus(project.status) === 'active').length;
        const delayedProjects = projectRows.filter((project) => normalizeStatus(project.status) === 'delayed').length;
        const unreadNotifications = notifications.filter((item) => !item.read).length;
        const skillCatalog = skills.length;
        const masteredSkills = skillTree.filter((item) => item.level >= 3).length;
        const learningSkills = skillTree.filter((item) => item.level > 0 && item.level < 3).length;

        return {
            totalProjects: projectRows.length,
            activeProjects,
            delayedProjects,
            unreadNotifications,
            skillCatalog,
            masteredSkills,
            learningSkills,
            lockedSkills: Math.max(skillTree.length - masteredSkills - learningSkills, 0),
        };
    }, [notifications, projectRows, skillTree, skills.length]);

    const projectStatusData = useMemo<DevDashboardChartDatum[]>(() => {
        const buckets = new Map<string, number>();

        projectRows.forEach((project) => {
            buckets.set(project.statusLabel, (buckets.get(project.statusLabel) ?? 0) + 1);
        });

        return Array.from(buckets.entries()).map(([name, value], index) => ({
            name,
            value,
            fill: PIE_COLORS[index % PIE_COLORS.length],
        }));
    }, [projectRows]);

    const skillLevelData = useMemo<DevDashboardChartDatum[]>(() => {
        return [
            { name: 'Thành thạo', value: summary.masteredSkills, fill: '#52c41a' },
            { name: 'Đang học', value: summary.learningSkills, fill: '#faad14' },
            { name: 'Chưa chạm tới', value: summary.lockedSkills, fill: '#d9d9d9' },
        ].filter((item) => item.value > 0);
    }, [summary]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && <Alert type="warning" showIcon message="Dashboard đang hiển thị dữ liệu một phần" description={error} />}

            <DevDashboardHeroCard
                account={account}
                summary={summary}
                onGoProjects={() => navigate('/developer/user-project')}
                onGoSkillTree={() => navigate('/developer/skill-tree')}
            />

            <DevDashboardStatsRow summary={summary} loading={loading} />

            <DevDashboardChartsRow
                projectStatusData={projectStatusData}
                skillLevelData={skillLevelData}
                summary={summary}
                skillTreeCount={skillTree.length}
                loading={loading}
            />

            <DevDashboardProjectTable projects={projectRows} loading={loading} onOpenProject={(projectId) => navigate(`/developer/projects/${projectId}`)} />

            <DevDashboardActivityPanel
                notifications={notifications}
                loading={loading}
                onGoProjects={() => navigate('/developer/user-project')}
                onGoSkillTree={() => navigate('/developer/skill-tree')}
                onGoSkills={() => navigate('/developer/skills')}
                onGoUserSkill={() => navigate('/developer/user-skill')}
            />

            {loading && (
                <Card bordered={false}>
                    <Skeleton active paragraph={{ rows: 3 }} />
                </Card>
            )}
        </div>
    );
};

export default DashboardPage;