import { Card, Col, Empty, Row, Typography } from 'antd';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';
import type { DevDashboardChartDatum, DevDashboardSummary } from '../../../common/types/dev-dashboard';

const { Text } = Typography;

interface DevDashboardChartsRowProps {
    projectStatusData: DevDashboardChartDatum[];
    skillLevelData: DevDashboardChartDatum[];
    summary: DevDashboardSummary;
    skillTreeCount: number;
    loading?: boolean;
}

const DevDashboardChartsRow = ({ projectStatusData, skillLevelData, summary, skillTreeCount, loading }: DevDashboardChartsRowProps) => {
    return (
        <Row gutter={16}>
            <Col xs={24} lg={12}>
                <Card title="Phân bổ dự án" bordered={false} extra={<Text type="secondary">{summary.delayedProjects} dự án đang trễ</Text>} loading={loading}>
                    {projectStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={projectStatusData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={3}
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                    {projectStatusData.map((entry, index) => (
                                        <Cell key={`project-status-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <Empty description="Chưa có dự án nào để hiển thị" />
                    )}
                </Card>
            </Col>

            <Col xs={24} lg={12}>
                <Card title="Sức khỏe kỹ năng" bordered={false} extra={<Text type="secondary">{skillTreeCount} node trong cây kỹ năng</Text>} loading={loading}>
                    {skillLevelData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={skillLevelData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={3}
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                    {skillLevelData.map((entry, index) => (
                                        <Cell key={`skill-level-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <Empty description="Chưa có dữ liệu skill tree" />
                    )}
                </Card>
            </Col>
        </Row>
    );
};

export default DevDashboardChartsRow;
