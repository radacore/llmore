import type { LucideIcon } from "lucide-react";

type Surface = "blue" | "gold" | "moss" | "thistle";

const surfaceStyle: Record<
  Surface,
  {
    bg: string;
    title: string;
    subtitle: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  blue: {
    bg: "bg-[#1009f6]",
    title: "text-pure-white",
    subtitle: "text-pure-white/85",
    iconBg: "bg-[#ffba09]",
    iconColor: "text-washed-black",
  },
  gold: {
    bg: "bg-[#ffba09]",
    title: "text-washed-black",
    subtitle: "text-washed-black/75",
    iconBg: "bg-washed-black",
    iconColor: "text-[#ffba09]",
  },
  moss: {
    bg: "bg-[#304801]",
    title: "text-pure-white",
    subtitle: "text-pure-white/80",
    iconBg: "bg-[#add3e5]",
    iconColor: "text-washed-black",
  },
  thistle: {
    bg: "bg-[#e3c7de]",
    title: "text-washed-black",
    subtitle: "text-washed-black/70",
    iconBg: "bg-[#1009f6]",
    iconColor: "text-pure-white",
  },
};

export function IntegrationHeader({
  icon: Icon,
  title,
  subtitle,
  description,
  surface = "blue",
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description?: string;
  surface?: Surface;
}) {
  const s = surfaceStyle[surface];
  return (
    <div className={`${s.bg} rounded-[24px] p-6 md:p-7 mb-7 border-2 border-washed-black`}>
      <div className="flex items-start gap-4">
        <span
          className={`${s.iconBg} ${s.iconColor} flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <h4 className={`${s.title} font-bold text-[18px] leading-[1.25]`}>
            {title}
          </h4>
          <p className={`${s.subtitle} text-[12px] mt-1 font-medium`}>
            {subtitle}
          </p>
          {description && (
            <p className={`${s.subtitle} text-[14px] leading-[1.6] mt-3`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Numbered step card untuk tutorial integration.
 */
export function IntegrationStep({
  n,
  title,
  children,
  highlight,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  const wrapperCls = highlight
    ? "bg-[#304801] text-pure-white border-[#304801]"
    : "bg-pearl text-washed-black border-washed-black/5";
  const numberCls = highlight
    ? "bg-[#ffba09] text-washed-black"
    : "bg-washed-black text-[#ffba09]";
  const titleCls = highlight ? "text-pure-white" : "text-washed-black";
  const bodyCls = highlight ? "text-pure-white/85" : "text-dim-grey";

  return (
    <div
      className={`flex gap-4 items-start p-5 rounded-[24px] border ${wrapperCls}`}
    >
      <span
        className={`${numberCls} flex-shrink-0 w-8 h-8 rounded-full inline-flex items-center justify-center text-[13px] font-bold`}
      >
        {n}
      </span>
      <div className="flex-1 min-w-0 pt-1">
        <h5 className={`${titleCls} font-bold text-[15px] mb-1.5`}>{title}</h5>
        <div className={`${bodyCls} text-[14px] leading-[1.6]`}>{children}</div>
      </div>
    </div>
  );
}
