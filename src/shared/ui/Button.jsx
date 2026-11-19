import React from "react";
import { Loader2 } from "lucide-react";
import { cx } from "../lib/cx.js";

const variants = {
  primary: "brand-gradient text-white shadow-sm hover:brightness-110 active:brightness-95",
  secondary: "bg-surface text-fg ring-1 ring-inset ring-line shadow-sm hover:bg-surface-2",
  ghost: "text-fg-secondary hover:bg-surface-2 hover:text-fg",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
};
const sizes = { sm: "h-9 sm:h-8 px-3 text-xs", md: "h-10 sm:h-9 px-4 text-sm", lg: "h-11 sm:h-10 px-5 text-sm" };

const Button = React.forwardRef(function Button(
  { variant = "primary", size = "md", loading = false, icon: Icon, className = "", children, disabled, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cx(
        "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-[background-color,box-shadow,filter,transform] duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
});

export default Button;
