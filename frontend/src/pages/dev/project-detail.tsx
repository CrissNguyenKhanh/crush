import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Tag, Typography, Button, Card, Descriptions, Spin } from "antd";
import { ArrowLeftOutlined, MessageOutlined } from "@ant-design/icons";
import { callFetchUserSprintProjects } from "../../api";
import { ProjectChatDrawer } from "../../components/pm/ProjectChatDrawer";
import type { ProjectItem } from "../../common/types/pm";

const { Title } = Typography;

const DevProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [sprints, setSprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const sprintRes = await callFetchUserSprintProjects();

      if (sprintRes && sprintRes.data) {
        const allProjects = sprintRes.data.projects || [];
        const allSprints = sprintRes.data.sprints || [];
        
        const foundProject = allProjects.find((p: any) => p.id === projectId || p.id === Number(projectId));
        if (foundProject) {
            setProject(foundProject);
        }

        setSprints(allSprints.filter((s: any) => s.projectId === projectId || s.projectId === Number(projectId)));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const sprintColumns = [
    {
      title: 'Tên Sprint',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (text: string) => text ? new Date(text).toLocaleDateString('vi-VN') : '-',
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (text: string) => text ? new Date(text).toLocaleDateString('vi-VN') : '-',
    },
    {
      title: 'Thành viên',
      dataIndex: 'attendant',
      key: 'attendant',
      render: (attendants: string[]) => (
        <>
          {attendants?.map(attendant => (
            <Tag color="blue" key={attendant}>
              {attendant}
            </Tag>
          ))}
        </>
      ),
    },
  ];

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/developer')} 
        style={{ marginBottom: '16px' }}
      >
        Quay lại Dashboard
      </Button>
      
      {project && (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={3} style={{ margin: 0 }}>{project.name}</Title>
            <Button
              type="primary"
              shape="circle"
              icon={<MessageOutlined />}
              onClick={() => setChatOpen(true)}
            />
          </div>
          <Descriptions column={2}>
            <Descriptions.Item label="Mô tả">{project.description || 'Không có mô tả'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={project.status === 'active' ? 'green' : 'geekblue'}>
                {project.status?.toUpperCase() || 'UNKNOWN'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu">
              {project.startDate ? new Date(project.startDate).toLocaleDateString('vi-VN') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày kết thúc">
              {project.endDate ? new Date(project.endDate).toLocaleDateString('vi-VN') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="Danh sách Sprint của bạn trong dự án này">
        <Table
          columns={sprintColumns}
          dataSource={sprints}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {project && (
        <ProjectChatDrawer
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          projectId={project.id}
          projectName={project.name}
        />
      )}
    </div>
  );
};

export default DevProjectDetail;
