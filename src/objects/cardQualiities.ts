import { CardType } from "isaac-typescript-definitions";

const DEFAULT_CARD_QUALITY = 0;

export const CARD_QUALITIES = {
  [CardType.NULL]: DEFAULT_CARD_QUALITY, // 0
  [CardType.FOOL]: 0, // 1
  [CardType.MAGICIAN]: 0, // 2
  [CardType.HIGH_PRIESTESS]: 0, // 3
  [CardType.EMPRESS]: 0, // 4
  [CardType.EMPEROR]: 0, // 5
  [CardType.HIEROPHANT]: 0, // 6
  [CardType.LOVERS]: 0, // 7
  [CardType.CHARIOT]: 0, // 8
  [CardType.JUSTICE]: 0, // 9
  [CardType.HERMIT]: 0, // 10
  [CardType.WHEEL_OF_FORTUNE]: 0, // 11
  [CardType.STRENGTH]: 0, // 12
  [CardType.HANGED_MAN]: 0, // 13
  [CardType.DEATH]: 0, // 14
  [CardType.TEMPERANCE]: 0, // 15
  [CardType.DEVIL]: 0, // 16
  [CardType.TOWER]: 0, // 17
  [CardType.STARS]: 0, // 18
  [CardType.MOON]: 0, // 19
  [CardType.SUN]: 0, // 20
  [CardType.JUDGEMENT]: 0, // 21
  [CardType.WORLD]: 0, // 22
  [CardType.CLUBS_2]: 0, // 23
  [CardType.DIAMONDS_2]: 0, // 24
  [CardType.SPADES_2]: 0, // 25
  [CardType.HEARTS_2]: 0, // 26
  [CardType.ACE_OF_CLUBS]: 0, // 27
  [CardType.ACE_OF_DIAMONDS]: 0, // 28
  [CardType.ACE_OF_SPADES]: 0, // 29
  [CardType.ACE_OF_HEARTS]: 0, // 30
  [CardType.JOKER]: 0, // 31
  [CardType.RUNE_HAGALAZ]: 0, // 32
  [CardType.RUNE_JERA]: 0, // 33
  [CardType.RUNE_EHWAZ]: 0, // 34
  [CardType.RUNE_DAGAZ]: 0, // 35
  [CardType.RUNE_ANSUZ]: 0, // 36
  [CardType.RUNE_PERTHRO]: 0, // 37
  [CardType.RUNE_BERKANO]: 0, // 38
  [CardType.RUNE_ALGIZ]: 0, // 39
  [CardType.RUNE_BLANK]: 0, // 40
  [CardType.RUNE_BLACK]: 0, // 41
  [CardType.CHAOS]: 0, // 42
  [CardType.CREDIT]: 0, // 43
  [CardType.RULES]: 0, // 44
  [CardType.AGAINST_HUMANITY]: 0, // 45
  [CardType.SUICIDE_KING]: 0, // 46
  [CardType.GET_OUT_OF_JAIL_FREE]: 0, // 47
  [CardType.QUESTION_MARK]: 0, // 48
  [CardType.DICE_SHARD]: 0, // 49
  [CardType.EMERGENCY_CONTACT]: 0, // 50
  [CardType.HOLY]: 0, // 51
  [CardType.HUGE_GROWTH]: 0, // 52
  [CardType.ANCIENT_RECALL]: 0, // 53
  [CardType.ERA_WALK]: 0, // 54
  [CardType.RUNE_SHARD]: 0, // 55
  [CardType.REVERSE_FOOL]: 0, // 56
  [CardType.REVERSE_MAGICIAN]: 0, // 57
  [CardType.REVERSE_HIGH_PRIESTESS]: 0, // 58
  [CardType.REVERSE_EMPRESS]: 0, // 59
  [CardType.REVERSE_EMPEROR]: 0, // 60
  [CardType.REVERSE_HIEROPHANT]: 0, // 61
  [CardType.REVERSE_LOVERS]: 0, // 62
  [CardType.REVERSE_CHARIOT]: 0, // 63
  [CardType.REVERSE_JUSTICE]: 0, // 64
  [CardType.REVERSE_HERMIT]: 0, // 65
  [CardType.REVERSE_WHEEL_OF_FORTUNE]: 0, // 66
  [CardType.REVERSE_STRENGTH]: 0, // 67
  [CardType.REVERSE_HANGED_MAN]: 0, // 68
  [CardType.REVERSE_DEATH]: 0, // 69
  [CardType.REVERSE_TEMPERANCE]: 0, // 70
  [CardType.REVERSE_DEVIL]: 0, // 71
  [CardType.REVERSE_TOWER]: 0, // 72
  [CardType.REVERSE_STARS]: 0, // 73
  [CardType.REVERSE_MOON]: 0, // 74
  [CardType.REVERSE_SUN]: 0, // 75
  [CardType.REVERSE_JUDGEMENT]: 0, // 76
  [CardType.REVERSE_WORLD]: 0, // 77
  [CardType.CRACKED_KEY]: 0, // 78
  [CardType.QUEEN_OF_HEARTS]: 0, // 79
  [CardType.WILD]: 0, // 80
  [CardType.SOUL_ISAAC]: 0, // 81
  [CardType.SOUL_MAGDALENE]: 0, // 82
  [CardType.SOUL_CAIN]: 0, // 83
  [CardType.SOUL_JUDAS]: 0, // 84
  [CardType.SOUL_BLUE_BABY]: 0, // 85
  [CardType.SOUL_EVE]: 0, // 86
  [CardType.SOUL_SAMSON]: 0, // 87
  [CardType.SOUL_AZAZEL]: 0, // 88
  [CardType.SOUL_LAZARUS]: 0, // 89
  [CardType.SOUL_EDEN]: 0, // 90
  [CardType.SOUL_LOST]: 0, // 91
  [CardType.SOUL_LILITH]: 0, // 92
  [CardType.SOUL_KEEPER]: 0, // 93
  [CardType.SOUL_APOLLYON]: 0, // 94
  [CardType.SOUL_FORGOTTEN]: 0, // 95
  [CardType.SOUL_BETHANY]: 0, // 96
  [CardType.SOUL_JACOB]: 0, // 97
} as const satisfies Record<CardType, Quality>;
