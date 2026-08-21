import fs from "fs";
import path from "path";
import Image from "next/image";
import { notFound } from "next/navigation";
import { beforeAfterGalleries } from "@/lib/data/beforeAfterGalleries";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function generateStaticParams() {
  return beforeAfterGalleries.map((gallery) => ({ gallery: gallery.slug }));
}

function getGalleryImages(slug: string) {
  const galleryPath = path.join(process.cwd(), "public", "images", "before-and-afters", "galleries", slug);

  if (!fs.existsSync(galleryPath)) {
    return [];
  }

  return fs
    .readdirSync(galleryPath)
    .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({
      file,
      src: `/images/before-and-afters/galleries/${slug}/${encodeURIComponent(file)}`
    }));
}

export default async function BeforeAfterGalleryPreviewPage({
  params
}: {
  params: Promise<{ gallery: string }>;
}) {
  const { gallery: gallerySlug } = await params;
  const gallery = beforeAfterGalleries.find((item) => item.slug === gallerySlug);

  if (!gallery) {
    notFound();
  }

  const images = getGalleryImages(gallery.slug);

  return (
    <main className="before-after-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="before-after-hero grid [place-items:center] min-h-[306px] [background:linear-gradient(rgba(0,0,0,0.66),rgba(0,0,0,0.66)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.09),transparent_15%),radial-gradient(circle_at_58%_30%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_78%_70%,rgba(255,255,255,0.06),transparent_18%),repeating-linear-gradient(26deg,rgba(255,255,255,0.035)_0_2px,transparent_2px_9px),linear-gradient(135deg,#262626,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[#d49d19] [&_h1]:text-[length:clamp(42px,3.2vw,54px)] [&_h1]:leading-[1] [&_h1]:font-thin max-[720px]:min-h-[210px]">
        <h1><TypewriterText text="gallery" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="before-after-preview-content pt-[82px] pb-[118px] px-[24px] max-[720px]:pt-[54px] max-[720px]:pb-[78px] max-[720px]:px-[16px]" aria-labelledby="before-after-preview-title">
        <div className="before-after-preview-scroll w-[min(1100px,100%)] my-0 mx-auto [&_h2]:w-[fit-content] [&_h2]:mt-0 [&_h2]:mb-[42px] [&_h2]:mx-auto [&_h2]:text-[#050505] [&_h2]:text-[length:18px] [&_h2]:leading-[1.2] [&_h2]:font-extrabold [&_h2]:capitalize max-[720px]:[&_h2]:mb-[30px] max-[720px]:[&_h2]:text-center max-[720px]:[&_h2]:text-[length:17px]">
          <h2 id="before-after-preview-title">{gallery.previewTitle}</h2>

          <div className="before-after-preview-grid grid grid-cols-[repeat(3,minmax(240px,1fr))] gap-[32px] max-[1050px]:grid-cols-[repeat(2,minmax(260px,1fr))] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[24px]">
            {images.map((image, index) => (
              <article className="before-after-preview-card min-w-[0] [&_a]:block [&_a]:p-[22px] [&_a]:[border:1px_solid_#e4e4e4] [&_a]:rounded-[8px] [&_a]:bg-[#fff] [&_a]:shadow-[0_14px_28px_rgba(0,0,0,0.1)] [&_a]:[transition:border-color_180ms_ease,box-shadow_180ms_ease,transform_180ms_ease] [&_a:hover]:border-[color:#d49d19] [&_a:hover]:shadow-[0_18px_34px_rgba(0,0,0,0.14)] [&_a:hover]:[transform:translateY(-3px)] [&_a:focus-visible]:border-[color:#d49d19] [&_a:focus-visible]:shadow-[0_18px_34px_rgba(0,0,0,0.14)] [&_a:focus-visible]:[transform:translateY(-3px)] [&_img]:block [&_img]:w-full [&_img]:aspect-[4_/_3] [&_img]:h-auto [&_img]:object-contain [&_img]:bg-[#f8f8f8] max-[720px]:[&_a]:p-[14px]" key={image.file}>
                <a href={image.src} target="_blank" rel="noreferrer" aria-label={`Open ${gallery.previewTitle} before and after image ${index + 1}`}>
                  <Image src={image.src} alt={`${gallery.previewTitle} before and after ${index + 1}`} width={520} height={390} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter variant="before-after-footer" />
    </main>
  );
}
