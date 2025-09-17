"use client";

import * as React from "react";
import { cn } from "@/lib/util/cn";

interface SelectRootProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

function collectItems(children: React.ReactNode, items: React.ReactElement<SelectItemProps>[]) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const type: any = child.type;
    if (type?.displayName === "SelectItem") {
      items.push(child as React.ReactElement<SelectItemProps>);
      return;
    }
    if (child.props?.children) {
      collectItems(child.props.children, items);
    }
  });
}

export function Select({ value, defaultValue, onValueChange, className, children }: SelectRootProps) {
  const items: React.ReactElement<SelectItemProps>[] = [];
  collectItems(children, items);
  const resolvedValue = value ?? defaultValue ?? items[0]?.props.value ?? "";

  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      value={value ?? resolvedValue}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {items.map((item, idx) => (
        <option key={idx} value={item.props.value} disabled={item.props.disabled}>
          {item.props.children}
        </option>
      ))}
    </select>
  );
}
Select.displayName = "Select";

export function SelectTrigger({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="sr-only">{placeholder}</span>;
}
SelectValue.displayName = "SelectValue";

export function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
SelectContent.displayName = "SelectContent";

export interface SelectItemProps {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function SelectItem({ children }: SelectItemProps) {
  return <>{children}</>;
}
SelectItem.displayName = "SelectItem";
