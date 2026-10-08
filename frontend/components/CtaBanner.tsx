"use client"
import { useRouter } from "next/navigation"

export const CtaBanner = () => {
    const router = useRouter()

    return (
        <section className="relative mx-6 mb-6 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 100%)" }}>
            {/* Background decoration */}
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }} />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-15"
                style={{ background: "radial-gradient(circle, #fef3c7, transparent)" }} />

            <div className="relative z-10 flex flex-col items-center text-center px-8 py-20 md:py-28">
                <span className="inline-block text-xs font-bold tracking-widest uppercase text-amber-200 mb-5 bg-white/10 px-4 py-1.5 rounded-full border border-white/20">
                    Get started today
                </span>

                <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6 max-w-3xl">
                    Your next automation<br />is one click away
                </h2>

                <p className="text-amber-100 text-lg max-w-lg mb-10 leading-relaxed">
                    Join over 2.2 million businesses already saving time with _Zapier.
                    No credit card required.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        id="cta-signup"
                        onClick={() => router.push("/Signup")}
                        className="bg-white text-amber-700 font-bold text-base px-8 py-4 rounded-full hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                        Start for free
                    </button>
                    <button
                        id="cta-demo"
                        onClick={() => router.push("/Contact")}
                        className="bg-white/10 text-white font-semibold text-base px-8 py-4 rounded-full border border-white/30 hover:bg-white/20 transition-all duration-200 cursor-pointer backdrop-blur-sm"
                    >
                        Talk to sales →
                    </button>
                </div>

                <p className="text-amber-200/60 text-xs mt-8">
                    Free plan available · No credit card · Cancel anytime
                </p>
            </div>
        </section>
    )
}
