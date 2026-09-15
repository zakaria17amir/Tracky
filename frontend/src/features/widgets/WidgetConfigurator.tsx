import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  Select,
  TextInput,
  ToggleSwitch,
} from "flowbite-react";
import MetricTypeBadge from "../../components/ui/MetricTypeBadge";
import { useMetrics } from "../metrics";
import { useCreateWidget, useUpdateWidget } from "../widgets";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../lib/errors";
import { CHART_COLORS, defaultConfig } from "../../lib/widgetData";
import type { ChartType, Metric, Widget, WidgetConfig } from "../../types";

interface WidgetConfiguratorProps {
  open: boolean;
  dashboardId: number;
  widget?: Widget | null; // present when editing
  onClose: () => void;
}

interface ChartOption {
  type: ChartType;
  title: string;
  desc: string;
}

const ALL_CHARTS: ChartOption[] = [
  { type: "line", title: "Line Chart", desc: "Trends over time" },
  { type: "bar", title: "Bar Chart", desc: "Compare periods" },
  { type: "stat", title: "Stat Card", desc: "Single value" },
  { type: "streak", title: "Streak", desc: "Consecutive days" },
];

function allowedCharts(metric: Metric | undefined): ChartOption[] {
  if (metric?.type === "boolean") {
    return ALL_CHARTS.filter((c) => c.type === "stat" || c.type === "streak");
  }
  return ALL_CHARTS;
}

