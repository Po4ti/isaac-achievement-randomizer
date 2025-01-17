import type { DamageFlag } from "isaac-typescript-definitions";
import {
  Dimension,
  LevelStage,
  ModCallback,
  NullItemID,
  RoomType,
} from "isaac-typescript-definitions";
import {
  Callback,
  CallbackCustom,
  ModCallbackCustom,
  ReadonlyMap,
  anyPlayerHasNullEffect,
  game,
  inDimension,
  inGrid,
  isAllRoomsClear,
  isFirstPlayer,
  isSelfDamage,
  onAnyChallenge,
  onRepentanceStage,
  sfxManager,
} from "isaacscript-common";
import { isPrikolsEnabled } from "../../config";
import { CharacterObjectiveKind } from "../../enums/CharacterObjectiveKind";
import { ObjectiveType } from "../../enums/ObjectiveType";
import { SoundEffectCustom } from "../../enums/SoundEffectCustom";
import { getObjective } from "../../types/Objective";
import { getAdjustedCharacterForObjective } from "../../utils";
import { RandomizerModFeature } from "../RandomizerModFeature";
import { addObjective } from "./achievementTracker/addObjective";
import { isCharacterObjectiveCompleted } from "./achievementTracker/completedObjectives";

const ROOM_TYPES = [
  RoomType.DEFAULT, // 1
  RoomType.BOSS, // 5
  RoomType.MINI_BOSS, // 6
] as const;

const STAGE_TO_CHARACTER_OBJECTIVE_KIND = new ReadonlyMap<
  LevelStage,
  CharacterObjectiveKind
>([
  [LevelStage.BASEMENT_1, CharacterObjectiveKind.NO_HIT_BASEMENT_1],
  [LevelStage.BASEMENT_2, CharacterObjectiveKind.NO_HIT_BASEMENT_2],
  [LevelStage.CAVES_1, CharacterObjectiveKind.NO_HIT_CAVES_1],
  [LevelStage.CAVES_2, CharacterObjectiveKind.NO_HIT_CAVES_2],
  [LevelStage.DEPTHS_1, CharacterObjectiveKind.NO_HIT_DEPTHS_1],
  [LevelStage.DEPTHS_2, CharacterObjectiveKind.NO_HIT_DEPTHS_2],
  [LevelStage.WOMB_1, CharacterObjectiveKind.NO_HIT_WOMB_1],
  [LevelStage.WOMB_2, CharacterObjectiveKind.NO_HIT_WOMB_2],
  [LevelStage.SHEOL_CATHEDRAL, CharacterObjectiveKind.NO_HIT_SHEOL_CATHEDRAL],
  [LevelStage.DARK_ROOM_CHEST, CharacterObjectiveKind.NO_HIT_DARK_ROOM_CHEST],
]);

const STAGE_TO_CHARACTER_OBJECTIVE_KIND_REPENTANCE = new ReadonlyMap<
  LevelStage,
  CharacterObjectiveKind
>([
  [LevelStage.BASEMENT_1, CharacterObjectiveKind.NO_HIT_DOWNPOUR_1],
  [LevelStage.BASEMENT_2, CharacterObjectiveKind.NO_HIT_DOWNPOUR_2],
  [LevelStage.CAVES_1, CharacterObjectiveKind.NO_HIT_MINES_1],
  [LevelStage.CAVES_2, CharacterObjectiveKind.NO_HIT_MINES_2],
  [LevelStage.DEPTHS_1, CharacterObjectiveKind.NO_HIT_MAUSOLEUM_1],
  [LevelStage.DEPTHS_2, CharacterObjectiveKind.NO_HIT_MAUSOLEUM_2],
  [LevelStage.WOMB_1, CharacterObjectiveKind.NO_HIT_CORPSE_1],
  [LevelStage.WOMB_2, CharacterObjectiveKind.NO_HIT_CORPSE_2],
]);

const v = {
  level: {
    tookHit: false,
  },
};

export class FloorObjectiveDetection extends RandomizerModFeature {
  v = v;

