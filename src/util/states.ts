import states from "../data/utility/usa.states.json";

export const STATE_NAME_MAP = states.reduce((acc, state) => {
  acc[state.name] = state.code;
  return acc;
}, {} as any);

export const STATE_CODE_MAP = states.reduce((acc, state) => {
  acc[state.code] = state.name;
  return acc;
}, {} as any);
