import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { callFetchSkillCatalog } from '../../api';
import { hrTalentsApi, type TalentDirectoryItem } from '../../api/hrTalents';
import {
  matchingRecommendationsApi,
  type MatchingRecommendation,
  type MatchingTarget,
} from '../../api/matchingRecommendations';
import { getApiErrorMessage } from '../../utils/api-error';

const { Title, Text } = Typography;

const HrMatchingRecommendations = () => {
  const [form] = Form.useForm();
  const [items, setItems] = useState<MatchingRecommendation[]>([]);
  const [targets, setTargets] = useState<MatchingTarget[]>([]);
  const [talents, setTalents] = useState<TalentDirectoryItem[]>([]);
  const [skills, setSkills] = useState<ISkills[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const projectId = Form.useWatch('projectId', form);
  const selectedProject = useMemo(
    () => targets.find((project) => project.id === projectId),
    [targets, projectId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, targetResponse, talentResponse, skillResponse] = await Promise.all([
        matchingRecommendationsApi.getHrMine(),
        matchingRecommendationsApi.getTargets(),
        hrTalentsApi.getAll({ page: 1, limit: 100, role: 'DEVELOPER' }),
        callFetchSkillCatalog(),
      ]);
      setItems(mine.data ?? []);
      setTargets(targetResponse.data ?? []);
      setTalents(talentResponse.data?.result ?? []);
      setSkills(skillResponse.data ?? []);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không thể tải dữ liệu Matching.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await matchingRecommendationsApi.create(values);
      message.success('Đã gửi đề cử tới PM.');
      setOpen(false);
      form.resetFields();
      await load();
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không thể gửi đề cử.'));
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<MatchingRecommendation> = [
    { title: 'Nhân sự', render: (_, item) => item.employee?.fullName },
    { title: 'Project', render: (_, item) => item.project?.name },
    { title: 'Sprint', render: (_, item) => item.sprint?.name ?? 'Chưa chỉ định' },
    { title: 'Kỹ năng', render: (_, item) => item.skill?.name ?? '-' },
    { title: 'Trạng thái', render: (_, item) => <Tag color={item.status === 'REJECTED' ? 'red' : item.status === 'PROPOSED' ? 'gold' : 'green'}>{item.status}</Tag> },
    { title: 'Phản hồi PM', dataIndex: 'decisionNote', render: (value) => value || '-' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
        <div><Title level={3} style={{ margin: 0 }}>Đề cử nhân sự</Title><Text type="secondary">HR đề xuất ứng viên; PM vẫn là người quyết định allocation.</Text></div>
        <Button type="primary" onClick={() => setOpen(true)}>Tạo đề cử</Button>
      </Space>
      <Card style={{ marginTop: 20 }}><Table rowKey="id" loading={loading} columns={columns} dataSource={items} scroll={{ x: 900 }} /></Card>
      <Modal title="Đề cử nhân sự cho Project" open={open} onCancel={() => setOpen(false)} onOk={() => void submit()} confirmLoading={saving} destroyOnHidden>
        <Form form={form} layout="vertical" onValuesChange={(changed) => { if ('projectId' in changed) form.setFieldValue('sprintId', undefined); }}>
          <Form.Item name="employeeId" label="Nhân sự" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={talents.map((item) => ({ value: item.id, label: `${item.fullName} · ${item.title ?? 'Developer'} · ${item.status}` }))} /></Form.Item>
          <Form.Item name="projectId" label="Project" rules={[{ required: true }]}><Select options={targets.map((item) => ({ value: item.id, label: `${item.name} · PM ${item.pm?.fullName ?? '-'}` }))} /></Form.Item>
          <Form.Item name="sprintId" label="Sprint (tùy chọn)"><Select allowClear options={(selectedProject?.sprints ?? []).map((item) => ({ value: item.id, label: `${item.name ?? 'Sprint'} · ${item.status}` }))} /></Form.Item>
          <Form.Item name="skillId" label="Kỹ năng trọng tâm"><Select allowClear showSearch optionFilterProp="label" options={skills.map((item) => ({ value: item.id, label: item.name }))} /></Form.Item>
          <Form.Item name="note" label="Lý do đề cử" rules={[{ required: true }, { max: 2000 }]}><Input.TextArea rows={4} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HrMatchingRecommendations;