  // 1
  @Callback(ModCallback.POST_UPDATE)
  postUpdate(): void {
    this.checkLostCurse();
  }

  /**
   * We invalidate the floor objective as soon as a player touches a white fire. This is to increase
   * the difficulty, since using The Lost for every room is cheap.
   */
  checkLostCurse(): void {
    if (anyPlayerHasNullEffect(NullItemID.LOST_CURSE)) {
      v.level.tookHit = true;
    }
  }

  // 70
  @Callback(ModCallback.PRE_SPAWN_CLEAR_AWARD)
  preSpawnClearAward(): boolean | undefined {
    floorObjectiveDetectionPreSpawnClearAward();
    return undefined;
  }

  @CallbackCustom(ModCallbackCustom.ENTITY_TAKE_DMG_PLAYER)
  entityTakeDmgPlayer(
    player: EntityPlayer,
    _amount: float,
    damageFlags: BitFlags<DamageFlag>,
  ): boolean | undefined {
    if (!isFirstPlayer(player)) {
      return undefined;
    }

    if (isSelfDamage(damageFlags)) {
      return undefined;
    }

    const character = getAdjustedCharacterForObjective(player);
    const kindNoHit = getCharacterObjectiveKindNoHit();

    if (
      kindNoHit != undefined &&
      !isCharacterObjectiveCompleted(character, kindNoHit) &&
      v.level.tookHit != true &&
      isPrikolsEnabled()
    ) {
      sfxManager.Play(SoundEffectCustom.NEPRAVILNO);
    }

    v.level.tookHit = true;

    return undefined;
  }

  /**
   * If the final room explored on a floor is empty, then it will not get set to being cleared until
   * the player enters it, and then the `PRE_SPAWN_CLEAR_AWARD` callback will never be fired. Thus,
   * we have to also check on every room enter.
   */
  @CallbackCustom(ModCallbackCustom.POST_NEW_ROOM_REORDERED)
  postNewRoomReordered(): void {
    checkCompletedFloorObjective();
  }

  @CallbackCustom(ModCallbackCustom.POST_HOLY_MANTLE_REMOVED)
  postHolyMantleRemoved(player: EntityPlayer): void {
    if (!isFirstPlayer(player)) {
      return;
    }
    const character = getAdjustedCharacterForObjective(player);
    const kindNoHit = getCharacterObjectiveKindNoHit();

    if (
      kindNoHit != undefined &&
      !isCharacterObjectiveCompleted(character, kindNoHit) &&
      v.level.tookHit != true &&
      isPrikolsEnabled()
    ) {
      sfxManager.Play(SoundEffectCustom.NEPRAVILNO);
    }
    v.level.tookHit = true;
  }
}

export function floorObjectiveDetectionPreSpawnClearAward(): void {
  checkCompletedFloorObjective();
}

function checkCompletedFloorObjective() {
  if (!inGrid() || !inDimension(Dimension.MAIN)) {
    return;
  }

  const player = Isaac.GetPlayer();
  const character = getAdjustedCharacterForObjective(player);

  if (!v.level.tookHit && isAllRoomsClear(ROOM_TYPES)) {
    const kindNoHit = getCharacterObjectiveKindNoHit();
    if (kindNoHit !== undefined) {
      const objective = getObjective(
        ObjectiveType.CHARACTER,
        character,
        kindNoHit,
      );
      addObjective(objective);
    }
  }
}

export function getCharacterObjectiveKindNoHit():
  | CharacterObjectiveKind
  | undefined {
  if (onAnyChallenge()) {
    return undefined;
  }

  const repentanceStage = onRepentanceStage();
  const stageToCharacterObjectiveKind = repentanceStage
    ? STAGE_TO_CHARACTER_OBJECTIVE_KIND_REPENTANCE
    : STAGE_TO_CHARACTER_OBJECTIVE_KIND;

  const level = game.GetLevel();
  const stage = level.GetStage();

  return stageToCharacterObjectiveKind.get(stage);
}

export function hasTakenHitOnFloor(): boolean {
  return v.level.tookHit;
}
