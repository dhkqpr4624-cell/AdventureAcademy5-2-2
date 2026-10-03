import { useEffect, useRef, useState } from "react";
import {
  DUNGEON10_CREDIT_FADE_OUT_MS,
  DUNGEON10_CREDIT_FINAL_HOLD_MS,
  DUNGEON10_CREDIT_FINAL_KEY,
  DUNGEON10_CREDIT_IMAGES,
  DUNGEON10_CREDIT_IMAGE_END_KEY,
  DUNGEON10_CREDIT_IMAGE_START_KEY,
  DUNGEON10_CREDIT_SECTIONS,
  DUNGEON10_CREDIT_VIEWPORTS_PER_SECOND,
  computeCreditTimeline,
  creditImageOpacity,
  resolveCreditText,
  type CreditTimeline,
} from "../../game/dungeon10/dungeon10Credits";

type Props = {
  playerName: string;
  /** Called exactly once after the final hold and fade-out. */
  onComplete: () => void;
  /** Optional probe used by automated browser checks (no UI effect). */
  onTimeline?: (timeline: CreditTimeline) => void;
};

/**
 * Auto-scrolling, non-skippable credits. Timestamp driven, so the scroll speed
 * and the five right-side images stay in sync even at a low frame rate.
 */
export function Dungeon10EndingCredits({ playerName, onComplete, onTimeline }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const imageRefs = useRef<Array<HTMLImageElement | null>>([]);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onTimelineRef = useRef(onTimeline);
  const [fadingOut, setFadingOut] = useState(false);
  onCompleteRef.current = onComplete;
  onTimelineRef.current = onTimeline;

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    let timeline: CreditTimeline | null = null;
    let frameId = 0;
    let startedAt: number | null = null;
    let finishTimer: number | null = null;
    let cancelled = false;

    const measure = () => {
      const section = (key: string) => track.querySelector<HTMLElement>(`[data-credit-key="${key}"]`);
      const start = section(DUNGEON10_CREDIT_IMAGE_START_KEY);
      const end = section(DUNGEON10_CREDIT_IMAGE_END_KEY);
      const final = section(DUNGEON10_CREDIT_FINAL_KEY);
      if (!start || !end || !final) return;
      timeline = computeCreditTimeline({
        viewportHeight: viewport.clientHeight,
        finalSectionTop: final.offsetTop,
        finalSectionHeight: final.offsetHeight,
        imageStartTop: start.offsetTop,
        imageEndAt: final.offsetTop,
      });
      onTimelineRef.current?.(timeline);
    };

    const finish = () => {
      if (completedRef.current || cancelled) return;
      completedRef.current = true;
      setFadingOut(true);
      finishTimer = window.setTimeout(() => {
        finishTimer = null;
        if (!cancelled) onCompleteRef.current();
      }, DUNGEON10_CREDIT_FADE_OUT_MS);
    };

    const tick = (now: number) => {
      frameId = 0;
      if (cancelled) return;
      if (!timeline) measure();
      if (!timeline) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }
      if (startedAt === null) startedAt = now;
      const elapsed = now - startedAt;
      const scrolled = Math.min(elapsed, timeline.scrollMs);
      const speed = viewport.clientHeight * DUNGEON10_CREDIT_VIEWPORTS_PER_SECOND;
      const offset = viewport.clientHeight - (speed * scrolled) / 1000;
      track.style.transform = `translate3d(0, ${offset}px, 0)`;
      imageRefs.current.forEach((image, index) => {
        if (image) image.style.opacity = String(creditImageOpacity(timeline!, index, elapsed));
      });
      if (elapsed >= timeline.scrollMs + DUNGEON10_CREDIT_FINAL_HOLD_MS) {
        finish();
        return;
      }
      frameId = window.requestAnimationFrame(tick);
    };

    const onResize = () => { timeline = null; measure(); };
    window.addEventListener("resize", onResize);
    const fontsReady = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready ?? Promise.resolve();
    void fontsReady.then(() => {
      if (!cancelled) frameId = window.requestAnimationFrame(tick);
    });
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (frameId) window.cancelAnimationFrame(frameId);
      if (finishTimer !== null) window.clearTimeout(finishTimer);
    };
  }, []);

  return (
    <section className={`d10-credits${fadingOut ? " is-fading-out" : ""}`} aria-label="엔딩 크레딧">
      <div className="d10-credits-images" aria-hidden="true">
        {DUNGEON10_CREDIT_IMAGES.map((url, index) => (
          <img key={url} ref={(node) => { imageRefs.current[index] = node; }} src={url} alt="" draggable={false} />
        ))}
      </div>
      <div className="d10-credits-viewport" ref={viewportRef}>
        <div className="d10-credits-track" ref={trackRef}>
          {DUNGEON10_CREDIT_SECTIONS.map((section) => (
            <section key={section.key} className={`d10-credit-section is-${section.key}`} data-credit-key={section.key}>
              {section.lines.map((line, index) => {
                const text = resolveCreditText(line.text, playerName);
                if (line.role === "spacer") return <span key={index} className="d10-credit-spacer" aria-hidden="true" />;
                if (line.role === "title") return <h1 key={index}>{text}</h1>;
                if (line.role === "heading") return <h2 key={index}>{text}</h2>;
                if (line.role === "name") return <strong key={index}>{text}</strong>;
                return <p key={index}>{text}</p>;
              })}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
