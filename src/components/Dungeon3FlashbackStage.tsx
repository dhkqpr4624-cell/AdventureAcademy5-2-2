import aronStanding from "../assets/story/npcs/chapter2/aron/standing_R.png";
import kappStanding from "../assets/story/npcs/chapter2/kapp/standing_R.png";
import denebStanding from "../assets/story/npcs/chapter2/deneb/silhouette_R.png";
import researcherStanding from "../assets/story/npcs/chapter2/researcher/standing_L.png";

const url = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon3/${name}`;

export function Dungeon3FlashbackStage({ stage }: { stage: "black" | "hq" | "ruins" | "ruinsAlert" }) {
  if (stage === "black") return <div className="dungeon3-flashback-stage is-black" aria-hidden="true" />;
  const hq = stage === "hq";
  return <div className={`dungeon3-flashback-stage is-${stage}`} aria-hidden="true">
    {hq ? <>
      <img className="d3-layer d3-background" src={url("hq-background.png")} alt="" />
      <div className="d3-rising-world">
        <img className="d3-layer d3-foreground" src={url("hq-foreground.png")} alt="" />
        <div className="d3-npcs">
          <img style={{left:"18%"}} src={aronStanding} alt="" /><img style={{left:"38%"}} src={kappStanding} alt="" />
          <img style={{left:"61%"}} src={denebStanding} alt="" /><img style={{left:"82%"}} src={researcherStanding} alt="" />
        </div>
        <img className="d3-layer d3-ground" src={url("hq-ground.png")} alt="" />
      </div>
    </> : <>
      <img className="d3-layer d3-background" src={url("ruined-sky.png")} alt="" />
      <img className="d3-layer d3-background-overlay" src={url("ruined-background.png")} alt="" />
      <div className="d3-rising-world">
        <div className="d3-npcs is-skill">
          <span className="d3-skill d3-aron-skill" style={{left:"23%",backgroundImage:`url(${url("aron-skill-sheet.png")})`}} />
          <img style={{left:"50%"}} src={denebStanding} alt="" />
          <span className="d3-skill d3-kapp-skill" style={{left:"77%",backgroundImage:`url(${url("kapp-skill-sheet.png")})`}} />
          {stage === "ruinsAlert" && <><span className="d3-exclamation" style={{left:"23%",backgroundImage:`url(${import.meta.env.BASE_URL}assets/story/chapter2/intro/exclamation-sheet.png)`}} /><span className="d3-exclamation" style={{left:"77%",backgroundImage:`url(${import.meta.env.BASE_URL}assets/story/chapter2/intro/exclamation-sheet.png)`}} /></>}
        </div>
        <img className="d3-layer d3-ground" src={url("ruined-ground.png")} alt="" />
      </div>
    </>}
  </div>;
}
