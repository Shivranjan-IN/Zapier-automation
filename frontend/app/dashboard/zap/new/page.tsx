"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import type { AvailableItem } from "@/lib/types";

type DraftAction = {
    key: string;
    availableActionId: string;
    name: string;
    image: string;
    metadata: Record<string, unknown>;
};

type DraftTrigger = {
    key: string;
    availableTriggerId: string;
    name: string;
    image: string;
    metadata: Record<string, unknown>;
};

const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all";

let actionKeyCounter = 0;
let triggerKeyCounter = 0;

function actionDefaults(name: string): Record<string, unknown> {
    switch (name) {
        case "Send Email":
            return {
                to: "you@gmail.com",
                subject: "New comment on {{repo}}",
                message:
                    "{{author}} commented on {{repo}}:\n\n\"{{comment}}\"\n\n{{url}}"
            };
        case "Slack Message":
            return { channel: "#general", text: "New event from Zapier!" };
        case "HTTP Request":
            return { method: "POST", url: "https://example.com/webhook" };
        case "Delay":
            return { seconds: 1 };
        case "Filter":
            return { field: "event", value: "new_lead" };
        case "Google Sheets":
            return {
                webhookUrl: "",
                values: "{{repo}},{{author}},{{comment}},{{url}}"
            };
        case "Solana Transfer":
            return { recipient: "RecipientWalletPubkey", amount: 0.1 };
        default:
            return {};
    }
}

const TEMPLATES: {
    id: string;
    name: string;
    description: string;
    triggers: string[];
    actions: { name: string; metadata: Record<string, unknown> }[];
}[] = [
    {
        id: "gh-email-sheet",
        name: "GitHub comment → Email + Google Sheet",
        description:
            "When someone comments on your repo, email yourself and log the row in a sheet.",
        triggers: ["GitHub"],
        actions: [
            {
                name: "Send Email",
                metadata: {
                    to: "you@gmail.com",
                    subject: "New comment on {{repo}}",
                    message:
                        "{{author}} commented on {{repo}}:\n\n\"{{comment}}\"\n\n{{url}}"
                }
            },
            {
                name: "Google Sheets",
                metadata: { values: "{{repo}},{{author}},{{comment}},{{url}}" }
            }
        ]
    },
    {
        id: "gh-email",
        name: "GitHub comment → Email alert",
        description: "Get an email every time an issue or PR gets a new comment.",
        triggers: ["GitHub"],
        actions: [
            {
                name: "Send Email",
                metadata: {
                    to: "you@gmail.com",
                    subject: "💬 {{author}} commented on {{repo}}",
                    message: "{{comment}}\n\n{{url}}"
                }
            }
        ]
    },
    {
        id: "wh-email",
        name: "Webhook → Email",
        description: "POST anything to your webhook URL and receive it by email.",
        triggers: ["Webhook"],
        actions: [
            {
                name: "Send Email",
                metadata: {
                    to: "you@gmail.com",
                    subject: "Webhook event received",
                    message: "Payload:\n{{payload}}"
                }
            }
        ]
    }
];

