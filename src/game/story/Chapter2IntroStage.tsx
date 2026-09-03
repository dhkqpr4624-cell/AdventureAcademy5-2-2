import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import lunaL from "../../assets/story/npcs/chapter2/luna/standing_L.png";
import lunaR from "../../assets/story/npcs/chapter2/luna/standing_R.png";
import theoL from "../../assets/story/npcs/chapter2/theo/standing_L.png";
import theoR from "../../assets/story/npcs/chapter2/theo/standing_R.png";
import aronL from "../../assets/story/npcs/chapter2/aron/standing_L.png";
import aronR from "../../assets/story/npcs/chapter2/aron/standing_R.png";
import kappL from "../../assets/story/npcs/chapter2/kapp/standing_L.png";
import kappR from "../../assets/story/npcs/chapter2/kapp/standing_R.png";

const ARRIVAL_MAP = { width: 1672, height: 941, groundY: 825 } as const;
const ARRIVAL_NPCS = {
  luna: { mapX: 869, anchorX: 0.6158, anchorY: 0.98, width: 114 },
  theo: { mapX: 1020, anchorX: 0.5271, anchorY: 0.985, width: 114 },
  aron: { mapX: 1187, anchorX: 0.5118, anchorY: 0.9814, width: 114 },
  kapp: { mapX: 1354, anchorX: 0.5378, anchorY: 0.9729, width: 114 },
} as const;

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/story/chapter2/intro/${name}`;

export const CHAPTER2_INTRO_ASSET_URLS = [
  ...["sky.png", "cloud-1.png", "cloud-2.png", "airship-deck-foreground.png", "airship-deck-ground.png", "exclamation-sheet.png", "portal-entrance.png", "portal-entry.png", "arrival-background.png", "arrival-ground.png", "airship.png"].map(asset),
  lunaL, lunaR, theoL, theoR, aronL, aronR, kappL, kappR,
];

function Clouds() {
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const tiles = Array.from(track.querySelectorAll<HTMLImageElement>("img"));
    let tileWidth = track.parentElement?.clientWidth ?? 2048;
    const observer = new ResizeObserver(() => { tileWidth = track.parentElement?.clientWidth ?? tileWidth; });
    if (track.parentElement) observer.observe(track.parentElement);
    let x = 0;
    let previous = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      x -= (now - previous) * 0.018;
      previous = now;
      if (x <= -tileWidth) {
        x += tileWidth;
        const first = tiles.shift();
        if (first) {
          first.src = asset(Math.random() < 0.5 ? "cloud-1.png" : "cloud-2.png");
          track.append(first);
          tiles.push(first);
        }
      }
      track.style.transform = `translate3d(${x}px,0,0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);
  return <div className="chapter2-cloud-window"><div ref={trackRef} className="chapter2-cloud-track"><img src={asset("cloud-1.png")} alt=""/><img src={asset("cloud-2.png")} alt=""/></div></div>;
}

function Npc({ id, src, className = "", children, arrival = false }: { id: string; src: string; className?: string; children?: ReactNode; arrival?: boolean }) {
  const layout = arrival ? ARRIVAL_NPCS[id as keyof typeof ARRIVAL_NPCS] : undefined;
  const style = layout ? {
    left: `${layout.mapX / ARRIVAL_MAP.width * 100}%`,
    top: `${ARRIVAL_MAP.groundY / ARRIVAL_MAP.height * 100}%`,
    width: `${layout.width / ARRIVAL_MAP.width * 100}%`,
    transform: `translate(${-layout.anchorX * 100}%, ${-layout.anchorY * 100}%)`,
  } : undefined;
  return <div className={`chapter2-story-npc chapter2-story-npc-${id} ${className}`} style={style}><img src={src} alt="" draggable={false}/>{children}</div>;
}

function Exclamation({ id }: { id: string }) {
  return <span className={`chapter2-exclamation chapter2-exclamation-${id}`} style={{ backgroundImage: `url("${asset("exclamation-sheet.png")}")` } as CSSProperties} />;
}

export function Chapter2IntroStage({ phase }: { phase: string; revision: number }) {
  if (phase.startsWith("deck")) {
    const raised = phase !== "deck-sky";
    const duo = ["deck-duo", "deck-party", "deck-surprise"].includes(phase);
    const party = ["deck-party", "deck-surprise"].includes(phase);
    const surprise = phase === "deck-surprise";
    return <div className="chapter2-stage chapter2-stage-deck">
      <img className="chapter2-layer chapter2-sky" src={asset("sky.png")} alt=""/><Clouds/>
      <div className={`chapter2-deck-group ${raised ? "is-raised" : ""}`}>
        <div className="chapter2-deck-background" aria-hidden="true" />
        <img className="chapter2-layer chapter2-deck-foreground" src={asset("airship-deck-foreground.png")} alt=""/>
        <div className="chapter2-npc-layer">
          {duo && <><Npc id="luna" src={surprise ? lunaR : lunaL} className="is-fading-in">{surprise && <Exclamation id="luna"/>}</Npc><Npc id="theo" src={theoR} className="is-fading-in">{surprise && <Exclamation id="theo"/>}</Npc></>}
          {party && <><Npc id="aron" src={aronL} className="is-fading-in"/><Npc id="kapp" src={kappL} className="is-fading-in"/></>}
        </div>
        <img className="chapter2-layer chapter2-deck-ground" src={asset("airship-deck-ground.png")} alt=""/>
      </div>
    </div>;
  }
  if (phase.startsWith("arrival")) {
    const party = ["arrival-party", "arrival-exit"].includes(phase);
    const exit = phase === "arrival-exit";
    return <div className="chapter2-stage chapter2-stage-arrival">
      <div className="chapter2-arrival-camera">
        <img className="chapter2-layer chapter2-sky" src={asset("sky.png")} alt=""/>
        <div className="chapter2-arrival-fixed"><img className="chapter2-layer chapter2-arrival-background" src={asset("arrival-background.png")} alt=""/></div>
        <div className={`chapter2-arrival-exit-group ${exit ? "is-exiting" : ""}`}>
          <img className="chapter2-arrival-airship" src={asset("airship.png")} alt=""/>
          <div className="chapter2-npc-layer">
            {party && <><Npc id="luna" src={lunaR} className="is-fading-in" arrival/><Npc id="theo" src={theoR} className="is-fading-in" arrival/><Npc id="aron" src={aronR} className="is-fading-in" arrival/><Npc id="kapp" src={kappR} className="is-fading-in" arrival/></>}
          </div>
          <img className="chapter2-layer chapter2-arrival-ground" src={asset("arrival-ground.png")} alt=""/>
        </div>
      </div>
    </div>;
  }
  return null;
}
