import type { DamageFlag } from "isaac-typescript-definitions";
import {
  BabyVariant,
  BeastVariant,
  BossID,
  CollectibleType,
  EntityType,
  FallenVariant,
  GurglingVariant,
  LokiVariant,
  MegaSatanVariant,
  MinibossID,
  ModCallback,
  NPCState,
  PeepVariant,
  RoomType,
  SlothVariant,
  UltraGreedVariant,
} from "isaac-typescript-definitions";
import {
  Callback,
  CallbackCustom,
  GAME_FRAMES_PER_SECOND,
  ModCallbackCustom,
  ReadonlySet,
  doesEntityExist,
  game,
  getBossID,
  getEntityTypeVariantFromBossID,
  getNPCs,
  getRoomSubType,
  getStageType,
  inBigRoom,
  isActiveEnemy,
  isFirstPlayer,
  isRepentanceStage,
  isSelfDamage,
  onAnyChallenge,
  sfxManager,
} from "isaacscript-common";
import { isPrikolsEnabled } from "../../config";
import { BossIDCustom } from "../../enums/BossIDCustom";
import { ObjectiveType } from "../../enums/ObjectiveType";
import { SoundEffectCustom } from "../../enums/SoundEffectCustom";
import {
  getNumSecondsForBossObjective,
  getObjective,
} from "../../types/Objective";
import { RandomizerModFeature } from "../RandomizerModFeature";
import { addObjective } from "./achievementTracker/addObjective";
import { isBossObjectiveCompleted } from "./achievementTracker/completedObjectives";

const BOSSES_IN_BIG_ROOMS_SET = new ReadonlySet([
  BossID.MR_FRED, // 53
  BossID.MEGA_SATAN, // 55
  BossID.ULTRA_GREED, // 62
  BossID.HUSH, // 63
  BossID.DELIRIUM, // 70
  BossID.ULTRA_GREEDIER, // 71
  BossID.TUFF_TWINS, // 80
  BossID.GREAT_GIDEON, // 83
  BossID.MOTHER, // 88
  BossID.SHELL, // 96
  BossID.DOGMA, // 99
]);

const v = {
  room: {
    tookDamageRoomFrame: 0,
    usedPause: false,
    onFirstPhaseOfIsaac: true,
    onFirstPhaseOfHush: true,
    beastAppeared: false,
    realHushStarted: false,
  },
};

export class BossNoHitObjectiveDetection extends RandomizerModFeature {
  v = v;
  // 0, 102
  @Callback(ModCallback.POST_NPC_UPDATE, EntityType.ISAAC)
  postNPCUpdateIsaac(npc: EntityNPC): void {
    const bossID = getModifiedBossID();
    if (bossID !== BossID.ISAAC && bossID !== BossID.BLUE_BABY) {
      return;
    }

    // Isaac goes to `NPCState.SPECIAL` when transitioning from phase 1 to phase 2 and when
    // transitioning from phase 2 to phase 3.
    if (v.room.onFirstPhaseOfIsaac && npc.State === NPCState.SPECIAL) {
      v.room.onFirstPhaseOfIsaac = false;

      const room = game.GetRoom();
      v.room.tookDamageRoomFrame = room.GetFrameCount();
    }
  }

  // 0, 407
  @Callback(ModCallback.POST_NPC_UPDATE, EntityType.HUSH)
  postNPCUpdateHush(): void {
    const bossID = getModifiedBossID();
    if (bossID !== BossID.HUSH) {
      return;
    }

    if (v.room.onFirstPhaseOfHush) {
      v.room.onFirstPhaseOfHush = false;

      const room = game.GetRoom();
      v.room.tookDamageRoomFrame = room.GetFrameCount();
    }
  }

  // 0, 102
  @CallbackCustom(
    ModCallbackCustom.POST_NPC_UPDATE_FILTER,
    EntityType.BEAST,
    BeastVariant.BEAST,
  )
  postNPCUpdateBeast(npc: EntityNPC): void {
    // The Beast is in state `NPCState.SPECIAL` (16) when off-screen.
    if (!v.room.beastAppeared && npc.State === NPCState.SPECIAL) {
      v.room.beastAppeared = true;

      const room = game.GetRoom();
      v.room.tookDamageRoomFrame = room.GetFrameCount();
    }
  }

  // 1
  @Callback(ModCallback.POST_UPDATE)
  postUpdate(): void {
    this.checkBossNoHit();
  }

