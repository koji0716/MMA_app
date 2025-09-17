"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/util/cn";

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | undefined>(undefined);

export interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, defaultOpen = false, onOpenChange, children }: SheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const actualOpen = isControlled ? open : internalOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setInternalOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const ctx = React.useMemo(() => ({ open: actualOpen, setOpen }), [actualOpen, setOpen]);

  return <SheetContext.Provider value={ctx}>{children}</SheetContext.Provider>;
}

export interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ onClick, asChild = false, children, ...props }, ref) => {
    const context = React.useContext(SheetContext);
    if (!context) {
      throw new Error("SheetTrigger must be used within Sheet");
    }

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      onClick?.(event);
      context.setOpen(!context.open);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
          children.props.onClick?.(event);
          handleClick(event);
        },
        ref,
      });
    }

    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
SheetTrigger.displayName = "SheetTrigger";

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "right" | "left" | "bottom" | "top";
}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = "right", children, ...props }, ref) => {
    const context = React.useContext(SheetContext);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    if (!context) {
      throw new Error("SheetContent must be used within Sheet");
    }
    if (!mounted || !context.open) {
      return null;
    }

    const positionClasses: Record<string, string> = {
      right: "right-0 top-0 h-full w-full max-w-md",
      left: "left-0 top-0 h-full w-full max-w-md",
      bottom: "bottom-0 left-0 w-full max-h-[90vh]",
      top: "top-0 left-0 w-full max-h-[90vh]",
    };

    return createPortal(
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/60" onClick={() => context.setOpen(false)} />
        <div
          ref={ref}
          className={cn(
            "relative ml-auto flex h-full flex-col bg-card text-card-foreground shadow-xl transition-transform",
            positionClasses[side],
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }
);
SheetContent.displayName = "SheetContent";

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("border-b border-border p-4", className)} {...props} />
);

export const SheetTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold", className)} {...props} />
);
