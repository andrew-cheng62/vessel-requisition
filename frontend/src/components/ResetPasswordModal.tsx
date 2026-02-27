import { useState } from "react";
import api from "../api/api";
import type { User } from "../types";
import toast from "react-hot-toast";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Modal from "./Modal";

type Props = {
  user: User;
  onClose: () => void;
};

export default function ResetPasswordModal({ user, onClose }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/users/${user.id}/reset-password`, {
        new_password: newPassword,
      });
      toast.success(`Password reset for ${user.full_name || user.username}`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Reset Password" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">
        Setting new password for{" "}
        <strong className="text-gray-800">{user.full_name || user.username}</strong>.
        They will need to use this password on next login.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <Input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <Input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Saving..." : "Reset Password"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
