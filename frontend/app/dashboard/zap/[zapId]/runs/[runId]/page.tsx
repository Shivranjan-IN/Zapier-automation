"use client";

import { Suspense, use } from "react";
import RunDetail from "./RunDetail";

export default function RunDetailPage({
    params
}: {
    params: Promise<{ zapId: string; runId: string }>;
}) {
    return (
        <Suspense
            fallback={
                <div className="text-sm text-gray-500 animate-pulse">Loading run&hellip;</div>
            }
        >
            <RunDetailWrapper params={params} />
        </Suspense>
    );
}

function RunDetailWrapper({
    params
}: {
    params: Promise<{ zapId: string; runId: string }>;
}) {
    const { zapId, runId } = use(params);
    return <RunDetail zapId={zapId} runId={runId} />;
}