  checkBossNoHit(): void {
    const bossID = getModifiedBossID();
    if (bossID === undefined) {
      return;
    }

    const seconds = getSecondsSinceLastDamage();
    if (seconds == 0 && isPrikolsEnabled()) {
      if (bossID == BossID.HUSH) {
        if (!v.room.realHushStarted) {
          v.room.realHushStarted = true;
        } else {
          sfxManager.Play(SoundEffectCustom.NEPRAVILNO);
        }
      } else {
        sfxManager.Play(SoundEffectCustom.NEPRAVILNO);
      }
    }
    if (seconds === undefined) {
      return;
    }

    const numSecondsForBossObjective = getNumSecondsForBossObjective(bossID);
    if (seconds >= numSecondsForBossObjective) {
      const objective = getObjective(ObjectiveType.BOSS, bossID);
      addObjective(objective);
    }
  }

  // 3, 478
  @Callback(ModCallback.POST_USE_ITEM, CollectibleType.PAUSE)
  postUseItemPause(): boolean | undefined {
    v.room.usedPause = true;
    return undefined;
  }

  // 27, 68, 10
  @CallbackCustom(
    ModCallbackCustom.POST_NPC_INIT_FILTER,
    EntityType.PEEP,
    PeepVariant.PEEP_EYE,
  )
  postNPCInitPeepEye(): void {
    const bossID = getModifiedBossID();
    if (bossID !== BossID.PEEP) {
      return;
    }

    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
  }

  // 27, 81, 0
  @CallbackCustom(
    ModCallbackCustom.POST_NPC_INIT_FILTER,
    EntityType.FALLEN,
    FallenVariant.FALLEN,
  )
  postNPCInitFallen(): void {
    const bossID = getModifiedBossID();
    if (bossID !== BossID.FALLEN) {
      return;
    }

    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
  }

  // 27, 246
  @Callback(ModCallback.POST_NPC_INIT, EntityType.RAGLING)
  postNPCInitRagling(): void {
    const bossID = getModifiedBossID();
    if (bossID !== BossID.RAG_MAN) {
      return;
    }

    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
  }

  // 27, 271
  @Callback(ModCallback.POST_NPC_INIT, EntityType.URIEL)
  postNPCInitUriel(): void {
    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
  }

  // 27, 272
  @Callback(ModCallback.POST_NPC_INIT, EntityType.GABRIEL)
  postNPCInitGabriel(): void {
    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
  }

  // 27, 950
  @Callback(ModCallback.POST_NPC_INIT, EntityType.DOGMA)
  postNPCInitDogma(): void {
    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
  }

  // 27, 951, 10
  @CallbackCustom(
    ModCallbackCustom.POST_NPC_INIT_FILTER,
    EntityType.BEAST,
    BeastVariant.ULTRA_FAMINE,
  )
  postNPCInitUltraFamine(): void {
    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
  }

  // 27, 951, 20
  @CallbackCustom(
    ModCallbackCustom.POST_NPC_INIT_FILTER,
    EntityType.BEAST,
    BeastVariant.ULTRA_PESTILENCE,
  )
  postNPCInitUltraPestilence(): void {
    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
  }

  // 27, 951, 30
  @CallbackCustom(
    ModCallbackCustom.POST_NPC_INIT_FILTER,
    EntityType.BEAST,
    BeastVariant.ULTRA_WAR,
  )
  postNPCInitUltraWar(): void {
    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
  }

  // 27, 951, 40
  @CallbackCustom(
    ModCallbackCustom.POST_NPC_INIT_FILTER,
    EntityType.BEAST,
    BeastVariant.ULTRA_DEATH,
  )
  postNPCInitUltraDeath(): void {
    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
  }

  // 68, 274
  @Callback(ModCallback.POST_ENTITY_KILL, EntityType.MEGA_SATAN)
  postEntityKillMegaSatan(): void {
    const bossID = getModifiedBossID();
    if (bossID !== BossID.MEGA_SATAN) {
      return;
    }

    const room = game.GetRoom();
    const roomFrameCount = room.GetFrameCount();
    v.room.tookDamageRoomFrame = roomFrameCount + GAME_FRAMES_PER_SECOND * 10;
    // (We need to account for the long appear animation. We do not use the `POST_NPC_INIT` callback
    // since it does not fire for Mega Satan 2.)
  }

