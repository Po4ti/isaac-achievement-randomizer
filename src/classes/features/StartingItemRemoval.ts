import {
  CardType,
  CollectibleType,
  EffectVariant,
  PillColor,
  PillEffect,
  PlayerType,
  SoundEffect,
  TrinketType,
} from "isaac-typescript-definitions";
import {
  CallbackCustom,
  ModCallbackCustom,
  VANILLA_COLLECTIBLE_TYPES,
  game,
  getRandomArrayElement,
  getRandomInt,
  isEden,
  isGoldenTrinketType,
  newRNG,
  rebirthItemTrackerRemoveCollectible,
  removeAllEffects,
  removeAllFamiliars,
  removeAllPickups,
  removeAllTears,
  setPlayerHealth,
  setRunSeed,
  sfxManager,
} from "isaacscript-common";
import { BANNED_COLLECTIBLE_TYPES_SET } from "../../arrays/unlockableCollectibleTypes";
import { BANNED_TRINKET_TYPES_SET } from "../../arrays/unlockableTrinketTypes";
import { POCKET_ITEM_SLOTS, TRINKET_SLOTS } from "../../cachedEnums";
import { OtherUnlockKind } from "../../enums/OtherUnlockKind";
import { mod } from "../../mod";
import { RandomizerModFeature } from "../RandomizerModFeature";
import { getRandomizerRunSeedString, preForcedRestart } from "./StatsTracker";
import {
  anyPillEffectsUnlocked,
  getUnlockedEdenActiveCollectibleTypes,
  getUnlockedEdenPassiveCollectibleTypes,
  isCardTypeUnlocked,
  isCharacterUnlocked,
  isCollectibleTypeUnlocked,
  isOtherUnlockKindUnlocked,
  isPillEffectUnlocked,
  isTrinketTypeUnlocked,
} from "./achievementTracker/completedUnlocks";

import { incrementSeedShiftCounter } from "./StatsTracker";
/** This feature handles removing the starting items of a player that are not unlocked yet. */
export class StartingItemRemoval extends RandomizerModFeature {
  @CallbackCustom(ModCallbackCustom.POST_PLAYER_INIT_FIRST)
  postPlayerInitFirst(): void {
    this.removeItemsFromInventory();
  }

  removeItemsFromInventory(): void {
    const player = Isaac.GetPlayer();
    const character = player.GetPlayerType();

    if (player.HasCollectible(CollectibleType.RED_STEW)) {
      incrementSeedShiftCounter();
      let newStartSeedString = getRandomizerRunSeedString() as string;
      print("Red stew detected");
      print("Trying to set seed to", newStartSeedString);
      mod.runNextRenderFrame(() => {
        preForcedRestart();
        setRunSeed(newStartSeedString);
      });
    }

    for (const collectibleType of VANILLA_COLLECTIBLE_TYPES) {
      if (
        player.HasCollectible(collectibleType) &&
        (!isCollectibleTypeUnlocked(collectibleType, true) ||
          BANNED_COLLECTIBLE_TYPES_SET.has(collectibleType) ||
          isEden(player)) &&
        !(
          //Leave bag on TCain
          (
            character == PlayerType.CAIN_B &&
            collectibleType == CollectibleType.BAG_OF_CRAFTING
          )
        )
      ) {
        player.RemoveCollectible(collectibleType);
        rebirthItemTrackerRemoveCollectible(collectibleType);
      }
    }

    for (const trinketSlot of TRINKET_SLOTS) {
      const trinketType = player.GetTrinket(trinketSlot);
      if (
        trinketType !== TrinketType.NULL &&
        (!isTrinketTypeUnlocked(trinketType, true) ||
          (isGoldenTrinketType(trinketType) &&
            !isOtherUnlockKindUnlocked(OtherUnlockKind.GOLD_TRINKETS, true)) ||
          BANNED_TRINKET_TYPES_SET.has(trinketType) ||
          isEden(player))
      ) {
        player.TryRemoveTrinket(trinketType);
      }
    }

    for (const pocketItemSlot of POCKET_ITEM_SLOTS) {
      const pillColor = player.GetPill(pocketItemSlot);
      if (
        pillColor !== PillColor.NULL &&
        (!anyPillEffectsUnlocked(true) ||
          isEden(player) ||
          (character === PlayerType.MAGDALENE &&
            !isPillEffectUnlocked(PillEffect.SPEED_UP, true)))
      ) {
        player.SetPill(pocketItemSlot, PillColor.NULL);
      }

      const cardType = player.GetCard(pocketItemSlot);
      if (
        cardType !== CardType.NULL &&
        (!isCardTypeUnlocked(cardType, true) || isEden(player))
      ) {
        player.SetCard(pocketItemSlot, CardType.NULL);
      }
    }

    switch (character) {
      // 9, 30
      case PlayerType.EDEN:
      case PlayerType.EDEN_B: {
        // Eden may be randomly given collectibles that are not yet unlocked, so we remove all
        // collectibles and then explicitly add two new ones.
        // this.emptyEdenInventory(player);

        this.addEdenRandomCollectibles(player);
        break;
      }

      default: {
        break;
      }
    }
  }

