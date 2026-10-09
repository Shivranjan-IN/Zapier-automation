"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import type { ZapRun } from "@/lib/types";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default function AllRunsPage() {
    const [runs, setRuns] = useState<ZapRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        const tick = async () => {
            try {
                const response = await api.get("/run");
                if (cancelled) return;
                setRuns(response.data.runs ?? []);
                setError("");
            } catch (loadError) {
                if (cancelled) return;
                setError(getErrorMessage(loadError, "Failed to load runs"));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        tick();
        const interval = setInterval(tick, 4000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Runs</h1>
                <p className="text-sm text-gray-500">
                    Every execution across your Zaps, newest first.
                </p>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-sm text-gray-500 animate-pulse">Loading runs&hellip;</div>
            ) : runs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
                    No runs yet. Open a Zap and send a test event.
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 font-semibold">Trigger</th>
                                <th className="px-4 py-3 font-semibold">Steps</th>
                                <th className="px-4 py-3 font-semibold">Duration</th>
                                <th className="px-4 py-3 font-semibold">Started</th>
                                <th className="px-4 py-3 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {runs.map(run => {
                                const done = run.steps.filter(
                                    step => step.status === "SUCCESS"
                                ).length;
                                const seconds = runDuration(run);
                                return (
                                    <tr key={run.id} className="hover:bg-amber-50/40">
                                        <td className="px-4 py-3">
                                            <StatusBadge status={run.status} />
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 capitalize">
                                            {run.zap?.triggers?.map(t => t.type.name).join(" or ") ?? "Webhook"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {done}/{run.steps.length}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {seconds !== null ? `${seconds.toFixed(1)}s` : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">
                                            {new Date(run.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/dashboard/zap/${run.zapId}/runs/${run.id}`}
                                                className="text-amber-600 hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function runDuration(run: ZapRun): number | null {
    if (!run.startedAt || !run.completedAt) return null;
    return (
        (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) /
        1000
    );
}
