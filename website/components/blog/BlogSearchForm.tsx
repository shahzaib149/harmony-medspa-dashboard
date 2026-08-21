"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useId, useState } from "react";

const searchClassName = "about-search relative flex items-center h-[56px] mb-[12px] py-0 pr-[20px] pl-[24px] [border:1px_solid_#c8d2dd] rounded-[8px] text-[var(--gold)] bg-[#fff] [&_input]:min-w-[0] [&_input]:flex-1 [&_input]:border-0 [&_input]:[outline:0] [&_input]:text-[#344356] [&_input]:bg-[transparent] [&_input]:[font:inherit] [&_input::placeholder]:text-[#425263] [&_input::placeholder]:opacity-[0.9] max-[1050px]:col-[1_/_-1]";

type SearchResult = {
  title: string;
  href: string;
};

export default function BlogSearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => setValue(defaultValue), [defaultValue]);

  useEffect(() => {
    const query = value.trim();
    if (!query) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/blogs/search?search=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as { results?: SearchResult[] };
        if (!response.ok) throw new Error("Blog search failed.");
        setResults(body.results || []);
        setOpen(true);
        setActiveIndex(-1);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
        setOpen(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [value]);

  function submitSearch() {
    const query = value.trim();
    setOpen(false);
    router.push(query ? `/blog?search=${encodeURIComponent(query)}` : "/blog");
  }

  return (
    <form
      action="/blog"
      method="get"
      role="search"
      className={searchClassName}
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label className="contents">
        <span className="sr-only">Search blog articles</span>
        <input
          name="search"
          type="search"
          value={value}
          placeholder="Enter search keyword"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          onFocus={() => { if (value.trim()) setOpen(true); }}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && results.length) {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) => current >= results.length - 1 ? 0 : current + 1);
            } else if (event.key === "ArrowUp" && results.length) {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) => current <= 0 ? results.length - 1 : current - 1);
            } else if (event.key === "Enter" && open && activeIndex >= 0 && results[activeIndex]) {
              event.preventDefault();
              setOpen(false);
              router.push(results[activeIndex].href);
            } else if (event.key === "Escape") {
              setOpen(false);
              setActiveIndex(-1);
            }
          }}
        />
      </label>
      <button type="submit" aria-label="Search blog articles" className="grid shrink-0 place-items-center border-0 bg-transparent p-0 text-[var(--gold)]">
        <Search size={18} />
      </button>

      {open ? (
        <div id={listId} role="listbox" aria-label="Matching blog articles" className="absolute top-[calc(100%+8px)] right-0 left-0 z-[60] max-h-[360px] overflow-y-auto rounded-[8px] border border-[#d8dee5] bg-white py-[6px] text-left shadow-[0_16px_38px_rgba(31,42,55,0.18)]">
          {loading ? <p className="m-0 px-[16px] py-[12px] text-[14px] text-[#5f6b79]">Searching…</p> : null}
          {!loading && results.length === 0 ? <p className="m-0 px-[16px] py-[12px] text-[14px] text-[#5f6b79]">No matching articles</p> : null}
          {!loading ? results.map((result, index) => (
            <Link
              id={`${listId}-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              key={result.href}
              href={result.href}
              className="block border-0 border-b border-solid border-[#edf0f3] px-[16px] py-[11px] text-[15px] leading-[1.35] text-[#344356] last:border-b-0 hover:bg-[#fff8e8] focus:bg-[#fff8e8] focus:outline-none aria-selected:bg-[#fff8e8]"
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => setOpen(false)}
            >
              {result.title}
            </Link>
          )) : null}
        </div>
      ) : null}
    </form>
  );
}
