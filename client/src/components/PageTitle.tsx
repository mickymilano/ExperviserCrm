import React from "react";

interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function PageTitle({ title, subtitle, icon }: PageTitleProps) {
  return (
    <div className="flex items-center">
      {icon && <div className="mr-3">{icon}</div>}
      <div>
        <h1 className="text-2xl font-bold text-neutral-dark">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-medium mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}