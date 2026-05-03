import type { ReactNode } from "react";
import { Lightbulb, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

type CalloutVariant = "tip" | "warning" | "info" | "success";

const variantStyle: Record<
  CalloutVariant,
  {
    bg: string;
    border: string;
    icon: typeof Info;
    iconBg: string;
    iconColor: string;
    title: string;
  }
> = {
  tip: {
    bg: "bg-[#ffba09]/15",
    border: "border-[#ffba09]",
    icon: Lightbulb,
    iconBg: "bg-[#ffba09]",
    iconColor: "text-washed-black",
    title: "Tip",
  },
  warning: {
    bg: "bg-[#e3c7de]/30",
    border: "border-washed-black",
    icon: AlertTriangle,
    iconBg: "bg-washed-black",
    iconColor: "text-[#ffba09]",
    title: "Perhatian",
  },
  info: {
    bg: "bg-[#add3e5]/30",
    border: "border-[#1009f6]",
    icon: Info,
    iconBg: "bg-[#1009f6]",
    iconColor: "text-pure-white",
    title: "Info",
  },
  success: {
    bg: "bg-[#304801]/10",
    border: "border-[#304801]",
    icon: CheckCircle2,
    iconBg: "bg-[#304801]",
    iconColor: "text-pure-white",
    title: "Berhasil",
  },
};

export function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}) {
  const s = variantStyle[variant];
  const Icon = s.icon;

  return (
    <div
      className={`${s.bg} border-l-4 ${s.border} rounded-[16px] p-5 my-5 flex gap-4`}
    >
      <span
        className={`${s.iconBg} ${s.iconColor} flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full mt-0.5`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-washed-black mb-1">
          {title ?? s.title}
        </p>
        <div className="text-[14px] text-washed-black leading-[1.6] [&_strong]:font-bold [&_a]:text-[#1009f6] [&_a]:font-bold [&_a:hover]:underline">
          {children}
        </div>
      </div>
    </div>
  );
}
