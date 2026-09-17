import { Avatar, Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import { FolderOpenOutlined, SafetyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { DevDashboardAccount, DevDashboardSummary } from '../../../common/types/dev-dashboard';

const { Title, Text, Paragraph } = Typography;

interface DevDashboardHeroCardProps {
    account: DevDashboardAccount;
    summary: DevDashboardSummary;
    onGoProjects: () => void;
    onGoSkillTree: () => void;
}

const DevDashboardHeroCard = ({ account, summary, onGoProjects, onGoSkillTree }: DevDashboardHeroCardProps) => {
    return (
        <Card
            bordered={false}
            style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #38bdf8 100%)',
                color: '#fff',
                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)',
                overflow: 'hidden',
            }}
        >
            <Row gutter={[16, 16]} align="middle">
                <Col xs={24} lg={16}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Space size={12} align="center">
                            <Avatar size={48} style={{ backgroundColor: '#ffffff', color: '#1d4ed8', fontWeight: 700 }}>
                                {account.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                                    Developer Console
                                </Text>
                                <Title level={2} style={{ color: '#fff', margin: 0 }}>
                                    Chào mừng, {account.name}
                                </Title>
                            </div>
                        </Space>

                        <Paragraph style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 760, marginBottom: 0 }}>
                            Dashboard này lấy dữ liệu thật từ dự án, kỹ năng và thông báo của bạn. Đây là nơi nên nhìn
                            vào mỗi ngày trước khi vào sprint, review hoặc cập nhật skill.
                        </Paragraph>

                        <Space wrap>
                            <Tag color="cyan" bordered={false} icon={<SafetyOutlined />}>
                                {account.role}
                            </Tag>
                            <Tag color="blue" bordered={false} icon={<FolderOpenOutlined />}>
                                {summary.totalProjects} dự án
                            </Tag>
                            <Tag color="gold" bordered={false} icon={<ThunderboltOutlined />}>
                                {summary.skillCatalog} skill catalog
                            </Tag>
                        </Space>
                    </Space>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        bordered={false}
                        style={{
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(10px)',
                            color: '#fff',
                        }}
                    >
                        <Space direction="vertical" size={16} style={{ width: '100%' }}>
                            <Title level={4} style={{ color: '#fff', margin: 0 }}>
                                Trạng thái nhanh
                            </Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                                {summary.activeProjects > 0 ? 'Đang có việc' : 'Rảnh'}
                            </Text>
                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                <Button type="primary" block onClick={onGoProjects}>
                                    Xem dự án của tôi
                                </Button>
                                <Button block onClick={onGoSkillTree}>
                                    Mở skill tree
                                </Button>
                            </Space>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </Card>
    );
};

export default DevDashboardHeroCard;