import { Loader2 } from "lucide-react";

export function Button({ children, className = "", loading = false, type = "button", ...props }) {
  return (
    <button
      type={type}
      className={`premium-button inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-950/10 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
      disabled={loading || props.disabled}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
