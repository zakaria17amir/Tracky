import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button } from "flowbite-react";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAdminUsers, useDeleteUser, useUpdateUserRole } from "../features/admin";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../lib/errors";
import type { User } from "../types";

export default function AdminPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useAdminUsers(page);
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const [deleting, setDeleting] = useState<User | null>(null);

  async function toggleRole(user: User) {
    try {
      await updateRole.mutateAsync({
        id: user.id,
        role: user.role === "admin" ? "user" : "admin",
      });
      toast.success(`${user.name} is now ${user.role === "admin" ? "a user" : "an admin"}.`);
    } catch (err) {
      toast.error(errorMessage(err, "Could not change role."));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteUser.mutateAsync(deleting.id);
      toast.success("User deleted.");
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete user."));
    }
  }

  const users = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Admin Panel" description="Manage users and view platform stats." />

      {isLoading && <LoadingState label="Loading users…" />}
      {isError && <ErrorState message="Couldn't load users." onRetry={() => refetch()} />}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Total Users" value={data.meta.total} />
            <StatCard label="Page" value={`${data.meta.current_page} / ${data.meta.last_page}`} />
            <StatCard label="Per Page" value={data.meta.per_page} />
          </div>

          {users.length === 0 ? (
            <EmptyState title="No users" description="No users to display." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Metrics</th>
                    <th className="px-4 py-3">Entries</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link to={`/admin/users/${user.id}`} className="hover:text-brand-600">
                          {user.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge color={user.role === "admin" ? "indigo" : "green"} className="w-fit">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.metrics_count ?? 0}</td>
                      <td className="px-4 py-3 text-gray-600">{user.entries_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="xs"
                            color="light"
                            disabled={user.id === me?.id || updateRole.isPending}
                            onClick={() => toggleRole(user)}
                          >
                            {user.role === "admin" ? "Make user" : "Make admin"}
                          </Button>
                          <Button
                            size="xs"
                            color="failure"
                            disabled={user.id === me?.id}
                            onClick={() => setDeleting(user)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.meta.last_page > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button
                size="xs"
                color="light"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="xs"
                color="light"
                disabled={page >= data.meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete user?"
        message={`"${deleting?.name}" and ALL of their data (metrics, entries, dashboards) will be permanently removed.`}
        loading={deleteUser.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
