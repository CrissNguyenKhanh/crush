import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  InputNumber,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  developerTasksApi,
  type DeveloperTask,
  type DeveloperTaskStatus,
} from '../../api/developerTasks';
import { getApiErrorMessage } from '../../utils/api-error';

const { Title, Text } = Typography;

const statusOptions: Array<{ value: DeveloperTaskStatus; label: string }> = [
  { value: 'TODO', label: 'Chưa bắt đầu' },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { value: 'BLOCKED', label: 'Đang bị chặn' },
  { value: 'DONE', label: 'Hoàn thành' },
];

const DeveloperTasksPage = () => {
  const [tasks, setTasks] = useState<DeveloperTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string>();
  const [drafts, setDrafts] = useState<
    Record<string, { status: DeveloperTaskStatus; progress: number }>
  >({});

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await developerTasksApi.getMyTasks();
      const nextTasks = response.data ?? [];
      setTasks(nextTasks);
      setDrafts(
        Object.fromEntries(
          nextTasks.map((task) => [
            task.id,
            { status: task.status, progress: Number(task.progress ?? 0) },
          ]),
        ),
      );
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không thể tải Task của bạn.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadTasks(), 0);
    return () => window.clearTimeout(timer);
  }, [loadTasks]);

  const updateDraft = (
    task: DeveloperTask,
    patch: Partial<{ status: DeveloperTaskStatus; progress: number }>,
  ) => {
    setDrafts((current) => ({
      ...current,
      [task.id]: {
        status: current[task.id]?.status ?? task.status,
        progress: current[task.id]?.progress ?? Number(task.progress ?? 0),
        ...patch,
      },
    }));
  };

  const save = async (task: DeveloperTask) => {
    const draft = drafts[task.id];
    if (!draft) return;

    const normalizedDraft = {
      ...draft,
      progress:
        draft.status === 'DONE'
          ? 100
          : draft.status === 'TODO'
            ? 0
            : Math.min(99, draft.progress),
    };

    setSavingId(task.id);
    try {
      await developerTasksApi.updateProgress(task.id, normalizedDraft);
      message.success('Đã cập nhật tiến độ Task.');
      await loadTasks();
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không thể cập nhật Task.'));
    } finally {
      setSavingId(undefined);
    }
  };

  const columns: ColumnsType<DeveloperTask> = [
    {
      title: 'Task',
      key: 'task',
      render: (_, task) => (
        <Space direction="vertical" size={0}>
          <Text strong>{task.title || 'Task chưa đặt tên'}</Text>
          <Text type="secondary">
            {task.sprint?.project?.name ?? 'Dự án'} · {task.sprint?.name ?? 'Sprint'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Deadline',
      dataIndex: 'endDate',
      render: (value?: string) =>
        value ? new Date(value).toLocaleDateString('vi-VN') : '-',
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      render: (priority: DeveloperTask['priority']) => (
        <Tag color={priority === 'CRITICAL' ? 'red' : priority === 'HIGH' ? 'orange' : 'blue'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, task) => (
        <Select
          style={{ width: 160 }}
          value={drafts[task.id]?.status ?? task.status}
          options={statusOptions}
          onChange={(status) => {
            const currentProgress =
              drafts[task.id]?.progress ?? Number(task.progress ?? 0);
            updateDraft(task, {
              status,
              ...(status === 'DONE' ? { progress: 100 } : {}),
              ...(status === 'TODO' ? { progress: 0 } : {}),
              ...((status === 'IN_PROGRESS' || status === 'BLOCKED') &&
              currentProgress >= 100
                ? { progress: 99 }
                : {}),
            });
          }}
        />
      ),
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      render: (_, task) => {
        const progress = drafts[task.id]?.progress ?? Number(task.progress ?? 0);
        return (
          <Space direction="vertical" size={4} style={{ minWidth: 180 }}>
            <Progress percent={progress} size="small" />
            <InputNumber
              min={0}
              max={100}
              value={progress}
              addonAfter="%"
              onChange={(value) => {
                const nextProgress = Number(value ?? 0);
                const currentStatus = drafts[task.id]?.status ?? task.status;
                updateDraft(task, {
                  progress: nextProgress,
                  ...(nextProgress === 100 ? { status: 'DONE' } : {}),
                  ...(nextProgress < 100 && currentStatus === 'DONE'
                    ? {
                        status:
                          nextProgress === 0 ? 'TODO' : 'IN_PROGRESS',
                      }
                    : {}),
                });
              }}
            />
          </Space>
        );
      },
    },
    {
      title: '',
      key: 'action',
      render: (_, task) => (
        <Button
          type="primary"
          loading={savingId === task.id}
          onClick={() => void save(task)}
        >
          Lưu
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>Task của tôi</Title>
      <Text type="secondary">
        Theo dõi deadline và cập nhật tiến độ các Task đã được PM giao.
      </Text>
      <Card style={{ marginTop: 20 }}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={tasks}
          locale={{ emptyText: <Empty description="Bạn chưa được giao Task nào" /> }}
          scroll={{ x: 980 }}
        />
      </Card>
    </div>
  );
};

export default DeveloperTasksPage;
