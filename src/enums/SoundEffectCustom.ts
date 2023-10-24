import { validateCustomEnum } from "isaacscript-common";

export const SoundEffectCustom = {
  GOLDEN_WALNUT: Isaac.GetSoundIdByName("Golden Walnut"),
  NEPRAVILNO: Isaac.GetSoundIdByName("nepravilno"),
} as const;

validateCustomEnum("SoundEffectCustom", SoundEffectCustom);
