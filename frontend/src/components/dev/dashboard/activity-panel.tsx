import { Button, Card, Empty, Space, Timeline, Typography } from 'antd';
import { BellOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { DevDashboardNotificationItem } from '../../../common/types/dev-dashboard';

const { Paragraph, Text } = Typography;

interface DevDashboardActivityPanelProps {
    notifications: DevDashboardNotificationItem[];
    loading?: boolean;
    onGoProjects: () => void;
    onGoSkillTree: () => void;
    onGoSkills: () => void;
    onGoUserSkill: () => void;
}

const formatRelativeTime = (value?: string) => {
    if (!value) return 'Vừa xong';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Vừa xong';

    const diffMs = Date.now() - parsed.getTime();
    const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    return `${Math.round(diffHours / 24)} ngày trước`;
};

const DevDashboardActivityPanel = ({ notifications, loading, onGoProjects, onGoSkillTree, onGoSkills, onGoUserSkill }: DevDashboardActivityPanelProps) => {
    const items = notifications.slice(0, 5).map((item) => ({
        color: item.type === 'success' ? 'green' : item.type === 'warning' ? 'orange' : 'blue',
        dot: item.type === 'success' ? <CheckCircleOutlined /> : item.type === 'warning' ? <ClockCircleOutlined /> : <BellOutlined />,
        children: (
            <div>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                    {item.title}
                </Text>
                <Paragraph style={{ marginBottom: 4, color: '#667085' }} ellipsis={{ rows: 2 }}>
                    {item.description}
                </Paragraph>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatRelativeTime(item.createdAt)}
                </Text>
            </div>
        ),
    }));

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card title="Hoạt động gần đây" bordered={false} extra={<Text type="secondary">{notifications.length} thông báo</Text>} loading={loading}>
                {items.length > 0 ? <Timeline items={items} /> : <Empty description="Chưa có thông báo mới" />}
            </Card>

            <Card title="Lối tắt" bordered={false} loading={loading}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Button block type="primary" onClick={onGoProjects}>
                        Xem dự án đang tham gia
                    </Button>
                    <Button block onClick={onGoSkillTree}>
                        Mở cây kỹ năng
                    </Button>
                    <Button block onClick={onGoSkills}>
                        Duyệt thư viện skill
                    </Button>
                    <Button block onClick={onGoUserSkill}>
                        Cập nhật kỹ năng cá nhân
                    </Button>
                </Space>
            </Card>
        </Space>
    );
};

export default DevDashboardActivityPanel;