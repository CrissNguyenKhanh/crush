import { Button, Card, Empty, Progress, Space, Table, Tag, Typography } from 'antd';
import { FolderOpenOutlined, RightOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DevDashboardProjectRow } from '../../../common/types/dev-dashboard';

const { Text } = Typography;

interface DevDashboardProjectTableProps {
    projects: DevDashboardProjectRow[];
    loading?: boolean;
    onOpenProject: (projectId: string) => void;
}

const DevDashboardProjectTable = ({ projects, loading, onOpenProject }: DevDashboardProjectTableProps) => {
    const columns: ColumnsType<DevDashboardProjectRow> = [
        {
            title: 'Dự án',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record) => (
                <Space direction="vertical" size={2}>
                    <Space size={8} align="center">
                        <FolderOpenOutlined style={{ color: '#1677ff' }} />
                        <Text strong>{name}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.description || 'Chưa có mô tả'}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'statusLabel',
            key: 'statusLabel',
            width: 140,
            render: (_: string, record) => (
                <Tag color={record.statusColor} bordered={false}>
                    {record.statusLabel}
                </Tag>
            ),
        },
        {
            title: 'Tiến độ',
            dataIndex: 'progress',
            key: 'progress',
            width: 220,
            render: (progress: number) => (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Progress percent={Math.min(100, Math.max(0, progress))} size="small" />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {Math.min(100, Math.max(0, progress))}%
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Thời gian',
            dataIndex: 'timeRange',
            key: 'timeRange',
            width: 220,
            render: (_: string, record) => (
                <Space direction="vertical" size={2}>
                    <Text>{record.timeRange}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.remainingDays}
                    </Text>
                </Space>
            ),
        },
        {
            title: '',
            key: 'action',
            width: 120,
            align: 'right',
            render: (_, record) => (
                <Button type="link" icon={<RightOutlined />} onClick={() => onOpenProject(record.id)}>
                    Mở
                </Button>
            ),
        },
    ];

    return (
        <Card bordered={false} title="Dự án của tôi" loading={loading}>
            <Table
                columns={columns}
                dataSource={projects}
                rowKey="id"
                pagination={false}
                scroll={{ x: 900 }}
                locale={{ emptyText: <Empty description="Chưa có dự án nào được gán cho bạn" /> }}
            />
        </Card>
    );
};

export default DevDashboardProjectTable;