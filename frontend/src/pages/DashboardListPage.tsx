import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  Textarea,
  TextInput,
} from "flowbite-react";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import {
  useCreateDashboard,
  useDashboards,
  useDeleteDashboard,
  useUpdateDashboard,
} from "../features/dashboards";
import { useToast } from "../context/ToastContext";
import { errorMessage, fieldErrors } from "../lib/errors";
import type { Dashboard } from "../types";

export default function DashboardListPage() {
  const toast = useToast();
  const { data: dashboards, isLoading, isError, refetch } = useDashboards();
  const deleteDashboard = useDeleteDashboard();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Dashboard | null>(null);
  const [deleting, setDeleting] = useState<Dashboard | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteDashboard.mutateAsync(deleting.id);
      toast.success("Dashboard deleted.");
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete dashboard."));
    }
  }

  return (
    <div>
      <PageHeader
        title="Dashboards"
        description="Organize your widgets into themed dashboards."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + New Dashboard
          </Button>
        }
      />

      {isLoading && <LoadingState label="Loading dashboards…" />}
      {isError && <ErrorState message="Couldn't load dashboards." onRetry={() => refetch()} />}

      {dashboards && dashboards.length === 0 && (
        <EmptyState
          title="No dashboards yet"
          description="Create a dashboard, then add widgets to visualize your metrics."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              + Create your first dashboard
            </Button>
          }
        />
      )}

      {dashboards && dashboards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-5"
            >
              <Link to={`/?d=${dashboard.id}`} className="group">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600">
                  {dashboard.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {dashboard.description || "No description"}
                </p>
                <p className="mt-3 text-xs font-medium text-gray-400">
                  {dashboard.widgets_count ?? 0} widget
                  {(dashboard.widgets_count ?? 0) === 1 ? "" : "s"}
                </p>
              </Link>
              <div className="mt-4 flex gap-2">
                <Link to={`/?d=${dashboard.id}`} className="flex-1">
                  <Button size="xs" className="w-full">
                    Open
                  </Button>
                </Link>
                <Button
                  size="xs"
                  color="light"
                  onClick={() => {
                    setEditing(dashboard);
                    setFormOpen(true);
                  }}
                >
                  Rename
                </Button>
                <Button size="xs" color="failure" onClick={() => setDeleting(dashboard)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DashboardFormModal
        open={formOpen}
        dashboard={editing}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete dashboard?"
        message={`"${deleting?.name}" and all its widgets will be permanently removed. Your metrics and entries are not affected.`}
        loading={deleteDashboard.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

interface DashboardFormModalProps {
  open: boolean;
  dashboard: Dashboard | null;
  onClose: () => void;
}

function DashboardFormModal({ open, dashboard, onClose }: DashboardFormModalProps) {
  const toast = useToast();
  const isEdit = !!dashboard;
  const createDashboard = useCreateDashboard();
  const updateDashboard = useUpdateDashboard();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setName(dashboard?.name ?? "");
      setDescription(dashboard?.description ?? "");
    }
  }, [open, dashboard]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      if (isEdit && dashboard) {
        await updateDashboard.mutateAsync({ id: dashboard.id, input: { name, description } });
        toast.success("Dashboard updated.");
      } else {
        await createDashboard.mutateAsync({ name, description });
        toast.success("Dashboard created.");
      }
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err, "Could not save dashboard."));
    }
  }

  const saving = createDashboard.isPending || updateDashboard.isPending;

  return (
    <Modal show={open} onClose={onClose} size="md">
      <ModalHeader>{isEdit ? "Rename Dashboard" : "New Dashboard"}</ModalHeader>
      <ModalBody>
        <form id="dashboard-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <div className="mb-1">
              <Label htmlFor="dash-name">Name</Label>
            </div>
            <TextInput
              id="dash-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              color={errors.name ? "failure" : undefined}
              required
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          <div>
            <div className="mb-1">
              <Label htmlFor="dash-desc">Description (optional)</Label>
            </div>
            <Textarea
              id="dash-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </form>
      </ModalBody>
      <div className="flex justify-end gap-3 border-t border-gray-200 p-4">
        <Button color="light" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" form="dashboard-form" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save" : "Create"}
        </Button>
      </div>
    </Modal>
  );
}
