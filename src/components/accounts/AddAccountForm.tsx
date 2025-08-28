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
  Card,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { AccountFormData } from "../../types/trade";
import { useEffect, useState } from "react";
import { isAccountNameTaken } from "../../services/accountsService";
import { useAuthStore } from "../../stores/authStore";

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
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuthStore();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Only create form instance when modal is visible
  const formInstance = visible ? form : undefined;

  const handleSubmit = async (values: AccountFormData) => {
    try {
      await onSubmit(values);
      if (formInstance) {
        formInstance.resetFields();
      }
    } catch {
      // Error handling is done in the parent component
    }
  };

  const handleCancel = () => {
    if (formInstance) {
      formInstance.resetFields();
    }
    onCancel();
  };

  const onChange = () => {
    // Date change handler
  };

  // Set form values when editing
  useEffect(() => {
    if (!formInstance) return; // Don't set values if form doesn't exist

    if (visible && mode === "edit" && initialData) {
      formInstance.setFieldsValue({
        name: initialData.name,
        isActive: initialData.isActive,
        isPrimary: initialData.isPrimary,
        transactions: initialData.transactions,
      });
    } else if (visible && mode === "add") {
      formInstance.setFieldsValue({
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
  }, [visible, mode, initialData, formInstance]);

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

    if (!user?.uid) {
      return Promise.resolve(); // Skip validation if user not authenticated
    }

    try {
      // For edit mode, exclude the current account being edited
      const isTaken = await isAccountNameTaken(
        user.uid,
        value.trim(),
        editingAccountId
      );

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
        width={isMobile ? "95%" : 800}
        destroyOnHidden>
        <Form
          form={formInstance}
          layout="vertical"
          onFinish={handleSubmit}
          validateTrigger={["onBlur", "onChange", "onSubmit"]}
          initialValues={{
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
          }}>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 12}>
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
            <Col span={isMobile ? 24 : 12}>
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
            <Col span={isMobile ? 24 : 12}>
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
                {!isMobile && (
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
                      <div
                        style={{ padding: "8px 0 0 0", color: "#666" }}></div>
                    </Col>
                  </Row>
                )}

                {/* Table Rows */}
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    style={{ marginBottom: isMobile ? "16px" : "0" }}>
                    {isMobile ? (
                      // Mobile Card Layout
                      <Card
                        size="small"
                        style={{
                          border: "1px solid #f0f0f0",
                          borderRadius: "8px",
                          marginBottom: "8px",
                        }}>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "type"]}
                              label="Type"
                              rules={[
                                { required: true, message: "Type is required" },
                              ]}>
                              <Select placeholder="Select type">
                                <Option value="deposit">Deposit</Option>
                                <Option value="withdrawal">Withdrawal</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "date"]}
                              label="Date"
                              rules={[
                                { required: true, message: "Date is required" },
                              ]}>
                              <DatePicker
                                onChange={onChange}
                                format="YYYY-MM-DD"
                                style={{ width: "100%" }}
                                placeholder="Select date"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, "amount"]}
                              label="Amount"
                              rules={[
                                {
                                  required: true,
                                  message: "Amount is required",
                                },
                                {
                                  type: "number",
                                  min: 0.01,
                                  message: "Amount must be greater than 0",
                                },
                              ]}>
                              <InputNumber
                                style={{ width: "100%" }}
                                placeholder="Amount"
                                min={0.01}
                                precision={2}
                                addonBefore="$"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, "description"]}
                              label="Note">
                              <Input
                                placeholder="Transaction note"
                                maxLength={100}
                                showCount
                              />
                            </Form.Item>
                          </Col>
                          <Col span={24} style={{ textAlign: "center" }}>
                            {fields.length > 1 && (
                              <Button
                                type="text"
                                danger
                                icon={<MinusCircleOutlined />}
                                onClick={() => remove(name)}
                                size="small">
                                Remove Transaction
                              </Button>
                            )}
                          </Col>
                        </Row>
                      </Card>
                    ) : (
                      // Desktop Table Layout
                      <Row
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
                                  cursor: "pointer",
                                }}
                              />
                            </div>
                          )}
                        </Col>
                      </Row>
                    )}
                  </div>
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
                    style={{ margin: "12px 0 32px 0" }}>
                    Add Transaction
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* Form buttons */}
          <Form.Item
            style={{ marginBottom: 0, textAlign: "right", marginTop: "16px" }}>
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