  /** Collectibles, trinkets, cards, and pills were removed earlier on. */
  emptyEdenInventory(player: EntityPlayer): void {
    // Some collectibles will spawn things in the room.
    removeAllPickups();
    removeAllTears();
    removeAllFamiliars();
    removeAllEffects(EffectVariant.BLOOD_EXPLOSION); // 2
    removeAllEffects(EffectVariant.POOF_1); // 15
    sfxManager.Stop(SoundEffect.MEAT_JUMPS); // 72
    sfxManager.Stop(SoundEffect.TEARS_FIRE); // 153

    // Some collectibles will add health.
    const startingHealth = mod.getEdenStartingHealth(player);
    if (startingHealth !== undefined) {
      setPlayerHealth(player, startingHealth);
    }
  }

  addEdenRandomCollectibles(player: EntityPlayer): void {
    const character = player.GetPlayerType();
    if (!isCharacterUnlocked(character, true)) {
      return;
    }

    /////////0. Remove room pickups////////////////

    ///////////////////1. Health//////////////////////////

    player.AddBlackHearts(-1000);
    player.AddMaxHearts(-1000, false);
    player.AddEternalHearts(-1000);
    player.AddBoneHearts(-1000);
    player.AddBrokenHearts(-1000);
    player.AddGoldenHearts(-1000);

    //The game randomly picks x = 0 to 3 Red Hearts;
    //It will randomly pick between 0 and (3 - x) Soul Hearts;
    //If no red hearts were picked at the first step, the game guarantees the player at least 2 Soul Hearts.

    const seeds = game.GetSeeds();
    const startSeed = seeds.GetStartSeed();

    const red_hearts = getRandomInt(0, 3, newRNG(startSeed));
    let soul_hearts = getRandomInt(0, 3 - red_hearts, newRNG(startSeed));
    if (red_hearts == 0 && soul_hearts < 2) soul_hearts = 2;

    player.AddMaxHearts(red_hearts * 2, false);
    player.AddHearts(red_hearts * 2);

    player.AddSoulHearts(soul_hearts * 2);

    ////////////////////2. Pickups//////////////////

    ////////////////////3. Pocket items////////////////

    /////////////////4. Items//////////////////////

    const activeCollectibleTypes = getUnlockedEdenActiveCollectibleTypes(true);
    const passiveCollectibleTypes =
      getUnlockedEdenPassiveCollectibleTypes(true);

    const passiveCollectibleType =
      passiveCollectibleTypes.length > 0
        ? getRandomArrayElement(passiveCollectibleTypes, newRNG(startSeed))
        : undefined;

    // If we do not have any active collectibles unlocked, default to giving Eden a second passive
    // collectible.

    let act = undefined;

    if (activeCollectibleTypes.length > 0) {
      act = getRandomArrayElement(activeCollectibleTypes, newRNG(startSeed));
    } else if (passiveCollectibleTypes.length > 1) {
      act = getRandomArrayElement(passiveCollectibleTypes, newRNG(startSeed), [
        passiveCollectibleType,
      ]);
    }
    const activeCollectibleType = act;

    if (activeCollectibleType != undefined) {
      player.AddCollectible(activeCollectibleType);
      player.FullCharge();
    }
    if (passiveCollectibleType != undefined)
      player.AddCollectible(passiveCollectibleType);
  }
}
