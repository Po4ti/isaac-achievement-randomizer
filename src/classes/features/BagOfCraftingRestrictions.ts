import { CollectibleType } from "isaac-typescript-definitions";
import {
  CallbackCustom,
  ModCallbackCustom,
  PickingUpItem,
} from "isaacscript-common";
import { BANNED_COLLECTIBLE_TYPES_SET } from "../../arrays/unlockableCollectibleTypes";
import { RandomizerModFeature } from "../RandomizerModFeature";

export class BagOfCraftingRestrictions extends RandomizerModFeature {
  @CallbackCustom(ModCallbackCustom.POST_ITEM_PICKUP)
  postItemPickup(player: EntityPlayer, pickingUpItem: PickingUpItem): void {
    const item_id = pickingUpItem.subType as CollectibleType;
    if (BANNED_COLLECTIBLE_TYPES_SET.has(item_id)) {
      player.RemoveCollectible(item_id, true);
    }
  }
}
