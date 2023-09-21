import { BossID, ModCallback, RoomType } from "isaac-typescript-definitions";
import {
  Callback,
  ReadonlyMap,
  game,
  getRoomSubType,
  inBeastRoom,
} from "isaacscript-common";
import { CharacterObjective } from "../../enums/CharacterObjective";
import { RandomizerModFeature } from "../RandomizerModFeature";
import { addAchievement } from "./AchievementTracker";

const CHARACTER_OBJECTIVE_TO_BOSS_ID = new ReadonlyMap<
  BossID,
  CharacterObjective
>([
  [BossID.MOM, CharacterObjective.MOM],
  [BossID.IT_LIVES, CharacterObjective.IT_LIVES],
  [BossID.ISAAC, CharacterObjective.ISAAC],
  [BossID.BLUE_BABY, CharacterObjective.BLUE_BABY],
  [BossID.SATAN, CharacterObjective.SATAN],
  [BossID.THE_LAMB, CharacterObjective.THE_LAMB],
  [BossID.MEGA_SATAN, CharacterObjective.MEGA_SATAN],
  // There is no boss ID for the Boss Rush (it has a separate room type).
  [BossID.HUSH, CharacterObjective.HUSH],
  [BossID.ULTRA_GREED, CharacterObjective.ULTRA_GREED],
  [BossID.DELIRIUM, CharacterObjective.DELIRIUM],
  [BossID.MAUSOLEUM_MOMS_HEART, CharacterObjective.MOMS_HEART_ALT],
  [BossID.MOTHER, CharacterObjective.MOTHER],
  [BossID.DOGMA, CharacterObjective.DOGMA],
  // There is no boss ID for The Beast (it does not have its own boss room).
]);

export class BossKillDetection extends RandomizerModFeature {
  @Callback(ModCallback.PRE_SPAWN_CLEAR_AWARD)
  preSpawnClearAward(): boolean | undefined {
    const room = game.GetRoom();
    const roomType = room.GetType();

    switch (roomType) {
      // 5
      case RoomType.BOSS: {
        const bossID = getRoomSubType() as BossID;
        const characterObjective = CHARACTER_OBJECTIVE_TO_BOSS_ID.get(bossID);
        if (characterObjective !== undefined) {
          addAchievement(characterObjective);
        }

        break;
      }

      // 16
      case RoomType.DUNGEON: {
        if (inBeastRoom()) {
          addAchievement(CharacterObjective.THE_BEAST);
        }

        break;
      }

      // 17
      case RoomType.BOSS_RUSH: {
        addAchievement(CharacterObjective.BOSS_RUSH);
        break;
      }

      default: {
        break;
      }
    }

    return undefined;
  }
}