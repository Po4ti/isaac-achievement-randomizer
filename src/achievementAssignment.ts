import type { Challenge } from "isaac-typescript-definitions";
import {
  BatterySubType,
  BombSubType,
  CardType,
  CoinSubType,
  HeartSubType,
  KeySubType,
  PickupVariant,
  PlayerType,
  SackSubType,
} from "isaac-typescript-definitions";
import {
  CHEST_PICKUP_VARIANTS,
  DefaultMap,
  MAIN_CHARACTERS,
  VANILLA_CARD_TYPES,
  VANILLA_PILL_EFFECTS,
  VANILLA_TRINKET_TYPES,
  arrayRemoveIndexInPlace,
  assertDefined,
  copyArray,
  getRandomArrayElementAndRemove,
  newRNG,
} from "isaacscript-common";
import {
  ACHIEVEMENT_TYPES,
  BATTERY_SUB_TYPES,
  BOMB_SUB_TYPES,
  CHALLENGES,
  COIN_SUB_TYPES,
  HEART_SUB_TYPES,
  KEY_SUB_TYPES,
  PILL_ACHIEVEMENT_KINDS,
  SACK_SUB_TYPES,
  UNLOCKABLE_PATHS,
} from "./cachedEnums";
import { AchievementType } from "./enums/AchievementType";
import { CharacterObjective } from "./enums/CharacterObjective";
import { UnlockablePath } from "./enums/UnlockablePath";
import type { Achievement } from "./types/Achievement";
import { UNLOCKABLE_COLLECTIBLE_TYPES } from "./unlockableCollectibleTypes";

interface Achievements {
  characterAchievements: CharacterAchievements;
  challengeAchievements: ChallengeAchievements;
}

type CharacterAchievements = DefaultMap<
  PlayerType,
  Map<CharacterObjective, Achievement>
>;

type ChallengeAchievements = Map<Challenge, Achievement>;

const EASY_OBJECTIVES = [
  CharacterObjective.MOM,
  CharacterObjective.IT_LIVES,
  CharacterObjective.ISAAC,
  CharacterObjective.SATAN,
  CharacterObjective.NO_DAMAGE_BASEMENT_1,
  CharacterObjective.NO_DAMAGE_BASEMENT_2,
  CharacterObjective.NO_DAMAGE_CAVES_1,
  CharacterObjective.NO_DAMAGE_CAVES_2,
  CharacterObjective.NO_DAMAGE_DEPTHS_1,
  CharacterObjective.NO_DAMAGE_DEPTHS_2,
  CharacterObjective.NO_DAMAGE_WOMB_1,
  CharacterObjective.NO_DAMAGE_WOMB_2,
] as const;

const EASY_UNLOCKABLE_PATHS = [
  UnlockablePath.THE_CHEST,
  UnlockablePath.DARK_ROOM,
] as const;

export function getAchievementsForSeed(seed: Seed): Achievements {
  const rng = newRNG(seed);

  const characterAchievements = new DefaultMap<
    PlayerType,
    Map<CharacterObjective, Achievement>
  >(() => new Map());

  const challengeAchievements = new Map<Challenge, Achievement>();

  const achievements = getAllAchievements();

  // The Polaroid and The Negative are guaranteed to be behind an easy objective for Isaac.
  const isaacAchievements = characterAchievements.getAndSetDefault(
    PlayerType.ISAAC,
  );
  const easyObjectives = copyArray(EASY_OBJECTIVES);
  for (const unlockablePath of EASY_UNLOCKABLE_PATHS) {
    const achievement = getAndRemovePathAchievement(
      achievements,
      unlockablePath,
    );
    const randomEasyAchievement = getRandomArrayElementAndRemove(
      easyObjectives,
      rng,
    );
    isaacAchievements.set(randomEasyAchievement, achievement);
  }

  // Pick the character achievements.
  // TODO

  // Pick the rest of the achievements.
  // TODO

  return { characterAchievements, challengeAchievements };
}

