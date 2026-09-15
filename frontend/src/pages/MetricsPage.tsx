import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, ToggleSwitch } from "flowbite-react";
import PageHeader from "../components/ui/PageHeader";
import MetricTypeBadge from "../components/ui/MetricTypeBadge";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import MetricFormModal from "../features/metrics/MetricFormModal";
import { useDeleteMetric, useMetrics, useUpdateMetric } from "../features/metrics";
import { lastEntrySummary, metricRangeLabel, typeAccent } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../lib/errors";
import type { Metric } from "../types";

export default function MetricsPage() {
  const toast = useToast();
  const { data: metrics, isLoading, isError, refetch } = useMetrics();
  const updateMetric = useUpdateMetric();
  const deleteMetric = useDeleteMetric();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Metric | null>(null);
  const [deleting, setDeleting] = useState<Metric | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(metric: Metric) {
    setEditing(metric);
    setFormOpen(true);
  }

  async function toggleActive(metric: Metric) {
    try {
      await updateMetric.mutateAsync({ id: metric.id, input: { is_active: !metric.is_active } });
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the metric."));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteMetric.mutateAsync(deleting.id);
      toast.success("Metric deleted.");
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the metric."));
    }
  }

  return (
    <div>
      <PageHeader
        title="My Metrics"
        description="Define what you want to track."
        action={<Button onClick={openCreate}>+ New Metric</Button>}
      />

      {isLoading && <LoadingState label="Loading your metrics…" />}
      {isError && <ErrorState message="Couldn't load your metrics." onRetry={() => refetch()} />}

      {metrics && metrics.length === 0 && (
        <EmptyState
          title="No metrics yet"
          description="Create your first metric to start tracking. You can track numbers, ratings, or yes/no habits."
          action={<Button onClick={openCreate}>+ Create your first metric</Button>}
        />
      )}

      {metrics && metrics.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Unit / Range</th>
                  <th className="px-4 py-3">Last Entry</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-8 w-1.5 rounded-full ${typeAccent(metric.type)}`} />
                        <span className="font-medium text-gray-900">{metric.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <MetricTypeBadge type={metric.type} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{metricRangeLabel(metric)}</td>
                    <td className="px-4 py-3 text-gray-600">{lastEntrySummary(metric)}</td>
                    <td className="px-4 py-3">
                      <ToggleSwitch
                        checked={metric.is_active}
                        onChange={() => toggleActive(metric)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/metrics/${metric.id}/history`}>
                          <Button size="xs" color="light">
                            History
                          </Button>
                        </Link>
                        <Button size="xs" color="light" onClick={() => openEdit(metric)}>
                          Edit
                        </Button>
                        <Button size="xs" color="failure" onClick={() => setDeleting(metric)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`h-8 w-1.5 rounded-full ${typeAccent(metric.type)}`} />
                    <div>
                      <p className="font-medium text-gray-900">{metric.name}</p>
                      <p className="text-xs text-gray-500">{lastEntrySummary(metric)}</p>
                    </div>
                  </div>
                  <MetricTypeBadge type={metric.type} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{metricRangeLabel(metric)}</span>
                  <ToggleSwitch checked={metric.is_active} onChange={() => toggleActive(metric)} />
                </div>
                <div className="flex gap-2">
                  <Link to={`/metrics/${metric.id}/history`} className="flex-1">
                    <Button size="xs" color="light" className="w-full">
                      History
                    </Button>
                  </Link>
                  <Button size="xs" color="light" className="flex-1" onClick={() => openEdit(metric)}>
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    color="failure"
                    className="flex-1"
                    onClick={() => setDeleting(metric)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <MetricFormModal open={formOpen} metric={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete metric?"
        message={`"${deleting?.name}" and all its entries and widgets will be permanently removed.`}
        loading={deleteMetric.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
