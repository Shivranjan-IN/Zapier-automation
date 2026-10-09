"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getErrorMessage, HOOKS_BASE } from "@/lib/api";
import type { UserProfile, Zap, ZapRun, ZapTrigger } from "@/lib/types";
import ZapFlow from "@/components/dashboard/ZapFlow";
import StatusBadge from "@/components/dashboard/StatusBadge";

const SAMPLE_PAYLOAD = {
    event: "new_lead",
    email: "jane@acme.com",
    amount: 42
};

async function fetchZapData(zapId: string) {
    const [zapResponse, runsResponse] = await Promise.all([
        api.get(`/zap/${zapId}`),
        api.get(`/zap/${zapId}/runs`)
    ]);
    return {
        zap: zapResponse.data.zap as Zap | null,
        runs: (runsResponse.data.runs ?? []) as ZapRun[]
    };
}

export default function ZapDetail({ zapId }: { zapId: string }) {
    const router = useRouter();
    const [zap, setZap] = useState<Zap | null>(null);
    const [runs, setRuns] = useState<ZapRun[]>([]);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copiedKey, setCopiedKey] = useState("");

    const refresh = useCallback(async () => {
        try {
            const data = await fetchZapData(zapId);
            setZap(data.zap);
            setRuns(data.runs);
            setError("");
        } catch (loadError) {
            setError(getErrorMessage(loadError, "Failed to load Zap"));
        } finally {
            setLoading(false);
        }
    }, [zapId]);

    useEffect(() => {
        let cancelled = false;
        const tick = async () => {
            try {
                const data = await fetchZapData(zapId);
                if (cancelled) return;
                setZap(data.zap);
                setRuns(data.runs);
                setError("");
            } catch (loadError) {
                if (cancelled) return;
                setError(getErrorMessage(loadError, "Failed to load Zap"));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        tick();
        const interval = setInterval(tick, 3000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [zapId]);

    useEffect(() => {
        api.get("/user")
            .then(response => setUser(response.data.user))
            .catch(() => undefined);
    }, []);

    const copyText = async (key: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(""), 1500);
        } catch {
            // clipboard unavailable
        }
    };

    if (loading && !zap) {
        return <div className="text-sm text-gray-500 animate-pulse">Loading Zap&hellip;</div>;
    }

    if (!zap) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error || "Zap not found"}
            </div>
        );
    }

    const hasPendingRun = runs.some(
        run => run.status === "PENDING" || run.status === "RUNNING"
    );
    const triggerNames = zap.triggers.map(t => t.type.name);
    const titlePrefix =
        triggerNames.length > 0 ? triggerNames.join(" or ") : "Untitled";

    return (
        <div className="space-y-8">
            <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Zap #{zap.id.slice(0, 8)}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {titlePrefix} &rarr; {zap.actions.length} action
                    {zap.actions.length === 1 ? "" : "s"}
                </h1>
                {zap.triggers.length > 1 && (
                    <p className="mt-1 text-sm text-gray-500">
                        This Zap runs when <b>any</b> of {zap.triggers.length} triggers fires.
                    </p>
                )}
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
                        Zap flow
                    </h2>
                    <ZapFlow triggers={zap.triggers} actions={zap.actions} vertical />
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
                        Trigger{zap.triggers.length === 1 ? "" : "s"} this Zap
                        {zap.triggers.length > 1 ? ` (${zap.triggers.length})` : ""}
                    </h2>
                    <div className="space-y-6">
                        {zap.triggers.map((trigger, index) => (
                            <TriggerPanel
                                key={trigger.id}
                                trigger={trigger}
                                index={index}
                                total={zap.triggers.length}
                                zapId={zap.id}
                                userId={user?.id ?? null}
                                copiedKey={copiedKey}
                                onCopy={copyText}
                                onChanged={refresh}
                            />
                        ))}
                        {zap.triggers.length === 0 && (
                            <div className="text-sm text-gray-400">
                                No triggers configured — this Zap can&apos;t fire yet.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                        Run history ({runs.length})
                    </h2>
                    {hasPendingRun && (
                        <span className="flex items-center gap-1.5 text-xs text-blue-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                            Executing&hellip;
                        </span>
                    )}
                </div>

                {runs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-400">
                        No runs yet. Use a test button above to fire this Zap.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Status</th>
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
                                    return (
                                        <tr
                                            key={run.id}
                                            className="hover:bg-amber-50/40 cursor-pointer"
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard/zap/${zap.id}/runs/${run.id}`
                                                )
                                            }
                                        >
                                            <td className="px-4 py-3">
                                                <StatusBadge status={run.status} />
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {done}/{run.steps.length} completed
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {duration(run)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">
                                                {new Date(run.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right text-amber-600">
                                                <Link
                                                    href={`/dashboard/zap/${zap.id}/runs/${run.id}`}
                                                    onClick={event => event.stopPropagation()}
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
            </section>
        </div>
    );
}

function TriggerPanel({
    trigger,
    index,
    total,
    zapId,
    userId,
    copiedKey,
    onCopy,
    onChanged
}: {
    trigger: ZapTrigger;
    index: number;
    total: number;
    zapId: string;
    userId: number | null;
    copiedKey: string;
    onCopy: (key: string, text: string) => void;
    onChanged: () => Promise<void>;
}) {
    const [testState, setTestState] = useState<
        | { kind: "idle" }
        | { kind: "sending" }
        | { kind: "done" }
        | { kind: "error"; message: string }
    >({ kind: "idle" });

    const typeName = trigger.type.name;
    const isGitHub = typeName === "GitHub";
    const isWebhook = typeName === "Webhook";
    const ghSecret =
        typeof trigger.metadata.secret === "string"
            ? trigger.metadata.secret.trim()
            : "";
    const ghRepo =
        String(trigger.metadata.repo ?? "").trim() || "owner/repo";

    const ghUrl = `${HOOKS_BASE}/hooks/github/${zapId}`;
    const hookUrl =
        userId !== null ? `${HOOKS_BASE}/hooks/catch/${userId}/${zapId}` : null;

    const sendTestComment = async () => {
        const payload = JSON.stringify({
            action: "created",
            issue: { number: 42 },
            comment: {
                user: { login: "octocat" },
                body: "Test comment from the Zap dashboard!",
                html_url: `https://github.com/${ghRepo}/issues/42#issuecomment-1`
            },
            repository: {
                full_name: ghRepo,
                html_url: `https://github.com/${ghRepo}`
            },
            sender: { login: "octocat" }
        });

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-GitHub-Event": "issue_comment"
        };

        setTestState({ kind: "sending" });
        try {
            if (ghSecret) {
                const key = await crypto.subtle.importKey(
                    "raw",
                    new TextEncoder().encode(ghSecret),
                    { name: "HMAC", hash: "SHA-256" },
                    false,
                    ["sign"]
                );
                const signature = await crypto.subtle.sign(
                    "HMAC",
                    key,
                    new TextEncoder().encode(payload)
                );
                const hex = Array.from(new Uint8Array(signature))
                    .map(byte => byte.toString(16).padStart(2, "0"))
                    .join("");
                headers["X-Hub-Signature-256"] = `sha256=${hex}`;
            }

            const response = await fetch(ghUrl, {
                method: "POST",
                headers,
                body: payload
            });
            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${(await response.text()).slice(0, 120)}`
                );
            }
            setTestState({ kind: "done" });
            await onChanged();
        } catch (testError) {
            setTestState({
                kind: "error",
                message:
                    testError instanceof Error ? testError.message : "Request failed"
            });
        }
    };

    const sendTestWebhook = async () => {
        if (!hookUrl) return;
        setTestState({ kind: "sending" });
        try {
            await fetch(hookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(SAMPLE_PAYLOAD)
            });
            setTestState({ kind: "done" });
            await onChanged();
        } catch (testError) {
            setTestState({
                kind: "error",
                message:
                    testError instanceof Error ? testError.message : "Request failed"
            });
        }
    };

    const header =
        total > 1 ? (
            <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                    {index + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {typeName}
                </span>
            </div>
        ) : null;

    const statusFeedback = (
        <>
            {testState.kind === "done" && (
                <div className="text-xs text-emerald-600">
                    Event sent — a new run should appear below in a few seconds.
                </div>
            )}
            {testState.kind === "error" && (
                <div className="text-xs text-red-600">
                    {testState.message} — is the hooks service running on {HOOKS_BASE}?
                </div>
            )}
        </>
    );

    if (isGitHub) {
        return (
            <div>
                {header}
                <div className="space-y-3">
                    <div className="text-xs text-gray-400">
                        GitHub webhook URL — paste into your repo&apos;s Settings &rarr;
                        Webhooks &rarr; Add webhook:
                    </div>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 truncate rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-700">
                            {ghUrl}
                        </code>
                        <button
                            onClick={() => onCopy(`gh-${trigger.id}`, ghUrl)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                            {copiedKey === `gh-${trigger.id}` ? "Copied!" : "Copy"}
                        </button>
                    </div>
                    <button
                        onClick={sendTestComment}
                        disabled={testState.kind === "sending"}
                        className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-amber-300 cursor-pointer"
                    >
                        {testState.kind === "sending" ? "Sending..." : "Send test comment"}
                    </button>
                    {statusFeedback}
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
                        <div className="font-semibold text-gray-600">Repo setup checklist</div>
                        <div>1. Content type: application/json</div>
                        <div>2. Events: Issue comments + Pull request review comments</div>
                        {ghSecret ? (
                            <div>3. Secret: match this trigger&apos;s webhook secret (HMAC verified)</div>
                        ) : (
                            <div>3. Secret: optional (none configured on this trigger)</div>
                        )}
                        <div className="pt-1 text-[11px] text-gray-400">
                            For internet reachability, expose port 3002 via a tunnel
                            (e.g. cloudflared / ngrok) and set NEXT_PUBLIC_HOOKS_BASE to
                            the public URL.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isWebhook) {
        return (
            <div>
                {header}
                {hookUrl ? (
                    <div className="space-y-3">
                        <div className="text-xs text-gray-400">
                            Webhook catch URL — send a POST request to fire this Zap:
                        </div>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 truncate rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-700">
                                {hookUrl}
                            </code>
                            <button
                                onClick={() => onCopy(`wh-${trigger.id}`, hookUrl)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                                {copiedKey === `wh-${trigger.id}` ? "Copied!" : "Copy"}
                            </button>
                        </div>
                        <button
                            onClick={sendTestWebhook}
                            disabled={testState.kind === "sending"}
                            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-amber-300 cursor-pointer"
                        >
                            {testState.kind === "sending" ? "Sending..." : "Send test event"}
                        </button>
                        <div className="text-xs text-gray-400">
                            Sample payload: <code>{JSON.stringify(SAMPLE_PAYLOAD)}</code>
                        </div>
                        {statusFeedback}
                    </div>
                ) : (
                    <div className="text-sm text-gray-400">Loading webhook URL&hellip;</div>
                )}
            </div>
        );
    }

    const interval = Number(trigger.metadata.intervalMinutes ?? "?");
    return (
        <div>
            {header}
            <div className="text-sm text-gray-400">
                Fires automatically every{" "}
                <span className="font-medium text-gray-600">
                    {Number.isFinite(interval) ? `${interval} minutes` : "N minutes"}
                </span>
                . No webhook to configure — runs appear below once the scheduler is wired.
            </div>
        </div>
    );
}

function duration(run: ZapRun): string {
    if (!run.startedAt) return "—";
    const end = run.completedAt ? new Date(run.completedAt).getTime() : Date.now();
    const seconds = (end - new Date(run.startedAt).getTime()) / 1000;
    return `${seconds.toFixed(1)}s`;
}
