import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

interface DeleteConfirmationModalProps {
  visible: boolean;
  entityName: string; // "Trade", "Account", etc.
  entityIdentifier: string; // symbol, name, etc.
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmationModal({
  visible,
  entityName,
  entityIdentifier,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteConfirmationModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is done in the parent component
      throw error;
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
          {`Permanently Delete ${entityName}`}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText={`Delete Permanently`}
      okType="danger"
      cancelText="Cancel"
      confirmLoading={loading}
      width={500}>
      <div>
        <p>
          Are you sure you want to <strong>permanently delete</strong> the{" "}
          {entityName.toLowerCase()} <strong>"{entityIdentifier}"</strong>?
        </p>
        <p style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "8px" }}>
          ⚠️ This action cannot be undone. The {entityName.toLowerCase()} and
          all its data will be permanently removed from the database.
        </p>
      </div>
    </Modal>
  );
}
