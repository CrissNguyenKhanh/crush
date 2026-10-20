import { Typography } from 'antd';
import BenchTalentPoolView from '../../components/hr/talents/bench/BenchTalentPoolView';

const { Title, Text } = Typography;

const BenchForecast = () => (
  <div style={{ padding: 24 }}>
    <Title level={3} style={{ margin: 0 }}>
      Bench Readiness
    </Title>
    <Text type="secondary">
      Dữ liệu được tổng hợp trực tiếp từ hồ sơ kỹ năng, bằng chứng và trạng thái
      nhân sự hiện tại.
    </Text>
    <div style={{ marginTop: 20 }}>
      <BenchTalentPoolView />
    </div>
  </div>
);

export default BenchForecast;
