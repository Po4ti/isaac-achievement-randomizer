import { CollectibleType } from "isaac-typescript-definitions";
import { arrayRemove, copyArray } from "isaacscript-common";
import {
  ALT_FLOORS,
  OTHER_UNLOCK_KINDS,
  UNLOCKABLE_PATHS,
  UNLOCK_TYPES,
} from "../cachedEnums";
import { UnlockType } from "../enums/UnlockType";
import type { Unlock } from "../types/Unlock";
import { UNLOCKABLE_CARD_TYPES } from "./unlockableCardTypes";
import { UNLOCKABLE_CHALLENGES } from "./unlockableChallenges";
import { UNLOCKABLE_CHARACTERS } from "./unlockableCharacters";
import {
  BOSS_ROOM_COLLECTIBLE_TYPE_EXCEPTIONS,
  getUnlockableCollectibleTypes,
} from "./unlockableCollectibleTypes";
import { UNLOCKABLE_GRID_ENTITY_TYPES } from "./unlockableGridEntityTypes";
import {
  UNLOCKABLE_BATTERY_SUB_TYPES,
  UNLOCKABLE_BOMB_SUB_TYPES,
  UNLOCKABLE_CHEST_PICKUP_VARIANTS,
  UNLOCKABLE_COIN_SUB_TYPES,
  UNLOCKABLE_HEART_SUB_TYPES,
  UNLOCKABLE_KEY_SUB_TYPES,
  UNLOCKABLE_SACK_SUB_TYPES,
} from "./unlockablePickupTypes";
import { UNLOCKABLE_PILL_EFFECTS } from "./unlockablePillEffects";
import {
  UNLOCKABLE_ROOM_TYPES_ONLY_NIGHTMARE,
  getUnlockableRoomTypes,
} from "./unlockableRoomTypes";
import { UNLOCKABLE_SLOT_VARIANTS } from "./unlockableSlotVariants";
import { UNLOCKABLE_TRINKET_TYPES } from "./unlockableTrinketTypes";

const ALL_UNLOCKS: readonly Unlock[] = (() => {
  const unlocks: Unlock[] = [];

  for (const unlockType of UNLOCK_TYPES) {
    switch (unlockType) {
      case UnlockType.CHARACTER: {
        for (const character of UNLOCKABLE_CHARACTERS) {
          const unlock: Unlock = {
            type: UnlockType.CHARACTER,
            character,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.PATH: {
        for (const unlockablePath of UNLOCKABLE_PATHS) {
          const unlock: Unlock = {
            type: UnlockType.PATH,
            unlockablePath,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.ALT_FLOOR: {
        for (const altFloor of ALT_FLOORS) {
          const unlock: Unlock = {
            type: UnlockType.ALT_FLOOR,
            altFloor,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.ROOM: {
        const unlockableRoomTypes = getUnlockableRoomTypes(false);
        for (const roomType of unlockableRoomTypes) {
          const unlock: Unlock = {
            type: UnlockType.ROOM,
            roomType,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.CHALLENGE: {
        for (const challenge of UNLOCKABLE_CHALLENGES) {
          const unlock: Unlock = {
            type: UnlockType.CHALLENGE,
            challenge,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.COLLECTIBLE: {
        const unlockableCollectibleTypes = getUnlockableCollectibleTypes(false);
        for (const collectibleType of unlockableCollectibleTypes) {
          const unlock: Unlock = {
            type: UnlockType.COLLECTIBLE,
            collectibleType,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.TRINKET: {
        for (const trinketType of UNLOCKABLE_TRINKET_TYPES) {
          const unlock: Unlock = {
            type: UnlockType.TRINKET,
            trinketType,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.CARD: {
        for (const cardType of UNLOCKABLE_CARD_TYPES) {
          const unlock: Unlock = {
            type: UnlockType.CARD,
            cardType,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.PILL_EFFECT: {
        for (const pillEffect of UNLOCKABLE_PILL_EFFECTS) {
          const unlock: Unlock = {
            type: UnlockType.PILL_EFFECT,
            pillEffect,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.HEART: {
        for (const heartSubType of UNLOCKABLE_HEART_SUB_TYPES) {
          const unlock: Unlock = {
            type: UnlockType.HEART,
            heartSubType,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.COIN: {
        for (const coinSubType of UNLOCKABLE_COIN_SUB_TYPES) {
          const unlock: Unlock = {
            type: UnlockType.COIN,
            coinSubType,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.BOMB: {
        for (const bombSubType of UNLOCKABLE_BOMB_SUB_TYPES) {
          const unlock: Unlock = {
            type: UnlockType.BOMB,
            bombSubType,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.KEY: {
        for (const keySubType of UNLOCKABLE_KEY_SUB_TYPES) {
          const unlock: Unlock = {
            type: UnlockType.KEY,
            keySubType,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.BATTERY: {
        for (const batterySubType of UNLOCKABLE_BATTERY_SUB_TYPES) {
          const unlock: Unlock = {
            type: UnlockType.BATTERY,
            batterySubType,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.SACK: {
        for (const sackSubType of UNLOCKABLE_SACK_SUB_TYPES) {
          const unlock: Unlock = {
            type: UnlockType.SACK,
            sackSubType,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.CHEST: {
        for (const pickupVariant of UNLOCKABLE_CHEST_PICKUP_VARIANTS) {
          const unlock: Unlock = {
            type: UnlockType.CHEST,
            pickupVariant,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.SLOT: {
        for (const slotVariant of UNLOCKABLE_SLOT_VARIANTS) {
          const unlock: Unlock = {
            type: UnlockType.SLOT,
            slotVariant,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.GRID_ENTITY: {
        for (const gridEntityType of UNLOCKABLE_GRID_ENTITY_TYPES) {
          const unlock: Unlock = {
            type: UnlockType.GRID_ENTITY,
            gridEntityType,
          };
          unlocks.push(unlock);
        }

        break;
      }

      case UnlockType.OTHER: {
        for (const otherUnlockKind of OTHER_UNLOCK_KINDS) {
          const unlock: Unlock = {
            type: UnlockType.OTHER,
            kind: otherUnlockKind,
          };
          unlocks.push(unlock);
        }

        break;
      }
    }
  }

  return unlocks;
})();

const ALL_UNLOCKS_NIGHTMARE: readonly Unlock[] = (() => {
  const unlocks = copyArray(ALL_UNLOCKS);

  // UnlockType.ROOM
  for (const roomType of UNLOCKABLE_ROOM_TYPES_ONLY_NIGHTMARE) {
    const unlock: Unlock = {
      type: UnlockType.ROOM,
      roomType,
    };
    unlocks.push(unlock);
  }

  // UnlockType.COLLECTIBLE
  const extraNightmareCollectibleTypes = arrayRemove(
    BOSS_ROOM_COLLECTIBLE_TYPE_EXCEPTIONS,
    CollectibleType.BREAKFAST,
  );

  for (const collectibleType of extraNightmareCollectibleTypes) {
    const unlock: Unlock = {
      type: UnlockType.COLLECTIBLE,
      collectibleType,
    };
    unlocks.push(unlock);
  }

  return unlocks;
})();

export function getAllUnlocks(nightmareMode: boolean): readonly Unlock[] {
  return nightmareMode ? ALL_UNLOCKS_NIGHTMARE : ALL_UNLOCKS;
}
