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

import dayjs from "dayjs";

import type { TaskItem } from "../../../common/types/pm";

import { pmApi } from "../../../api/pm";
import { callFetchSkillCatalog } from "../../../api";
import type { Dayjs } from "dayjs";
import { getApiErrorData } from "../../../utils/api-error";

interface Props {
  open: boolean;

  task: TaskItem | null;

  onClose: () => void;

  onRefresh: () => void | Promise<void>;
}

interface TaskFormValues {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  budgetRate?: number | null;
  dateRange?: [Dayjs, Dayjs];
  requiredSkills?: Array<{
    skill_id: string;
    min_level: number;
    weight: number;
  }>;
}

export const EditTaskModal: React.FC<Props> = ({
  open,
  task,
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
  // LOAD TASK INTO FORM
  // ==========================================

  useEffect(() => {
    if (!open || !task) {
      return;
    }

    form.setFieldsValue({
      title: task.title ?? "",

      description: task.description ?? "",

      priority: task.priority ?? "MEDIUM",

      budgetRate: task.budgetRate ?? null,

      dateRange:
        task.startDate && task.endDate
          ? [dayjs(task.startDate), dayjs(task.endDate)]
          : undefined,

      requiredSkills: task.requiredSkills ?? [],
    });
  }, [open, task, form]);

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

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleFinish = async (values: TaskFormValues) => {
    if (!task) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: values.title?.trim(),

        description: values.description?.trim() || null,

        priority: values.priority,

        budgetRate: values.budgetRate ?? null,

        startDate: values.dateRange?.[0]?.format("YYYY-MM-DD"),

        endDate: values.dateRange?.[1]?.format("YYYY-MM-DD"),

        requiredSkills: values.requiredSkills ?? [],
      };

      await pmApi.updateTask(task.id, payload);

      message.success("Cập nhật Task thành công.");

      form.resetFields();

      await onRefresh();

      onClose();
    } catch (error: unknown) {
      console.error("Lỗi cập nhật Task:", error);

      const errorData = getApiErrorData(error);

      const code = errorData?.code ?? errorData?.error?.code;

      if (code === "TASK_TIMELINE_DEPENDENCY_CONFLICT") {
        Modal.warning({
          title: "Timeline xung đột Dependency",

          width: 620,

          content:
            errorData?.message ??
            "Timeline mới làm dependency của Task không còn hợp lệ.",
        });

        return;
      }

      if (code === "TASK_OUTSIDE_SPRINT_TIMELINE") {
        Modal.warning({
          title: "Timeline ngoài Sprint",

          content:
            errorData?.message ?? "Task phải nằm trong timeline của Sprint.",
        });

        return;
      }

      if (code === "DONE_TASK_EDIT_LOCKED") {
        Modal.warning({
          title: "Task đã hoàn thành",

          content: "Task DONE không thể chỉnh sửa thông tin.",
        });

        return;
      }

      if (code === "SPRINT_READ_ONLY") {
        Modal.warning({
          title: "Sprint chỉ đọc",

          content:
            "Sprint đã hoàn thành hoặc đã hủy nên không thể chỉnh sửa Task.",
        });

        return;
      }

      if (code === "DUPLICATE_REQUIRED_SKILL") {
        Modal.warning({
          title: "Kỹ năng bị trùng",

          content:
            errorData?.message ??
            "Required Skills không được chứa kỹ năng trùng.",
        });

        return;
      }

      message.error(errorData?.message ?? "Không thể cập nhật Task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Chỉnh sửa Task"
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      width={800}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
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
          <Input maxLength={255} showCount />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} maxLength={2000} showCount />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Độ ưu tiên"
          rules={[
            {
              required: true,
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
                message: "Vui lòng chọn ngày",
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
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Space>

        <Divider titlePlacement="start" plain>
          Required Skills
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
                  <Form.Item
                    {...restField}
                    name={[name, "skill_id"]}
                    rules={[
                      {
                        required: true,
                        message: "Chọn kỹ năng",
                      },
                    ]}
                  >
                    <Select
                      style={{
                        width: 200,
                      }}
                      placeholder="Kỹ năng"
                      loading={skillsLoading}
                      showSearch
                      optionFilterProp="label"
                      options={skillOptions}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "min_level"]}
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={5}
                      placeholder="Level"
                      style={{
                        width: 150,
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "weight"]}
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={10}
                      placeholder="Weight"
                      style={{
                        width: 130,
                      }}
                    />
                  </Form.Item>

                  <MinusCircleOutlined
                    style={{
                      color: "#ff4d4f",
                      cursor: "pointer",
                    }}
                    onClick={() => remove(name)}
                  />
                </Space>
              ))}

              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() =>
                  add({
                    weight: 1,
                  })
                }
              >
                Thêm Required Skill
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};
