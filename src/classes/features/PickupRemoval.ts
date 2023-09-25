import type { BatterySubType, SackSubType } from "isaac-typescript-definitions";
import {
  BombSubType,
  CardType,
  ChestSubType,
  CoinSubType,
  CollectibleType,
  EffectVariant,
  HeartSubType,
  KeySubType,
  ModCallback,
  PickupVariant,
  PillColor,
  PillEffect,
  PlayerType,
  PocketItemSlot,
  SoundEffect,
  TrinketSlot,
  TrinketType,
} from "isaac-typescript-definitions";
import {
  Callback,
  CallbackCustom,
  FIRST_PILL_COLOR,
  ModCallbackCustom,
  VANILLA_COLLECTIBLE_TYPES,
  copySet,
  game,
  getCharacterStartingCollectibleTypes,
  getCharacterStartingTrinketType,
  getNormalPillColorFromHorse,
  getRandomArrayElement,
  getRandomSetElement,
  isChestVariant,
  isGoldPill,
  isHorsePill,
  isRune,
  isSuitCard,
  log,
  removeAllEffects,
  removeAllFamiliars,
  removeAllPickups,
  removeAllTears,
  removeCollectibleFromPools,
  removeTrinketFromPools,
  setCollectibleSubType,
  setPlayerHealth,
  sfxManager,
} from "isaacscript-common";
import { MOD_NAME } from "../../constants";
import { mod } from "../../mod";
import {
  BANNED_COLLECTIBLE_TYPES,
  UNLOCKABLE_COLLECTIBLE_TYPES,
} from "../../unlockableCollectibleTypes";
import {
  BANNED_TRINKET_TYPES,
  UNLOCKABLE_TRINKET_TYPES,
} from "../../unlockableTrinketTypes";
import { RandomizerModFeature } from "../RandomizerModFeature";
import {
  anyCardTypesUnlocked,
  anyPillEffectsUnlocked,
  getUnlockedCardTypes,
  getUnlockedPillEffects,
  getUnlockedTrinketTypes,
  isAllCharacterAchievementsCompleted,
  isBatterySubTypeUnlocked,
  isBombSubTypeUnlocked,
  isCardTypeUnlocked,
  isChestVariantUnlocked,
  isCoinSubTypeUnlocked,
  isCollectibleTypeUnlocked,
  isGoldPillUnlocked,
  isHeartSubTypeUnlocked,
  isHorsePillsUnlocked,
  isKeySubTypeUnlocked,
  isPillEffectUnlocked,
  isSackSubTypeUnlocked,
  isTrinketTypeUnlocked,
} from "./AchievementTracker";

/** This feature handles removing all of the pickups from the game that are not unlocked yet. */
export class PickupRemoval extends RandomizerModFeature {
  // 20
  @Callback(ModCallback.GET_CARD)
  getCard(
    _rng: RNG,
    cardType: CardType,
    includePlayingCards: boolean,
    includeRunes: boolean,
    onlyRunes: boolean,
  ): CardType | undefined {
    if (isCardTypeUnlocked(cardType)) {
      return undefined;
    }

    const unlockedCardTypes = getUnlockedCardTypes();

    // If there are no unlocked card types, the card will be replaced with a coin in the
    // `POST_PICKUP_SELECTION_FILTER` callback.
    if (unlockedCardTypes.size === 0) {
      return undefined;
    }

    const runeCardTypes = [...unlockedCardTypes].filter((unlockedCardType) =>
      isRune(unlockedCardType),
    );

    if (onlyRunes) {
      return runeCardTypes.length === 0
        ? CardType.RUNE_SHARD
        : getRandomArrayElement(runeCardTypes);
    }

    const playingCardTypes = [...unlockedCardTypes].filter((unlockedCardType) =>
      isSuitCard(unlockedCardType),
    );

    const cardTypesToUse = copySet(unlockedCardTypes);

    if (!includePlayingCards) {
      for (const playingCardType of playingCardTypes) {
        cardTypesToUse.delete(playingCardType);
      }
    }

    if (!includeRunes) {
      for (const runeCardType of runeCardTypes) {
        cardTypesToUse.delete(runeCardType);
      }
    }

    return getRandomSetElement(cardTypesToUse);
  }

