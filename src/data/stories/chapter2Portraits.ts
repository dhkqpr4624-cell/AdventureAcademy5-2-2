import type { StoryActor, StoryNpcPortraitDefinition, StoryVisualAsset } from "../../types/story";
import lunaDefault from "../../assets/portraits/chapter2/luna/default.png";
import lunaSmile from "../../assets/portraits/chapter2/luna/smile.png";
import lunaSad from "../../assets/portraits/chapter2/luna/sad.png";
import lunaAngry from "../../assets/portraits/chapter2/luna/angry.png";
import theoDefault from "../../assets/portraits/chapter2/theo/default.png";
import theoSmile from "../../assets/portraits/chapter2/theo/smile.png";
import theoSad from "../../assets/portraits/chapter2/theo/sad.png";
import theoAngry from "../../assets/portraits/chapter2/theo/angry.png";
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

export const CHAPTER2_PORTRAITS: Record<string, StoryNpcPortraitDefinition> = {
  luna: { defaultExpression: "default", expressions: { default: lunaDefault, smile: lunaSmile, sad: lunaSad, angry: lunaAngry } },
  theo: { defaultExpression: "default", expressions: { default: theoDefault, smile: theoSmile, sad: theoSad, angry: theoAngry } },
  aron: { defaultExpression: "default", expressions: { default: aronDefault, smile: aronSmile, sad: aronSad, angry: aronAngry, serious: aronSerious } },
  kapp: { defaultExpression: "default", expressions: { default: kappDefault, smile: kappSmile, sad: kappSad, angry: kappAngry, surprised: kappSurprised } },
  sailor: { defaultExpression: "default", expressions: { default: sailorDefault } },
};

export function createChapter2Actor(id: string, name: string, role: string, accentColor: string): StoryActor {
  const definition = CHAPTER2_PORTRAITS[id];
  const portraits = Object.fromEntries(Object.entries(definition.expressions).map(([expression, imageUrl]) => [
    expression,
    { imageUrl, placeholder: { label: name, subtitle: role, gradient: "linear-gradient(135deg, #30291f, #111)" } } satisfies StoryVisualAsset,
  ]));
  return { id, name, role, accentColor, portraits, defaultExpression: definition.defaultExpression };
}
