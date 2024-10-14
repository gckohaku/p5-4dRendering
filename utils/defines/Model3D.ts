import { type MathCollection, type MathType, abs, acos, chain, concat, cross, divide, dot, inv, map, matrix, mean, multiply, norm, pow, subtract, transpose } from "mathjs";
import type p5 from "p5";
import { type Coordinate3d, PolygonStrip3D } from "#imports";
import { BinaryTree } from "./BinaryTree";
import type { Matrix } from "./MatrixTypes";
import type { ColorRGBArray } from "./TypeUtilities";

type BSPTreeType = { index: number, subIndex: number }[];

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
			if (colors?.[i]) {
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
			for (let j = 0; j < polygons[i].length - 2; j++) {
				nodeData.push({ index: i, subIndex: j });
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

	render(p: p5, cameraMatrix: Matrix<3, 3>, externalMatrix: Matrix<3, 4>,
		{
			standardLuminousDistance = 100
		}: {
			standardLuminousDistance?: number;
		} = {}
	) {
		p.stroke(0, 0, 0, 0);

		const polygons: Coordinate3d[][] = this.getPolygons();

		const pointOfViewPolygon: Coordinate3d[] = [[0, 0, 0, 1], [1, -1, 0, 1], [1, 1, 0, 1]];

		const calibrationMatrix: Matrix<3, 4> = multiply(cameraMatrix, externalMatrix) as Matrix<3, 4>;

		const afterCalibrationPointOfView: Coordinate3d[] = [];

		const cameraMoveMatrix = structuredClone(externalMatrix);
		cameraMoveMatrix[0][3] *= -1;
		cameraMoveMatrix[1][3] *= -1;
		cameraMoveMatrix[2][3] *= -1;

		const tree = this.bspTree;
		for (const polygon of pointOfViewPolygon) {
			afterCalibrationPointOfView.push(concat(multiply(cameraMoveMatrix, polygon), [1]) as Coordinate3d);
		}

		if (tree) {
			this.recursiveRender(p, tree, cameraMatrix, externalMatrix, afterCalibrationPointOfView, standardLuminousDistance);
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
		const rootNormalVector = getNormalVector(rootVertexes);
		const rootNormalizedNormalVector: number[] = divide(rootNormalVector, norm(rootNormalVector)) as number[];

		const rootAveragePos = mean([...rootVertexes], 0) as MathType as number[];

		const leftData: BSPTreeType = [];
		const rightData: BSPTreeType = [];

		for (const indexes of node.data) {
			if (indexes.index === rootIndex && indexes.subIndex === rootSubIndex) {
				continue;
			}
			const poly = this.parts[indexes.index].getPolygonOfIndex(indexes.subIndex);
			const polyNormalVector = getNormalVector(poly);
			const polyNormalizedNormalVector: number[] = divide(polyNormalVector, norm(polyNormalVector)) as number[];

			const polyAveragePos = mean([...poly], 0) as MathType as number[];

			const distAvgVector: number[] = subtract(polyAveragePos, rootAveragePos);
			const distNormalizedAvgVector: number[] = divide(distAvgVector, norm(distAvgVector)) as number[];

			// ポリゴンの再分割が必要かの判定
			// const intersectionLineVec = cross(rootNormalVector, polyNormalVector) as number[];
			if (this.isRequiredSubdividing(rootNormalVector, polyNormalVector, rootVertexes, poly)) {
				console.log(`needs to subdivision at [${rootIndex}, ${rootSubIndex}]`);
			}

			if (dot(distAvgVector.slice(0, 3), rootNormalizedNormalVector) >= 0) {
				leftData.push({ index: indexes.index, subIndex: indexes.subIndex });
			}
			else {
				rightData.push({ index: indexes.index, subIndex: indexes.subIndex });
			}
		}

		if (leftData.length) {
			node.addLeft(leftData);
			const firstIndexes = leftData[0];
			this.setBSPChildren(node.left!, firstIndexes.index, firstIndexes.subIndex);
		}
		if (rightData.length) {
			node.addRight(rightData);
			const firstIndexes = rightData[0];
			this.setBSPChildren(node.right!, firstIndexes.index, firstIndexes.subIndex);
		}

		for (const indexes of node.data) {
			if (indexes.index === rootIndex && indexes.subIndex === rootSubIndex) {
				continue;
			}

			node.data.splice(node.data.indexOf(indexes));
		}

	}

	private recursiveRender(p: p5, tree: BinaryTree<BSPTreeType>, cameraMatrix: Matrix<3, 3>, externalMatrix: Matrix<3, 4>, pointOfViewPolygon: Coordinate3d[], standardLuminousDistance: number = 100) {
		const index = tree.data[0].index;
		const subIndex = tree.data[0].subIndex;

		const targetPolygon = this.parts[index].getPolygonOfIndex(subIndex);
		const averageTargetVertexPos = mean([...targetPolygon], 0) as MathType as number[];

		const polyVecToPointOfView: number[] = subtract(pointOfViewPolygon[0].slice(0, 3), averageTargetVertexPos.slice(0, 3));

		const targetNormalVec = getNormalVector(targetPolygon);

		const dotTargetAndPointOfView = dot(polyVecToPointOfView, targetNormalVec);

		const polyDistToPointOfView = norm(polyVecToPointOfView);
		const polyAngleTowardsLuminous = acos(divide(dotTargetAndPointOfView, multiply(polyDistToPointOfView, norm(targetNormalVec))) as number);

		if (dotTargetAndPointOfView > 0) {
			if (tree.right) {
				this.recursiveRender(p, tree.right, cameraMatrix, externalMatrix, pointOfViewPolygon, standardLuminousDistance);
			}

			const illuminanceDistFactor: number = inv(pow(divide(polyDistToPointOfView, standardLuminousDistance), 2) as number);
			const illuminanceAngleFactor: number = divide(dot([0, 0, 1], targetNormalVec), norm(targetNormalVec)) as number;
			p.fill(...chain(this.parts[index].color).multiply(0.4 + illuminanceAngleFactor * 0.6).done());

			const renderPolygon: number[][] = []

			for (let i = 0; i < targetPolygon.length; i++) {
				const renderVertex = chain(cameraMatrix as MathCollection).multiply(externalMatrix).multiply(transpose(targetPolygon[i])).done() as number[];
				renderPolygon.push(divide(renderVertex, -renderVertex[2]) as number[]);
			};

			p.beginShape();
			for (let i = 0; i < renderPolygon.length; i++) {
				const poly = renderPolygon[i];
				p.vertex(poly[0], -poly[1]);
			}
			p.endShape(p.CLOSE);

			if (tree.left) {
				this.recursiveRender(p, tree.left, cameraMatrix, externalMatrix, pointOfViewPolygon, standardLuminousDistance);
			}
		}
		else {
			if (tree.left) {
				this.recursiveRender(p, tree.left, cameraMatrix, externalMatrix, pointOfViewPolygon, standardLuminousDistance);
			}
			if (tree.right) {
				this.recursiveRender(p, tree.right, cameraMatrix, externalMatrix, pointOfViewPolygon, standardLuminousDistance);
			}
		}
	}

	/**
	 * ポリゴンの再分割が必要かを判定
	 * @param rootNormalVec 
	 * @param targetNormalVec 
	 * @param rootPoly 
	 * @param targetPoly 
	 * @returns 再分割の必要が無いなら false 再分割が必要なら再分割線の座標
	 */
	private isRequiredSubdividing(rootNormalVec: number[], targetNormalVec: number[], rootPoly: Coordinate3d[], targetPoly: Coordinate3d[]): false | number[][] {
		// eps 以下は 0 として扱う (浮動小数点数計算では誤差が出るため)
		const eps = 1e-14;

		const intersectionLineVec = cross(rootNormalVec, targetNormalVec) as number[];

		// 外積の結果が 0 の場合は平行なので、交差しえない
		if (abs(intersectionLineVec[0]) <= eps && abs(intersectionLineVec[1]) <= eps && abs(intersectionLineVec[2]) <= eps) {
			console.log("parallel");
			return false;
		}

		const intersectionLinePoint = this.calcInterSectionLinePoint(rootNormalVec, targetNormalVec, rootPoly, targetPoly, intersectionLineVec, eps);

		const crossToIntersectionVec: number[][] = [];

		for (let i = 0; i < targetPoly.length; i++) {
			const crossResult = cross(intersectionLineVec, subtract(targetPoly[i].slice(0, 3), intersectionLinePoint));
			crossToIntersectionVec.push(map(crossResult, (value) => (abs(value) <= eps) ? 0 : value) as number[]);
		}

		if (
			this.isMatchSignOfVector(crossToIntersectionVec[0], crossToIntersectionVec[1]) &&
			this.isMatchSignOfVector(crossToIntersectionVec[1], crossToIntersectionVec[2])
		) {
			return false;
		}

		return [[0]];
	}

	/**
	 * 交線を通る座標の位置ベクトルを計算する\
	 * この関数を利用するには、二つのベクトルが平行でない必要がある
	 * @param rootNormalVec 
	 * @param targetNormalVec 
	 * @param rootPoly 
	 * @param targetPoly 
	 * @param intersectionLineVec 交線の方向ベクトル
	 * @param eps この値以下を 0 として扱う
	 * @returns 交線を通る座標の位置ベクトル
	 */
	private calcInterSectionLinePoint(rootNormalVec: number[], targetNormalVec: number[], rootPoly: Coordinate3d[], targetPoly: Coordinate3d[], intersectionLineVec: number[], eps: number): number[] {
		const intersectionLinePoint = [0, 0, 0];

		const dRoot = rootNormalVec[0] * rootPoly[0][0] + rootNormalVec[1] * rootPoly[0][1] + rootNormalVec[2] * rootPoly[0][2];
		const dTarget = targetNormalVec[0] * targetPoly[0][0] + targetNormalVec[1] * targetPoly[0][1] + targetNormalVec[2] * targetPoly[0][2];

		if (intersectionLineVec[2] > eps) {
			intersectionLinePoint[0] = (targetNormalVec[1] * dRoot - rootNormalVec[1] * dTarget) / intersectionLineVec[2];
			intersectionLinePoint[1] = (targetNormalVec[0] * dRoot - rootNormalVec[0] * dTarget) / (-intersectionLineVec[2]);
		}
		else if (intersectionLineVec[1] > eps) {
			intersectionLinePoint[0] = (targetNormalVec[2] * dRoot - rootNormalVec[2] * dTarget) / (-intersectionLineVec[1]);
			intersectionLinePoint[2] = (targetNormalVec[0] * dRoot - rootNormalVec[0] * dTarget) / intersectionLineVec[1];
		}
		else if (intersectionLineVec[0] > eps) {
			intersectionLinePoint[1] = (targetNormalVec[2] * dRoot - rootNormalVec[2] * dTarget) / intersectionLineVec[0];
			intersectionLinePoint[2] = (targetNormalVec[1] * dRoot - rootNormalVec[1] * dTarget) / (-intersectionLineVec[0]);
		}

		return intersectionLinePoint;
	}

	/**
	 * ベクトルの符号が一致しているかを判定する
	 * @param vec1 
	 * @param vec2 
	 * @returns 符号が一致していれば true 、そうでなければ false
	 */
	private isMatchSignOfVector(vec1: number[], vec2: number[]): boolean {
		console.log("    ", vec1, vec2)
		if ((vec1[0] > 0 && vec2[0] < 0) || (vec1[0] < 0 && vec2[0] > 0)) {
			return false;
		}
		if ((vec1[1] > 0 && vec2[1] < 0) || (vec1[1] < 0 && vec2[1] > 0)) {
			return false;
		}
		if ((vec1[0] > 0 && vec2[0] < 0) || (vec1[0] < 0 && vec2[0] > 0)) {
			return false;
		}
		return true;
	}
}