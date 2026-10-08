"use client"
import React from "react";

interface LinkButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export const LinkButton = ({ children, href, onClick }: LinkButtonProps) => {
  return (
    <div className="text-black px-4 py-2 font-semibold cursor-pointer hover:text-amber-600" onClick={onClick}>
      {children}
    </div>
  ); 
}
