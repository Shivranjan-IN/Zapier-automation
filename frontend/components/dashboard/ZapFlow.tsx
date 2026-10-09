import type { ZapAction, ZapTrigger } from "@/lib/types";

type Props = {
    triggers: ZapTrigger[];
    actions: ZapAction[];
    vertical?: boolean;
};

export default function ZapFlow({ triggers, actions, vertical = false }: Props) {
    return (
        <div
            className={
                vertical
                    ? "flex flex-col items-stretch gap-2"
                    : "flex flex-wrap items-center gap-2"
            }
        >
            {triggers.length === 0 ? (
                <FlowNode label="No trigger yet" accent />
            ) : (
                <div
                    className={
                        vertical
                            ? "flex flex-col gap-2"
                            : "flex flex-wrap items-center gap-2"
                    }
                >
                    {triggers.map((trigger, index) => (
                        <div
                            key={trigger.id}
                            className={
                                vertical
                                    ? "flex items-center gap-2"
                                    : "inline-flex items-center gap-2"
                            }
                        >
                            {index > 0 && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                    or
                                </span>
                            )}
                            <FlowNode
                                label={trigger.type.name}
                                image={trigger.type.image}
                                accent
                            />
                        </div>
                    ))}
                </div>
            )}

            {actions.length > 0 && (
                <span
                    className={
                        vertical
                            ? "ml-3 text-gray-300"
                            : "text-gray-300"
                    }
                >
                    &rarr;
                </span>
            )}

            {actions.map((action, index) => (
                <FlowNode
                    key={action.id}
                    label={action.type.name}
                    image={action.type.image}
                    arrow={!vertical}
                    index={index}
                />
            ))}
            {actions.length === 0 && (
                <span className="text-xs text-gray-400">No actions yet</span>
            )}
        </div>
    );
}

function FlowNode({
    label,
    image,
    accent = false,
    arrow = false,
    index
}: {
    label: string;
    image?: string;
    accent?: boolean;
    arrow?: boolean;
    index?: number;
}) {
    const node = (
        <div
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                accent
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-gray-200 bg-white text-gray-700"
            }`}
        >
            <span
                className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                    accent ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                }`}
            >
                {accent ? "T" : (index ?? 0) + 1}
            </span>
            {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="h-4 w-4 object-contain" />
            ) : null}
            <span className="capitalize">{label}</span>
        </div>
    );

    if (!arrow) {
        return node;
    }

    return (
        <div className="inline-flex items-center gap-2">
            <span className="text-gray-300">&rarr;</span>
            {node}
        </div>
    );
}
