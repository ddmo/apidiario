import { useEffect, useRef } from 'react';

type BeeAnimationProps = { className?: string };

const FLOWERS = [
  { x: 50, y: 133 },
  { x: 130, y: 120 },
  { x: 210, y: 138 },
  { x: 290, y: 123 },
  { x: 360, y: 138 },
] as const;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function BeeAnimation({ className }: BeeAnimationProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const svg = svgRef.current;
    if (!svg) return;

    if (reduced) {
      svg.setAttribute('data-reduced', 'true');
    }

    const bee = svg.querySelector<SVGGElement>('#ad-bee');
    if (!bee) return;

    let currentIdx = -1;
    let curX = 200;
    let curY = 60;

    const hop = (): void => {
      let nextIdx: number;
      do {
        nextIdx = Math.floor(Math.random() * FLOWERS.length);
      } while (nextIdx === currentIdx && FLOWERS.length > 1);
      currentIdx = nextIdx;

      const target = FLOWERS[nextIdx]!;
      const newDir: 1 | -1 = target.x >= curX ? 1 : -1;
      const midX = (curX + target.x) / 2;
      const peakY = Math.min(curY, target.y) - 55;
      const duration = 950 + Math.random() * 500;
      const startMs = performance.now();
      const fromX = curX;
      const fromY = curY;

      const frame = (now: number): void => {
        const elapsed = now - startMs;
        const p = Math.min(elapsed / duration, 1);
        const e = easeOutCubic(p);

        const x = (1 - e) * (1 - e) * fromX + 2 * (1 - e) * e * midX + e * e * target.x;
        const y = (1 - e) * (1 - e) * fromY + 2 * (1 - e) * e * peakY + e * e * target.y;

        bee.setAttribute('transform', `translate(${x}, ${y}) scale(${newDir}, 1)`);

        if (p < 1) {
          rafRef.current = requestAnimationFrame(frame);
        } else {
          curX = target.x;
          curY = target.y;
          timeoutRef.current = window.setTimeout(hop, 700 + Math.random() * 1500);
        }
      };

      rafRef.current = requestAnimationFrame(frame);
    };

    timeoutRef.current = window.setTimeout(hop, 700);

    return () => {
      if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current);
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className={className} aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <svg
        ref={svgRef}
        viewBox="0 0 400 260"
        width="100%"
        style={{ display: 'block', aspectRatio: '400/260' }}
        role="img"
      >
        <title>Animazione decorativa</title>

        {/* Polline fluttuante */}
        <g opacity="0.45" className="ad-pollen">
          <circle cx="60" cy="30" r="2" fill="#C7891A">
            <animate attributeName="cy" values="30;26;30" dur="3.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="280" cy="45" r="1.5" fill="#C7891A">
            <animate attributeName="cy" values="45;41;45" dur="3.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="180" cy="25" r="1.8" fill="#E5A938">
            <animate attributeName="cy" values="25;20;25" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="340" cy="18" r="1.4" fill="#E5A938">
            <animate attributeName="cy" values="18;14;18" dur="3.4s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Erba accennata */}
        <g stroke="#6E8347" strokeWidth="1" strokeLinecap="round" opacity="0.45">
          <line x1="10" y1="258" x2="14" y2="246" />
          <line x1="22" y1="258" x2="24" y2="248" />
          <line x1="78" y1="258" x2="82" y2="247" />
          <line x1="170" y1="258" x2="174" y2="248" />
          <line x1="240" y1="258" x2="244" y2="247" />
          <line x1="320" y1="258" x2="322" y2="249" />
          <line x1="380" y1="258" x2="384" y2="247" />
        </g>

        {/* F1: Margherita */}
        <g transform="translate(50, 150)">
          <g className="ad-sway ad-s1">
            <line x1="0" y1="0" x2="0" y2="110" stroke="#6E8347" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 0,48 Q -8,46 -10,50 Q -8,54 0,52" fill="#6E8347" />
            <g>
              <ellipse cx="0" cy="-9" rx="3.5" ry="8" fill="#EDE3CE" stroke="#C9B896" strokeWidth="0.4" />
              <ellipse cx="0" cy="-9" rx="3.5" ry="8" fill="#EDE3CE" stroke="#C9B896" strokeWidth="0.4" transform="rotate(45)" />
              <ellipse cx="0" cy="-9" rx="3.5" ry="8" fill="#EDE3CE" stroke="#C9B896" strokeWidth="0.4" transform="rotate(90)" />
              <ellipse cx="0" cy="-9" rx="3.5" ry="8" fill="#EDE3CE" stroke="#C9B896" strokeWidth="0.4" transform="rotate(135)" />
              <ellipse cx="0" cy="-9" rx="3.5" ry="8" fill="#EDE3CE" stroke="#C9B896" strokeWidth="0.4" transform="rotate(180)" />
              <ellipse cx="0" cy="-9" rx="3.5" ry="8" fill="#EDE3CE" stroke="#C9B896" strokeWidth="0.4" transform="rotate(225)" />
              <ellipse cx="0" cy="-9" rx="3.5" ry="8" fill="#EDE3CE" stroke="#C9B896" strokeWidth="0.4" transform="rotate(270)" />
              <ellipse cx="0" cy="-9" rx="3.5" ry="8" fill="#EDE3CE" stroke="#C9B896" strokeWidth="0.4" transform="rotate(315)" />
            </g>
            <circle cx="0" cy="0" r="4.5" fill="#C7891A" />
            <circle cx="-1" cy="-1" r="2" fill="#76500F" opacity="0.5" />
          </g>
        </g>

        {/* F2: Girasole */}
        <g transform="translate(130, 135)">
          <g className="ad-sway ad-s2">
            <line x1="0" y1="0" x2="0" y2="125" stroke="#6E8347" strokeWidth="2" strokeLinecap="round" />
            <path d="M 0,52 Q -10,49 -13,55 Q -10,60 0,57" fill="#6E8347" />
            <path d="M 0,84 Q 10,81 13,87 Q 10,92 0,89" fill="#6E8347" />
            <g>
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <path
                  key={deg}
                  d="M 0,-4 Q -3,-10 -1.5,-15 L 1.5,-15 Q 3,-10 0,-4 Z"
                  fill="#E5A938"
                  stroke="#A06D14"
                  strokeWidth="0.4"
                  transform={`rotate(${deg})`}
                />
              ))}
            </g>
            <circle cx="0" cy="0" r="6" fill="#3F311F" />
            <circle cx="-2" cy="-1" r="0.6" fill="#76500F" />
            <circle cx="2" cy="-2" r="0.6" fill="#76500F" />
            <circle cx="0" cy="2" r="0.6" fill="#76500F" />
            <circle cx="-3" cy="2" r="0.6" fill="#76500F" />
            <circle cx="3" cy="1" r="0.6" fill="#76500F" />
          </g>
        </g>

        {/* F3: Calendula doppia */}
        <g transform="translate(210, 155)">
          <g className="ad-sway ad-s3">
            <line x1="0" y1="0" x2="0" y2="105" stroke="#6E8347" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 0,47 Q 8,45 11,49 Q 8,53 0,51" fill="#6E8347" />
            <g>
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <ellipse
                  key={`outer-${deg}`}
                  cx="0" cy="-8" rx="3.5" ry="6.5"
                  fill="#F0C77A" stroke="#A06D14" strokeWidth="0.3"
                  transform={`rotate(${deg})`}
                />
              ))}
            </g>
            <g>
              {[30, 90, 150, 210, 270, 330].map((deg) => (
                <ellipse
                  key={`inner-${deg}`}
                  cx="0" cy="-5" rx="2.5" ry="4.5"
                  fill="#E5A938" stroke="#76500F" strokeWidth="0.3"
                  transform={`rotate(${deg})`}
                />
              ))}
            </g>
            <circle cx="0" cy="0" r="2.8" fill="#76500F" />
          </g>
        </g>

        {/* F4: Papavero */}
        <g transform="translate(290, 140)">
          <g className="ad-sway ad-s4">
            <line x1="0" y1="0" x2="0" y2="120" stroke="#6E8347" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 0,66 Q -8,64 -10,68 Q -8,72 0,70" fill="#6E8347" />
            <ellipse cx="-5" cy="-2" rx="6.5" ry="7" fill="#D4761F" stroke="#76500F" strokeWidth="0.4" />
            <ellipse cx="5" cy="-2" rx="6.5" ry="7" fill="#D4761F" stroke="#76500F" strokeWidth="0.4" />
            <ellipse cx="-3" cy="-8" rx="6" ry="6.5" fill="#D4761F" stroke="#76500F" strokeWidth="0.4" />
            <ellipse cx="3" cy="-8" rx="6" ry="6.5" fill="#D4761F" stroke="#76500F" strokeWidth="0.4" />
            <circle cx="0" cy="-4" r="2.5" fill="#2A2014" />
            <line x1="-2" y1="-6" x2="-3" y2="-10" stroke="#2A2014" strokeWidth="0.5" strokeLinecap="round" />
            <line x1="0" y1="-6.5" x2="0" y2="-11" stroke="#2A2014" strokeWidth="0.5" strokeLinecap="round" />
            <line x1="2" y1="-6" x2="3" y2="-10" stroke="#2A2014" strokeWidth="0.5" strokeLinecap="round" />
          </g>
        </g>

        {/* F5: Fiore-salmone */}
        <g transform="translate(360, 155)">
          <g className="ad-sway ad-s5">
            <line x1="0" y1="0" x2="0" y2="105" stroke="#6E8347" strokeWidth="1.4" strokeLinecap="round" />
            {[0, 72, 144, 216, 288].map((deg) => (
              <ellipse
                key={deg}
                cx="0" cy="-7" rx="4.5" ry="7"
                fill="#F2DBD0" stroke="#B0492E" strokeWidth="0.3" opacity="0.9"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx="0" cy="0" r="3" fill="#C7891A" />
            <circle cx="0" cy="0" r="1.2" fill="#76500F" />
          </g>
        </g>

        {/* Ape */}
        <g id="ad-bee" transform="translate(200, 60)">
          <g className="ad-bee-wings">
            <ellipse cx="-3" cy="-12" rx="10" ry="14" fill="#FAF6ED" opacity="0.55" stroke="#C9B896" strokeWidth="0.5" transform="rotate(-30 -3 -3)" />
            <ellipse cx="-2" cy="-12" rx="6" ry="10" fill="#FAF6ED" opacity="0.75" transform="rotate(-22 -2 -3)" />
            <ellipse cx="3" cy="-12" rx="10" ry="14" fill="#FAF6ED" opacity="0.55" stroke="#C9B896" strokeWidth="0.5" transform="rotate(30 3 -3)" />
            <ellipse cx="2" cy="-12" rx="6" ry="10" fill="#FAF6ED" opacity="0.75" transform="rotate(22 2 -3)" />
          </g>
          <ellipse cx="0" cy="0" rx="14" ry="10" fill="#E5A938" stroke="#76500F" strokeWidth="0.7" />
          <path d="M -7.5,-9 C -7.5,-3 -7,3 -7,9" stroke="#2A2014" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M 0,-9.7 C 0,-3 0,3 0,9.7" stroke="#2A2014" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 7,-9.3 C 7,-3 7,3 6,8.5" stroke="#2A2014" strokeWidth="2.3" fill="none" strokeLinecap="round" />
          <g stroke="#76500F" strokeWidth="0.5" strokeLinecap="round" opacity="0.55">
            <line x1="-12.5" y1="-7" x2="-14.5" y2="-7.5" />
            <line x1="-13.5" y1="-3" x2="-15.5" y2="-3" />
            <line x1="-13.5" y1="3" x2="-15.5" y2="3" />
            <line x1="-12.5" y1="7" x2="-14.5" y2="7.5" />
            <line x1="-9" y1="-10" x2="-9.5" y2="-12" />
            <line x1="-3" y1="-10.5" x2="-3" y2="-12.5" />
            <line x1="3" y1="-10.5" x2="3" y2="-12.5" />
            <line x1="-9" y1="10" x2="-9.5" y2="12" />
            <line x1="-3" y1="10.5" x2="-3" y2="12.5" />
            <line x1="3" y1="10.5" x2="3" y2="12.5" />
          </g>
          <path d="M -14,0 L -18,-1.4 L -18,1.4 Z" fill="#2A2014" />
          <circle cx="11.5" cy="-1" r="6.5" fill="#2A2014" />
          <circle cx="13" cy="-2" r="2.8" fill="#FAF6ED" />
          <circle cx="13.5" cy="-1.5" r="1.8" fill="#1A130C" />
          <circle cx="14" cy="-2.3" r="0.7" fill="#FAF6ED" />
          <path d="M 12,3 Q 14,4.5 16,3" stroke="#FAF6ED" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d="M 8.5,-6.5 Q 5,-12 3,-16" stroke="#2A2014" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          <circle cx="3" cy="-16" r="1.4" fill="#2A2014" />
          <path d="M 14,-7 Q 14.5,-12 14.5,-16" stroke="#2A2014" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          <circle cx="14.5" cy="-16" r="1.4" fill="#2A2014" />
          <line x1="-5" y1="9.5" x2="-7" y2="13" stroke="#2A2014" strokeWidth="0.7" strokeLinecap="round" />
          <line x1="0" y1="10" x2="0" y2="13" stroke="#2A2014" strokeWidth="0.7" strokeLinecap="round" />
          <line x1="5" y1="9.5" x2="7" y2="13" stroke="#2A2014" strokeWidth="0.7" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
