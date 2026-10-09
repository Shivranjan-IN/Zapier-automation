"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import type { ZapRun } from "@/lib/types";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default function RunDetail({
    zapId,
    runId
}: {
    zapId: string;
    runId: string;
}) {
    const [run, setRun] = useState<ZapRun | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const active = !run || run.status === "PENDING" || run.status === "RUNNING";

    useEffect(() => {
        if (!active) return;
        let cancelled = false;
        const tick = async () => {
            try {
                const response = await api.get(`/run/${runId}`);
                if (cancelled) return;
                setRun(response.data.run);
                setError("");
            } catch (loadError) {
                if (cancelled) return;
                setError(getErrorMessage(loadError, "Failed to load run"));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        tick();
        const interval = setInterval(tick, 2000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [active, runId]);

    if (loading && !run) {
        return (
            <div className="text-sm text-gray-500 animate-pulse">Loading run&hellip;</div>
        );
    }

    if (!run) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error || "Run not found"}
            </div>
        );
    }

    const completed = run.steps.filter(step => step.status === "SUCCESS").length;
    const total = run.steps.length;

    return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <Link
                    href={`/dashboard/zap/${zapId}`}
                    className="text-sm text-amber-600 hover:underline"
                >
                    &larr; Back to Zap
                </Link>
                <div className="mt-2 flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">Run details</h1>
                    <StatusBadge status={run.status} />
                    {active && (
                        <span className="flex items-center gap-1.5 text-xs text-blue-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                            live
                        </span>
                    )}
                </div>
                <div className="mt-1 text-xs text-gray-400">Run #{run.id.slice(0, 8)}</div>
            </div>
            <div className="text-right text-sm text-gray-500">
                <div>
                    Started:{" "}
                    {run.startedAt
                        ? new Date(run.startedAt).toLocaleTimeString()
                        : "not yet"}
                </div>
                <div>
                    Duration: {duration(run)}
                </div>
                <div>
                    {completed}/{total} actions succeeded
                </div>
            </div>
        </div>

        {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
            </div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                Trigger payload
            </h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs text-gray-700">
                {JSON.stringify(run.metadata, null, 2)}
            </pre>
        </section>

        <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
                Actions ({run.steps.length})
            </h2>

            {run.steps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-400">
                    {active
                        ? "Waiting for the worker to pick up this run…"
                        : "No actions were recorded for this run."}
                </div>
            ) : (
                <ol className="space-y-3">
                    {run.steps.map((step, index) => {
                        const isExpanded = expanded[step.id] ?? false;
                        return (
                            <li
                                key={step.id}
                                className="rounded-xl border border-gray-200 bg-white p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                                step.status === "SUCCESS"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : step.status === "FAILED"
                                                      ? "bg-red-100 text-red-700"
                                                      : step.status === "RUNNING"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            {step.status === "SUCCESS"
                                                ? "✓"
                                                : step.status === "FAILED"
                                                  ? "✕"
                                                  : index + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-gray-800 truncate">
                                                {step.action?.type.name ?? "Action"}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Step {index + 1}
                                                {step.startedAt && (
                                                    <> &middot; {stepDuration(step.startedAt, step.finishedAt)}</>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status={step.status} />
                                </div>

                                {step.status === "FAILED" && step.error && (
                                    <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                                        {step.error}
                                    </div>
                                )}

                                {step.output !== null && step.output !== undefined && (
                                    <div className="mt-3">
                                        <button
                                            onClick={() =>
                                                setExpanded(previous => ({
                                                    ...previous,
                                                    [step.id]: !isExpanded
                                                }))
                                            }
                                            className="text-xs font-semibold text-amber-600 hover:underline cursor-pointer bg-transparent border-none"
                                        >
                                            {isExpanded ? "Hide output" : "Show output"}
                                        </button>
                                        {isExpanded && (
                                            <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs text-gray-700">
                                                {JSON.stringify(step.output, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                )}

                                {step.status === "SKIPPED" && (
                                    <div className="mt-3 text-xs text-gray-400">
                                        Skipped because an earlier action failed.
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    </div>
    );
}

function duration(run: ZapRun): string {
    if (!run.startedAt) return "—";
    const end = run.completedAt ? new Date(run.completedAt).getTime() : Date.now();
    const seconds = (end - new Date(run.startedAt).getTime()) / 1000;
    return `${seconds.toFixed(1)}s`;
}

function stepDuration(startedAt: string, finishedAt: string | null): string {
    const start = new Date(startedAt).getTime();
    const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
    return `${((end - start) / 1000).toFixed(1)}s`;
}
