import type { StoryActor, StoryNpcPortraitDefinition, StoryVisualAsset } from "../../types/story";
import lunaDefault from "../../assets/portraits/chapter2/luna/default.png";
import lunaSmile from "../../assets/portraits/chapter2/luna/smile.png";
import lunaSad from "../../assets/portraits/chapter2/luna/sad.png";
import lunaAngry from "../../assets/portraits/chapter2/luna/angry.png";
import lunaScared from "../../assets/portraits/chapter2/luna/scared.png";
import theoDefault from "../../assets/portraits/chapter2/theo/default.png";
import theoSmile from "../../assets/portraits/chapter2/theo/smile.png";
import theoSad from "../../assets/portraits/chapter2/theo/sad.png";
import theoAngry from "../../assets/portraits/chapter2/theo/angry.png";
import theoWorried from "../../assets/portraits/chapter2/theo/worried.png";
import aronDefault from "../../assets/portraits/chapter2/aron/default.png";
import aronSmile from "../../assets/portraits/chapter2/aron/smile.png";
import aronSad from "../../assets/portraits/chapter2/aron/sad.png";
import aronAngry from "../../assets/portraits/chapter2/aron/angry.png";
import aronSerious from "../../assets/portraits/chapter2/aron/serious.png";
import kappDefault from "../../assets/portraits/chapter2/kapp/default.png";
import kappSmile from "../../assets/portraits/chapter2/kapp/smile.png";
import kappSad from "../../assets/portraits/chapter2/kapp/sad.png";
import kappAngry from "../../assets/portraits/chapter2/kapp/angry.png";
import kappSurprised from "../../assets/portraits/chapter2/kapp/surprised.png";
import sailorDefault from "../../assets/portraits/chapter2/sailor/default.png";
import scholarDefault from "../../assets/portraits/chapter2/scholar/default.png";
import yiDefault from "../../assets/portraits/chapter2/yi/default.png";
import angryYangbanDefault from "../../assets/portraits/chapter2/angry-yangban/default.png";
import angryCommonerDefault from "../../assets/portraits/chapter2/angry-commoner/default.png";
import lunaSerious from "../../assets/portraits/chapter2/luna/serious.png";
import lunaShout from "../../assets/portraits/chapter2/luna/shout.png";
import theoSurprised from "../../assets/portraits/chapter2/theo/surprised.png";
import aronShouting from "../../assets/portraits/chapter2/aron/shouting.png";
import kappSerious from "../../assets/portraits/chapter2/kapp/serious.png";
import kappShouting from "../../assets/portraits/chapter2/kapp/shouting.png";
import denebDefault from "../../assets/portraits/chapter2/deneb/default.png";
import researcherDefault from "../../assets/portraits/chapter2/researcher/default.png";
import sejongDefault from "../../assets/portraits/chapter2/sejong/default.png";
import chiefMinisterDefault from "../../assets/portraits/chapter2/chief-minister/default.png";
import yeongjoDefault from "../../assets/portraits/chapter2/yeongjo/default.png";

export const CHAPTER2_PORTRAITS: Record<string, StoryNpcPortraitDefinition> = {
  luna: { defaultExpression: "default", expressions: { default: lunaDefault, smile: lunaSmile, sad: lunaSad, angry: lunaAngry, scared: lunaScared, serious: lunaSerious, shout: lunaShout } },
  theo: { defaultExpression: "default", expressions: { default: theoDefault, smile: theoSmile, sad: theoSad, angry: theoAngry, worried: theoWorried, surprised: theoSurprised } },
  aron: { defaultExpression: "default", expressions: { default: aronDefault, smile: aronSmile, sad: aronSad, angry: aronAngry, serious: aronSerious, shouting: aronShouting } },
  kapp: { defaultExpression: "default", expressions: { default: kappDefault, smile: kappSmile, sad: kappSad, angry: kappAngry, surprised: kappSurprised, serious: kappSerious, shouting: kappShouting } },
  sailor: { defaultExpression: "default", expressions: { default: sailorDefault } },
  scholar: { defaultExpression: "default", expressions: { default: scholarDefault } },
  yi: { defaultExpression: "default", expressions: { default: yiDefault } },
  angryYangban: { defaultExpression: "default", expressions: { default: angryYangbanDefault } },
  angryCommoner: { defaultExpression: "default", expressions: { default: angryCommonerDefault } },
  commoner: { defaultExpression: "default", expressions: { default: angryCommonerDefault } },
  deneb: { defaultExpression: "default", expressions: { default: denebDefault } },
  researcher: { defaultExpression: "default", expressions: { default: researcherDefault } },
  sejong: { defaultExpression: "default", expressions: { default: sejongDefault } },
  chiefMinister: { defaultExpression: "default", expressions: { default: chiefMinisterDefault } },
  yeongjo: { defaultExpression: "default", expressions: { default: yeongjoDefault } },
};

export function createChapter2Actor(id: string, name: string, role: string, accentColor: string): StoryActor {
  const definition = CHAPTER2_PORTRAITS[id];
  if (!definition) return { id, name, role, accentColor, portraits: {}, defaultExpression: "default" };
  const portraits = Object.fromEntries(Object.entries(definition.expressions).map(([expression, imageUrl]) => [
    expression,
    { imageUrl, placeholder: { label: name, subtitle: role, gradient: "linear-gradient(135deg, #30291f, #111)" } } satisfies StoryVisualAsset,
  ]));
  return { id, name, role, accentColor, portraits, defaultExpression: definition.defaultExpression };
}
