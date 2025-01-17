import type { PillEffect } from "isaac-typescript-definitions";
import {
  QUALITIES,
  VANILLA_PILL_EFFECTS,
  assertDefined,
} from "isaacscript-common";
import { PILL_EFFECT_QUALITIES } from "../../../arrays/pillEffectQualities";

const QUALITY_TO_VANILLA_PILL_EFFECTS_MAP: ReadonlyMap<Quality, PillEffect[]> =
  (() => {
    const qualityToPillEffectsMap = new Map<Quality, PillEffect[]>();

    for (const quality of QUALITIES) {
      const pillEffects: PillEffect[] = [];

      for (const pillEffect of VANILLA_PILL_EFFECTS) {
        const pillEffectQuality = PILL_EFFECT_QUALITIES[pillEffect];
        if (pillEffectQuality === quality) {
          pillEffects.push(pillEffect);
        }
      }

      qualityToPillEffectsMap.set(quality, pillEffects);
    }

    return qualityToPillEffectsMap;
  })();

export function getPillEffectsOfQuality(quality: Quality): PillEffect[] {
  const pillEffects = QUALITY_TO_VANILLA_PILL_EFFECTS_MAP.get(quality);
  assertDefined(
    pillEffects,
    `Failed to get the pill effects of quality: ${quality}`,
  );

  return pillEffects;
}