  // 68, 406, 0
  @CallbackCustom(
    ModCallbackCustom.POST_ENTITY_KILL_FILTER,
    EntityType.ULTRA_GREED,
  )
  postEntityKillUltraGreed(): void {
    const room = game.GetRoom();
    const roomFrameCount = room.GetFrameCount();
    v.room.tookDamageRoomFrame = roomFrameCount + GAME_FRAMES_PER_SECOND * 7;
    // (We need to account for the long appear animation. We do not use the `POST_NPC_INIT` callback
    // since it does not fire for Ultra Greedier.)
  }

  // 68, 71
  @Callback(ModCallback.POST_ENTITY_KILL, EntityType.FISTULA_BIG)
  postEntityKillFistulaBig(): void {
    const bossID = getModifiedBossID();
    if (bossID !== BossID.FISTULA && bossID !== BossID.TERATOMA) {
      return;
    }

    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
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

    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
    return undefined;
  }

  @CallbackCustom(ModCallbackCustom.POST_HOLY_MANTLE_REMOVED)
  postHolyMantleRemoved(player: EntityPlayer): void {
    if (!isFirstPlayer(player)) {
      return;
    }

    const room = game.GetRoom();
    v.room.tookDamageRoomFrame = room.GetFrameCount();
  }
}

/**
 * Returns undefined if the player does not need the corresponding boss objective or if the current
 * situation is invalid for the objective.
 */
