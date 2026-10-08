"use client"
import { useRouter } from "next/navigation"
import { PrimaryButton } from "./button/primaryButton"

import { GoogleButton } from "./button/GoogleButton"

export const Hero = () => {
    const router = useRouter()
    return <div>
        <div className="flex justify-center pt-26">
            The next generation of Zapier
        </div>
        <div className="flex justify-center">
            <div className="text-5xl font-semibold flex text-center pt-8 max-w-xl">
                Welcome to automation in the agentic era
            </div>

        </div>
        <div className="flex justify-center pt-5">
            Start building in your favorite AI tool, then run and govern trusted workflows on Zapier.
        </div>

        <div className=" flex justify-center pt-5">
            <div className="flex m-4 gap-4">
                <PrimaryButton
                    size="big"
                    onClick={() => router.push("/Signup")}
                >
                    Get started free
                </PrimaryButton>

                <GoogleButton
                    size="big"
                    onClick={() => router.push("/Contact")}
                >
                    Contect Seles
                </GoogleButton>
            </div>

        </div>
    </div>
}           