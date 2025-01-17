/** This is 1 instead of 0 because Lua has 1-indexed arrays. */
const DSS_CHOICE_DISABLED = 1;

/** This is 2 instead of 1 because Lua has 1-indexed arrays. */
const DSS_CHOICE_ENABLED = 2;

// Registered in "deadSeaScrolls.ts".
// eslint-disable-next-line isaacscript/require-v-registration
export const v = {
  persistent: {
    timer: DSS_CHOICE_DISABLED,
    enablePrikols: DSS_CHOICE_ENABLED,
    delayAchievementText: DSS_CHOICE_DISABLED,

    deadSeaScrolls: {},
  },
};

export function isTimerEnabled(): boolean {
  return v.persistent.timer === DSS_CHOICE_ENABLED;
}

export function isPrikolsEnabled(): boolean {
  return v.persistent.enablePrikols === DSS_CHOICE_ENABLED;
}

export function isDelayAchievementTextEnabled(): boolean {
  return v.persistent.delayAchievementText === DSS_CHOICE_ENABLED;
}
