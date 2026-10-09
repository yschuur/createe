const GOOGLE_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853", "#EA4335"];

function GoogleWordmark() {
  return <span aria-hidden className="flex text-[14px] font-medium leading-none tracking-tight sm:text-[20px]" style={{ fontFamily: "'Fraunces', serif" }}>
    {"Google".split("").map((letter, i) => <span key={i} style={{ color: GOOGLE_COLORS[i] }}>{letter}</span>)}
  </span>;
}

function TrustpilotWordmark() {
  return <span aria-hidden className="text-[13px] font-bold leading-none tracking-tight text-[#191919] sm:text-[19px]" style={{ fontFamily: "'Fraunces', serif" }}>Trustpilot</span>;
}

function GoogleStars() {
  return <span aria-hidden className="flex gap-[2px] sm:gap-[3px]">
    {Array.from({ length: 5 }, (_, i) => (
      <svg key={i} className="size-[11px] sm:size-[17px]" viewBox="0 0 24 24" fill="#FBBC04"><path d="M12 2l2.94 6.26 6.88.6-5.22 4.55 1.56 6.74L12 16.9l-6.16 3.21 1.56-6.74L2.18 8.86l6.88-.6L12 2z" /></svg>
    ))}
  </span>;
}

function TrustpilotStars() {
  const star = "M12 3.4l2.5 5.6 6.1.6-4.6 4.1 1.3 6-5.3-3.1-5.3 3.1 1.3-6-4.6-4.1 6.1-.6L12 3.4z";
  const cell = (fill: string) => (
    <svg key={fill} className="size-[11px] sm:size-[17px]" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="2" fill={fill === "half" ? "#DCDCE6" : "#00B67A"} />
      {fill !== "empty" && (
        <g clipPath={fill === "half" ? "url(#tp-half)" : undefined}>
          <path d={star} fill="#fff" />
          {fill === "half" && <rect width="12" height="24" fill="#00B67A" />}
        </g>
      )}
    </svg>
  );
  return <span aria-hidden className="flex gap-[2px] sm:gap-[3px]">
    <svg width="0" height="0" className="absolute"><clipPath id="tp-half"><rect width="12" height="24" /></clipPath></svg>
    {[0, 1, 2, 3].map((i) => <span key={i}>{cell("full")}</span>)}
    {cell("half")}
  </span>;
}

export function RatingsBar({ googleLabel, trustLabel, trustUrl, googleUrl }: { googleLabel: string; trustLabel: string; trustUrl?: string; googleUrl?: string }) {
  const block = "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-white px-2.5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-black/5 sm:flex-none sm:gap-3 sm:px-6 sm:py-3";
  return (
    <div data-section="home-ratings" className="flex flex-nowrap items-stretch justify-center gap-2 bg-shop-surface px-3 py-3 sm:gap-5 sm:px-4 sm:py-4">
      <a href={googleUrl || undefined} target="_blank" rel="noreferrer" className={`${block} transition hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)]`}>
        <GoogleWordmark />
        <GoogleStars />
        <span className="sr-only">{googleLabel}</span>
      </a>
      <a href={trustUrl || undefined} target="_blank" rel="noreferrer" className={`${block} transition hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)]`}>
        <TrustpilotWordmark />
        <TrustpilotStars />
        <span className="sr-only">{trustLabel}</span>
      </a>
    </div>
  );
}
