import type { ReactNode } from "react";

/**
 * Inline code: chip kecil dengan background Beige & accent Royal Blue.
 */
export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="bg-beige text-[#1009f6] px-1.5 py-0.5 rounded-[4.375px] text-[0.875em] font-mono border border-silver-mist/40">
      {children}
    </code>
  );
}

/**
 * Section heading: judul besar Contractbook-style — bold, washed black,
 * dengan underline tipis Energy Gold.
 */
export function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="pt-12 mb-8 scroll-mt-24" id={id}>
      <h2 className="text-[32px] md:text-[40px] font-bold text-washed-black leading-[1.1] tracking-tight">
        {children}
      </h2>
      <span
        aria-hidden
        className="inline-block mt-4 h-1.5 w-16 rounded-full bg-[#ffba09]"
      />
    </div>
  );
}

/**
 * Parameter row untuk tabel parameter API.
 * Required di-highlight dengan badge Royal Blue, optional dengan dim grey.
 */
export function ParamRow({
  name,
  type,
  required,
  description,
}: {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}) {
  return (
    <tr className="border-b border-silver-mist/30">
      <td className="py-3 pr-4 align-top">
        <code className="bg-beige text-washed-black px-2 py-0.5 rounded-[4.375px] text-[13px] font-mono border border-silver-mist/40">
          {name}
        </code>
      </td>
      <td className="py-3 pr-4 align-top text-[12px] text-dim-grey font-mono">
        {type}
      </td>
      <td className="py-3 pr-4 align-top">
        {required ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1009f6] text-pure-white">
            required
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-beige text-dim-grey">
            optional
          </span>
        )}
      </td>
      <td className="py-3 text-[14px] text-washed-black leading-[1.5]">
        {description}
      </td>
    </tr>
  );
}
