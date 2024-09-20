import { PolygonStrip3D, type Coordinate3d } from "#imports";
import type p5 from "p5";
import type { ColorRGBArray } from "./TypeUtilities";
import { BinaryTree } from "./BinaryTree";
import { abs, cross, divide, subtract } from "mathjs";

type BSPTreeType = {index: number, subIndex: number}[];

export class Model3D {
	vertexes: Coordinate3d[] = [];
	parts: (PolygonStrip3D)[] = [];
	bspTree: BinaryTree<BSPTreeType> | null = null;

	constructor();
	constructor(m: Model3D);

	constructor(m?: Model3D) {
		if (m) {
			this.vertexes = [...m.vertexes];
			for (const p of m.parts) {
				this.parts.push(new PolygonStrip3D(p));
			}
			this.bspTree = m.bspTree;
		}
	}

	setVertexes(vs: Coordinate3d[]) {
		this.vertexes = vs;
	}

	addVertexes(vs: Coordinate3d[]) {
		for (let i = 0; i < vs.length; i++) {
			this.vertexes.push(vs[i]);
		}
	}

	setParts(partsIndexes: number[][], colors?: ColorRGBArray[]) {
		for (let i = 0; i < partsIndexes.length; i++) {
			const indexes = partsIndexes[i];
			if (indexes.length < 3) {
				console.warn(`partsIndexes[${i}] length is too few (al least 3 length).`);
			}
			const vs: Coordinate3d[] = [];
			for (let j = 0; j < indexes.length; j++) {
				vs.push(this.vertexes[indexes[j]]);
			}
			this.parts.push(new PolygonStrip3D([...vs]));
			if (colors && colors[i]) {
				this.parts.at(-1)!.setColor(...colors[i]);
			}
		}
	}

	makeBSPTree(rootPolygonIndex: number, rootPolygonSubIndex: number = 0) {
		if (this.bspTree !== null) {
			this.bspTree = null;
		}

		const polygons: Coordinate3d[][] = this.getPolygons();

		const nodeData: BSPTreeType = [];
		for (let i = 0; i < polygons.length; i++) {
			for (let j = 0; j < polygons[i].length; j++) {
				nodeData.push({index: i, subIndex: j});
			}
		}

		this.bspTree = new BinaryTree<BSPTreeType>(nodeData);
		this.setBSPChildren(this.bspTree, rootPolygonIndex, rootPolygonSubIndex);
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
		for (const part of this.parts) {
			part.renderFrame(p, { center: center, strokeColor: strokeColor, isSubGrid: isSubGrid, subGridColor: subGridColor, subGridAlpha: subGridAlpha });
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
		for (const part of this.parts) {
			part.renderFrame2DPerspective(p, cameraMatrix, externalMatrix, { center: center, strokeColor: strokeColor, isSubGrid: isSubGrid, subGridColor: subGridColor, subGridAlpha: subGridAlpha });
		}
	}

	render(p: p5, cameraMatrix: Matrix<3, 3>, externalMatrix: Matrix<3, 4>) {
		const polygons: Coordinate3d[][] = [];

		for (let i = 0; i < this.parts.length; i++) {
			polygons.push(this.parts[i].getPolygons());
		}


	}

	affine(m: Matrix<4, 4>) {
		for (const part of this.parts) {
			part.affine(m);
		}
	}

	private getPolygons(): Coordinate3d[][] {
		const polygons: Coordinate3d[][] = [];

		for (let i = 0; i < this.parts.length; i++) {
			polygons.push(this.parts[i].getPolygons());
		}

		return polygons;
	}

	private setBSPChildren(node: BinaryTree<BSPTreeType>, rootIndex: number = 0, rootSubIndex: number = 0) {
		const rootVertexes = this.parts[rootIndex].getPolygonOfIndex(rootSubIndex);
		const rootNormalVector: number[] = cross(subtract(rootVertexes[1], rootVertexes[0]), subtract(rootVertexes[2], rootVertexes[1])) as number[];
		const rootNormalizedNormalVector: number[] = divide(rootNormalVector, abs(rootNormalVector)) as number[];

		for (const indexes of node.data) {

		}
	}
}