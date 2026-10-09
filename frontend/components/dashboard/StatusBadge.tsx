import type { RunStatus } from "@/lib/types";

const STYLES: Record<RunStatus, string> = {
    PENDING: "bg-gray-100 text-gray-600 border-gray-200",
    RUNNING: "bg-blue-50 text-blue-700 border-blue-200",
    SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
    SKIPPED: "bg-amber-50 text-amber-600 border-amber-200"
};

const LABELS: Record<RunStatus, string> = {
    PENDING: "Pending",
    RUNNING: "Running",
    SUCCESS: "Success",
    FAILED: "Failed",
    SKIPPED: "Skipped"
};

export default function StatusBadge({ status }: { status: RunStatus }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[status] ?? STYLES.PENDING}`}
        >
            {status === "RUNNING" && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
            )}
            {LABELS[status] ?? status}
        </span>
    );
}