  /**
   * Set items are unlockable, but they will show up even if they are removed from pools. Replace
   * them with Breakfast.
   */
  // 34, 100
  @Callback(ModCallback.POST_PICKUP_INIT, PickupVariant.COLLECTIBLE)
  postPickupInitCollectible(pickup: EntityPickup): void {
    const collectible = pickup as EntityPickupCollectible;
    if (!isCollectibleTypeUnlocked(collectible.SubType)) {
      setCollectibleSubType(collectible, CollectibleType.BREAKFAST);
    }
  }

  // 37
  @Callback(ModCallback.POST_PICKUP_SELECTION)
  postPickupSelection(
    _pickup: EntityPickup,
    pickupVariant: PickupVariant,
    _subType: int,
  ): [PickupVariant, int] | undefined {
    if (!isChestVariant(pickupVariant)) {
      return undefined;
    }

    return isChestVariantUnlocked(pickupVariant)
      ? undefined
      : [PickupVariant.CHEST, ChestSubType.CLOSED];
  }

  // 65
  @Callback(ModCallback.GET_PILL_EFFECT)
  getPillEffect(
    pillEffect: PillEffect,
    _pillColor: PillColor,
  ): PillEffect | undefined {
    if (isPillEffectUnlocked(pillEffect)) {
      return undefined;
    }

    const unlockedPillEffects = getUnlockedPillEffects();

    // If there are no unlocked pill effects, the pill will be replaced with a coin in the
    // `POST_PICKUP_SELECTION_FILTER` callback.
    if (unlockedPillEffects.size === 0) {
      return undefined;
    }

    return getRandomSetElement(unlockedPillEffects);
  }