export function getSecondsSinceLastDamage(): int | undefined {
  const bossID = getModifiedBossID();
  if (bossID === undefined) {
    return undefined;
  }

  if (isBossObjectiveCompleted(bossID)) {
    return undefined;
  }

  const room = game.GetRoom();
  const isClear = room.IsClear();
  if (isClear) {
    return undefined;
  }

  if (onAnyChallenge()) {
    return undefined;
  }

  if (inBigRoom() && !BOSSES_IN_BIG_ROOMS_SET.has(bossID)) {
    return undefined;
  }

  if (v.room.usedPause) {
    return undefined;
  }

  // Boss-specific checks.
  switch (bossID) {
    // 24
    case BossID.SATAN: {
      if (onFirstPhaseOfSatan()) {
        return undefined;
      }

      break;
    }

    // 39, 40
    case BossID.ISAAC:
    case BossID.BLUE_BABY: {
      if (v.room.onFirstPhaseOfIsaac) {
        return undefined;
      }

      break;
    }

    // 63
    case BossID.HUSH: {
      if (v.room.onFirstPhaseOfHush) {
        return undefined;
      }

      break;
    }

    default: {
      break;
    }
  }

  // Verify the boss is alive.
  switch (bossID) {
    // 18, 33
    case BossID.FISTULA:
    case BossID.TERATOMA: {
      const bigPieces = getNPCs(EntityType.FISTULA_BIG, -1, -1, true);
      const mediumPieces = getNPCs(EntityType.FISTULA_MEDIUM, -1, -1, true);
      const smallPieces = getNPCs(EntityType.FISTULA_SMALL, -1, -1, true);
      const bosses = [...bigPieces, ...mediumPieces, ...smallPieces];
      const aliveBosses = bosses.filter((boss) => !boss.IsDead());

      if (aliveBosses.length < 4) {
        return;
      }

      break;
    }

    // 23
    case BossID.FALLEN: {
      const fallens = getNPCs(
        EntityType.FALLEN,
        FallenVariant.FALLEN,
        -1,
        true,
      );
      const aliveBosses = fallens.filter((boss) => !boss.IsDead());

      if (aliveBosses.length < 2) {
        return;
      }

      break;
    }

    // 31
    case BossID.LOKII: {
      const lokiis = getNPCs(EntityType.LOKI, LokiVariant.LOKII, -1, true);
      const aliveBosses = lokiis.filter((boss) => !boss.IsDead());

      if (aliveBosses.length < 2) {
        return;
      }

      break;
    }

    // 55
    case BossID.MEGA_SATAN: {
      const megaSatan2s = getNPCs(
        EntityType.MEGA_SATAN_2,
        MegaSatanVariant.MEGA_SATAN,
        -1,
        true,
      );
      const aliveBosses = megaSatan2s.filter((boss) => !boss.IsDead());

      if (aliveBosses.length === 0) {
        return;
      }

      break;
    }

    // 56
    case BossID.GURGLING: {
      const gurglings = getNPCs(
        EntityType.GURGLING,
        GurglingVariant.GURGLING_BOSS,
        -1,
        true,
      );
      const aliveBosses = gurglings.filter((boss) => !boss.IsDead());

      if (aliveBosses.length < 2) {
        return;
      }

      break;
    }

    // 61
    case BossID.RAG_MAN: {
      const ragMans = getNPCs(EntityType.RAG_MAN);
      const raglings = getNPCs(EntityType.RAGLING);
      const bosses = [...ragMans, ...raglings];
      const aliveBosses = bosses.filter((boss) => !boss.IsDead());

      if (aliveBosses.length < 3) {
        return;
      }

      break;
    }

    // 65
    case BossID.PEEP: {
      const peeps = getNPCs(EntityType.PEEP, PeepVariant.PEEP, -1, true);
      const peepEyes = getNPCs(EntityType.PEEP, PeepVariant.PEEP_EYE, -1, true);
      const bosses = [...peeps, ...peepEyes];
      const aliveBosses = bosses.filter((boss) => !boss.IsDead());

      if (aliveBosses.length < 3) {
        return;
      }

      break;
    }

    // 65
    case BossID.TURDLING: {
      const turdlings = getNPCs(
        EntityType.GURGLING,
        GurglingVariant.TURDLING,
        -1,
        true,
      );
      const aliveBosses = turdlings.filter((boss) => !boss.IsDead());

      if (aliveBosses.length < 2) {
        return;
      }

      break;
    }

    // 71
    case BossID.ULTRA_GREEDIER: {
      // The Ultra Greedier entity is not removed after the explosion and still counts as being
      // alive, so we must use the custom logic contained within the `isActiveEnemy` helper
      // function.
      const ultraGreediers = getNPCs(
        EntityType.ULTRA_GREED,
        UltraGreedVariant.ULTRA_GREEDIER,
        -1,
        true,
      );
      const aliveBosses = ultraGreediers.filter(
        (boss) => !boss.IsDead() && isActiveEnemy(boss),
      );

      if (aliveBosses.length === 0) {
        return;
      }

      break;
    }

    // 68
    case BossID.SISTERS_VIS: {
      const sistersVis = getNPCs(EntityType.SISTERS_VIS, -1, -1, true);
      const aliveBosses = sistersVis.filter((boss) => !boss.IsDead());

      if (aliveBosses.length < 2) {
        return;
      }

      break;
    }

    // 100
    case BossID.BEAST: {
      // The Beast is in state `NPCState.SPECIAL` (16) when off-screen.
      const beasts = getNPCs(EntityType.BEAST, BeastVariant.BEAST, -1, true);
      if (beasts.some((beast) => beast.State === NPCState.SPECIAL)) {
        return;
      }

      break;
    }

    case BossIDCustom.ULTRA_PRIDE: {
      const ultraPrides = getNPCs(
        EntityType.SLOTH,
        SlothVariant.ULTRA_PRIDE,
        -1,
        true,
      );
      const ultraPrideBabies = getNPCs(
        EntityType.BABY,
        BabyVariant.ULTRA_PRIDE_BABY,
        -1,
        true,
      );
      const bosses = [...ultraPrides, ...ultraPrideBabies];
      const aliveBosses = bosses.filter((boss) => !boss.IsDead());

      if (aliveBosses.length < 2) {
        return;
      }

      break;
    }

    case BossIDCustom.KRAMPUS: {
      const fallens = getNPCs(
        EntityType.FALLEN,
        FallenVariant.KRAMPUS,
        -1,
        true,
      );
      const aliveBosses = fallens.filter((boss) => !boss.IsDead());

      if (aliveBosses.length === 0) {
        return;
      }

      break;
    }

    case BossIDCustom.URIEL: {
      const uriels = getNPCs(EntityType.URIEL, -1, -1, true);
      const aliveBosses = uriels.filter((boss) => !boss.IsDead());

      if (aliveBosses.length === 0) {
        return;
      }

      break;
    }

    case BossIDCustom.GABRIEL: {
      const gabriels = getNPCs(EntityType.GABRIEL, -1, -1, true);
      const aliveBosses = gabriels.filter((boss) => !boss.IsDead());

      if (aliveBosses.length === 0) {
        return;
      }

      break;
    }

    case BossIDCustom.ULTRA_FAMINE: {
      const ultraFamines = getNPCs(
        EntityType.BEAST,
        BeastVariant.ULTRA_FAMINE,
        -1,
        true,
      );
      const aliveBosses = ultraFamines.filter((boss) => !boss.IsDead());

      if (aliveBosses.length === 0) {
        return;
      }

      break;
    }

    case BossIDCustom.ULTRA_PESTILENCE: {
      const ultraPestilences = getNPCs(
        EntityType.BEAST,
        BeastVariant.ULTRA_PESTILENCE,
        -1,
        true,
      );
      const aliveBosses = ultraPestilences.filter((boss) => !boss.IsDead());

      if (aliveBosses.length === 0) {
        return;
      }

      break;
    }

    case BossIDCustom.ULTRA_WAR: {
      const ultraWars = getNPCs(
        EntityType.BEAST,
        BeastVariant.ULTRA_WAR,
        -1,
        true,
      );
      const aliveBosses = ultraWars.filter((boss) => !boss.IsDead());

      if (aliveBosses.length === 0) {
        return;
      }

      break;
    }

    case BossIDCustom.ULTRA_DEATH: {
      const ultraDeaths = getNPCs(
        EntityType.BEAST,
        BeastVariant.ULTRA_DEATH,
        -1,
        true,
      );
      const aliveBosses = ultraDeaths.filter((boss) => !boss.IsDead());

      if (aliveBosses.length === 0) {
        return;
      }

      break;
    }

    default: {
      const [entityType, variant] = getEntityTypeVariantFromBossID(bossID);
      const bosses = getNPCs(entityType, variant, -1, true);
      const aliveBosses = bosses.filter((boss) => !boss.IsDead());

      if (aliveBosses.length === 0) {
        return;
      }

      break;
    }
  }

  const roomFrameCount = room.GetFrameCount();
  const elapsedGameFrames = roomFrameCount - v.room.tookDamageRoomFrame;

  return elapsedGameFrames / GAME_FRAMES_PER_SECOND;
}

