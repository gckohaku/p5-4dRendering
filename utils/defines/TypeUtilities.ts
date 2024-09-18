import type { Color } from "p5";

export type Shift<T extends readonly unknown[]> = T extends [infer F, ...infer U] ? U : T;

export type FixedArray<T, Value> = [...T[]] & { length: Value };

/**
 * [red, green, blue]
 */
export type ColorRGBArray = [number, number, number];