  @CallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED, false)
  postGameStartedReorderedFalse(): void {
    const itemPool = game.GetItemPool();
    const seeds = game.GetSeeds();
    const startSeedString = seeds.GetStartSeedString();
    const player = Isaac.GetPlayer();
    const character = player.GetPlayerType();

    log(`${MOD_NAME} started on seed: ${startSeedString}`);

    for (const collectibleType of UNLOCKABLE_COLLECTIBLE_TYPES) {
      if (!isCollectibleTypeUnlocked(collectibleType)) {
        itemPool.RemoveCollectible(collectibleType);
      }
    }

    removeCollectibleFromPools(...BANNED_COLLECTIBLE_TYPES);

    for (const trinketType of UNLOCKABLE_TRINKET_TYPES) {
      if (!isTrinketTypeUnlocked(trinketType)) {
        itemPool.RemoveTrinket(trinketType);
      }
    }

    removeTrinketFromPools(...BANNED_TRINKET_TYPES);

    this.conditionallyRemoveRevivalCollectible(
      itemPool,
      CollectibleType.ANKH, // 161
      PlayerType.BLUE_BABY,
    );
    this.conditionallyRemoveRevivalCollectible(
      itemPool,
      CollectibleType.JUDAS_SHADOW, // 311
      PlayerType.JUDAS,
    );
    this.conditionallyRemoveRevivalCollectible(
      itemPool,
      CollectibleType.LAZARUS_RAGS, // 332
      PlayerType.JUDAS,
    );
    this.conditionallyRemoveRevivalTrinket(
      itemPool,
      TrinketType.MYSTERIOUS_PAPER, // 21
      PlayerType.LOST,
    );
    this.conditionallyRemoveRevivalTrinket(
      itemPool,
      TrinketType.MISSING_POSTER, // 23
      PlayerType.LOST,
    );

    const startingCollectibleTypes =
      getCharacterStartingCollectibleTypes(character);
    for (const collectibleType of startingCollectibleTypes) {
      if (
        !isCollectibleTypeUnlocked(collectibleType) &&
        // Make an exception for Bag of Crafting since the collectible to pickups effect will always
        // be active on Tainted Cain. (Thus, the character cannot really function properly without
        // Bag of Crafting.)
        collectibleType !== CollectibleType.BAG_OF_CRAFTING
      ) {
        player.RemoveCollectible(collectibleType);
      }
    }

    const startingTrinketType = getCharacterStartingTrinketType(character);
    if (
      startingTrinketType !== undefined &&
      !isTrinketTypeUnlocked(startingTrinketType)
    ) {
      player.TryRemoveTrinket(startingTrinketType);
    }

    switch (character) {
      // 0
      case PlayerType.ISAAC: {
        if (!isPillEffectUnlocked(PillEffect.FULL_HEALTH)) {
          player.SetPill(PocketItemSlot.SLOT_1, PillColor.NULL);
        }

        break;
      }

      // 1
      case PlayerType.MAGDALENE: {
        if (!isPillEffectUnlocked(PillEffect.FULL_HEALTH)) {
          player.SetPill(PocketItemSlot.SLOT_1, PillColor.NULL);
        }

        break;
      }

      // 7, 28
      case PlayerType.AZAZEL:
      case PlayerType.AZAZEL_B: {
        if (!isCardTypeUnlocked(CardType.FOOL)) {
          player.SetCard(PocketItemSlot.SLOT_1, CardType.NULL);
        }

        break;
      }

      // 8
      case PlayerType.LAZARUS: {
        if (!anyPillEffectsUnlocked()) {
          player.SetPill(PocketItemSlot.SLOT_1, PillColor.NULL);
        }

        break;
      }

      // 9, 30
      case PlayerType.EDEN:
      case PlayerType.EDEN_B: {
        this.emptyEdenInventory(player);
        break;
      }

      // 31
      case PlayerType.LOST_B: {
        if (!isCardTypeUnlocked(CardType.HOLY)) {
          player.SetCard(PocketItemSlot.SLOT_1, CardType.NULL);
        }

        break;
      }

      default: {
        break;
      }
    }
  }

  conditionallyRemoveRevivalCollectible(
    itemPool: ItemPool,
    collectibleType: CollectibleType,
    character: PlayerType,
  ): void {
    if (!isAllCharacterAchievementsCompleted(character)) {
      itemPool.RemoveCollectible(collectibleType);
    }
  }

  conditionallyRemoveRevivalTrinket(
    itemPool: ItemPool,
    trinketType: TrinketType,
    character: PlayerType,
  ): void {
    if (!isAllCharacterAchievementsCompleted(character)) {
      itemPool.RemoveTrinket(trinketType);
    }
  }

  emptyEdenInventory(player: EntityPlayer): void {
    for (const collectibleType of VANILLA_COLLECTIBLE_TYPES) {
      // We check for the presence of the collectible to avoid spamming the log.
      if (player.HasCollectible(collectibleType)) {
        player.RemoveCollectible(collectibleType);
      }
    }

    const trinketType = player.GetTrinket(TrinketSlot.SLOT_1);
    if (trinketType !== TrinketType.NULL) {
      player.TryRemoveTrinket(trinketType);
    }

    const cardType = player.GetCard(PocketItemSlot.SLOT_1);
    if (cardType !== CardType.NULL) {
      player.SetCard(PocketItemSlot.SLOT_1, CardType.NULL);
    }

    const pillColor = player.GetPill(PocketItemSlot.SLOT_1);
    if (pillColor !== PillColor.NULL) {
      player.SetPill(PocketItemSlot.SLOT_1, PillColor.NULL);
    }

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

  @CallbackCustom(
    ModCallbackCustom.POST_PICKUP_SELECTION_FILTER,
    PickupVariant.HEART, // 10
  )
  postPickupSelectionHeart(
    _pickup: EntityPickup,
    _pickupVariant: PickupVariant,
    subType: int,
  ): [PickupVariant, int] | undefined {
    const heartSubType = subType as HeartSubType;

    return isHeartSubTypeUnlocked(heartSubType)
      ? undefined
      : [PickupVariant.HEART, HeartSubType.HALF];
  }

  @CallbackCustom(
    ModCallbackCustom.POST_PICKUP_SELECTION_FILTER,
    PickupVariant.COIN, // 20
  )
  postPickupSelectionCoin(
    _pickup: EntityPickup,
    _pickupVariant: PickupVariant,
    subType: int,
  ): [PickupVariant, int] | undefined {
    const coinSubType = subType as CoinSubType;

    return isCoinSubTypeUnlocked(coinSubType)
      ? undefined
      : [PickupVariant.COIN, CoinSubType.PENNY];
  }

  @CallbackCustom(
    ModCallbackCustom.POST_PICKUP_SELECTION_FILTER,
    PickupVariant.KEY, // 30
  )
  postPickupSelectionKey(
    _pickup: EntityPickup,
    _pickupVariant: PickupVariant,
    subType: int,
  ): [PickupVariant, int] | undefined {
    const keySubType = subType as KeySubType;

    return isKeySubTypeUnlocked(keySubType)
      ? undefined
      : [PickupVariant.KEY, KeySubType.NORMAL];
  }

  @CallbackCustom(
    ModCallbackCustom.POST_PICKUP_SELECTION_FILTER,
    PickupVariant.BOMB, // 40
  )
  postPickupSelectionBomb(
    _pickup: EntityPickup,
    _pickupVariant: PickupVariant,
    subType: int,
  ): [PickupVariant, int] | undefined {
    const bombSubType = subType as BombSubType;

    return isBombSubTypeUnlocked(bombSubType)
      ? undefined
      : [PickupVariant.BOMB, BombSubType.NORMAL];
  }

  @CallbackCustom(
    ModCallbackCustom.POST_PICKUP_SELECTION_FILTER,
    PickupVariant.SACK, // 69
  )
  postPickupSelectionSack(
    _pickup: EntityPickup,
    _pickupVariant: PickupVariant,
    subType: int,
  ): [PickupVariant, int] | undefined {
    const sackSubType = subType as SackSubType;

    return isSackSubTypeUnlocked(sackSubType)
      ? undefined
      : [PickupVariant.COIN, CoinSubType.PENNY];
  }

  @CallbackCustom(
    ModCallbackCustom.POST_PICKUP_SELECTION_FILTER,
    PickupVariant.PILL, // 70
  )
  postPickupSelectionPill(
    _pickup: EntityPickup,
    _pickupVariant: PickupVariant,
    subType: int,
  ): [PickupVariant, int] | undefined {
    if (!anyPillEffectsUnlocked()) {
      return [PickupVariant.COIN, CoinSubType.PENNY];
    }

    const pillColor = subType as PillColor;

    if (isGoldPill(pillColor) && !isGoldPillUnlocked()) {
      return [PickupVariant.PILL, FIRST_PILL_COLOR];
    }

    if (isHorsePill(pillColor) && !isHorsePillsUnlocked()) {
      const normalPillColor = getNormalPillColorFromHorse(pillColor);
      return [PickupVariant.PILL, normalPillColor];
    }

    return undefined;
  }

  @CallbackCustom(
    ModCallbackCustom.POST_PICKUP_SELECTION_FILTER,
    PickupVariant.LIL_BATTERY, // 90
  )
  postPickupSelectionLilBattery(
    _pickup: EntityPickup,
    _pickupVariant: PickupVariant,
    subType: int,
  ): [PickupVariant, int] | undefined {
    const batterySubType = subType as BatterySubType;

    return isBatterySubTypeUnlocked(batterySubType)
      ? undefined
      : [PickupVariant.COIN, CoinSubType.PENNY];
  }

  @CallbackCustom(
    ModCallbackCustom.POST_PICKUP_SELECTION_FILTER,
    PickupVariant.TAROT_CARD, // 300
  )
  postPickupSelectionTarotCard(
    _pickup: EntityPickup,
    _pickupVariant: PickupVariant,
    subType: int,
  ): [PickupVariant, int] | undefined {
    if (!anyCardTypesUnlocked()) {
      return [PickupVariant.COIN, CoinSubType.PENNY];
    }

    // We make Rune Shards elsewhere in this feature to signify that the card should be replaced
    // with a penny.
    const cardType = subType as CardType;
    if (cardType === CardType.RUNE_SHARD) {
      return [PickupVariant.COIN, CoinSubType.PENNY];
    }

    return undefined;
  }

  /**
   * If the trinket pool is depleted, it will automatically refill the pool with every trinket. In
   * other words, this is no analogous "Breakfast" mechanic for trinkets. Thus, we must manually
   * replace locked trinket types with a random unlocked trinket type. (If no trinket types are
   * unlocked, we replace all trinkets with pennies.)
   */
  @CallbackCustom(
    ModCallbackCustom.POST_PICKUP_SELECTION_FILTER,
    PickupVariant.TRINKET, // 350
  )
  postPickupSelectionTrinket(
    _pickup: EntityPickup,
    _pickupVariant: PickupVariant,
    subType: int,
  ): [PickupVariant, int] | undefined {
    const trinketType = subType as TrinketType;

    const unlockedTrinketTypes = getUnlockedTrinketTypes();
    if (unlockedTrinketTypes.has(trinketType)) {
      return undefined;
    }

    if (unlockedTrinketTypes.size === 0) {
      return [PickupVariant.COIN, CoinSubType.PENNY];
    }

    const newTrinketType = getRandomSetElement(unlockedTrinketTypes);
    return [PickupVariant.TRINKET, newTrinketType];
  }
}
