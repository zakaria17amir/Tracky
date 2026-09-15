import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Button, Select } from "flowbite-react";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import WidgetCard from "../features/widgets/WidgetCard";
import WidgetConfigurator from "../features/widgets/WidgetConfigurator";
import { useDashboard, useDashboards } from "../features/dashboards";
import { useDeleteWidget, useReorderWidgets } from "../features/widgets";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../lib/errors";
import type { Widget } from "../types";

export default function DashboardViewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const { data: dashboards, isLoading: listLoading } = useDashboards();

  // Selected dashboard comes from ?d=ID, defaulting to the first one. Using a
  // query param (not a path) keeps the URL on "/" so the Dashboard nav stays active.
  const requestedId = searchParams.get("d") ? Number(searchParams.get("d")) : undefined;
  const dashboardId =
    requestedId ?? (dashboards && dashboards.length > 0 ? dashboards[0].id : undefined);
  const { data: dashboard, isLoading, isError, refetch } = useDashboard(dashboardId);

  const reorder = useReorderWidgets(dashboardId ?? 0);
  const deleteWidget = useDeleteWidget(dashboardId ?? 0);

  const [order, setOrder] = useState<Widget[]>([]);
  const [configuratorOpen, setConfiguratorOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [deletingWidget, setDeletingWidget] = useState<Widget | null>(null);

  // Sync local order from the server whenever the dashboard reloads.
  useEffect(() => {
    if (dashboard?.widgets) setOrder(dashboard.widgets);
  }, [dashboard]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.findIndex((w) => w.id === active.id);
    const newIndex = order.findIndex((w) => w.id === over.id);
    const previous = order;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next); // optimistic

    try {
      await reorder.mutateAsync(next.map((w) => w.id));
    } catch (err) {
      setOrder(previous); // rollback
      toast.error(errorMessage(err, "Could not save the new order."));
    }
  }

  async function confirmDeleteWidget() {
    if (!deletingWidget) return;
    try {
      await deleteWidget.mutateAsync(deletingWidget.id);
      toast.success("Widget removed.");
      setDeletingWidget(null);
    } catch (err) {
      toast.error(errorMessage(err, "Could not remove widget."));
    }
  }

  if (listLoading) return <LoadingState label="Loading dashboards…" />;

  if (dashboards && dashboards.length === 0) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Your widgets at a glance." />
        <EmptyState
          title="No dashboards yet"
          description="Create a dashboard first, then add widgets to visualize your metrics."
          action={
            <Link to="/dashboards">
              <Button>Go to Dashboards</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={dashboard?.name ?? "Dashboard"}
        description={dashboard?.description || "Your widgets at a glance."}
        action={
          <div className="flex items-center gap-2">
            {dashboards && dashboards.length > 1 && (
              <Select
                value={dashboardId}
                onChange={(e) => setSearchParams({ d: e.target.value })}
              >
                {dashboards.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            )}
            <Button onClick={() => setConfiguratorOpen(true)}>+ Add Widget</Button>
          </div>
        }
      />

      {isLoading && <LoadingState label="Loading widgets…" />}
      {isError && <ErrorState message="Couldn't load this dashboard." onRetry={() => refetch()} />}

      {dashboard && order.length === 0 && (
        <EmptyState
          title="No widgets yet"
          description="Add your first widget to start visualizing a metric."
          action={<Button onClick={() => setConfiguratorOpen(true)}>+ Add Widget</Button>}
        />
      )}

      {dashboard && order.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {order.map((widget) => (
                <WidgetCard
                  key={widget.id}
                  widget={widget}
                  onEdit={(w) => {
                    setEditingWidget(w);
                    setConfiguratorOpen(true);
                  }}
                  onDelete={(w) => setDeletingWidget(w)}
                />
              ))}
              <button
                type="button"
                onClick={() => setConfiguratorOpen(true)}
                className="flex min-h-[14rem] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white/50 text-gray-500 transition hover:border-brand-400 hover:text-brand-600"
              >
                <span className="text-2xl">+</span>
                <span className="text-sm font-medium">Add Widget</span>
                <span className="text-xs text-gray-400">Pick metric & chart type</span>
              </button>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {dashboardId && (
        <WidgetConfigurator
          open={configuratorOpen}
          dashboardId={dashboardId}
          widget={editingWidget}
          onClose={() => {
            setConfiguratorOpen(false);
            setEditingWidget(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingWidget}
        title="Remove widget?"
        message="This widget will be removed from the dashboard. Your metric and its data are not affected."
        confirmLabel="Remove"
        loading={deleteWidget.isPending}
        onConfirm={confirmDeleteWidget}
        onCancel={() => setDeletingWidget(null)}
      />
    </div>
  );
}
