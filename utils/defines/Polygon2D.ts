import type p5 from "p5";
import type { Coordinate2d } from "./MatrixCoordinateTypes";
import { add, multiply } from "mathjs";
import type { Matrix } from "./MatrixTypes";

export class Polygon2D {
	vertexes: [Coordinate2d, Coordinate2d, Coordinate2d];

	constructor(poly2d: Polygon2D);
	constructor(pos1: Coordinate2d, pos2: Coordinate2d, pos3: Coordinate2d);

	constructor(arg1: Coordinate2d | Polygon2D, arg2?: Coordinate2d, arg3?: Coordinate2d) {
		if (arg1 instanceof Polygon2D) {
			this.vertexes = [...arg1.vertexes];
		}
		else if (arg2 && arg3) {
			this.vertexes = [arg1, arg2, arg3]
		}
		else {
			throw new Error(`Polygon2D construction error: Invalid parameter Type`);
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

		const v = this.vertexes;
		// p.triangle(v[0][0] + center[0], v[0][1] + center[1], v[1][0] + center[0], v[1][1] + center[1], v[2][0] + center[0], v[2][1] + center[1]);

		p.beginShape();
		for (let i = 0; i < v.length; i++) {
			p.vertex(v[i][0] + center[0], v[i][1] + center[1]);
		}
		p.endShape(p.CLOSE);
	}

	affine(m: Matrix<3, 3>) {
		const vs = this.vertexes;
		for (let i = 0; i < vs.length; i++) {
			vs[i] = multiply(m, vs[i]) as Coordinate2d;
		}
	}
}