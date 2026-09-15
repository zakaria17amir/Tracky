import { Link, useParams } from "react-router-dom";
import { Badge, Button } from "flowbite-react";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/States";
import { useAdminUser } from "../features/admin";

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const { data: user, isLoading, isError, refetch } = useAdminUser(Number(id));

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="User Detail"
        description="Read-only view of a user's account."
        action={
          <Link to="/admin">
            <Button color="light">Back to Admin</Button>
          </Link>
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Couldn't load this user." onRetry={() => refetch()} />}

      {user && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
            <Badge color={user.role === "admin" ? "indigo" : "green"} className="w-fit">
              {user.role}
            </Badge>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Metrics</dt>
              <dd className="font-medium text-gray-900">{user.metrics_count ?? 0}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Entries</dt>
              <dd className="font-medium text-gray-900">{user.entries_count ?? 0}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Dashboards</dt>
              <dd className="font-medium text-gray-900">{user.dashboards_count ?? 0}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
