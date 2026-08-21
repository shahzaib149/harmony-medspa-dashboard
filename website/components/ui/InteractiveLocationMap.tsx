"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GOOGLE_MAPS_LOCATION_URL } from "@/lib/constants";

type InteractiveLocationMapProps = {
  variant: "home" | "contact";
};

type StreetLabel = {
  name: string;
  className: string;
};

const streetLabels: StreetLabel[] = [
  { name: "Vascaro Dr", className: "left-[47%] top-[2%] [transform:rotate(58deg)]" },
  { name: "Stickney Point Rd", className: "left-[38%] top-[18%] [transform:rotate(-48deg)]" },
  { name: "Terry Ln", className: "left-[50%] top-[14%] [transform:rotate(-48deg)]" },
  { name: "Gateway Ave", className: "left-[57%] top-[45%] [transform:rotate(90deg)]" },
  { name: "Rodgers Ave", className: "left-[64%] top-[14%] [transform:rotate(90deg)]" },
  { name: "Carlton Ave", className: "left-[70%] top-[12%] [transform:rotate(90deg)]" },
  { name: "Gulf Gate Dr", className: "left-[31%] top-[55%]" },
  { name: "Gulf Gate Dr", className: "left-[67%] top-[56%]" },
  { name: "Mall Dr", className: "left-[51%] top-[37%]" },
  { name: "Terry Ln", className: "left-[49%] top-[30%]" },
  { name: "Couper Dr", className: "left-[7%] top-[29%]" },
  { name: "Southwinds Dr", className: "left-[18%] top-[9%]" },
  { name: "Southwinds Dr", className: "left-[19%] top-[13%]" },
  { name: "Concord St", className: "left-[88%] top-[8%]" },
  { name: "Valley Forge St", className: "left-[88%] top-[14%]" },
  { name: "Mayflower St", className: "left-[88%] top-[20%]" },
  { name: "Seaspray St", className: "left-[88%] top-[25%]" },
  { name: "White Sands Dr", className: "left-[80%] top-[39%]" },
  { name: "Clipper Ship Way", className: "left-[78%] top-[47%]" },
  { name: "Colonial Dr", className: "left-[76%] top-[39%] [transform:rotate(90deg)]" },
  { name: "Seagate Ave", className: "left-[96%] top-[31%] [transform:rotate(90deg)]" },
  { name: "Gulf Gate Pl", className: "left-[67%] top-[49%] [transform:rotate(90deg)]" },
  { name: "Sun Home St", className: "left-[50%] top-[62%]" },
  { name: "Champion St", className: "left-[51%] top-[65%]" },
  { name: "N Mobile Estates Dr", className: "left-[51%] top-[68%]" },
  { name: "S Mobile Estates Dr", className: "left-[52%] top-[71%]" },
  { name: "Detroit St", className: "left-[58%] top-[74%]" },
  { name: "Glenwood Dr", className: "left-[61%] top-[77%]" },
  { name: "Trotwood Dr", className: "left-[61%] top-[80%]" },
  { name: "Reynolds St", className: "left-[48%] top-[79%]" },
  { name: "S Tamiami Trl", className: "left-[42%] top-[82%] [transform:rotate(58deg)]" },
  { name: "Baywood Dr", className: "left-[29%] top-[77%] [transform:rotate(-42deg)]" },
  { name: "Bispham Rd", className: "left-[54%] top-[88%]" },
  { name: "Bispham Rd", className: "left-[76%] top-[88%]" },
  { name: "Crestwood Dr", className: "left-[78%] top-[81%] [transform:rotate(58deg)]" },
  { name: "1st St", className: "left-[40%] top-[90%]" },
  { name: "2nd St", className: "left-[40%] top-[93%]" },
  { name: "3rd St", className: "left-[40%] top-[96%]" },
  { name: "4th St", className: "left-[40%] top-[99%]" },
  { name: "Avenue A", className: "left-[31%] top-[83%] [transform:rotate(60deg)]" },
  { name: "Avenue B", className: "left-[7%] top-[76%] [transform:rotate(60deg)]" },
  { name: "Avenue C", className: "left-[6%] top-[85%] [transform:rotate(60deg)]" }
];

