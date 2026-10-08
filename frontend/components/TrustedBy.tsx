const logos = [
    "Notion", "Slack", "Shopify", "HubSpot", "Stripe",
    "Airtable", "Asana", "GitHub", "Salesforce", "Figma",
    "Linear", "Intercom", "Zendesk", "Webflow", "Loom",
]

export const TrustedBy = () => {
    return (
        <section className="py-16 overflow-hidden">
            <p className="text-center text-sm font-semibold tracking-widest text-gray-400 uppercase mb-10 animate-fade-in">
                Trusted by the world&apos;s best companies
            </p>

            {/* Ticker tape — duplicated for seamless loop */}
            <div className="relative flex">
                <div
                    className="flex gap-16 items-center whitespace-nowrap"
                    style={{
                        animation: "ticker 28s linear infinite",
                    }}
                >
                    {[...logos, ...logos].map((name, i) => (
                        <span
                            key={i}
                            className="text-xl font-bold text-gray-300 hover:text-amber-500 transition-colors cursor-default select-none tracking-tight"
                        >
                            {name}
                        </span>
                    ))}
                </div>

                {/* Fade edges */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-32"
                    style={{ background: "linear-gradient(to right, #fffefb, transparent)" }} />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-32"
                    style={{ background: "linear-gradient(to left, #fffefb, transparent)" }} />
            </div>

            <style>{`
                @keyframes ticker {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </section>
    )
}
