"use client"
import React from "react"

interface primaryButtonProps {
    children: React.ReactNode;
    size?: "big" | "small"
    onClick?: () => void;
}
export const GoogleButton = ({ children, size, onClick }: primaryButtonProps) => {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer rounded-full flex flex-col justify-center items-center bg-white text-black transition-colors hover:bg-white border border-gray-300 hover:shadow-md ${
                size === "small" ? "text-sm px-4 py-2" : "text-xl px-4 py-2"
            }`}
        >
            {children}
        </div>
    )
}