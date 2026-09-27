import { services } from "@/lib/content";
import type { Locale } from "@/i18n/pathnames";

/**
 * The tagline, drawn: two outlined containers, "yours" and "ours", filled to
 * one shared fill line. The fill rises once when the page opens (CSS, behind
 * prefers-reduced-motion); the drawing is the brand's one graphic device, not
 * a photo (§1). Captions are the two services' names and where each runs,
 * from content/services.json.
 */
const BODY =
  "M40 80Q40 60 60 60H90V26H150V60H180Q200 60 200 80V292Q200 312 180 312H60Q40 312 40 292Z";
const LINE_Y = 134;

function Container({ id, x, late }: { id: string; x: number; late?: boolean }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <clipPath id={id}>
        <path d={BODY} />
      </clipPath>
      <path d={BODY} fill="var(--vkc-label)" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <rect
        className={`gauge-fill${late ? " gauge-fill-late" : ""}`}
        clipPath={`url(#${id})`}
        x="40"
        y={LINE_Y}
        width="160"
        height={312 - LINE_Y}
        fill="currentColor"
        style={{ transformBox: "fill-box" }}
      />
      {/* The cap, printed over the fill. */}
      <path d="M82 26H158V14H82Z" fill="var(--vkc-label)" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      {/* The fill mark moulded beside the body: the site's tick. */}
      <path d={`M6 ${LINE_Y}H34`} stroke="currentColor" strokeWidth="5" strokeLinecap="butt" />
    </g>
  );
}

export function HeroGauge({ locale, label }: { locale: Locale; label: string }) {
  const ss = services.secondShift;
  const bn = services.bottleneck;
  return (
    <figure className="w-full max-w-[34rem]">
      <svg viewBox="0 0 480 320" role="img" aria-label={label} className="block w-full text-ink">
        {/* One line for both containers: the hairline the tick sits on. */}
        <path d={`M0 ${LINE_Y}H480`} stroke="var(--vkc-hairline)" strokeWidth="1.5" />
        <Container id="gauge-yours" x={0} />
        <Container id="gauge-ours" x={240} late />
      </svg>
      <figcaption className="mt-3 grid grid-cols-2 gap-4">
        <div className="pl-[8%]">
          <p className="field-name">{ss.where[locale]}</p>
          <p className="font-bold leading-tight">{ss.name[locale]}</p>
        </div>
        <div className="pl-[8%]">
          <p className="field-name">{bn.where[locale]}</p>
          <p className="font-bold leading-tight">{bn.name[locale]}</p>
        </div>
      </figcaption>
    </figure>
  );
}
