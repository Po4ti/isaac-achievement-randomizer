import { PlayerType } from "isaac-typescript-definitions";

export function getAdjustedCharacterForObjective(
  player: EntityPlayer,
): PlayerType {
  const character = player.GetPlayerType();

  switch (character) {
    case PlayerType.LAZARUS_2: {
      return PlayerType.LAZARUS;
    }

    case PlayerType.LAZARUS_2_B: {
      return PlayerType.LAZARUS_B;
    }

    case PlayerType.SOUL: {
      return PlayerType.FORGOTTEN;
    }

    case PlayerType.SOUL_B: {
      return PlayerType.FORGOTTEN_B;
    }

    case PlayerType.ESAU: {
      return PlayerType.JACOB;
    }

    case PlayerType.LAZARUS_2_B: {
      return PlayerType.LAZARUS_B;
    }

    case PlayerType.DARK_JUDAS: {
      return PlayerType.JUDAS;
    }

    //MAIN_CHARACTERS:
    //ISAAC MAGDALENE, CAIN, JUDAS, BLUE_BABY, EVE, SAMSON, AZAZEL, LAZARUS, EDEN, LOST, LILITH, KEEPER, APOLLYON, FORGOTTEN, BETHANY, JACOB,
    //ISAAC_B, MAGDALENE_B,CAIN_B, JUDAS_B, BLUE_BABY_B, EVE_B, SAMSON_B, AZAZEL_B, LAZARUS_B, EDEN_B, LOST_B, LILITH_B, KEEPER_B, APOLLYON_B, FORGOTTEN_B, BETHANY_B, JACOB_B

    default: {
      return character;
    }
  }
}
