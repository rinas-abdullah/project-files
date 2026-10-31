import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-navy-900 text-white hover:bg-navy-800 shadow-sm",
        critical: "bg-critical text-white hover:bg-red-700 shadow-sm",
        warning: "bg-warning text-white hover:bg-amber-700 shadow-sm",
        stable: "bg-stable text-white hover:bg-teal-700 shadow-sm",
        ai: "bg-ai text-white hover:bg-violet-700 shadow-sm",
        outline: "border border-input bg-white hover:bg-muted text-foreground",
        secondary: "bg-muted text-foreground hover:bg-accent",
        ghost: "hover:bg-muted text-foreground",
        link: "text-info underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        xl: "h-16 px-5 text-base rounded-xl",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";
export { buttonVariants };
