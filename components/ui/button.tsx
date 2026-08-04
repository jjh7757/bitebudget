import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-600",
        outline:
          "border border-border bg-transparent text-foreground hover:border-primary-300 hover:bg-accent",
        ghost: "text-foreground hover:bg-accent",
        destructive: "text-destructive hover:bg-destructive/10",
        link: "text-muted-foreground underline underline-offset-2 hover:text-foreground",
      },
      size: {
        default: "h-12 rounded-md px-5 text-sm",
        sm: "h-9 rounded-sm px-3 text-xs",
        icon: "h-11 w-11 rounded-full",
        fab: "h-14 w-14 rounded-full shadow-fab",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
