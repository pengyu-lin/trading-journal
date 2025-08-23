import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Input,
  Button,
  Space,
  Row,
  Col,
  message,
  Upload,
  Image,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  UploadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { TradingAccount, Trade, TradeAction } from "../../types/trade";
import { getPrimaryAccount } from "../../services/accountsService";
import { createTrade, updateTrade } from "../../services/tradesService";

const { Option } = Select;

interface AddTradeFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  mode: "create" | "edit";
  editData?: {
    trade: Trade;
    actions: TradeAction[];
  };
}

export default function AddTradeForm({
  visible,
  onCancel,
  onSubmit,
  mode,
  editData,
}: AddTradeFormProps) {
  const [form] = Form.useForm();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [primaryAccount, setPrimaryAccount] = useState<TradingAccount | null>(
    null
  );

  // Load primary account when component mounts
  useEffect(() => {
    const loadPrimaryAccount = async () => {
      try {
        const account = await getPrimaryAccount();
        setPrimaryAccount(account);
      } catch (error) {
        console.error("Failed to load primary account:", error);
        message.error("Failed to load primary account");
      }
    };

    if (visible) {
      loadPrimaryAccount();

      // If editing, populate form with existing data
      if (mode === "edit" && editData) {
        const { trade, actions } = editData;

        // Convert actions to form format
        const formActions = actions.map((action) => ({
          action: action.action,
          date: dayjs(action.date.toDate()),
          qty: action.qty,
          price: action.price,
          fee: action.fee,
        }));

        form.setFieldsValue({
          accountId: trade.accountId,
          symbol: trade.symbol,
          tickSize: trade.tickSize,
          tickValue: trade.tickValue,
          actions: formActions,
          note: trade.note || "",
          screenshots: trade.screenshots || [],
        });
      } else {
        // Reset form for create mode
        form.resetFields();
        setUploadedImages([]);
      }
    }
  }, [visible, mode, editData, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      setLoading(true);

      // Set the primary account ID if not already set
      if (!values.accountId && primaryAccount) {
        values.accountId = primaryAccount.id;
      }

      // Ensure screenshots field is properly set
      if (!values.screenshots) {
        values.screenshots = [];
      }

      if (mode === "edit" && editData) {
        // Update existing trade
        await updateTrade(editData.trade.id!, values as any);
        // Success message handled by parent component
      } else {
        // Create new trade
        const tradeId = await createTrade(values as any);
        // Success message handled by parent component
      }

      // Reset form and close modal
      form.resetFields();
      setUploadedImages([]);

      // Call the onSubmit callback to close the modal
      await onSubmit(values);
    } catch (error) {
      console.error("Error submitting trade:", error);
      const action = mode === "edit" ? "updating" : "adding";
      message.error(`Failed to ${action} trade. Please try again.`);
      throw error; // Re-throw to let the form handle the error
    } finally {
      setLoading(false);
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

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setUploadedImages((prev) => [...prev, imageUrl]);
    };
    reader.readAsDataURL(file);
    return false; // Prevent default upload behavior
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <style>
        {`
          .ant-form-item-explain-error {
            display: none !important;
          }
          .ant-form-item-extra {
            display: none !important;
          }
        `}
      </style>
      <Modal
        title={mode === "edit" ? "Edit Trade" : "Add New Trade"}
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
            actions: [
              {
                action: "buy",
                date: dayjs(),
                qty: null,
                price: null,
                fee: null,
              },
            ],
            screenshots: [], // Initialize screenshots as empty array
          }}>
          {/* Account Selection */}
          <Form.Item
            name="accountId"
            label="Trading Account"
            rules={[{ required: true, message: "Please select an account" }]}>
            <Select placeholder="Select account" disabled={!primaryAccount}>
              {primaryAccount && (
                <Option value={primaryAccount.id}>{primaryAccount.name}</Option>
              )}
            </Select>
          </Form.Item>

          {/* First row: Symbol, Tick Size, Tick Value */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="symbol"
                label="Symbol"
                rules={[
                  { required: true, message: "Please enter a symbol" },
                  {
                    min: 1,
                    max: 10,
                    message: "Symbol must be between 1 and 10 characters",
                  },
                ]}>
                <Input placeholder="e.g., AAPL" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="tickSize"
                label="Tick Size"
                rules={[
                  { required: true, message: "Please enter tick size" },
                  {
                    type: "number",
                    min: 0.0001,
                    message: "Tick size must be greater than 0",
                  },
                ]}>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="e.g., 0.01"
                  precision={4}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="tickValue"
                label="Tick Value"
                rules={[
                  { required: true, message: "Please enter tick value" },
                  {
                    type: "number",
                    min: 0.01,
                    message: "Tick value must be greater than 0",
                  },
                ]}>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="e.g., 0.01"
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Action rows */}
          <Form.List name="actions">
            {(fields, { add, remove }) => (
              <>
                {/* Table Headers */}
                <Row gutter={16} style={{ fontWeight: "bold" }}>
                  <Col span={4}>
                    <div style={{ padding: "8px 0 0 0", color: "#666" }}>
                      Action
                    </div>
                  </Col>
                  <Col span={7}>
                    <div style={{ padding: "8px 0 0 0", color: "#666" }}>
                      Date/Time
                    </div>
                  </Col>
                  <Col span={3}>
                    <div style={{ padding: "8px 0 0 0", color: "#666" }}>
                      Qty
                    </div>
                  </Col>
                  <Col span={4}>
                    <div style={{ padding: "8px 0 0 0", color: "#666" }}>
                      Price
                    </div>
                  </Col>
                  <Col span={3}>
                    <div style={{ padding: "8px 0 0 0", color: "#666" }}>
                      Fee
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
                        name={[name, "action"]}
                        rules={[
                          { required: true, message: "Action is required" },
                        ]}
                        style={{ marginBottom: 0 }}>
                        <Select placeholder="Select action">
                          <Option value="buy">Buy</Option>
                          <Option value="sell">Sell</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={7}>
                      <Form.Item
                        {...restField}
                        name={[name, "date"]}
                        rules={[
                          { required: true, message: "Date is required" },
                        ]}
                        style={{ marginBottom: 0 }}>
                        <DatePicker
                          onChange={onChange}
                          showTime={{
                            format: "HH:mm",
                          }}
                          format="YYYY-MM-DD HH:mm"
                          style={{ width: "100%" }}
                          placeholder="Select date"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item
                        {...restField}
                        name={[name, "qty"]}
                        rules={[
                          { required: true, message: "Quantity is required" },
                          {
                            type: "number",
                            min: 1,
                            message: "Quantity must be greater than 0",
                          },
                        ]}
                        style={{ marginBottom: 0 }}>
                        <InputNumber
                          style={{ width: "100%" }}
                          placeholder="Qty"
                          min={1}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, "price"]}
                        rules={[
                          { required: true, message: "Price is required" },
                          {
                            type: "number",
                            min: 0.01,
                            message: "Price must be greater than 0",
                          },
                        ]}
                        style={{ marginBottom: 0 }}>
                        <InputNumber
                          style={{ width: "100%" }}
                          precision={2}
                          placeholder="Price"
                          min={0.01}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item
                        {...restField}
                        name={[name, "fee"]}
                        rules={[
                          {
                            type: "number",
                            min: 0,
                            message: "Fee must be greater than or equal to 0",
                          },
                        ]}
                        style={{ marginBottom: 0 }}>
                        <InputNumber
                          style={{ width: "100%" }}
                          placeholder="Fee"
                          min={0}
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
                        action: "buy",
                        date: dayjs(),
                        qty: null,
                        price: null,
                        fee: null,
                      })
                    }
                    icon={<PlusOutlined />}
                    style={{ margin: "12px 0" }}>
                    Add Action
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* Note field */}
          <Form.Item
            name="note"
            label="Note"
            rules={[
              { max: 500, message: "Note must be less than 500 characters" },
            ]}>
            <Input.TextArea
              rows={3}
              placeholder="Add your trade notes here..."
            />
          </Form.Item>

          {/* Screenshot upload */}
          <Form.Item label="Trade Screenshots">
            <Upload
              beforeUpload={handleImageUpload}
              showUploadList={false}
              accept="image/*"
              multiple>
              <Button icon={<UploadOutlined />}>Upload Screenshots</Button>
            </Upload>

            {/* Display uploaded images */}
            {uploadedImages.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Row gutter={[8, 8]}>
                  {uploadedImages.map((imageUrl, index) => (
                    <Col key={index} span={6}>
                      <div
                        style={{
                          position: "relative",
                          display: "inline-block",
                        }}>
                        <Image
                          src={imageUrl}
                          alt={`Screenshot ${index + 1}`}
                          style={{
                            width: "100%",
                            height: 120,
                            objectFit: "cover",
                            cursor: "pointer",
                          }}
                          preview={{ mask: "Click to view" }}
                        />
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          size="small"
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            background: "rgba(255, 255, 255, 0.8)",
                            border: "none",
                            color: "#ff4d4f",
                          }}
                          onClick={() => removeImage(index)}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </Form.Item>

          {/* Form buttons */}
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {loading
                  ? mode === "edit"
                    ? "Updating Trade..."
                    : "Adding Trade..."
                  : mode === "edit"
                  ? "Update Trade"
                  : "Add Trade"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
