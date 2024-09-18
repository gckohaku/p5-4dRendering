// アフィン返還を適用するために、列ベクトルで表す
export type Coordinate2d = FixedArray<number, 3>;
export const makeCoordinate2d = <X extends number, Y extends number>(x: X, y: Y): Coordinate2d => [x, y, 1];

export type Coordinate3d = FixedArray<number, 4>;
export const makeCoordinate3d = <X extends number, Y extends number, Z extends number>(x: X, y: Y, z: Z): Coordinate3d => [x, y, z, 1];

export type Coordinate4d = FixedArray<number, 5>;
export const makeCoordinate4d = <X extends number, Y extends number, Z extends number, W extends number>(x: X, y: Y, z: Z, w: W): Coordinate4d => [x, y, z, w, 1];