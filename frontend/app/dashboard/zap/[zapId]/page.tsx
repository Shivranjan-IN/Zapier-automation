"use client";

import { Suspense, use } from "react";
import ZapDetail from "./ZapDetail";

export default function ZapDetailPage({
    params
}: {
    params: Promise<{ zapId: string }>;
}) {
    return (
        <Suspense
            fallback={<div className="text-sm text-gray-500 animate-pulse">Loading Zap&hellip;</div>}
        >
            <ZapDetailWrapper params={params} />
        </Suspense>
    );
}

function ZapDetailWrapper({ params }: { params: Promise<{ zapId: string }> }) {
    const { zapId } = use(params);
    return <ZapDetail zapId={zapId} />;
}
