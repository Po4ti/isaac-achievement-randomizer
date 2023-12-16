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
        this.emptyEdenInventory(player);
        this.addEdenRandomCollectibles(player);
        break;
      }

      default: {
        break;
      }
    }
  }

  getEdenCard(rng: RNG): CardType {
    if (getRandomInt(0, 24, rng) == 0) {
      // Special cards from Chaos Card to Era Walk, with 2 more cards in Repentance.

      let card = getRandomInt(0, 14, rng) + 42;

      if (card == 55) {
        card = 78;
      } // Cracked key
      if (card == 56) {
        card = 80;
      } // Wild Card

      return card;
    }

    // The checks of Runes and Playing cards are removed in Repentance, too.

    // Normal cards from The Fool to The World
    let card = getRandomInt(0, 21, rng) + 1;

    // Reversed Major Arcana Cards; added in Repentance
    if (getRandomInt(0, 6, rng) == 0) {
      card += 55;
    }

    return card;
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

    player.AddKeys(-10000);
    player.AddBombs(-10000);
    player.AddCoins(-10000);

    const seeds = game.GetSeeds();
    const startSeed = seeds.GetStartSeed();
    const rng = newRNG(startSeed);

    if (getRandomInt(0, 2, rng) == 0) {
      const pickup = getRandomInt(0, 2, rng);
      if (pickup == 0) {
        player.AddKeys(1);
      } else if (pickup == 1) {
        player.AddBombs(getRandomInt(0, 1, rng));
      } else {
        player.AddCoins(getRandomInt(0, 4, rng));
      }
    }

    player.SetCard(0, CardType.NULL);
    player.SetCard(1, CardType.NULL);

    if (getRandomInt(0, 2, rng) <= 1) {
      // 2/3 chance to get pill, card or nothing
      if (getRandomInt(0, 1, rng) < 1) {
        // 2/3 * 1/2 chance to get nothing
        player.SetCard(0, CardType.NULL);
      } else {
        // 2/3 * 1/2 chance to get a pill or a card
        if (getRandomInt(0, 1, rng) < 1) {
          // 1/3 * 1/2 chance to generate a pill
          if (anyPillEffectsUnlocked(true))
            player.SetPill(0, getRandomInt(1, 13, rng));
          //give a random pill
        } else {
          // 1/3 * 1/2 chance to generate a card
          const card_to_give = this.getEdenCard(rng);
          if (isCardTypeUnlocked(card_to_give, true))
            player.SetCard(0, card_to_give);
        }
      }
    } else {
      // 1/3 chance to get a trinket
      //give a random trinket
      let trinket_to_give;
      let found_trinket = false;
      let count = 64;
      let cur_trinket = player.GetTrinket(0);
      if (cur_trinket != 0) player.TryRemoveTrinket(player.GetTrinket(0));
      while (count > 0 && !found_trinket) {
        trinket_to_give = getRandomInt(1, 189, rng);
        found_trinket = isTrinketTypeUnlocked(trinket_to_give, true);
        if (found_trinket && BANNED_TRINKET_TYPES_SET.has(trinket_to_give))
          found_trinket = false;
        count--;
      }

      if (found_trinket) {
        player.AddTrinket(trinket_to_give as int, true);
      }
    }
  }

  addEdenRandomCollectibles(player: EntityPlayer): void {
    const character = player.GetPlayerType();
    if (!isCharacterUnlocked(character, true)) {
      return;
    }

    const seeds = game.GetSeeds();
    const startSeed = seeds.GetStartSeed();
    const rng = newRNG(startSeed);

    const activeCollectibleTypes = getUnlockedEdenActiveCollectibleTypes(true);
    const passiveCollectibleTypes =
      getUnlockedEdenPassiveCollectibleTypes(true);

    const passiveCollectibleType =
      passiveCollectibleTypes.length > 0
        ? getRandomArrayElement(passiveCollectibleTypes, rng)
        : undefined;
    // If we do not have any active collectibles unlocked, default to giving Eden a second passive
    // collectible.

    let act = undefined;

    if (activeCollectibleTypes.length > 0) {
      act = getRandomArrayElement(activeCollectibleTypes, rng);
    } else if (passiveCollectibleTypes.length > 1) {
      act = getRandomArrayElement(passiveCollectibleTypes, rng, [
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
