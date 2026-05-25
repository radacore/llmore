"use client";

import { usePlans, type Plan } from "@/hooks/useBilling";
import { formatCurrency, formatNumber } from "@/lib/utils";

function getPlanFeatures(plan: Plan): string[] {
  return plan.features ?? [];
}

export function LandingPricing() {
  const { data: plans, isLoading } = usePlans();
  const activePlans = plans?.filter((plan) => plan.is_active) ?? [];

  return (
    <section id="harga" className="bg-pearl py-[60px] md:py-[96px]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div data-reveal className="max-w-2xl mb-12">
          <p className="text-[11px] font-medium text-royal-blue uppercase tracking-[0.2em] mb-4">
            Harga
          </p>
          <h2 className="text-washed-black font-bold text-[32px] sm:text-[40px] md:text-[48px] leading-[1.1]">
            Sederhana & transparan. Pilih sesuai kebutuhan.
          </h2>
        </div>

        {isLoading ? (
          <div data-reveal className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {["basic", "pro", "advance"].map((slug) => (
              <div
                key={slug}
                className="h-[520px] rounded-[24px] border-2 border-washed-black/10 bg-pure-white p-6 md:p-8"
              >
                <div className="h-4 w-20 rounded-full bg-pearl" />
                <div className="mt-5 h-8 w-32 rounded-full bg-pearl" />
                <div className="mt-8 h-20 rounded-[24px] bg-pearl" />
                <div className="mt-8 space-y-3">
                  <div className="h-4 rounded-full bg-pearl" />
                  <div className="h-4 rounded-full bg-pearl" />
                  <div className="h-4 w-3/4 rounded-full bg-pearl" />
                </div>
              </div>
            ))}
          </div>
        ) : activePlans.length > 0 ? (
          <div data-reveal className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {activePlans.map((plan) => {
              const isPopular = plan.slug === "pro";

              return (
                <article
                  key={plan.slug}
                  className={`relative flex h-full flex-col overflow-hidden rounded-[24px] border-2 bg-pure-white p-6 transition duration-200 hover:-translate-y-1 hover:border-royal-blue hover:bg-pure-white md:p-8 ${
                    isPopular ? "border-royal-blue" : "border-washed-black/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-royal-blue">
                        Paket
                      </p>
                      <h3 className="mt-3 text-[28px] font-bold leading-none text-washed-black">
                        {plan.name}
                      </h3>
                    </div>
                    {isPopular && (
                      <span className="rounded-full bg-royal-blue px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-pure-white">
                        Populer
                      </span>
                    )}
                  </div>

                  <p className="mt-5 text-[14px] leading-[1.6] text-dim-grey">
                    {plan.description}
                  </p>

                  <div className="mt-8">
                    <p className="text-[40px] font-bold leading-none tracking-tight text-washed-black">
                      {formatCurrency(plan.price)}
                    </p>
                    <p className="mt-2 text-[14px] font-medium text-dim-grey">
                      per bulan
                    </p>
                  </div>

                  <div className="mt-8 grid gap-3 rounded-[24px] bg-pearl p-4">
                    <div className="flex items-center justify-between gap-4 border-b border-washed-black/10 pb-3">
                      <span className="text-[13px] font-medium text-dim-grey">
                        Token/bulan
                      </span>
                      <span className="text-[16px] font-bold text-royal-blue">
                        {formatNumber(plan.token_quota)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-washed-black/10 pb-3">
                      <span className="text-[13px] font-medium text-dim-grey">
                        Rate limit
                      </span>
                      <span className="text-right text-[14px] font-bold text-washed-black">
                        {plan.rate_limit_per_minute} request/menit
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[13px] font-medium text-dim-grey">
                        API key
                      </span>
                      <span className="text-right text-[14px] font-bold text-washed-black">
                        {plan.max_api_keys} API key
                      </span>
                    </div>
                  </div>

                  {getPlanFeatures(plan).length > 0 && (
                    <ul className="mt-8 space-y-3">
                      {getPlanFeatures(plan).map((feature) => (
                        <li
                          key={feature}
                          className="flex gap-3 text-[14px] leading-[1.6] text-washed-black"
                        >
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-energy-gold" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div
            data-reveal
            className="rounded-[24px] border-2 border-washed-black/10 bg-pure-white p-8 text-center"
          >
            <p className="text-[18px] font-bold text-washed-black">
              Belum ada paket aktif.
            </p>
            <p className="mt-2 text-[14px] text-dim-grey">
              Paket yang dinonaktifkan dari admin tidak akan tampil di landing.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
