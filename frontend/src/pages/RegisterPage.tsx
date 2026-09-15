import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import AuthLayout from "../components/layout/AuthLayout";
import TextField from "../components/ui/TextField";
import { useAuth } from "../context/AuthContext";
import { errorMessage, fieldErrors } from "../lib/errors";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err, "Unable to create your account."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking what matters to you"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {formError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}
        <TextField
          id="name"
          label="Name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          error={errors.name}
          required
          autoComplete="name"
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors.email}
          required
          autoComplete="email"
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          error={errors.password}
          required
          autoComplete="new-password"
        />
        <TextField
          id="password_confirmation"
          label="Confirm password"
          type="password"
          value={form.password_confirmation}
          onChange={(e) => update("password_confirmation", e.target.value)}
          required
          autoComplete="new-password"
        />
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Creating…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
