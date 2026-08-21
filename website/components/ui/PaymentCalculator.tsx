"use client";

import { useMemo, useState } from "react";

const careCreditCalculatorBaseUrl = "https://www.carecredit.com/payment_calculator/template.html";

export default function PaymentCalculator() {
  const [amount, setAmount] = useState<string | null>(null);

  const calculatorUrl = useMemo(() => {
    const cleanAmount = amount?.replace(/[^\d.]/g, "") ?? "";
    const url = new URL(careCreditCalculatorBaseUrl);

    url.searchParams.set("amount", cleanAmount || "null");
    url.searchParams.set("keys", "");
    url.searchParams.set("plate", "GFF238");

    return url.toString();
  }, [amount]);

  return (
    <div className="payment-calculator-card w-[min(416px,100%)] overflow-hidden [border:1px_solid_#d8d8d8] rounded-[4px] bg-[#fff] shadow-[0_2px_4px_rgba(0,0,0,0.18)]">
      <div className="payment-calculator-head flex items-center justify-between min-h-[63px] py-0 px-[24px] text-[#fff] [background:linear-gradient(rgba(28,133,114,0.86),rgba(28,133,114,0.86)),url('/images/about-us/Img_3.jpg')_center_34%_/_cover] [&_span]:text-[length:28px] [&_span]:leading-[1] [&_span]:font-normal [&_strong]:text-[length:18px] [&_strong]:font-extrabold">
        <span>Payment Calculator</span>
        <strong>CareCredit</strong>
      </div>
      <div className="payment-calculator-body grid grid-cols-[minmax(0,1fr)_128px] [align-items:end] gap-[16px] pt-[29px] pb-[13px] px-[24px] [&_small]:block [&_small]:text-[#4b4b4b] [&_small]:text-[length:12px] [&_small]:leading-[1.15] [&_small]:font-extrabold [&_small]:tracking-[0.12em] [&_span]:block [&_span]:pb-[6px] [&_span]:[border-bottom:2px_solid_#c8c8c8] [&_span]:text-[#777] [&_span]:text-[length:24px] [&_span]:leading-[1.2] [&_a]:grid [&_a]:[place-items:center] [&_a]:min-h-[48px] [&_a]:rounded-[9px] [&_a]:bg-[#65a53c] [&_a]:text-[#fff] [&_a]:text-[length:18px] [&_a]:font-extrabold max-[720px]:grid-cols-[1fr] max-[720px]:items-stretch">
        <label>
          <small>ESTIMATED PROCEDURE AMOUNT</small>
          <span className="payment-amount-input-wrap">
            <span aria-hidden="true">$</span>
            <input
              aria-label="Estimated procedure amount"
              inputMode="decimal"
              value={amount ?? ""}
              onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
            />
          </span>
        </label>
        <a href={calculatorUrl} target="_blank" rel="noreferrer">
          Calculate
        </a>
      </div>
    </div>
  );
}
