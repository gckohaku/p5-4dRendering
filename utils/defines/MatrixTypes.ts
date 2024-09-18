import type { FixedArray } from "./TypeUtilities";

export type Matrix<R extends number, C extends number, T = number> =
	R extends 1
	? FixedArray<T, C>
	: C extends 1
	? FixedArray<T, R>
	: FixedArray<FixedArray<T, C>, R>;