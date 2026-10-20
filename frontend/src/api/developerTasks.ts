import axios from '../config/interceptor';

export type DeveloperTaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export interface DeveloperTask {
  id: string;
  title?: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: DeveloperTaskStatus;
  progress: number;
  startDate?: string;
  endDate?: string;
  sprint?: {
    id: string;
    name?: string;
    project?: { id: string; name: string };
  };
}

export const developerTasksApi = {
  getMyTasks: () =>
    axios.get<IBackendRes<DeveloperTask[]>>('/tasks/my') as unknown as Promise<
      IBackendRes<DeveloperTask[]>
    >,

  getMyTask: (taskId: string) =>
    axios.get<IBackendRes<DeveloperTask>>(`/tasks/my/${taskId}`) as unknown as Promise<
      IBackendRes<DeveloperTask>
    >,

  updateProgress: (
    taskId: string,
    data: { status?: DeveloperTaskStatus; progress?: number },
  ) =>
    axios.patch<IBackendRes<DeveloperTask>>(
      `/tasks/my/${taskId}/progress`,
      data,
      { suppressGlobalErrorToast: true },
    ) as unknown as Promise<IBackendRes<DeveloperTask>>,
};
