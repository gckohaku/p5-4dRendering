import type p5 from "p5";
import type { Coordinate3d } from "./MatrixCoordinateTypes";
import { add, multiply } from "mathjs";
import type { Matrix } from "./MatrixTypes";

export class Polygon3D {
	vertexes: [Coordinate3d, Coordinate3d, Coordinate3d];

	constructor(poly3d: Polygon3D);
	constructor(pos1: Coordinate3d, pos2: Coordinate3d, pos3: Coordinate3d);

	constructor(arg1: Coordinate3d | Polygon3D, arg2?: Coordinate3d, arg3?: Coordinate3d) {
		if (arg1 instanceof Polygon3D) {
			this.vertexes = [...arg1.vertexes];
		}
		else if (arg2 && arg3) {
			this.vertexes = [arg1, arg2, arg3]
		}
		else {
			throw new Error(`Polygon3D construction error: Invalid parameter Type`);
		}
	}

	renderFrame(p: p5,
		{
			center = [0, 0],
			strokeColor = { r: 0, g: 0, b: 0 },
		}: {
			center?: [number, number, ...number[]],
			strokeColor?: string | { r: number, g: number, b: number }
		} = {}
	) {
		if (typeof strokeColor === "string") {
			p.stroke(strokeColor);
		}
		else {
			p.stroke(strokeColor.r, strokeColor.g, strokeColor.b);
		}

		p.fill("transparent");

		const v = this.vertexes;

		p.beginShape();
		for (let i = 0; i < v.length; i++) {
			p.vertex(v[i][0] + center[0], v[i][1] + center[1]);
		}
		p.endShape(p.CLOSE);
	}

	renderFrame2DPerspective(p: p5, cameraMatrix: Matrix<3, 3>, externalMatrix: Matrix<3, 4>,
		{
			center = [0, 0],
			strokeColor = { r: 0, g: 0, b: 0 },
			isSubGrid = true,
			subGridColor = { r: 128, g: 128, b: 128 },
			subGridAlpha = 0.5 * 255,
		}: {
			center?: [number, number, ...number[]],
			strokeColor?: string | { r: number, g: number, b: number },
			isSubGrid?: boolean,
			subGridColor?: string | { r: number, g: number, b: number },
			subGridAlpha?: number,
		} = {}
	) {
		if (typeof strokeColor === "string") {
			p.stroke(strokeColor);
		}
		else {
			p.stroke(strokeColor.r, strokeColor.g, strokeColor.b);
		}

		p.fill("transparent");

		const v = this.vertexes;

		p.beginShape();
		for (let i = 0; i < v.length; i++) {
			p.vertex(v[i][0] + center[0], v[i][1] + center[1]);
		}
		p.endShape(p.CLOSE);
	}

	affine(m: Matrix<4, 4>) {
		const vs = this.vertexes;
		for (let i = 0; i < vs.length; i++) {
			vs[i] = multiply(m, vs[i]) as Coordinate3d;
		}
	}
}