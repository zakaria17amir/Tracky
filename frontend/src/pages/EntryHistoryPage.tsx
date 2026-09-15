import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Label, Modal, ModalBody, ModalHeader, TextInput, Textarea } from "flowbite-react";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useMetrics } from "../features/metrics";
import { useDeleteEntry, useEntries, useUpdateEntry } from "../features/entries";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../lib/errors";
import { formatEntryValue } from "../lib/format";
import type { Entry, EntryValue } from "../types";

export default function EntryHistoryPage() {
  const { id } = useParams();
  const metricId = Number(id);
  const toast = useToast();

  const { data: metrics } = useMetrics();
  const metric = metrics?.find((m) => m.id === metricId);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading, isError, refetch } = useEntries({
    metric_id: metricId,
    from: from || undefined,
    to: to || undefined,
  });

  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const [editing, setEditing] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState<Entry | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteEntry.mutateAsync(deleting.id);
      toast.success("Entry deleted.");
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete entry."));
    }
  }

  const entries = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title={metric ? `${metric.name} — History` : "Entry History"}
        description="Browse, edit and delete your past entries."
        action={
          <Link to="/metrics">
            <Button color="light">Back to Metrics</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <div className="mb-1">
            <Label htmlFor="from">From</Label>
          </div>
          <TextInput id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <div className="mb-1">
            <Label htmlFor="to">To</Label>
          </div>
          <TextInput id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(from || to) && (
          <Button
            color="light"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {isLoading && <LoadingState label="Loading entries…" />}
      {isError && <ErrorState message="Couldn't load entries." onRetry={() => refetch()} />}

      {data && entries.length === 0 && (
        <EmptyState title="No entries" description="No entries match this date range." />
      )}

      {entries.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{entry.logged_date}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatEntryValue(entry.value, metric)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{entry.notes || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="xs" color="light" onClick={() => setEditing(entry)}>
                        Edit
                      </Button>
                      <Button size="xs" color="failure" onClick={() => setDeleting(entry)}>
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

      {editing && (
        <EditEntryModal
          entry={editing}
          metricType={metric?.type ?? "numeric"}
          onClose={() => setEditing(null)}
          onSave={async (value, notes) => {
            try {
              await updateEntry.mutateAsync({ id: editing.id, input: { value, notes } });
              toast.success("Entry updated.");
              setEditing(null);
            } catch (err) {
              toast.error(errorMessage(err, "Could not update entry."));
            }
          }}
          saving={updateEntry.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete entry?"
        message={`The entry from ${deleting?.logged_date} will be permanently removed.`}
        loading={deleteEntry.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

interface EditEntryModalProps {
  entry: Entry;
  metricType: string;
  onClose: () => void;
  onSave: (value: EntryValue, notes: string) => void;
  saving: boolean;
}

function EditEntryModal({ entry, metricType, onClose, onSave, saving }: EditEntryModalProps) {
  const [value, setValue] = useState<string>(
    entry.value === null || entry.value === undefined ? "" : String(entry.value),
  );
  const [notes, setNotes] = useState(entry.notes ?? "");

  function parseValue(): EntryValue {
    if (metricType === "boolean") return value === "true" || value === "1" || value === "Yes";
    if (value === "") return null;
    return Number(value);
  }

  return (
    <Modal show onClose={onClose} size="md">
      <ModalHeader>Edit entry — {entry.logged_date}</ModalHeader>
      <ModalBody>
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1">
              <Label htmlFor="edit-value">Value</Label>
            </div>
            {metricType === "boolean" ? (
              <select
                id="edit-value"
                value={value === "true" || value === "1" ? "true" : "false"}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : (
              <TextInput
                id="edit-value"
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
          </div>
          <div>
            <div className="mb-1">
              <Label htmlFor="edit-notes">Notes</Label>
            </div>
            <Textarea
              id="edit-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </ModalBody>
      <div className="flex justify-end gap-3 border-t border-gray-200 p-4">
        <Button color="light" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={() => onSave(parseValue(), notes)} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Modal>
  );
}
