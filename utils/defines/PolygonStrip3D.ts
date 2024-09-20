import { chain, multiply, transpose } from "mathjs";
import type { Coordinate2d, Coordinate3d } from "./MatrixCoordinateTypes";
import type p5 from "p5";

export class PolygonStrip3D {
	vertexes: Coordinate3d[];
	color: ColorRGBArray = [0, 128, 0];

	constructor(polyStrip3d: PolygonStrip3D);
	constructor(vertexes: Coordinate3d[]);

	constructor(arg: PolygonStrip3D | Coordinate3d[]) {
		if (arg instanceof PolygonStrip3D) {
			this.vertexes = [...arg.vertexes];
		}
		else {
			if (arg.length < 3) {
				throw new Error(`Polygon Strip 3d construction error:\nvertexes parameter length is too few.`);
			}
			this.vertexes = [...arg];
		}
	}

	setColor(r: number, g: number, b: number) {
		const c = this.color;
		c[0] = r;
		c[1] = g;
		c[2] = b;
	}

	getPolygons(): Coordinate3d[] {
		const retArray: Coordinate3d[] = structuredClone(this.vertexes);

		return retArray;
	}

	getPolygonOfIndex(index: number): [Coordinate3d, Coordinate3d, Coordinate3d] {
		if (index + 2 >= this.vertexes.length) {
			throw new Error(`Error in PolygonStrip3D.getPolygonsOfIndex(): polygon of specified index don't exists.`);
		}

		const v = this.vertexes;
		return [v[index], v[index + 1], v[index + 2]];
	}

	renderFrame(p: p5,
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

		p.fill(this.color[0], this.color[1], this.color[2]);

		const v = this.vertexes;

		const len = v.length;
		p.beginShape();
		p.vertex(v[0][0] + center[0], -v[0][1] + center[1]);
		for (let i = 1; i < len - 1; i += 2) {
			p.vertex(v[i][0] + center[0], -v[i][1] + center[1]);
		}
		p.vertex(v[len - 1][0] + center[0], -v[len - 1][1] + center[1]);
		for (let i = len - 1 - (len + 1) % 2; i > 0; i -= 2) {
			p.vertex(v[i][0] + center[0], -v[i][1] + center[1]);
		}
		p.endShape(p.CLOSE);

		if (isSubGrid) {
			let c;

			if (typeof subGridColor === "string") {
				c = p.color(subGridColor);
			}
			else {
				c = p.color(subGridColor.r, subGridColor.g, subGridColor.b);
			}

			c.setAlpha(subGridAlpha);
			p.stroke(c);

			for (let i = 1; i < len - 2; i++) {
				p.line(v[i][0] + center[0], -v[i][1] + center[1], v[i + 1][0] + center[0], -v[i + 1][1] + center[1]);
			}
		}
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

		p.fill(0, 0, 0, 0);

		const v = this.vertexes;

		const calibrationMatrix: Matrix<3, 4> = multiply(cameraMatrix, externalMatrix) as Matrix<3, 4>;

		const renderV: Coordinate2d[] = [];

		for (let i = 0; i < v.length; i++) {
			const cameraZ = getMatrixMulMonoCellResult(externalMatrix, transpose([v[i]]), 2, 0);
			if (cameraZ >= 0) {
				continue;
			}
			const screenPos = chain(calibrationMatrix).multiply(transpose(v[i])).divide(-cameraZ).done() as number[];
			renderV.push([screenPos[0], screenPos[1], screenPos[2]]);
		}

		const len = renderV.length;
		if (len <= 0) {
			return;
		}

		p.beginShape();
		p.vertex(renderV[0][0], -renderV[0][1]);
		for (let i = 1; i < len - 1; i += 2) {
			p.vertex(renderV[i][0], -renderV[i][1]);
		}
		p.vertex(renderV[len - 1][0], -renderV[len - 1][1]);
		for (let i = len - 1 - (len + 1) % 2; i > 0; i -= 2) {
			p.vertex(renderV[i][0], -renderV[i][1]);
		}
		p.endShape(p.CLOSE);

		if (isSubGrid) {
			let c;

			if (typeof subGridColor === "string") {
				c = p.color(subGridColor);
			}
			else {
				c = p.color(subGridColor.r, subGridColor.g, subGridColor.b);
			}

			c.setAlpha(subGridAlpha);
			p.stroke(c);

			for (let i = 1; i < len - 2; i++) {
				p.line(renderV[i][0], -renderV[i][1], renderV[i + 1][0], -renderV[i + 1][1]);
			}
		}
	}

	render(p: p5, cameraMatrix: Matrix<3, 3>, externalMatrix: Matrix<3, 4>, center: [number, number, ...number[]] = [0, 0]) {
		p.fill(0, 0, 0, 0);

		const v = this.vertexes;

		const calibrationMatrix: Matrix<3, 4> = multiply(cameraMatrix, externalMatrix) as Matrix<3, 4>;

		const renderV: Coordinate2d[] = [];

		for (let i = 0; i < v.length; i++) {
			const cameraZ = getMatrixMulMonoCellResult(externalMatrix, transpose([v[i]]), 2, 0);
			if (cameraZ >= 0) {
				continue;
			}
			const screenPos = multiply(calibrationMatrix, transpose(v[i])) as number[];
			renderV.push([screenPos[0], screenPos[1], screenPos[2]]);
		}

		const len = renderV.length;
		if (len <= 0) {
			return;
		}

		p.beginShape();
		p.vertex(renderV[0][0], -renderV[0][1]);
		for (let i = 1; i < len - 1; i += 2) {
			p.vertex(renderV[i][0], -renderV[i][1]);
		}
		p.vertex(renderV[len - 1][0], -renderV[len - 1][1]);
		for (let i = len - 1 - (len + 1) % 2; i > 0; i -= 2) {
			p.vertex(renderV[i][0], -renderV[i][1]);
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