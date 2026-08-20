import { Receipt } from "lucide-react";

import { cn } from "@/lib/utils";

interface LogoProps extends React.ComponentProps<"div"> {
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false, ...props }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Receipt className="h-5 w-5" />
      </span>
      {!iconOnly && (
        <span className="text-xl font-semibold tracking-tight text-foreground">
          Fatura<span className="text-primary">+</span>
        </span>
      )}
    </div>
  );
}
