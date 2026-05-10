import * as React from "react";
import { IconProps as BaseIconProps, IconBase } from "../icons/IconBase";
import { cn } from "@/lib/utils";

interface IconProps extends BaseIconProps {
  icon: React.FC<BaseIconProps>;
}

/** Standardised icon wrapper — consistent strokeWidth and sizing across the app. */
export function Icon({ icon: IconComponent, size = 16, strokeWidth = 1.5, className, ...props }: IconProps) {
  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}
