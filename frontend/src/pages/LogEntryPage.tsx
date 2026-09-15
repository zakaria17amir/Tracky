import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Label, TextInput } from "flowbite-react";
import PageHeader from "../components/ui/PageHeader";
import MetricTypeBadge from "../components/ui/MetricTypeBadge";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useMetrics } from "../features/metrics";
import { useBulkUpsertEntries, useUpsertEntry } from "../features/entries";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../lib/errors";
import { todayIso } from "../lib/format";
import type { EntryValue, Metric } from "../types";

type ValueMap = Record<number, EntryValue>;

export default function LogEntryPage() {
  const toast = useToast();
  const { data: metrics, isLoading, isError, refetch } = useMetrics(true);
  const upsert = useUpsertEntry();
  const bulkUpsert = useBulkUpsertEntries();

  const today = todayIso();
  const [logDate, setLogDate] = useState(today);
  const [values, setValues] = useState<ValueMap>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  function setValue(metricId: number, value: EntryValue) {
    setValues((prev) => ({ ...prev, [metricId]: value }));
  }

  function clearValue(metricId: number) {
    setValues((prev) => {
      const next = { ...prev };
      delete next[metricId];
      return next;
    });
  }

  const filledRows = useMemo(
    () =>
      Object.entries(values)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([metricId, value]) => ({
          metric_id: Number(metricId),
          logged_date: logDate,
          value: value as EntryValue,
        })),
    [values, logDate],
  );

  async function saveOne(metric: Metric) {
    const value = values[metric.id];
    if (value === null || value === undefined) {
      toast.error("Enter a value first.");
      return;
    }
    setSavingId(metric.id);
    try {
      await upsert.mutateAsync({ metric_id: metric.id, logged_date: logDate, value });
      toast.success(`Saved ${metric.name}.`);
      clearValue(metric.id); // clear the input after a successful save
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the entry."));
    } finally {
      setSavingId(null);
    }
  }

  async function saveAll() {
    if (filledRows.length === 0) {
      toast.error("Nothing to save yet.");
      return;
    }
    try {
      await bulkUpsert.mutateAsync(filledRows);
      toast.success(`Saved ${filledRows.length} entries.`);
      setValues({}); // clear all inputs after a successful save
    } catch (err) {
      toast.error(errorMessage(err, "Could not save entries."));
    }
  }

  const dateLabel = new Date(logDate + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <PageHeader title="Log Data" description={`Quick Log — ${dateLabel}`} />

      {/* Date selector — lets you back-fill past days. */}
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <div className="mb-1">
            <Label htmlFor="log-date">Date</Label>
          </div>
          <TextInput
            id="log-date"
            type="date"
            value={logDate}
            max={today}
            onChange={(e) => {
              setLogDate(e.target.value || today);
              setValues({});
            }}
          />
        </div>
        {logDate !== today && (
          <Button color="light" onClick={() => setLogDate(today)}>
            Today
          </Button>
        )}
      </div>

      {isLoading && <LoadingState label="Loading your metrics…" />}
      {isError && <ErrorState message="Couldn't load metrics." onRetry={() => refetch()} />}

      {metrics && metrics.length === 0 && (
        <EmptyState
          title="No active metrics"
          description="Create a metric (and keep it active) to log values here."
          action={
            <Link to="/metrics">
              <Button>Go to Metrics</Button>
            </Link>
          }
        />
      )}

      {metrics && metrics.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {metrics.map((metric) => (
              <MetricLogCard
                key={metric.id}
                metric={metric}
                value={values[metric.id] ?? null}
                onChange={(v) => setValue(metric.id, v)}
                onSave={() => saveOne(metric)}
                saving={savingId === metric.id}
              />
            ))}
          </div>

          <div className="mt-6">
            <Button
              color="success"
              className="w-full"
              onClick={saveAll}
              disabled={bulkUpsert.isPending || filledRows.length === 0}
            >
              {bulkUpsert.isPending
                ? "Saving…"
                : `✓ Save All Entries${filledRows.length ? ` (${filledRows.length})` : ""}`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

interface MetricLogCardProps {
  metric: Metric;
  value: EntryValue;
  onChange: (value: EntryValue) => void;
  onSave: () => void;
  saving: boolean;
}

function MetricLogCard({ metric, value, onChange, onSave, saving }: MetricLogCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900">{metric.name}</span>
        <MetricTypeBadge type={metric.type} />
      </div>

      {metric.type === "boolean" && (
        <BooleanInput value={value as boolean | null} onChange={onChange} />
      )}
      {metric.type === "scale" && (
        <ScaleInput
          min={metric.scale_min ?? 1}
          max={metric.scale_max ?? 10}
          value={value as number | null}
          onChange={onChange}
        />
      )}
      {metric.type === "numeric" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="any"
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-brand-500"
            placeholder="Enter value"
          />
          {metric.unit && <span className="text-sm text-gray-500">{metric.unit}</span>}
        </div>
      )}

      <Button size="sm" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function BooleanInput({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-pressed={value === true}
        onClick={() => onChange(true)}
        className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
          value === true
            ? "border-green-600 bg-green-600 text-white"
            : "border-gray-300 bg-white text-gray-600"
        }`}
      >
        YES
      </button>
      <button
        type="button"
        aria-pressed={value === false}
        onClick={() => onChange(false)}
        className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
          value === false
            ? "border-gray-700 bg-gray-700 text-white"
            : "border-gray-300 bg-white text-gray-600"
        }`}
      >
        NO
      </button>
    </div>
  );
}

function ScaleInput({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: number | null;
  onChange: (value: number) => void;
}) {
  const options = [];
  for (let i = min; i <= max; i++) options.push(i);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={value === n}
          aria-label={`Rating ${n}`}
          onClick={() => onChange(n)}
          className={`h-9 w-9 rounded-full text-sm font-medium transition ${
            value === n
              ? "bg-brand-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