export default function InteractiveLocationMap({ variant }: InteractiveLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ pointerId: 0, x: 0, y: 0, offsetX: 0, offsetY: 0, moved: false });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const isHome = variant === "home";
  const outerClass = isHome
    ? "map-panel relative block overflow-hidden text-[inherit] bg-[#303030] cursor-grab active:cursor-grabbing touch-none select-none focus-visible:[outline:2px_solid_var(--gold)] focus-visible:[outline-offset:-6px] max-[720px]:min-h-[360px]"
    : "contact-map-card relative block overflow-hidden bg-[#303030] cursor-grab active:cursor-grabbing touch-none select-none focus-visible:[outline:2px_solid_var(--gold)] focus-visible:[outline-offset:-6px]";

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const direction = event.deltaY < 0 ? 1 : -1;
      setScale((current) => Math.min(2.8, Math.max(0.78, current + direction * 0.16)));
    };

    mapElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => mapElement.removeEventListener("wheel", handleWheel);
  }, []);

  const openLocation = () => {
    window.open(GOOGLE_MAPS_LOCATION_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      ref={mapRef}
      className={outerClass}
      role="link"
      tabIndex={0}
      aria-label="Illustrated Harmony Med Spa location map. Hold Control and scroll to zoom the map. Drag to move the map."
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsDragging(true);
        dragStart.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          offsetX: offset.x,
          offsetY: offset.y,
          moved: false
        };
      }}
      onPointerMove={(event) => {
        if (!isDragging || dragStart.current.pointerId !== event.pointerId) {
          return;
        }

        const movementX = event.clientX - dragStart.current.x;
        const movementY = event.clientY - dragStart.current.y;
        dragStart.current.moved = dragStart.current.moved || Math.abs(movementX) > 3 || Math.abs(movementY) > 3;
        setOffset({
          x: dragStart.current.offsetX + movementX,
          y: dragStart.current.offsetY + movementY
        });
      }}
      onPointerUp={(event) => {
        if (dragStart.current.pointerId === event.pointerId && !dragStart.current.moved) {
          openLocation();
        }

        setIsDragging(false);
      }}
      onPointerCancel={() => setIsDragging(false)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLocation();
        }
      }}
    >
      <div
        className="absolute inset-[-18%] bg-[#353535]"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
          transformOrigin: "center",
          transition: isDragging ? "none" : "transform 120ms ease"
        }}
      >
        <div className="absolute inset-0 opacity-[0.5] [background:linear-gradient(90deg,transparent_0_7%,#1f1f1f_7%_7.6%,transparent_7.6%_100%),linear-gradient(90deg,transparent_0_28%,#202020_28%_28.7%,transparent_28.7%_100%),linear-gradient(90deg,transparent_0_55%,#202020_55%_55.7%,transparent_55.7%_100%),linear-gradient(90deg,transparent_0_68%,#202020_68%_68.7%,transparent_68.7%_100%),linear-gradient(90deg,transparent_0_74%,#202020_74%_74.7%,transparent_74.7%_100%),linear-gradient(90deg,transparent_0_91%,#202020_91%_91.7%,transparent_91.7%_100%),linear-gradient(0deg,transparent_0_10%,#202020_10%_10.8%,transparent_10.8%_100%),linear-gradient(0deg,transparent_0_22%,#202020_22%_22.8%,transparent_22.8%_100%),linear-gradient(0deg,transparent_0_36%,#202020_36%_36.9%,transparent_36.9%_100%),linear-gradient(0deg,transparent_0_54%,#202020_54%_55.1%,transparent_55.1%_100%),linear-gradient(0deg,transparent_0_63%,#202020_63%_63.9%,transparent_63.9%_100%),linear-gradient(0deg,transparent_0_74%,#202020_74%_74.8%,transparent_74.8%_100%),linear-gradient(0deg,transparent_0_88%,#202020_88%_88.8%,transparent_88.8%_100%)]" />
        <div className="absolute left-[-12%] top-[40%] h-[18px] w-[72%] bg-[#1f1f1f] opacity-[0.64] [transform:rotate(-45deg)]" />
        <div className="absolute left-[30%] top-[3%] h-[14px] w-[52%] bg-[#202020] opacity-[0.6] [transform:rotate(52deg)]" />
        <div className="absolute left-[21%] top-[55%] h-[15px] w-[70%] bg-[#202020] opacity-[0.62] [transform:rotate(1deg)]" />
        <div className="absolute left-[31%] top-[60%] h-[10px] w-[34%] bg-[#202020] opacity-[0.54] [transform:rotate(0deg)]" />
        <div className="absolute left-[35%] top-[68%] h-[10px] w-[30%] bg-[#202020] opacity-[0.5] [transform:rotate(0deg)]" />
        <div className="absolute left-[72%] top-[48%] h-[12px] w-[30%] bg-[#202020] opacity-[0.55] [transform:rotate(20deg)]" />
        <div className="absolute left-[0%] top-[74%] h-[10px] w-[25%] bg-[#202020] opacity-[0.48] [transform:rotate(58deg)]" />
        <div className="absolute left-[26%] top-[76%] h-[12px] w-[28%] bg-[#202020] opacity-[0.55] [transform:rotate(-43deg)]" />
        <div className="absolute left-[76%] top-[80%] h-[10px] w-[26%] bg-[#202020] opacity-[0.48] [transform:rotate(55deg)]" />

        <div className="absolute left-[46%] top-[20%] h-[10%] w-[12%] rounded-[44%] bg-[#3f3f3f] opacity-[0.72]" />
        <div className="absolute left-[7%] top-[6%] h-[7%] w-[24%] rounded-[10px] bg-[#3f3f3f] opacity-[0.5]" />
        <div className="absolute left-[37%] top-[94%] h-[6%] w-[17%] rounded-[10px] bg-[#3f3f3f] opacity-[0.48]" />

        {streetLabels.map((label) => (
          <span
            className={`absolute z-[1] text-[length:13px] leading-none font-bold text-[rgba(255,255,255,0.2)] [text-shadow:0_1px_1px_rgba(0,0,0,0.42)] whitespace-nowrap ${label.className}`}
            key={`${label.name}-${label.className}`}
          >
            {label.name}
          </span>
        ))}

        <div className="absolute left-[50.5%] top-[49.5%] z-[2] text-[#e5b631] [transform:translate(-50%,-50%)] [filter:drop-shadow(0_3px_4px_rgba(0,0,0,0.5))]">
          <MapPin size={isHome ? 74 : 58} fill="currentColor" />
          <span className="absolute left-[50%] top-[38%] grid h-[28px] w-[28px] [transform:translate(-50%,-50%)] [place-items:center] rounded-full border border-[#2c2c2c] bg-[#e5b631] text-[#272727] [font-family:Georgia,serif] text-[length:20px] italic font-bold">H</span>
        </div>
      </div>

      <div className="absolute inset-0 bg-[rgba(0,0,0,0.18)] pointer-events-none" />
      <span className="absolute left-[5px] bottom-[5px] z-[3] text-[#f2f2f2] text-[length:18px] leading-none [font-family:Arial,sans-serif] [text-shadow:0_1px_2px_#000] pointer-events-none">Google</span>
      <div className="absolute right-0 bottom-0 z-[3] flex text-[length:10px] leading-none text-[#222] pointer-events-none [&_span]:bg-[#e6e6e6] [&_span]:px-[6px] [&_span]:py-[4px] [&_span]:border-l [&_span]:border-[#c6c6c6]">
        <span>Keyboard shortcuts</span>
        <span>Map data ©2026 Google</span>
        <span>Terms</span>
        <span>Report a map error</span>
      </div>
    </div>
  );
}
