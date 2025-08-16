import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  message,
  Checkbox,
  InputNumber,
  DatePicker,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { AccountFormData } from "../../types/trade";

const { Option } = Select;

interface AddAccountFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: AccountFormData) => void;
}

export default function AddAccountForm({
  visible,
  onCancel,
  onSubmit,
}: AddAccountFormProps) {
  const [form] = Form.useForm<AccountFormData>();

  const handleSubmit = async (values: AccountFormData) => {
    try {
      console.log("Form values:", values);
      await onSubmit(values);
      form.resetFields();
      message.success("Account added successfully!");
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
    console.log("Date changed:", date, dateString);
  };

  return (
    <>
      <style>
        {`
          .ant-form-item-explain-error {
            display: none !important;
          }
        `}
      </style>
      <Modal
        title="Add New Trading Account"
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={800}>
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
            <h4 style={{ marginBottom: 16 }}>Initial Account Transactions</h4>
            <p style={{ color: "#666", marginBottom: 16 }}>
              Add your initial deposits or withdrawals to set up the account
              balance.
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
                        amount: null,
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
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Add Account
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
