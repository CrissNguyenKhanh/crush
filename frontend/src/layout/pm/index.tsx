
import {
  Layout,
  Menu,
  Typography,
  Button,
  Flex,
  theme,
  message,
  type GetProp,
  type MessageArgsProps
} from "antd";

import {
  DashboardOutlined,
  DatabaseOutlined,
  AlertOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProjectOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";

import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { NotificationBell } from "../../components/pm/NotificationBell";

const { Content, Sider, Header } = Layout;
const { Text } = Typography;

import { connectSocket, getSocket } from "../../config/socket.config";



const defaultStyles: GetProp<MessageArgsProps, 'styles', 'Return'> = {
  root: {
    backgroundColor: '#f6ffed',
    border: '2px solid #95de64',
    borderRadius: 16,
    boxShadow: '4px 4px 0 #d9f7be',
  },
  icon: {
    color: '#237804',
  },
  title: {
    color: '#237804',
    fontWeight: 600,
  },
};

const LayoutPM = () => {

  const [messageApi, contextHolder] = message.useMessage();
  // const socketRef = useRef<Socket | null>(null);

  // useEffect(() => {
  //   const token = localStorage.getItem('access_token');

  //   if (!token) return;

  //   const rawToken = token.replace(/^Bearer\s+/i, '');
  //   console.log(`${import.meta.env.VITE_SOCKET_URL}/user-skills`);
  //   const socket = io(`${import.meta.env.VITE_SOCKET_URL}/user-skills`, {
  //     auth: {
  //       token: `Bearer ${rawToken}`
  //     },
  //     transports: ["websocket"],
  //     reconnectionAttempts: 5,
  //     timeout: 10000
  //   });

  //   socketRef.current = socket;

  //   socket.on('connect', () => console.log('Socket Connected:', socket.id));
  //   socket.on('disconnect', (reason) => console.log('Socket Disconnected:', reason));
  //   socket.on('connect_error', (err) => console.error('Socket Error:', err.message));

  //   socket.on('user-skill-updated', (message) => {
  //     console.log('Nhận thông báo từ server:', message);
  //     messageApi.open({
  //       type: 'success',
  //       content: message.message,
  //       styles: defaultStyles,
  //     });
  //   });

  //   return () => {
  //     socket.off('user-skill-updated');
  //     socket.disconnect();
  //   };
  // }, []);

  useEffect(() => {
    connectSocket('/user-skills');
    const socket = getSocket('/user-skills');
    const handleUpdated = (socketMessage: { message?: string }) => {
      messageApi.open({
        type: 'success',
        content: socketMessage.message ?? 'Dữ liệu kỹ năng đã được cập nhật.',
        styles: defaultStyles,
      });
    };

    socket.on('user-skill-updated', handleUpdated);

    return () => {
      socket.off('user-skill-updated', handleUpdated);
    };
  }, [messageApi]);


  const [collapsed, setCollapsed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // ==========================================
  // ACTIVE MENU
  // ==========================================

  const path = location.pathname;
  const selectedKey =
    path === "/pm" || path.includes("/pm/dashboard")
      ? "dashboard"
      : path.includes("/pm/my-team")
        ? "my-team"
        : path.includes("/pm/resources")
          ? "resources"
          : path.includes("/pm/action-center")
            ? "action-center"
            : path.includes("/pm/matching")
              ? "matching"
              : "projects";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* ==========================================
          SIDEBAR
      ========================================== */}

      {contextHolder}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
      >

        {/* LOGO */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            fontSize: collapsed ? "16px" : "20px",
            transition: "font-size 0.2s",
          }}
        >
          {collapsed ? "PM" : "PM Workspace"}
        </div>

        {/* MENU */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ marginTop: 16 }}
          items={[
            {
              key: "dashboard",

              icon: <DashboardOutlined />,

              label: "Tổng quan",

              onClick: () => navigate("/pm/dashboard"),
            },
            {
              key: "projects",
              icon: <ProjectOutlined />,
              label: "Quản lý Dự án",
              onClick: () => navigate("/pm/projects"),
            },
            {
              key: "my-team",
              icon: <TeamOutlined />,
              label: "Đội của tôi (My Team)",
              onClick: () => navigate("/pm/my-team"),
            },
            {
              key: "resources",
              icon: <DatabaseOutlined />,
              label: "Tài nguyên",
              onClick: () => navigate("/pm/resources"),
            },
            {
              key: "matching",
              icon: <UserSwitchOutlined />,
              label: "Đề cử từ HR",
              onClick: () => navigate("/pm/matching"),
            },
            {
              key: "action-center",
              icon: <AlertOutlined />,
              label: "Việc cần xử lý",
              onClick: () => navigate("/pm/action-center"),
            },
          ]}
        />
      </Sider>

      {/* ==========================================
          MAIN LAYOUT
      ========================================== */}

      <Layout>
        {/* ========================================
            HEADER
        ======================================== */}

        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Flex
            align="center"
            justify="space-between"
            style={{
              height: "100%",
              width: "100%",
            }}
          >
            {/* LEFT */}
            <Flex align="center" gap={12}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: "18px",
                  width: 42,
                  height: 42,
                }}
              />

              <Text
                strong
                style={{
                  fontSize: 18,
                  color: "#1677ff",
                }}
              >
                Project Manager
              </Text>
            </Flex>

            {/* RIGHT */}
            <Flex
              align="center"
              gap={20}
              style={{
                height: "100%",
              }}
            >
              {/* NOTIFICATION */}
              <NotificationBell />

              {/* USER */}
              <Flex
                align="center"
                gap={4}
                style={{
                  whiteSpace: "nowrap",
                }}
              >
                <Text type="secondary">Welcome,</Text>

                <Text strong>Khanh Nguyễn (PM)</Text>
              </Flex>
            </Flex>
          </Flex>
        </Header>

        {/* ========================================
            CONTENT
        ======================================== */}

        <Content
          style={{
            margin: "24px 16px",
            padding: 0,
            minHeight: 280,
          }}
        >
          <div
            style={{
              minHeight: "calc(100vh - 112px)",
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutPM;
