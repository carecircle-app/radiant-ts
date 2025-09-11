import type { ReactNode } from "react";

type Props = {
  className?: string;
  children?: ReactNode;
};

export function Container({ className = "", children }: Props) {
  return <div className={`mx-auto max-w-7xl px-6 ${className}`}>{children}</div>;
}

// keep default to be backward compatible with older imports
export default Container;
