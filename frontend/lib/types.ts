export type AvailableItem = {
    id: string;
    name: string;
    image: string;
};

export type ZapAction = {
    id: string;
    actionId: string;
    metadata: Record<string, unknown>;
    sortingOrder: number;
    type: AvailableItem;
};

export type ZapTrigger = {
    id: string;
    triggerId: string;
    metadata: Record<string, unknown>;
    type: AvailableItem;
};

export type Zap = {
    id: string;
    userId: number;
    actions: ZapAction[];
    triggers: ZapTrigger[];
};

export type RunStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";

export type ZapRunStep = {
    id: string;
    zapRunId: string;
    actionId: string;
    sortingOrder: number;
    status: RunStatus;
    startedAt: string | null;
    finishedAt: string | null;
    output: unknown;
    error: string | null;
    action: ZapAction;
};

export type ZapRun = {
    id: string;
    zapId: string;
    metadata: Record<string, unknown>;
    status: RunStatus;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    steps: ZapRunStep[];
    zap?: Zap;
};

export type UserProfile = {
    id: number;
    name: string;
    email: string;
};
