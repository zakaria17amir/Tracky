import { useState, type FormEvent } from "react";
import { Button } from "flowbite-react";
import PageHeader from "../components/ui/PageHeader";
import TextField from "../components/ui/TextField";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../lib/api";
import { errorMessage, fieldErrors } from "../lib/errors";
import type { User } from "../types";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [savingPw, setSavingPw] = useState(false);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setSavingProfile(true);
    try {
      const { data } = await api.patch<User>("/user", { name, email });
      updateUser(data);
      toast.success("Profile updated.");
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err, "Could not update profile."));
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwErrors({});
    setSavingPw(true);
    try {
      await api.patch("/user", {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      toast.success("Password changed.");
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err) {
      setPwErrors(fieldErrors(err));
      toast.error(errorMessage(err, "Could not change password."));
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile & Settings" description="Manage your account." />

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Account details</h2>
        <form onSubmit={saveProfile} className="flex flex-col gap-4" noValidate>
          <TextField
            id="profile-name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />
          <TextField
            id="profile-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />
          <div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Change password</h2>
        <form onSubmit={savePassword} className="flex flex-col gap-4" noValidate>
          <TextField
            id="current-password"
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={pwErrors.current_password}
            autoComplete="current-password"
            required
          />
          <TextField
            id="new-password"
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={pwErrors.password}
            autoComplete="new-password"
            required
          />
          <TextField
            id="confirm-password"
            label="Confirm new password"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            autoComplete="new-password"
            required
          />
          <div>
            <Button type="submit" disabled={savingPw}>
              {savingPw ? "Saving…" : "Change password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