function onFirstPhaseOfSatan(): boolean {
  const satans = getNPCs(EntityType.SATAN);
  if (satans.length === 0) {
    return false;
  }

  return satans.every((satan) => satan.State === NPCState.IDLE);
}

/**
 * Similar to the `getBossID` helper function from `isaacscript-common`, but works with custom boss
 * IDs for the randomizer.
 */
export function getModifiedBossID(): BossID | undefined {
  const room = game.GetRoom();
  const roomType = room.GetType();

  switch (roomType) {
    // 6
    case RoomType.MINI_BOSS: {
      const roomSubType = getRoomSubType();

      switch (roomSubType) {
        case MinibossID.ULTRA_PRIDE: {
          return BossIDCustom.ULTRA_PRIDE;
        }

        case MinibossID.KRAMPUS: {
          return BossIDCustom.KRAMPUS;
        }

        default: {
          return undefined;
        }
      }
    }

    // 14
    case RoomType.DEVIL: {
      if (doesEntityExist(EntityType.FALLEN, FallenVariant.KRAMPUS)) {
        return BossIDCustom.KRAMPUS;
      }

      return undefined;
    }

    // 15
    case RoomType.ANGEL: {
      if (doesEntityExist(EntityType.URIEL)) {
        return BossIDCustom.URIEL;
      }

      if (doesEntityExist(EntityType.GABRIEL)) {
        return BossIDCustom.GABRIEL;
      }

      break;
    }

    // 16
    case RoomType.DUNGEON: {
      if (doesEntityExist(EntityType.BEAST, BeastVariant.ULTRA_FAMINE)) {
        return BossIDCustom.ULTRA_FAMINE;
      }

      if (doesEntityExist(EntityType.BEAST, BeastVariant.ULTRA_PESTILENCE)) {
        return BossIDCustom.ULTRA_PESTILENCE;
      }

      if (doesEntityExist(EntityType.BEAST, BeastVariant.ULTRA_WAR)) {
        return BossIDCustom.ULTRA_WAR;
      }

      if (doesEntityExist(EntityType.BEAST, BeastVariant.ULTRA_DEATH)) {
        return BossIDCustom.ULTRA_DEATH;
      }

      break;
    }

    default: {
      break;
    }
  }

  const bID = getBossID();
  const isRep = isRepentanceStage(getStageType());
  if (!isRep) return bID;
  else {
    if (bID == BossID.MOM) return BossID.MAUSOLEUM_MOM;
    if (bID == BossID.MOMS_HEART) return BossID.MAUSOLEUM_MOMS_HEART;
    return bID;
  }
}
