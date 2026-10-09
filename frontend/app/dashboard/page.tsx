"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import type { Zap, ZapRun } from "@/lib/types";
import ZapFlow from "@/components/dashboard/ZapFlow";
import StatusBadge from "@/components/dashboard/StatusBadge";

function timeAgo(value: string): string {
    const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardPage() {
    const router = useRouter();
    const [zaps, setZaps] = useState<Zap[]>([]);
    const [runs, setRuns] = useState<ZapRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        const tick = async () => {
            try {
                const [zapsResponse, runsResponse] = await Promise.all([
                    api.get("/zap"),
                    api.get("/run")
                ]);
                if (cancelled) return;
                setZaps(zapsResponse.data.zaps ?? []);
                setRuns(runsResponse.data.runs ?? []);
                setError("");
            } catch (loadError) {
                if (cancelled) return;
                setError(getErrorMessage(loadError, "Failed to load dashboard"));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        tick();
        const interval = setInterval(tick, 5000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    if (loading) {
        return <div className="text-sm text-gray-500 animate-pulse">Loading zaps&hellip;</div>;
    }

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Zaps</h1>
                    <p className="text-sm text-gray-500">
                        Automations with a trigger and one or more actions.
                    </p>
                </div>
                <Link
                    href="/dashboard/zap/new"
                    className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
                >
                    + Create Zap
                </Link>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
                    Your Zaps ({zaps.length})
                </h2>
                {zaps.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                        <p className="text-gray-600 font-medium">No Zaps yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Create your first Zap to connect a trigger to multiple actions.
                        </p>
                        <Link
                            href="/dashboard/zap/new"
                            className="mt-4 inline-block rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
                        >
                            Create a Zap
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {zaps.map(zap => {
                            const zapRuns = runs.filter(run => run.zapId === zap.id);
                            const lastRun = zapRuns[0];
                            return (
                                <Link
                                    key={zap.id}
                                    href={`/dashboard/zap/${zap.id}`}
                                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-semibold text-gray-400">
                                            Zap #{zap.id.slice(0, 8)}
                                        </span>
                                        {lastRun && <StatusBadge status={lastRun.status} />}
                                    </div>
                                    <ZapFlow triggers={zap.triggers ?? []} actions={zap.actions} />
                                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                                        <span>
                                            {zap.actions.length} action
                                            {zap.actions.length === 1 ? "" : "s"}
                                        </span>
                                        {lastRun && <span>Last run {timeAgo(lastRun.createdAt)}</span>}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                        Recent runs
                    </h2>
                    <Link href="/dashboard/runs" className="text-sm text-amber-600 hover:underline">
                        View all
                    </Link>
                </div>
                {runs.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white px-5 py-6 text-sm text-gray-400">
                        No runs yet. Trigger a Zap from its detail page to see execution history
                        here.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Zap</th>
                                    <th className="px-4 py-3 font-semibold">Steps</th>
                                    <th className="px-4 py-3 font-semibold">Started</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {runs.slice(0, 8).map(run => (
                                    <tr
                                        key={run.id}
                                        className="hover:bg-amber-50/40 cursor-pointer"
                                        onClick={() => router.push(`/dashboard/zap/${run.zapId}/runs/${run.id}`)}
                                    >
                                        <td className="px-4 py-3">
                                            <StatusBadge status={run.status} />
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {run.zap?.triggers?.map(t => t.type.name).join(" or ") ?? "Webhook"} &rarr;{" "}
                                            {run.zap?.actions.length ?? run.steps.length} steps
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {run.steps.filter(s => s.status === "SUCCESS").length}/
                                            {run.steps.length} completed
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">
                                            {timeAgo(run.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
