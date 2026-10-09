"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

function NavLinks() {
    const pathname = usePathname();
    return (
        <nav className="flex items-center gap-5 text-sm">
            <Link
                href="/dashboard"
                className={`font-medium ${
                    pathname === "/dashboard"
                        ? "text-amber-600"
                        : "text-gray-500 hover:text-gray-900"
                }`}
            >
                Zaps
            </Link>
            <Link
                href="/dashboard/runs"
                className={`font-medium ${
                    pathname.startsWith("/dashboard/runs")
                        ? "text-amber-600"
                        : "text-gray-500 hover:text-gray-900"
                }`}
            >
                Runs
            </Link>
        </nav>
    );
}

export default function DashboardLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [checked, setChecked] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.replace("/login");
            return;
        }

        let cancelled = false;
        api
            .get("/user")
            .then(response => {
                if (!cancelled) {
                    setUser(response.data.user);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    localStorage.removeItem("token");
                    router.replace("/login");
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setChecked(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [router]);

    if (!checked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fffefb]">
                <div className="text-sm text-gray-500 animate-pulse">
                    Loading dashboard&hellip;
                </div>
            </div>
        );
    }

    const logout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-[#fffefb]">
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-8">
                        <Link
                            href="/dashboard"
                            className="text-xl font-bold text-gray-900"
                        >
                            _Zapier
                        </Link>
                        <Suspense
                            fallback={
                                <div className="flex items-center gap-5 text-sm">
                                    <span className="font-medium text-gray-400">Zaps</span>
                                    <span className="font-medium text-gray-400">Runs</span>
                                </div>
                            }
                        >
                            <NavLinks />
                        </Suspense>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/zap/new"
                            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
                        >
                            + Create Zap
                        </Link>
                        {user && (
                            <span className="hidden text-sm text-gray-500 sm:block">
                                {user.name}
                            </span>
                        )}
                        <button
                            onClick={logout}
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 cursor-pointer bg-transparent border-none"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </div>
    );
}
