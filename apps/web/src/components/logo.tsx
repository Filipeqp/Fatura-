import { Receipt } from "lucide-react";

import { cn } from "@/lib/utils";

interface LogoProps extends React.ComponentProps<"div"> {
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false, ...props }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} {...props}>
      <Receipt className="h-6 w-6 shrink-0 text-primary" strokeWidth={1.75} />
      {!iconOnly && (
        <span className="font-serif text-2xl italic tracking-tight text-foreground">
          Fatura<span className="text-primary">+</span>
        </span>
      )}
    </div>
  );
}
