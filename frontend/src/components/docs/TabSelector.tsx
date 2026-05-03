"use client";

export function TabSelector({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-full bg-beige border border-washed-black/10">
      {tabs.map((tab) => {
        const active = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`px-4 py-2 rounded-full text-[13px] font-bold transition cursor-pointer ${
              active
                ? "bg-washed-black text-pure-white"
                : "text-washed-black hover:bg-washed-black/5"
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
