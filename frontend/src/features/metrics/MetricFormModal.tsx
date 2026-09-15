import { useEffect, useState, type FormEvent } from "react";
import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  Select,
  Textarea,
  TextInput,
  ToggleSwitch,
} from "flowbite-react";
import MetricTypeBadge from "../../components/ui/MetricTypeBadge";
import { useToast } from "../../context/ToastContext";
import { errorMessage, fieldErrors } from "../../lib/errors";
import { useCreateMetric, useUpdateMetric, type MetricInput } from "../metrics";
import type { Metric, MetricType } from "../../types";

interface MetricFormModalProps {
  open: boolean;
  metric?: Metric | null;
  onClose: () => void;
}

const EMPTY: MetricInput = {
  name: "",
  description: "",
  type: "numeric",
  unit: "",
  scale_min: 1,
  scale_max: 10,
  is_active: true,
};

export default function MetricFormModal({ open, metric, onClose }: MetricFormModalProps) {
  const isEdit = !!metric;
  const toast = useToast();
  const createMetric = useCreateMetric();
  const updateMetric = useUpdateMetric();

  const [form, setForm] = useState<MetricInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        metric
          ? {
              name: metric.name,
              description: metric.description ?? "",
              type: metric.type,
              unit: metric.unit ?? "",
              scale_min: metric.scale_min ?? 1,
              scale_max: metric.scale_max ?? 10,
              is_active: metric.is_active,
            }
          : EMPTY,
      );
    }
  }, [open, metric]);

  function set<K extends keyof MetricInput>(key: K, value: MetricInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      if (isEdit && metric) {
        const { type: _type, ...editable } = form;
        void _type;
        await updateMetric.mutateAsync({ id: metric.id, input: editable });
        toast.success("Metric updated.");
      } else {
        await createMetric.mutateAsync(form);
        toast.success("Metric created.");
      }
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err, "Could not save the metric."));
    }
  }

  const saving = createMetric.isPending || updateMetric.isPending;

  return (
    <Modal show={open} onClose={onClose} size="lg">
      <ModalHeader>{isEdit ? "Edit Metric" : "New Metric"}</ModalHeader>
      <ModalBody>
        <form id="metric-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <div className="mb-1">
              <Label htmlFor="metric-name">Name</Label>
            </div>
            <TextInput
              id="metric-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              color={errors.name ? "failure" : undefined}
              required
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <div className="mb-1">
              <Label htmlFor="metric-type">Type</Label>
            </div>
            {isEdit ? (
              <div className="flex items-center gap-2">
                <MetricTypeBadge type={form.type} />
                <span className="text-xs text-gray-500">Type can't be changed after creation.</span>
              </div>
            ) : (
              <Select
                id="metric-type"
                value={form.type}
                onChange={(e) => set("type", e.target.value as MetricType)}
              >
                <option value="numeric">Numeric (e.g. hours, kg)</option>
                <option value="scale">Scale (e.g. 1–10 rating)</option>
                <option value="boolean">Boolean (yes / no)</option>
              </Select>
            )}
          </div>

          {/* Type-dependent fields */}
          {form.type === "numeric" && (
            <div>
              <div className="mb-1">
                <Label htmlFor="metric-unit">Unit</Label>
              </div>
              <TextInput
                id="metric-unit"
                value={form.unit ?? ""}
                onChange={(e) => set("unit", e.target.value)}
                placeholder="hours, kg, steps…"
                color={errors.unit ? "failure" : undefined}
              />
              {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit}</p>}
            </div>
          )}

          {form.type === "scale" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1">
                  <Label htmlFor="metric-min">Minimum</Label>
                </div>
                <TextInput
                  id="metric-min"
                  type="number"
                  value={form.scale_min ?? 1}
                  onChange={(e) => set("scale_min", Number(e.target.value))}
                  color={errors.scale_min ? "failure" : undefined}
                />
              </div>
              <div>
                <div className="mb-1">
                  <Label htmlFor="metric-max">Maximum</Label>
                </div>
                <TextInput
                  id="metric-max"
                  type="number"
                  value={form.scale_max ?? 10}
                  onChange={(e) => set("scale_max", Number(e.target.value))}
                  color={errors.scale_max ? "failure" : undefined}
                />
                {errors.scale_max && (
                  <p className="mt-1 text-sm text-red-600">{errors.scale_max}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="mb-1">
              <Label htmlFor="metric-desc">Description (optional)</Label>
            </div>
            <Textarea
              id="metric-desc"
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <ToggleSwitch
            checked={form.is_active ?? true}
            label="Active (show on Quick Log)"
            onChange={(checked) => set("is_active", checked)}
          />
        </form>
      </ModalBody>
      <div className="flex justify-end gap-3 border-t border-gray-200 p-4">
        <Button color="light" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" form="metric-form" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create metric"}
        </Button>
      </div>
    </Modal>
  );
}