function getAllAchievements(): Achievement[] {
  const achievements: Achievement[] = [];

  for (const achievementType of ACHIEVEMENT_TYPES) {
    switch (achievementType) {
      case AchievementType.CHARACTER: {
        for (const character of MAIN_CHARACTERS) {
          if (character === PlayerType.ISAAC) {
            continue;
          }

          const achievement: Achievement = {
            type: AchievementType.CHARACTER,
            character,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.PATH: {
        for (const unlockablePath of UNLOCKABLE_PATHS) {
          const achievement: Achievement = {
            type: AchievementType.PATH,
            unlockablePath,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.CHALLENGE: {
        for (const challenge of CHALLENGES) {
          const achievement: Achievement = {
            type: AchievementType.CHALLENGE,
            challenge,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.COLLECTIBLE: {
        for (const collectibleType of UNLOCKABLE_COLLECTIBLE_TYPES) {
          const achievement: Achievement = {
            type: AchievementType.COLLECTIBLE,
            collectibleType,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.TRINKET: {
        for (const trinketType of VANILLA_TRINKET_TYPES) {
          const achievement: Achievement = {
            type: AchievementType.TRINKET,
            trinketType,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.CARD: {
        for (const cardType of VANILLA_CARD_TYPES) {
          if (cardType === CardType.RUNE_SHARD) {
            continue;
          }

          const achievement: Achievement = {
            type: AchievementType.CARD,
            cardType,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.PILL_EFFECT: {
        for (const pillEffect of VANILLA_PILL_EFFECTS) {
          const achievement: Achievement = {
            type: AchievementType.PILL_EFFECT,
            pillEffect,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.PILL: {
        for (const pillAchievementKind of PILL_ACHIEVEMENT_KINDS) {
          const achievement: Achievement = {
            type: AchievementType.PILL,
            kind: pillAchievementKind,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.HEART: {
        for (const heartSubType of HEART_SUB_TYPES) {
          if (
            heartSubType === HeartSubType.NULL || // 0
            heartSubType === HeartSubType.HALF // 2
          ) {
            continue;
          }

          const achievement: Achievement = {
            type: AchievementType.HEART,
            heartSubType,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.COIN: {
        for (const coinSubType of COIN_SUB_TYPES) {
          if (
            coinSubType === CoinSubType.NULL || // 0
            coinSubType === CoinSubType.PENNY // 1
          ) {
            continue;
          }

          const achievement: Achievement = {
            type: AchievementType.COIN,
            coinSubType,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.BOMB: {
        for (const bombSubType of BOMB_SUB_TYPES) {
          if (
            bombSubType === BombSubType.NULL || // 0
            bombSubType === BombSubType.NORMAL || // 1
            bombSubType === BombSubType.TROLL || // 3
            bombSubType === BombSubType.MEGA_TROLL || // 5
            bombSubType === BombSubType.GOLDEN_TROLL || // 6
            bombSubType === BombSubType.GIGA // 7
          ) {
            continue;
          }

          const achievement: Achievement = {
            type: AchievementType.BOMB,
            bombSubType,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.KEY: {
        for (const keySubType of KEY_SUB_TYPES) {
          if (
            keySubType === KeySubType.NULL || // 0
            keySubType === KeySubType.NORMAL // 1
          ) {
            continue;
          }

          const achievement: Achievement = {
            type: AchievementType.KEY,
            keySubType,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.BATTERY: {
        for (const batterySubType of BATTERY_SUB_TYPES) {
          if (
            batterySubType === BatterySubType.NULL // 0
          ) {
            continue;
          }

          const achievement: Achievement = {
            type: AchievementType.BATTERY,
            batterySubType,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.SACK: {
        for (const sackSubType of SACK_SUB_TYPES) {
          if (
            sackSubType === SackSubType.NULL // 0
          ) {
            continue;
          }

          const achievement: Achievement = {
            type: AchievementType.SACK,
            sackSubType,
          };
          achievements.push(achievement);
        }

        break;
      }

      case AchievementType.CHEST: {
        for (const pickupVariant of CHEST_PICKUP_VARIANTS) {
          if (
            pickupVariant === PickupVariant.CHEST || // 50
            pickupVariant === PickupVariant.OLD_CHEST || // 55
            pickupVariant === PickupVariant.MOMS_CHEST // 390
          ) {
            continue;
          }

          const achievement: Achievement = {
            type: AchievementType.CHEST,
            pickupVariant,
          };
          achievements.push(achievement);
        }

        break;
      }
    }
  }

  return achievements;
}

function getAndRemovePathAchievement(
  achievements: Achievement[],
  unlockablePath: UnlockablePath,
): Achievement {
  const index = achievements.findIndex(
    (achievement) =>
      achievement.type === AchievementType.PATH &&
      achievement.unlockablePath === unlockablePath,
  );
  if (index === -1) {
    error(`Failed to find path achievement: ${unlockablePath}`);
  }

  const achievement = achievements[index];
  assertDefined(
    achievement,
    `Failed to find the path achievement at index: ${index}`,
  );

  arrayRemoveIndexInPlace(achievements, index);

  return achievement;
}