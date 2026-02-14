import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "placeholder:text-[var(--ink-muted)] border-[var(--cream-dark)] h-9 w-full min-w-0 rounded-md border bg-white px-3 py-1 text-base text-[var(--ink)] shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20 focus-visible:ring-[3px]",
        className
      )}
      {...props}
    />
  );
}

export { Input };
