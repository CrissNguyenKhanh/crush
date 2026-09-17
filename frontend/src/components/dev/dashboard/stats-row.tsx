import { Card, Col, Row, Statistic } from 'antd';
import { BellOutlined, ClockCircleOutlined, FolderOpenOutlined, UserOutlined } from '@ant-design/icons';
import type { DevDashboardSummary } from '../../../common/types/dev-dashboard';

interface DevDashboardStatsRowProps {
    summary: DevDashboardSummary;
    loading?: boolean;
}

const DevDashboardStatsRow = ({ summary, loading }: DevDashboardStatsRowProps) => {
    return (
        <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
                <Card loading={loading} bordered={false}>
                    <Statistic title="Tổng dự án" value={summary.totalProjects} prefix={<FolderOpenOutlined />} valueStyle={{ color: '#1677ff' }} />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card loading={loading} bordered={false}>
                    <Statistic title="Dự án đang chạy" value={summary.activeProjects} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card loading={loading} bordered={false}>
                    <Statistic title="Skill catalog" value={summary.skillCatalog} prefix={<UserOutlined />} valueStyle={{ color: '#722ed1' }} />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card loading={loading} bordered={false}>
                    <Statistic title="Thông báo chưa đọc" value={summary.unreadNotifications} prefix={<BellOutlined />} valueStyle={{ color: '#fa8c16' }} />
                </Card>
            </Col>
        </Row>
    );
};

export default DevDashboardStatsRow;