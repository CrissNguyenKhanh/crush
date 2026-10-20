import React, { useEffect, useState } from "react";

import {
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
} from "antd";

import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

import { pmApi } from "../../../api/pm";
import { callFetchSkillCatalog } from "../../../api";
import type { Dayjs } from "dayjs";
import { getApiErrorMessage } from "../../../utils/api-error";

interface Props {
  open: boolean;
  sprintId: string;
  onClose: () => void;
  onRefresh: () => void;
}

interface TaskFormValues {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  budgetRate?: number;
  dateRange?: [Dayjs, Dayjs];
  requiredSkills?: Array<{
    skill_id: string;
    min_level: number;
    weight: number;
  }>;
}

export const CreateTaskModal: React.FC<Props> = ({
  open,
  sprintId,
  onClose,
  onRefresh,
}) => {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillOptions, setSkillOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  useEffect(() => {
    if (!open) return;

    const loadSkills = async () => {
      setSkillsLoading(true);
      try {
        const response = await callFetchSkillCatalog();
        const skills = response?.data ?? [];
        setSkillOptions(
          (Array.isArray(skills) ? skills : []).map((skill: ISkills) => ({
            value: skill.id,
            label: skill.name,
          })),
        );
      } catch {
        setSkillOptions([]);
        message.error("Không thể tải danh mục kỹ năng.");
      } finally {
        setSkillsLoading(false);
      }
    };

    void loadSkills();
  }, [open]);

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleFinish = async (values: TaskFormValues) => {
    try {
      setLoading(true);

      const formattedData = {
        sprintId,

        title: values.title,

        description: values.description ?? null,

        priority: values.priority ?? "MEDIUM",

        budgetRate: values.budgetRate,

        startDate: values.dateRange?.[0]?.format("YYYY-MM-DD"),

        endDate: values.dateRange?.[1]?.format("YYYY-MM-DD"),

        requiredSkills: values.requiredSkills ?? [],
      };

      await pmApi.createTask(formattedData);

      message.success("Tạo Task thành công!");

      form.resetFields();

      onRefresh();

      onClose();
    } catch (error: unknown) {
      console.error("Lỗi tạo Task:", error);

      message.error(getApiErrorMessage(error, "Lỗi khi tạo Task"));
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CLOSE
  // ==========================================

  const handleClose = () => {
    if (loading) {
      return;
    }

    form.resetFields();

    onClose();
  };

  return (
    <Modal
      title="Khởi tạo Task mới"
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Tạo Task"
      cancelText="Hủy"
      width={800}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          priority: "MEDIUM",
          requiredSkills: [],
        }}
      >
        {/* ================================= */}
        {/* BASIC INFORMATION */}
        {/* ================================= */}

        <Form.Item
          name="title"
          label="Tên Task"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập tên Task",
            },
          ]}
        >
          <Input
            placeholder="Ví dụ: Xây dựng API Resource Allocation"
            maxLength={255}
            showCount
          />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea
            rows={3}
            placeholder="Mô tả công việc cần thực hiện..."
            maxLength={2000}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Độ ưu tiên"
          rules={[
            {
              required: true,
              message: "Vui lòng chọn độ ưu tiên",
            },
          ]}
        >
          <Select
            options={[
              {
                value: "LOW",
                label: "Low",
              },
              {
                value: "MEDIUM",
                label: "Medium",
              },
              {
                value: "HIGH",
                label: "High",
              },
              {
                value: "CRITICAL",
                label: "Critical",
              },
            ]}
          />
        </Form.Item>

        {/* ================================= */}
        {/* TIME + BUDGET */}
        {/* ================================= */}

        <Space
          align="start"
          size="middle"
          style={{
            width: "100%",
          }}
        >
          <Form.Item
            name="dateRange"
            label="Thời gian thực hiện"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn ngày!",
              },
            ]}
            style={{
              flex: 1,
              minWidth: 300,
            }}
          >
            <DatePicker.RangePicker
              style={{
                width: "100%",
              }}
            />
          </Form.Item>

          <Form.Item
            name="budgetRate"
            label="Ngân sách / Cost Rate ($)"
            style={{
              flex: 1,
              minWidth: 250,
            }}
          >
            <InputNumber
              min={0}
              placeholder="Ví dụ: 1500"
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Space>

        {/* ================================= */}
        {/* REQUIRED SKILLS */}
        {/* ================================= */}

        <Divider titlePlacement="start" plain>
          Yêu cầu Kỹ năng (Required Skills)
        </Divider>

        <Form.List name="requiredSkills">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{
                    display: "flex",
                    marginBottom: 8,
                  }}
                  align="baseline"
                  wrap
                >
                  {/* SKILL */}

                  <Form.Item
                    {...restField}
                    name={[name, "skill_id"]}
                    rules={[
                      {
                        required: true,
                        message: "Chọn kỹ năng!",
                      },
                    ]}
                  >
                    <Select
                      style={{
                        width: 200,
                      }}
                      placeholder="Chọn kỹ năng"
                      loading={skillsLoading}
                      showSearch
                      optionFilterProp="label"
                      options={skillOptions}
                    />
                  </Form.Item>

                  {/* LEVEL */}

                  <Form.Item
                    {...restField}
                    name={[name, "min_level"]}
                    rules={[
                      {
                        required: true,
                        message: "Nhập Level!",
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={5}
                      placeholder="Level tối thiểu"
                      style={{
                        width: 170,
                      }}
                    />
                  </Form.Item>

                  {/* WEIGHT */}

                  <Form.Item
                    {...restField}
                    name={[name, "weight"]}
                    initialValue={1}
                    rules={[
                      {
                        required: true,
                        message: "Nhập Trọng số!",
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={10}
                      placeholder="Trọng số"
                      style={{
                        width: 140,
                      }}
                    />
                  </Form.Item>

                  {/* DELETE */}

                  <MinusCircleOutlined
                    style={{
                      color: "#ff4d4f",
                      cursor: "pointer",
                    }}
                    onClick={() => remove(name)}
                  />
                </Space>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      weight: 1,
                    })
                  }
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm Yêu cầu Kỹ năng
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};
