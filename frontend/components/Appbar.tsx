"use client"
import { LinkButton } from "./button/LinkButton";
import { PrimaryButton } from "./button/primaryButton"
import { useRouter } from "next/navigation";
export const Appbar = () => {
    const router = useRouter()
    return (
        <div className="sticky top-0 z-50 flex border-b border-gray-200 justify-between items-center px-4 py-2"
            style={{ backgroundColor: "rgba(255,254,251,0.85)", backdropFilter: "blur(12px)" }}>
            <div className="flex flex-row items-center">
                <div className="flex flex-row items-center gap-2">
                    <div className="text-3xl font-bold font-sans pl-4 cursor-pointer select-none"
                        onClick={() => router.push("/")}>
                        _Zapier
                    </div>

                    <LinkButton
                        onClick={() => router.push("/product")}
                    >
                        Product
                    </LinkButton>

                    <LinkButton
                        onClick={() => router.push("/solution")}
                    >
                        Solution
                    </LinkButton>

                    <LinkButton
                        onClick={() => router.push("/resources")}
                    >
                        Resources
                    </LinkButton>

                    <LinkButton
                        onClick={() => router.push("/enterprice")}
                    >
                        Enterprise
                    </LinkButton>

                    <LinkButton
                        onClick={() => router.push("/pricing")}
                    >
                        Pricing
                    </LinkButton>
                </div>

            </div>
            <div className="flex items-center gap-1">
                <div>
                    <LinkButton onClick={() => (
                        router.push("https://github.com/Shivranjan-In/Zapier-automation")
                    )}> GitHub </LinkButton>

                </div>
                <div>
                    <LinkButton onClick={() => (
                        router.push("/Contect")
                    )}> Contect Sales </LinkButton>

                </div>
                <div>
                    <LinkButton onClick={() => (
                        router.push("/login")
                    )}> Login </LinkButton>
                </div>

                <div className="ml-2">
                    <PrimaryButton size="small" onClick={() => (
                        router.push("/signup")
                    )}>
                        Signup
                    </PrimaryButton>
                </div>

            </div>

        </div>
    );
}
