import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Input, Modal, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  matchingRecommendationsApi,
  type MatchingRecommendation,
} from '../../api/matchingRecommendations';
import { getApiErrorMessage } from '../../utils/api-error';

const { Title, Text } = Typography;

export const MatchingRecommendationsPage = () => {
  const [items, setItems] = useState<MatchingRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await matchingRecommendationsApi.getPmMine();
      setItems(response.data ?? []);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không thể tải đề cử từ HR.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const decide = (item: MatchingRecommendation, status: 'ACCEPTED' | 'REJECTED') => {
    let note = '';
    Modal.confirm({
      title: status === 'ACCEPTED' ? 'Tiếp nhận đề cử?' : 'Từ chối đề cử?',
      content: <Input.TextArea rows={3} placeholder="Phản hồi cho HR" onChange={(event) => { note = event.target.value; }} />,
      okText: status === 'ACCEPTED' ? 'Tiếp nhận' : 'Từ chối',
      okButtonProps: { danger: status === 'REJECTED' },
      onOk: async () => {
        setSavingId(item.id);
        try {
          await matchingRecommendationsApi.decide(item.id, { status, decisionNote: note });
          message.success('Đã phản hồi đề cử.');
          await load();
        } catch (error) {
          message.error(getApiErrorMessage(error, 'Không thể phản hồi đề cử.'));
          throw error;
        } finally {
          setSavingId(undefined);
        }
      },
    });
  };

  const columns: ColumnsType<MatchingRecommendation> = [
    { title: 'Ứng viên', render: (_, item) => <Space direction="vertical" size={0}><Text strong>{item.employee?.fullName}</Text><Text type="secondary">{item.employee?.title ?? 'Developer'}</Text></Space> },
    { title: 'Project / Sprint', render: (_, item) => <Space direction="vertical" size={0}><Text>{item.project?.name}</Text><Text type="secondary">{item.sprint?.name ?? 'Chưa chỉ định Sprint'}</Text></Space> },
    { title: 'Kỹ năng', render: (_, item) => item.skill?.name ?? '-' },
    { title: 'Lý do HR đề cử', dataIndex: 'note' },
    { title: 'Trạng thái', render: (_, item) => <Tag color={item.status === 'REJECTED' ? 'red' : item.status === 'PROPOSED' ? 'gold' : 'green'}>{item.status}</Tag> },
    {
      title: 'Hành động',
      render: (_, item) => item.status === 'PROPOSED' ? (
        <Space>
          <Button type="primary" loading={savingId === item.id} onClick={() => decide(item, 'ACCEPTED')}>Tiếp nhận</Button>
          <Button danger loading={savingId === item.id} onClick={() => decide(item, 'REJECTED')}>Từ chối</Button>
        </Space>
      ) : <Text type="secondary">Đã xử lý</Text>,
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>Đề cử từ HR</Title>
      <Text type="secondary">Xem ứng viên HR đề xuất. Tiếp nhận đề cử không tự động tạo allocation.</Text>
      <Card style={{ marginTop: 20 }}><Table rowKey="id" loading={loading} columns={columns} dataSource={items} scroll={{ x: 980 }} /></Card>
    </div>
  );
};
