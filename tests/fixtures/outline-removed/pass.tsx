import { cn } from "./cn";
export const A = () => <input className="rounded-md border px-3 outline-none focus-visible:ring-2 focus-visible:ring-offset-2" />;
export const B = ({ className }) => <div className={cn("px-2 outline-hidden focus:bg-accent", className)}>Item</div>;
