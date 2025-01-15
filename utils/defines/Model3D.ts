import { type MathCollection, type MathType, abs, acos, add, chain, concat, cross, divide, dot, dotDivide, dotMultiply, dotPow, inv, map, matrix, mean, multiply, norm, pow, sign, subtract, sum, transpose, unaryMinus } from "mathjs";
import p5 from "p5";
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

		const indexValue = polygons.length - 1;
		this.bspTree = new BinaryTree<BSPTreeType>(nodeData);
		this.setBSPChildren(this.bspTree, rootPolygonIndex, rootPolygonSubIndex, indexValue);
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
		p.strokeWeight(0.7);

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

	private setBSPChildren(node: BinaryTree<BSPTreeType>, rootIndex: number = 0, rootSubIndex: number = 0, indexValue: number) {
		const rootVertexes = this.parts[rootIndex].getPolygonOfIndex(rootSubIndex);
		const rootNormalVector = getNormalVector(rootVertexes);
		const rootNormalizedNormalVector: number[] = divide(rootNormalVector, norm(rootNormalVector)) as number[];

		const rootAveragePos = mean([...rootVertexes], 0) as MathType as number[];

		const leftData: BSPTreeType = [];
		const rightData: BSPTreeType = [];

		let currentMaxIndex = indexValue;

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
			const subdividingResult = this.isRequiredSubdividing(rootNormalVector, polyNormalVector, rootVertexes, poly);

			if (subdividingResult) {
				console.log(`needs to subdivision at [${rootIndex}, ${rootSubIndex}]`, subdividingResult);

				const newIndex = ++currentMaxIndex;
				const subIndexRange = subdividingResult.length - 2;
				// for (let i = 0; i < subdividingResult.length - 2; i++) {
				// 	node.data.push({index: newIndex, subIndex: i});
				// }
				this.parts.push(new PolygonStrip3D(subdividingResult));
				this.parts[newIndex].setColor(...this.parts[indexes.index].color);

				for (let i = 0; i < subIndexRange; i++) {
					const dividedPolygon = this.parts[newIndex].getPolygonOfIndex(i);
					const resultAveragePos = mean([...dividedPolygon], 0) as MathType as number[];
					const distFromRootToResult = subtract(resultAveragePos, rootAveragePos);

					if (dot(distFromRootToResult.slice(0, 3), rootNormalVector) >= 0) {
						leftData.push({ index: newIndex, subIndex: i });
					}
					else {
						rightData.push({ index: newIndex, subIndex: i });
					}
				}
			}
			else {
				if (dot(distAvgVector.slice(0, 3), rootNormalVector) >= 0) {
					leftData.push({ index: indexes.index, subIndex: indexes.subIndex });
				}
				else {
					rightData.push({ index: indexes.index, subIndex: indexes.subIndex });
				}
			}
		}

		if (leftData.length) {
			node.addLeft(leftData);
			const firstIndexes = leftData[0];
			this.setBSPChildren(node.left!, firstIndexes.index, firstIndexes.subIndex, currentMaxIndex);
		}
		if (rightData.length) {
			node.addRight(rightData);
			const firstIndexes = rightData[0];
			this.setBSPChildren(node.right!, firstIndexes.index, firstIndexes.subIndex, currentMaxIndex);
		}

		for (const indexes of node.data) {
			if (indexes.index === rootIndex && indexes.subIndex === rootSubIndex) {
				continue;
			}

			node.data.splice(node.data.indexOf(indexes));
		}

	}

	renderWithWebgl(p: p5) {
		for (const part of this.parts) {
			part.renderWithWebgl(p);
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
			p.stroke(...chain(this.parts[index].color).multiply(0.4 + illuminanceAngleFactor * 0.6).done());
			p.fill(...chain(this.parts[index].color).multiply(0.4 + illuminanceAngleFactor * 0.6).done());

			const renderPolygon: number[][] = [];

			console.log(cameraMatrix, externalMatrix);

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
	private isRequiredSubdividing(rootNormalVec: number[], targetNormalVec: number[], rootPoly: Coordinate3d[], targetPoly: Coordinate3d[]): false | Coordinate3d[] {
		// eps 未満は 0 として扱う (浮動小数点数計算では誤差が出るため)
		const eps = 1e-5;

		const intersectionLineVec = cross(rootNormalVec, targetNormalVec) as number[];

		// 外積の結果が 0 の場合は平行なので、交差しえない
		if (abs(intersectionLineVec[0]) < eps && abs(intersectionLineVec[1]) < eps && abs(intersectionLineVec[2]) < eps) {
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

		const divisionPoints = this.findPolygonDivisionPoints(intersectionLineVec, intersectionLinePoint, targetPoly, eps);

		return this.makeDivisionPolygons(targetPoly, divisionPoints);
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

		if (intersectionLineVec[2] >= eps) {
			intersectionLinePoint[0] = (targetNormalVec[1] * dRoot - rootNormalVec[1] * dTarget) / intersectionLineVec[2];
			intersectionLinePoint[1] = (targetNormalVec[0] * dRoot - rootNormalVec[0] * dTarget) / (-intersectionLineVec[2]);
		}
		else if (intersectionLineVec[1] >= eps) {
			intersectionLinePoint[0] = (targetNormalVec[2] * dRoot - rootNormalVec[2] * dTarget) / (-intersectionLineVec[1]);
			intersectionLinePoint[2] = (targetNormalVec[0] * dRoot - rootNormalVec[0] * dTarget) / intersectionLineVec[1];
		}
		else if (intersectionLineVec[0] >= eps) {
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
		if ((vec1[0] > 0 && vec2[0] < 0) || (vec1[0] < 0 && vec2[0] > 0)) {
			return false;
		}
		if ((vec1[1] > 0 && vec2[1] < 0) || (vec1[1] < 0 && vec2[1] > 0)) {
			return false;
		}
		if ((vec1[2] > 0 && vec2[2] < 0) || (vec1[2] < 0 && vec2[2] > 0)) {
			return false;
		}
		return true;
	}

	/**
	 * 
	 * @param intersectionLineVec 
	 * @param intersectionLinePoint 
	 * @param polygon 
	 * @param eps この値未満は 0 として扱う
	 * @returns 
	 */
	private findPolygonDivisionPoints(intersectionLineVec: number[], intersectionLinePoint: number[], polygon: Coordinate3d[], eps: number): { positions: number[][], type: "triangleAndSquare" | "triangles", indexCode: number } {
		/*
		変数名はこの導出の変数に沿う
		https://www.mathcha.io/editor/oMjp3H1LFkXh8kW5yXFrPPvkecjqz86GCqkpLpK
		*/
		const p_1 = intersectionLinePoint;
		// a_1 は単位ベクトルである必要がある
		const a_1 = dotDivide(intersectionLineVec, norm(intersectionLineVec));
		// l_2 側は線分が3つあるので、配列で表す
		const p_2 = [polygon[0].slice(0, 3), polygon[1].slice(0, 3), polygon[2].slice(0, 3)];
		const a_2 = [
			subtract(p_2[1], p_2[0]),
			subtract(p_2[2], p_2[1]),
			subtract(p_2[0], p_2[2]),
		];
		// a_2 も単位ベクトルである必要がある
		for (let i = 0; i < a_2.length; i++) {
			a_2[i] = dotDivide(a_2[i], norm(a_2[i]));
		}

		const m_1 = sum(dotPow(a_1, 2));
		const m_2: number[] = [];

		const n_1 = [sum(dotPow(a_2[0], 2)), sum(dotPow(a_2[1], 2)), sum(dotPow(a_2[2], 2))];
		const n_2: number[] = [];

		const o: number[] = [];

		const t: (number | null)[] = [];
		const s: (number | null)[] = [];

		const l_1: (number[] | null)[] = [];
		const l_2: (number[] | null)[] = [];

		for (let i = 0; i < p_2.length; i++) {
			m_2.push(add(
				multiply(a_1[0], subtract(p_1[0], p_2[i][0])),
				multiply(a_1[1], subtract(p_1[1], p_2[i][1])),
				multiply(a_1[2], subtract(p_1[2], p_2[i][2]))
			));

			n_2.push(add(
				multiply(a_2[i][0], subtract(p_2[i][0], p_1[0])),
				multiply(a_2[i][1], subtract(p_2[i][1], p_1[1])),
				multiply(a_2[i][2], subtract(p_2[i][2], p_1[2]))
			));

			o.push(unaryMinus(add(
				multiply(a_1[0], a_2[i][0]),
				multiply(a_1[1], a_2[i][1]),
				multiply(a_1[2], a_2[i][2])
			)));

			if (abs(subtract(pow(o[i], 2), multiply(m_1, n_1[i]))) as number < eps) {
				t.push(null);
			}
			else {
				t.push(divide(
					subtract(multiply(m_1, n_2[i]), multiply(m_2[i], o[i])),
					subtract(pow(o[i], 2), multiply(m_1, n_1[i]))
				) as number);
			}

			const current_t = t[i];

			if (current_t) {
				const current_s = unaryMinus(divide(
					add(m_2[i], multiply(o[i], current_t)),
					m_1
				)) as number;

				s.push(current_s);
				l_1.push(add(p_1, dotMultiply(current_s, a_1)));
				l_2.push(add(p_2[i], dotMultiply(current_t, a_2[i])));
			}
			else {
				s.push(null);
				l_1.push(null);
				l_2.push(null);
			}
		}

		const intersectionOnPolyLine: (number[] | null)[] = [];
		for (let i = 0; i < l_1.length; i++) {
			const current_l_1i = l_1[i];
			const current_l_2i = l_2[i];
			if (current_l_1i && current_l_2i) {
				// intersectionOnPolyLine.push(mean([current_l_1i, current_l_2i], 0) as MathType as number[]);
				intersectionOnPolyLine.push(current_l_2i);
			}
			else {
				intersectionOnPolyLine.push(null);
			}
		}

		const intersectionPoint: number[][] = [];

		const isIntersectionOnEdge = [false, false, false];
		const isIntersectionOnVertex = [false, false, false];

		for (let i = 0; i < intersectionOnPolyLine.length; i++) {
			const current = intersectionOnPolyLine[i];

			if (current) {

				const edgeVec = subtract(polygon[(i + 1) % polygon.length].slice(0, 3), polygon[i].slice(0, 3));
				const toIntersectionVec = subtract(current, polygon[i].slice(0, 3));
				if (norm(toIntersectionVec) as number < eps) {
					console.log("push vertex");
					isIntersectionOnVertex[i] = true;
				}
				else if (dot(edgeVec, toIntersectionVec) as number >= eps && norm(edgeVec) > norm(toIntersectionVec)) {
					if (norm(subtract(edgeVec, toIntersectionVec)) as number < eps) {
						console.log("push vertex");
						isIntersectionOnVertex[(i + 1) % polygon.length] = true;
					}
					else {
						console.log("push current");
						isIntersectionOnEdge[i] = true;
						intersectionPoint.push(current);
					}
				}
			}

			console.groupEnd();
		}

		let type: (typeof this.findPolygonDivisionPoints extends (...args: any) => infer R ? R : never)["type"] = "triangleAndSquare";
		let indexCode: number = 0;

		if (isIntersectionOnVertex.includes(true)) {
			type = "triangles";
			indexCode = isIntersectionOnVertex.indexOf(true);
		}
		else {
			indexCode = isIntersectionOnEdge.indexOf(false);
		}

		return { positions: intersectionPoint, type: type, indexCode: indexCode };
	}

	/**
	 * ポリゴンを分割したポリゴンストリップを作成する
	 * @param polygon 
	 * @param info 
	 * @returns ポリゴンストリップを表す配列
	 */
	private makeDivisionPolygons(polygon: Coordinate3d[], info: { positions: number[][], type: "triangleAndSquare" | "triangles", indexCode: number }): Coordinate3d[] {
		const positions = info.positions;
		const retPolygonStrip: Coordinate3d[] = [];

		const first = info.indexCode;
		const second = (first + 1) % polygon.length;
		const third = (second + 1) % polygon.length;

		console.log("polygon", polygon);
		if (info.type === "triangleAndSquare") {
			if (info.indexCode === 1) {
				[positions[0], positions[1]] = [positions[1], positions[0]];
			}

			retPolygonStrip.push(polygon[third], concat(positions[1], [1]) as Coordinate3d, concat(positions[0], [1]) as Coordinate3d, polygon[first], polygon[second]);
		}
		else {
			retPolygonStrip.push(polygon[second], concat(positions[0], [1]) as Coordinate3d, polygon[first], polygon[third]);
		}

		return retPolygonStrip;
	}
}