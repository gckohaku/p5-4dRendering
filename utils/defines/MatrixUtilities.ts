import { chain, concat, cos, sin, Unit } from "mathjs";
import type { Matrix } from "./MatrixTypes";

export const makeRotate3DMatrix = (rotateX: number, rotateY: number, rotateZ: number): Matrix<3, 3> => {
	const unitRX = new Unit(rotateX, "deg");
	const unitRY = new Unit(rotateY, "deg");
	const unitRZ = new Unit(rotateZ, "deg");

	const sinRX = sin(unitRX);
	const cosRX = cos(unitRX);
	const sinRY = sin(unitRY);
	const cosRY = cos(unitRY);
	const sinRZ = sin(unitRZ);
	const cosRZ = cos(unitRZ);

	const rotateMatrixX = [
		[1, 0, 0],
		[0, cosRX, -sinRX],
		[0, sinRX, cosRX]
	];
	const rotateMatrixY = [
		[cosRY, 0, sinRY],
		[0, 1, 0],
		[-sinRY, 0, cosRY]
	];
	const rotateMatrixZ = [
		[cosRZ, -sinRZ, 0],
		[sinRZ, cosRZ, 0],
		[0, 0, 1]
	]

	return chain(rotateMatrixZ).multiply(rotateMatrixY).multiply(rotateMatrixX).done() as Matrix<3, 3>;
}

export const makeRotate3DMatrix44 = (rotateX: number, rotateY: number, rotateZ: number): Matrix<4, 4> => {
	const matrix33 = makeRotate3DMatrix(rotateX, rotateY, rotateZ);
	const matrix34 = concat(matrix33, [[0], [0], [0]]);
	const matrix44 = concat(matrix34, [[0, 0, 0, 1]], 0);
	return matrix44 as Matrix<4 ,4>;
}

export const getMatrixMulMonoCellResult = <T extends number>(m1: Matrix<number, T>, m2: Matrix<T, number>, index1: number, index2: number) => {
	const len = m1[index1].length;
	let res = 0
	for (let i = 0; i < len; i++) {
		res += m1[index1][i] * m2[i][index2];
	}
	return res;
}