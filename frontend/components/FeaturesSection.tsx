const features = [
    {
        icon: "⚡",
        title: "Automate in seconds",
        desc: "Connect 7,000+ apps with no-code Zaps. Go from idea to running workflow faster than ever before.",
        gradient: "from-amber-50 to-orange-50",
        accent: "#f59e0b",
    },
    {
        icon: "🤖",
        title: "AI-powered agents",
        desc: "Let intelligent agents reason, plan, and execute complex multi-step workflows autonomously.",
        gradient: "from-violet-50 to-purple-50",
        accent: "#7c3aed",
    },
    {
        icon: "🔒",
        title: "Enterprise-grade trust",
        desc: "SOC 2 Type II certified. Granular permissions, audit logs, and SSO keep your data safe.",
        gradient: "from-sky-50 to-blue-50",
        accent: "#0ea5e9",
    },
    {
        icon: "📊",
        title: "Tables & Interfaces",
        desc: "Store, transform and display data beautifully without writing a single line of backend code.",
        gradient: "from-emerald-50 to-teal-50",
        accent: "#10b981",
    },
    {
        icon: "🔗",
        title: "7,000+ integrations",
        desc: "Slack, Notion, Salesforce, Gmail, GitHub — if you use it, Zapier connects to it.",
        gradient: "from-rose-50 to-pink-50",
        accent: "#f43f5e",
    },
    {
        icon: "📈",
        title: "Real-time observability",
        desc: "Monitor every Zap run with detailed logs, error alerts, and performance dashboards.",
        gradient: "from-amber-50 to-yellow-50",
        accent: "#eab308",
    },
]

export const FeaturesSection = () => {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-16 animate-fade-up">
                <span className="inline-block text-xs font-bold tracking-widest uppercase text-amber-600 mb-3 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Why _Zapier
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-4 leading-tight">
                    Everything you need to<br />
                    <span className="text-shimmer">automate your business</span>
                </h2>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                    From simple automations to enterprise-grade AI agents — one platform, unlimited possibilities.
                </p>
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((f, i) => (
                    <div
                        key={f.title}
                        className={`animate-fade-up delay-${(i + 1) * 100} group relative rounded-2xl bg-gradient-to-br ${f.gradient} border border-gray-100 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden`}
                    >
                        {/* Subtle corner glow on hover */}
                        <div
                            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                            style={{ background: f.accent, filter: "blur(24px)" }}
                        />

                        <span className="text-4xl mb-5 block">{f.icon}</span>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>

                        <div
                            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ color: f.accent }}
                        >
                            Learn more
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