export default function WidgetConfigurator({
  open,
  dashboardId,
  widget,
  onClose,
}: WidgetConfiguratorProps) {
  const isEdit = !!widget;
  const toast = useToast();
  const { data: metrics } = useMetrics();
  const createWidget = useCreateWidget(dashboardId);
  const updateWidget = useUpdateWidget(dashboardId);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [metricId, setMetricId] = useState<number | null>(null);
  const [chartType, setChartType] = useState<ChartType | null>(null);
  const [config, setConfig] = useState<WidgetConfig>({});
  const [search, setSearch] = useState("");

  // Initialize when opening.
  useEffect(() => {
    if (!open) return;
    if (widget) {
      setMetricId(widget.metric_id);
      setChartType(widget.chart_type);
      setConfig(widget.config ?? defaultConfig(widget.chart_type));
      setStep(2); // metric is locked when editing
    } else {
      setMetricId(null);
      setChartType(null);
      setConfig({});
      setStep(1);
    }
    setSearch("");
  }, [open, widget]);

  const selectedMetric = metrics?.find((m) => m.id === metricId);

  const filteredMetrics = useMemo(() => {
    const list = metrics ?? [];
    if (!search) return list;
    return list.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [metrics, search]);

  function chooseChart(type: ChartType) {
    setChartType(type);
    // Type-narrow config to the new chart type's defaults.
    setConfig(defaultConfig(type));
    setStep(3);
  }

  function setCfg<K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!metricId || !chartType) return;
    try {
      if (isEdit && widget) {
        await updateWidget.mutateAsync({ id: widget.id, input: { chart_type: chartType, config } });
        toast.success("Widget updated.");
      } else {
        await createWidget.mutateAsync({ metric_id: metricId, chart_type: chartType, config });
        toast.success("Widget added.");
      }
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the widget."));
    }
  }

  const saving = createWidget.isPending || updateWidget.isPending;
  const steps = ["Select Metric", "Choose Chart", "Configure"];

  return (
    <Modal show={open} onClose={onClose} size="2xl">
      <ModalHeader>{isEdit ? "Edit Widget" : "Add Widget to Dashboard"}</ModalHeader>
      <ModalBody>
        {/* Progress bar */}
        <ol className="mb-6 flex items-center gap-2 text-xs font-medium">
          {steps.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const active = step === n;
            const done = step > n;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    active || done ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {n}
                </span>
                <span className={active ? "text-brand-700" : "text-gray-500"}>{label}</span>
              </li>
            );
          })}
        </ol>

        {/* Step 1 — select metric */}
        {step === 1 && (
          <div>
            <TextInput
              placeholder="Search metrics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
            />
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {filteredMetrics.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-400">No metrics found.</p>
              )}
              {filteredMetrics.map((metric) => (
                <button
                  key={metric.id}
                  type="button"
                  onClick={() => {
                    setMetricId(metric.id);
                    setStep(2);
                  }}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition hover:border-brand-400 ${
                    metricId === metric.id ? "border-brand-500 bg-brand-50" : "border-gray-200"
                  }`}
                >
                  <span className="font-medium text-gray-900">{metric.name}</span>
                  <MetricTypeBadge type={metric.type} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — choose chart type */}
        {step === 2 && (
          <div>
            <p className="mb-3 text-sm text-gray-500">
              Selected metric:{" "}
              <span className="font-medium text-gray-800">{selectedMetric?.name}</span>{" "}
              {selectedMetric && <MetricTypeBadge type={selectedMetric.type} />}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {allowedCharts(selectedMetric).map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => chooseChart(opt.type)}
                  className={`rounded-lg border p-4 text-left transition hover:border-brand-400 ${
                    chartType === opt.type ? "border-brand-500 bg-brand-50" : "border-gray-200"
                  }`}
                >
                  <p className="font-semibold text-gray-900">{opt.title}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — configure (dependent fields) */}
        {step === 3 && chartType && (
          <div>
            <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Fields below change based on the chart type you chose.
            </div>
            <h4 className="mb-3 font-semibold text-gray-800">Configuration ({chartType})</h4>

            {chartType === "line" && (
              <div className="flex flex-col gap-4">
                <RangeSelect value={config.range_days ?? 14} onChange={(v) => setCfg("range_days", v)} />
                <ColorPicker value={config.color} onChange={(c) => setCfg("color", c)} />
                <ToggleSwitch
                  checked={config.show_points ?? true}
                  label="Show data points"
                  onChange={(c) => setCfg("show_points", c)}
                />
              </div>
            )}

            {chartType === "bar" && (
              <div className="flex flex-col gap-4">
                <RangeSelect value={config.range_days ?? 14} onChange={(v) => setCfg("range_days", v)} />
                <div>
                  <div className="mb-1">
                    <Label htmlFor="grouping">Grouping</Label>
                  </div>
                  <Select
                    id="grouping"
                    value={config.grouping ?? "daily"}
                    onChange={(e) =>
                      setCfg("grouping", e.target.value as WidgetConfig["grouping"])
                    }
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Select>
                </div>
                <ColorPicker value={config.color} onChange={(c) => setCfg("color", c)} />
              </div>
            )}

            {chartType === "stat" && (
              <div>
                <div className="mb-1">
                  <Label htmlFor="comparison">Comparison mode</Label>
                </div>
                <Select
                  id="comparison"
                  value={config.comparison ?? "average"}
                  onChange={(e) =>
                    setCfg("comparison", e.target.value as WidgetConfig["comparison"])
                  }
                >
                  <option value="average">Today vs average</option>
                  <option value="yesterday">Today vs yesterday</option>
                  <option value="last_week">Today vs last week</option>
                </Select>
              </div>
            )}

            {chartType === "streak" && (
              <div className="flex flex-col gap-4">
                {selectedMetric?.type !== "boolean" && (
                  <div>
                    <div className="mb-1">
                      <Label htmlFor="threshold">Counts when value is at least</Label>
                    </div>
                    <TextInput
                      id="threshold"
                      type="number"
                      step="any"
                      value={config.threshold_value ?? 1}
                      onChange={(e) => setCfg("threshold_value", Number(e.target.value))}
                    />
                  </div>
                )}
                {selectedMetric?.type === "boolean" && (
                  <p className="text-sm text-gray-500">
                    Counts consecutive days this habit was marked “Yes”.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </ModalBody>

      <div className="flex items-center justify-between border-t border-gray-200 p-4">
        <Button
          color="light"
          onClick={() => {
            if (step === 1 || (isEdit && step === 2)) onClose();
            else setStep((s) => (s - 1) as 1 | 2 | 3);
          }}
        >
          {step === 1 || (isEdit && step === 2) ? "Cancel" : "← Back"}
        </Button>
        {step === 3 && (
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add Widget →"}
          </Button>
        )}
      </div>
    </Modal>
  );
}

function RangeSelect({ value, onChange }: { value: number; onChange: (v: 7 | 14 | 30 | 90) => void }) {
  return (
    <div>
      <div className="mb-1">
        <Label htmlFor="range">Date range</Label>
      </div>
      <Select
        id="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as 7 | 14 | 30 | 90)}
      >
        <option value={7}>Last 7 days</option>
        <option value={14}>Last 14 days</option>
        <option value={30}>Last 30 days</option>
        <option value={90}>Last 90 days</option>
      </Select>
    </div>
  );
}

function ColorPicker({ value, onChange }: { value?: string; onChange: (c: string) => void }) {
  return (
    <div>
      <div className="mb-1">
        <Label>Color</Label>
      </div>
      <div className="flex gap-2">
        {CHART_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            style={{ backgroundColor: c }}
            className={`h-8 w-8 rounded-full ${value === c ? "ring-2 ring-offset-2 ring-gray-700" : ""}`}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
    </div>
  );
}