export default function NewZapPage() {
    const router = useRouter();
    const [triggers, setTriggers] = useState<AvailableItem[]>([]);
    const [availableActions, setAvailableActions] = useState<AvailableItem[]>([]);
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [draftTriggers, setDraftTriggers] = useState<DraftTrigger[]>([]);

    const [actions, setActions] = useState<DraftAction[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([api.get("/available/triggers"), api.get("/available/actions")])
            .then(([triggersResponse, actionsResponse]) => {
                setTriggers(triggersResponse.data.triggers ?? []);
                setAvailableActions(actionsResponse.data.actions ?? []);
            })
            .catch(loadError => setError(getErrorMessage(loadError, "Failed to load catalog")));
    }, []);

    const canSave = useMemo(
        () => draftTriggers.length > 0 && actions.length > 0,
        [draftTriggers, actions]
    );

    const triggerDefaults = (name: string): Record<string, unknown> => {
        if (name === "Schedule") return { intervalMinutes: 15 };
        if (name === "GitHub") return { repo: "", secret: "" };
        return {};
    };

    const toggleTrigger = (item: AvailableItem) => {
        setDraftTriggers(previous => {
            const existing = previous.find(t => t.availableTriggerId === item.id);
            if (existing) {
                return previous.filter(t => t.availableTriggerId !== item.id);
            }
            return [
                ...previous,
                {
                    key: `${item.id}-${triggerKeyCounter++}`,
                    availableTriggerId: item.id,
                    name: item.name,
                    image: item.image,
                    metadata: triggerDefaults(item.name)
                }
            ];
        });
    };

    const updateTriggerMetadata = (key: string, patch: Record<string, unknown>) => {
        setDraftTriggers(previous =>
            previous.map(trigger =>
                trigger.key === key
                    ? { ...trigger, metadata: { ...trigger.metadata, ...patch } }
                    : trigger
            )
        );
    };

    const addAction = (item: AvailableItem) => {
        setActions(previous => [
            ...previous,
            {
                key: `${item.id}-${actionKeyCounter++}`,
                availableActionId: item.id,
                name: item.name,
                image: item.image,
                metadata: actionDefaults(item.name)
            }
        ]);
        setPickerOpen(false);
    };

    const applyTemplate = (template: (typeof TEMPLATES)[number]) => {
        const resolvedTriggers: DraftTrigger[] = [];
        for (const triggerName of template.triggers) {
            const item = triggers.find(t => t.name === triggerName);
            if (!item) continue;
            resolvedTriggers.push({
                key: `${item.id}-${triggerKeyCounter++}`,
                availableTriggerId: item.id,
                name: item.name,
                image: item.image,
                metadata: triggerDefaults(item.name)
            });
        }
        if (resolvedTriggers.length === 0) return;

        const resolvedActions: DraftAction[] = [];
        for (const step of template.actions) {
            const item = availableActions.find(a => a.name === step.name);
            if (!item) continue;
            resolvedActions.push({
                key: `${item.id}-${actionKeyCounter++}`,
                availableActionId: item.id,
                name: item.name,
                image: item.image,
                metadata: { ...actionDefaults(item.name), ...step.metadata }
            });
        }
        if (resolvedActions.length === 0) return;

        setDraftTriggers(resolvedTriggers);
        setActions(resolvedActions);
        setError("");
        setStep(2);
    };

    const updateActionMetadata = (key: string, patch: Record<string, unknown>) => {
        setActions(previous =>
            previous.map(action =>
                action.key === key
                    ? { ...action, metadata: { ...action.metadata, ...patch } }
                    : action
            )
        );
    };

    const removeAction = (key: string) => {
        setActions(previous => previous.filter(action => action.key !== key));
    };

    const moveAction = (key: string, direction: -1 | 1) => {
        setActions(previous => {
            const index = previous.findIndex(action => action.key === key);
            const target = index + direction;
            if (index < 0 || target < 0 || target >= previous.length) {
                return previous;
            }
            const next = [...previous];
            const current = next[index]!;
            next[index] = next[target]!;
            next[target] = current;
            return next;
        });
    };

    const save = async () => {
        if (draftTriggers.length === 0 || actions.length === 0) return;
        setSaving(true);
        setError("");
        try {
            const response = await api.post("/zap", {
                triggers: draftTriggers.map(trigger => ({
                    availableTriggerId: trigger.availableTriggerId,
                    triggerMetadata: trigger.metadata
                })),
                actions: actions.map(action => ({
                    availableActionId: action.availableActionId,
                    actionMetadata: action.metadata
                }))
            });
            router.push(`/dashboard/zap/${response.data.zapId}`);
        } catch (saveError) {
            setError(getErrorMessage(saveError, "Failed to create Zap"));
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Create a Zap</h1>
                <p className="text-sm text-gray-500">
                    Pick a trigger, add one or more actions, then run it to see every step.
                </p>
            </div>

            <div className="flex items-center gap-3 text-sm">
                {(["Choose trigger", "Add actions", "Review & save"] as const).map(
                    (label, index) => {
                        const number = (index + 1) as 1 | 2 | 3;
                        const active = step === number;
                        const done = step > number;
                        return (
                            <div key={label} className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        if (number === 1 || draftTriggers.length > 0) setStep(number);
                                    }}
                                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-medium cursor-pointer transition-colors ${
                                        active
                                            ? "border-amber-500 bg-amber-50 text-amber-700"
                                            : done
                                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                              : "border-gray-200 bg-white text-gray-400"
                                    }`}
                                >
                                    <span
                                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                            active
                                                ? "bg-amber-600 text-white"
                                                : done
                                                  ? "bg-emerald-600 text-white"
                                                  : "bg-gray-200 text-gray-500"
                                        }`}
                                    >
                                        {done ? "✓" : number}
                                    </span>
                                    {label}
                                </button>
                                {index < 2 && <span className="text-gray-300">&rarr;</span>}
                            </div>
                        );
                    }
                )}
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {step === 1 && (
                <section className="space-y-6">
                    <div>
                        <h2 className="font-semibold text-gray-900">Start with a template</h2>
                        <div className="mt-2 grid gap-3 md:grid-cols-3">
                            {TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => applyTemplate(template)}
                                    className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-left hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer"
                                >
                                    <div className="text-sm font-semibold text-amber-800">
                                        {template.name}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {template.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Or pick triggers — this Zap runs when <span className="text-amber-700">any</span> of them fires
                        </h2>
                        <p className="mt-1 text-xs text-gray-400">
                            Select one or more. Click again to deselect.
                        </p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-3">
                            {triggers.length === 0 ? (
                                <p className="text-sm text-gray-400">Loading triggers&hellip;</p>
                            ) : (
                                triggers.map(trigger => {
                                    const selected = draftTriggers.some(
                                        t => t.availableTriggerId === trigger.id
                                    );
                                    return (
                                        <button
                                            key={trigger.id}
                                            onClick={() => toggleTrigger(trigger)}
                                            className={`relative flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition-all cursor-pointer ${
                                                selected
                                                    ? "border-amber-500 bg-amber-50 shadow-sm"
                                                    : "border-gray-200 bg-white hover:border-amber-400 hover:shadow-sm"
                                            }`}
                                        >
                                            {selected && (
                                                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
                                                    ✓
                                                </span>
                                            )}
                                            <CatalogIcon image={trigger.image} name={trigger.name} />
                                            <div>
                                                <div className="font-semibold text-gray-800">
                                                    {trigger.name}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {trigger.name === "Webhook"
                                                        ? "Fire on an incoming HTTP request"
                                                        : trigger.name === "GitHub"
                                                          ? "Fire on issue / PR comments"
                                                          : "Fire on a recurring interval"}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {draftTriggers.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700">
                                Configure triggers ({draftTriggers.length} selected)
                            </h3>
                            {draftTriggers.map((trigger, index) => (
                                <div
                                    key={trigger.key}
                                    className="rounded-xl border border-gray-200 bg-white p-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                                            {index + 1}
                                        </span>
                                        <CatalogIcon image={trigger.image} name={trigger.name} />
                                        <span className="font-semibold text-gray-800">
                                            {trigger.name}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setDraftTriggers(previous =>
                                                    previous.filter(t => t.key !== trigger.key)
                                                )
                                            }
                                            className="ml-auto rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 cursor-pointer"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    {trigger.name === "Schedule" && (
                                        <div className="mt-3">
                                            <label className="text-sm font-medium text-gray-700">
                                                Interval (minutes)
                                            </label>
                                            <select
                                                className={`${inputClass} mt-1`}
                                                value={Number(trigger.metadata.intervalMinutes ?? 15)}
                                                onChange={event =>
                                                    updateTriggerMetadata(trigger.key, {
                                                        intervalMinutes: Number(event.target.value)
                                                    })
                                                }
                                            >
                                                {[5, 15, 30, 60].map(value => (
                                                    <option key={value} value={value}>
                                                        Every {value} minutes
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {trigger.name === "GitHub" && (
                                        <div className="mt-3 space-y-3">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">
                                                    Repository (optional, your note)
                                                </label>
                                                <input
                                                    className={`${inputClass} mt-1`}
                                                    placeholder="owner/repo-name"
                                                    value={String(trigger.metadata.repo ?? "")}
                                                    onChange={event =>
                                                        updateTriggerMetadata(trigger.key, {
                                                            repo: event.target.value
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">
                                                    Webhook secret (recommended)
                                                </label>
                                                <input
                                                    className={`${inputClass} mt-1`}
                                                    placeholder="e.g. my-random-secret-123"
                                                    value={String(trigger.metadata.secret ?? "")}
                                                    onChange={event =>
                                                        updateTriggerMetadata(trigger.key, {
                                                            secret: event.target.value
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {trigger.name === "Webhook" && (
                                        <p className="mt-2 text-xs text-gray-400">
                                            No configuration needed — after saving, this Zap&apos;s
                                            page shows the webhook URL to POST to.
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={() => draftTriggers.length > 0 && setStep(2)}
                            disabled={draftTriggers.length === 0}
                            className="rounded-full bg-amber-600 px-6 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-amber-300 cursor-pointer"
                        >
                            Continue to actions
                        </button>
                    </div>
                </section>
            )}

            {step === 2 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">
                            Then do this ({actions.length} action
                            {actions.length === 1 ? "" : "s"})
                        </h2>
                        <button
                            onClick={() => setPickerOpen(open => !open)}
                            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 cursor-pointer"
                        >
                            + Add action
                        </button>
                    </div>

                    {pickerOpen && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {availableActions.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => addAction(item)}
                                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer"
                                >
                                    <CatalogIcon image={item.image} name={item.name} />
                                    <span className="font-medium text-gray-800">
                                        {item.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {actions.length === 0 && !pickerOpen && (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-400">
                            No actions yet. Add at least one action.
                        </div>
                    )}

                    <div className="space-y-3">
                        {actions.map((action, index) => (
                            <div
                                key={action.key}
                                className="rounded-xl border border-gray-200 bg-white p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                                            {index + 1}
                                        </span>
                                        <CatalogIcon image={action.image} name={action.name} />
                                        <span className="font-semibold text-gray-800">
                                            {action.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => moveAction(action.key, -1)}
                                            disabled={index === 0}
                                            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                                        >
                                            &uarr;
                                        </button>
                                        <button
                                            onClick={() => moveAction(action.key, 1)}
                                            disabled={index === actions.length - 1}
                                            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                                        >
                                            &darr;
                                        </button>
                                        <button
                                            onClick={() => removeAction(action.key)}
                                            className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 cursor-pointer"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <ActionFields
                                        action={action}
                                        onChange={patch =>
                                            updateActionMetadata(action.key, patch)
                                        }
                                    />
                                </div>

                                <label className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                    <input
                                        type="checkbox"
                                        checked={action.metadata.simulateError === true}
                                        onChange={event =>
                                            updateActionMetadata(action.key, {
                                                simulateError: event.target.checked
                                            })
                                        }
                                        className="accent-red-500"
                                    />
                                    Simulate a failure for this step
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between pt-2">
                        <button
                            onClick={() => setStep(1)}
                            className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => actions.length > 0 && setStep(3)}
                            disabled={actions.length === 0}
                            className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-amber-300 cursor-pointer"
                        >
                            Review
                        </button>
                    </div>
                </section>
            )}

            {step === 3 && (
                <section className="space-y-4">
                    <h2 className="font-semibold text-gray-900">Review your Zap</h2>
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            When this happens ({draftTriggers.length} trigger
                            {draftTriggers.length === 1 ? "" : "s"} — any fires the Zap)
                        </div>
                        <ul className="mt-2 space-y-2">
                            {draftTriggers.map((trigger, index) => (
                                <li
                                    key={trigger.key}
                                    className="flex items-center gap-2 text-sm text-gray-700 capitalize"
                                >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                                        T{index + 1}
                                    </span>
                                    <CatalogIcon image={trigger.image} name={trigger.name} />
                                    {trigger.name}
                                    {trigger.name === "GitHub" &&
                                        String(trigger.metadata.secret ?? "").trim() && (
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                                secret set
                                            </span>
                                        )}
                                    {trigger.name === "Schedule" && (
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                            every {Number(trigger.metadata.intervalMinutes ?? 15)} min
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Do this ({actions.length})
                        </div>
                        <ol className="mt-2 space-y-2">
                            {actions.map((action, index) => (
                                <li
                                    key={action.key}
                                    className="flex items-center gap-2 text-sm text-gray-700"
                                >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                                        {index + 1}
                                    </span>
                                    <CatalogIcon image={action.image} name={action.name} />
                                    {action.name}
                                    {action.metadata.simulateError === true && (
                                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                                            will fail
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={() => setStep(2)}
                            className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                            Back
                        </button>
                        <button
                            onClick={save}
                            disabled={!canSave || saving}
                            className="rounded-full bg-amber-600 px-6 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-amber-300 cursor-pointer"
                        >
                            {saving ? "Saving..." : "Save & Review"}
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}

function CatalogIcon({ image, name }: { image: string; name: string }) {
    if (image) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-6 w-6 object-contain" />
        );
    }
    return (
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-xs font-bold text-amber-700">
            {name.slice(0, 1).toUpperCase()}
        </span>
    );
}

function ActionFields({
    action,
    onChange
}: {
    action: DraftAction;
    onChange: (patch: Record<string, unknown>) => void;
}) {
    const value = (key: string) => String(action.metadata[key] ?? "");

    switch (action.name) {
        case "Send Email":
            return (
                <>
                    <Field label="To">
                        <input
                            className={inputClass}
                            value={value("to")}
                            onChange={event => onChange({ to: event.target.value })}
                        />
                    </Field>
                    <Field label="Subject">
                        <input
                            className={inputClass}
                            value={value("subject")}
                            onChange={event => onChange({ subject: event.target.value })}
                        />
                    </Field>
                    <div className="sm:col-span-2">
                        <Field label="Message — supports {{repo}} {{author}} {{comment}} {{url}}">
                            <textarea
                                rows={4}
                                className={inputClass}
                                value={value("message")}
                                onChange={event => onChange({ message: event.target.value })}
                            />
                        </Field>
                    </div>
                    <div className="sm:col-span-2 text-xs text-gray-400">
                        Real delivery via Gmail SMTP — set <code>SMTP_USER</code> and{" "}
                        <code>SMTP_PASS</code> (Gmail App Password) in{" "}
                        <code>worker/.env</code>. Without them, sends are simulated.
                    </div>
                </>
            );
        case "Google Sheets":
            return (
                <>
                    <div className="sm:col-span-2">
                        <Field label="Apps Script Webhook URL">
                            <input
                                className={inputClass}
                                placeholder="https://script.google.com/macros/s/AKfy.../exec"
                                value={value("webhookUrl")}
                                onChange={event => onChange({ webhookUrl: event.target.value })}
                            />
                        </Field>
                    </div>
                    <div className="sm:col-span-2">
                        <Field label="Row values (comma-separated — supports {{repo}} {{author}} {{comment}} {{url}})">
                            <input
                                className={inputClass}
                                value={value("values")}
                                onChange={event => onChange({ values: event.target.value })}
                            />
                        </Field>
                    </div>
                    <div className="sm:col-span-2">
                        <details className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                            <summary className="cursor-pointer text-xs font-semibold text-emerald-700">
                                How do I create the Google Sheets webhook? (2 min, free)
                            </summary>
                            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-gray-600">
                                <li>Open your Google Sheet &rarr; menu Extensions &rarr; Apps Script.</li>
                                <li>Delete any code and paste this, then press Ctrl+S:</li>
                            </ol>
                            <pre className="mt-2 overflow-x-auto rounded bg-white border border-emerald-100 p-2 text-[10px] text-gray-700">{`function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.appendRow((data.values || []).concat(new Date().toISOString()));
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true })
  );
}`}</pre>
                            <ol start={3} className="mt-2 list-decimal space-y-1 pl-4 text-xs text-gray-600">
                                <li>Deploy &rarr; New deployment &rarr; type: Web app.</li>
                                <li>Execute as: <b>Me</b>. Who has access: <b>Anyone</b>. Deploy.</li>
                                <li>Copy the Web app URL (ends in <code>/exec</code>) into the field above.</li>
                            </ol>
                        </details>
                    </div>
                </>
            );
        case "Slack Message":
            return (
                <Field label="Channel">
                    <input
                        className={inputClass}
                        value={value("channel")}
                        onChange={event => onChange({ channel: event.target.value })}
                    />
                </Field>
            );
        case "HTTP Request":
            return (
                <>
                    <Field label="URL">
                        <input
                            className={inputClass}
                            value={value("url")}
                            onChange={event => onChange({ url: event.target.value })}
                        />
                    </Field>
                    <Field label="Method">
                        <select
                            className={inputClass}
                            value={value("method") || "POST"}
                            onChange={event => onChange({ method: event.target.value })}
                        >
                            {["GET", "POST", "PUT", "PATCH", "DELETE"].map(method => (
                                <option key={method}>{method}</option>
                            ))}
                        </select>
                    </Field>
                </>
            );
        case "Delay":
            return (
                <Field label="Seconds (max 5)">
                    <input
                        type="number"
                        min={0}
                        max={5}
                        className={inputClass}
                        value={value("seconds")}
                        onChange={event => onChange({ seconds: Number(event.target.value) })}
                    />
                </Field>
            );
        case "Filter":
            return (
                <>
                    <Field label="Payload field">
                        <input
                            className={inputClass}
                            placeholder="event"
                            value={value("field")}
                            onChange={event => onChange({ field: event.target.value })}
                        />
                    </Field>
                    <Field label="Equals value">
                        <input
                            className={inputClass}
                            placeholder="new_lead"
                            value={value("value")}
                            onChange={event => onChange({ value: event.target.value })}
                        />
                    </Field>
                </>
            );
        case "Solana Transfer":
            return (
                <>
                    <Field label="Recipient">
                        <input
                            className={inputClass}
                            value={value("recipient")}
                            onChange={event => onChange({ recipient: event.target.value })}
                        />
                    </Field>
                    <Field label="Amount (SOL)">
                        <input
                            type="number"
                            step="0.01"
                            className={inputClass}
                            value={value("amount")}
                            onChange={event => onChange({ amount: Number(event.target.value) })}
                        />
                    </Field>
                </>
            );
        default:
            return (
                <div className="sm:col-span-2 text-xs text-gray-400">
                    No configuration needed for {action.name}. It will echo the trigger payload.
                </div>
            );
    }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="text-xs font-medium text-gray-500">{label}</span>
            <div className="mt-1">{children}</div>
        </label>
    );
}
