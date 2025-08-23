import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Checkbox,
  InputNumber,
  DatePicker,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { AccountFormData } from "../../types/trade";
import { useEffect } from "react";
import { isAccountNameTaken } from "../../services/accountsService";

const { Option } = Select;

interface AddAccountFormProps {
  visible: boolean;
  mode: "add" | "edit";
  initialData?: AccountFormData;
  editingAccountId?: string; // Add this for edit mode
  onCancel: () => void;
  onSubmit: (values: AccountFormData) => void;
  loading?: boolean;
}

export default function AddAccountForm({
  visible,
  mode,
  initialData,
  editingAccountId,
  onCancel,
  onSubmit,
  loading = false,
}: AddAccountFormProps) {
  const [form] = Form.useForm<AccountFormData>();

  const handleSubmit = async (values: AccountFormData) => {
    try {
      await onSubmit(values);
      form.resetFields();
    } catch {
      // Error handling is done in the parent component
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const onChange = (
    date: dayjs.Dayjs | null,
    dateString: string | string[]
  ) => {
    // Date change handler
  };

  // Set form values when editing
  useEffect(() => {
    if (visible && mode === "edit" && initialData) {
      form.setFieldsValue({
        name: initialData.name,
        isActive: initialData.isActive,
        isPrimary: initialData.isPrimary,
        transactions: initialData.transactions,
      });
    } else if (visible && mode === "add") {
      form.setFieldsValue({
        name: "",
        isActive: true,
        isPrimary: false,
        transactions: [
          {
            type: "deposit",
            amount: undefined,
            date: dayjs(),
            description: "",
          },
        ],
      });
    }
  }, [visible, mode, initialData, form]);

  const getModalTitle = () => {
    return mode === "add" ? "Add New Trading Account" : "Edit Trading Account";
  };

  const getSubmitButtonText = () => {
    return mode === "add" ? "Add Account" : "Update Account";
  };

  // Custom validation for duplicate account names
  const validateAccountName = async (_: unknown, value: string) => {
    if (!value || value.trim().length === 0) {
      return Promise.resolve();
    }

    try {
      // For edit mode, exclude the current account being edited
      const isTaken = await isAccountNameTaken(value.trim(), editingAccountId);

      if (isTaken) {
        return Promise.reject(
          new Error(`Account name "${value.trim()}" already exists`)
        );
      }

      return Promise.resolve();
    } catch {
      // If validation fails, don't block the form
      return Promise.resolve();
    }
  };

  return (
    <>
      <style>
        {`
            /* Hide error text messages for transaction amount fields only */
            .ant-form-item:has(.ant-input-number) .ant-form-item-explain-error {
              display: none !important;
            }
          `}
      </style>
      <Modal
        title={getModalTitle()}
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnHidden>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          validateTrigger={["onBlur", "onChange", "onSubmit"]}
          initialValues={{
            isActive: true,
            isPrimary: false,
            transactions: [
              {
                type: "deposit",
                amount: null,
                date: dayjs(),
                description: "",
              },
            ],
          }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Account Name"
                rules={[
                  { required: true, message: "Please enter account name" },
                  {
                    min: 2,
                    max: 50,
                    message: "Account name must be between 2 and 50 characters",
                  },
                  {
                    validator: validateAccountName,
                    validateTrigger: ["onBlur", "onChange"],
                  },
                ]}>
                <Input placeholder="e.g., Main Account" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="Account Status"
                rules={[{ required: true, message: "Please select status" }]}>
                <Select placeholder="Select status">
                  <Option value={true}>Active</Option>
                  <Option value={false}>Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isPrimary"
                valuePropName="checked"
                label="Primary Account">
                <Checkbox>Set as primary account</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          {/* Account Transactions Section */}
          <div style={{ marginTop: 24, marginBottom: 16 }}>
            <h4 style={{ marginBottom: 16 }}>
              {mode === "add" ? "Initial" : "Account"} Transactions
            </h4>
            <p style={{ color: "#666", marginBottom: 16 }}>
              {mode === "add"
                ? "Add your initial deposits or withdrawals to set up the account balance."
                : "Manage deposits and withdrawals for this account."}
            </p>
          </div>

          <Form.List name="transactions">
            {(fields, { add, remove }) => (
              <>
                {/* Table Headers */}
                <Row gutter={16} style={{ fontWeight: "bold" }}>
                  <Col span={4}>
                    <div style={{ padding: "8px 0 0 0", color: "#666" }}>
                      Type
                    </div>
                  </Col>
                  <Col span={5}>
                    <div style={{ padding: "8px 0 0 0", color: "#666" }}>
                      Date
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ padding: "8px 0 0 0", color: "#666" }}>
                      Amount
                    </div>
                  </Col>
                  <Col span={7}>
                    <div style={{ padding: "8px 0 0 0", color: "#666" }}>
                      Note
                    </div>
                  </Col>
                  <Col span={2}>
                    <div style={{ padding: "8px 0 0 0", color: "#666" }}></div>
                  </Col>
                </Row>

                {/* Table Rows */}
                {fields.map(({ key, name, ...restField }) => (
                  <Row
                    key={key}
                    gutter={16}
                    align="middle"
                    style={{ padding: "12px 0" }}>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, "type"]}
                        rules={[
                          { required: true, message: "Type is required" },
                        ]}
                        style={{ marginBottom: 0 }}>
                        <Select placeholder="Select type">
                          <Option value="deposit">Deposit</Option>
                          <Option value="withdrawal">Withdrawal</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, "date"]}
                        rules={[
                          { required: true, message: "Date is required" },
                        ]}
                        style={{ marginBottom: 0 }}>
                        <DatePicker
                          onChange={onChange}
                          format="YYYY-MM-DD"
                          style={{ width: "100%" }}
                          placeholder="Select date"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, "amount"]}
                        rules={[
                          { required: true, message: "Amount is required" },
                          {
                            type: "number",
                            min: 0.01,
                            message: "Amount must be greater than 0",
                          },
                        ]}
                        style={{ marginBottom: 0 }}>
                        <InputNumber
                          style={{ width: "100%" }}
                          placeholder="Amount"
                          min={0.01}
                          precision={2}
                          addonBefore="$"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={7}>
                      <Form.Item
                        {...restField}
                        name={[name, "description"]}
                        style={{ marginBottom: 0 }}>
                        <Input
                          placeholder="Transaction note"
                          maxLength={100}
                          showCount
                        />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      {fields.length > 1 && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                          }}>
                          <MinusCircleOutlined
                            onClick={() => remove(name)}
                            style={{
                              color: "#ff4d4f",
                              fontSize: "18px",
                              cursor: "pointer",
                            }}
                          />
                        </div>
                      )}
                    </Col>
                  </Row>
                ))}

                <Form.Item
                  style={{
                    marginBottom: 0,
                    display: "flex",
                    justifyContent: "center",
                  }}>
                  <Button
                    type="dashed"
                    onClick={() =>
                      add({
                        type: "deposit",
                        amount: undefined,
                        date: dayjs(),
                        description: "",
                      })
                    }
                    icon={<PlusOutlined />}
                    style={{ margin: "12px 0" }}>
                    Add Transaction
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* Form buttons */}
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {getSubmitButtonText()}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
