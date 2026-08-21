"use client";

import { useState } from "react";

type Faq = {
  question: string;
  answer: string;
};

type FaqCategory = {
  category: string;
  faqs: Faq[];
};

type IvFaqAccordionProps = {
  categories: FaqCategory[];
};

function cleanText(value: string) {
  return value.replace(/\u00e2\u20ac\u201c/g, "-");
}

export default function IvFaqAccordion({ categories }: IvFaqAccordionProps) {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  return (
    <div className="grid gap-[24px]">
      {categories.map((category) => (
        <section key={category.category}>
          <h2 className="mt-0 mb-[18px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]">
            {category.category}
          </h2>

          <div className="bg-[#f7f7f7] shadow-[0_26px_58px_rgba(0,0,0,0.08)]">
            {category.faqs.map((faq) => {
              const isOpen = openQuestion === faq.question;

              return (
                <div className="border-t border-[#d9d9d9] first:border-t-0" key={faq.question}>
                  <button
                    className={`flex w-full items-center justify-between gap-[24px] px-[36px] py-[28px] text-left text-[length:19px] leading-[1.35] font-normal [border:0] bg-[transparent] cursor-pointer max-[720px]:px-[20px] max-[720px]:py-[22px] max-[720px]:text-[length:17px] ${
                      isOpen ? "text-[#ebb35a] bg-[#fff]" : "text-[#132235]"
                    }`}
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenQuestion(isOpen ? null : faq.question)}
                  >
                    <span>{faq.question}</span>
                    <span className={`shrink-0 text-[length:38px] leading-[1] font-bold ${isOpen ? "text-[#ebb35a]" : "text-[#24364d]"}`}>
                      {isOpen ? "-" : "+"}
                    </span>
                  </button>

                  <div
                    className={`grid bg-[#fff] transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                    aria-hidden={!isOpen}
                  >
                    <div className="overflow-hidden">
                      <div className="px-[36px] pt-[10px] pb-[34px] text-[#132235] text-[length:19px] leading-[1.85] max-[720px]:px-[20px] max-[720px]:text-[length:17px]">
                        {cleanText(faq.answer)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
