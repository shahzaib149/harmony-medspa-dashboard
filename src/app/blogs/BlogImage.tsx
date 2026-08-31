"use client";

import { useEffect, useState } from "react";
import { imageSourceForSite } from "@/lib/blogs/types";

export default function BlogImage({
  url,
  alt,
  className,
}: {
  url: string;
  alt: string;
  className?: string;
}) {
  const source = imageSourceForSite(url);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [source]);

  if (failed) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-left text-xs leading-5 text-red-800" role="alert">
        <strong className="block">Image could not be loaded.</strong>
        <span className="block">Keep the image block and fix or deploy this URL before publishing.</span>
        <code className="mt-2 block break-all text-[10px]">{url}</code>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={source} alt={alt} onError={() => setFailed(true)} />
  );
}
