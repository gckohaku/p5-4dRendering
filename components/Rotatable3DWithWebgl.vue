<script setup lang="ts">
import { chain, concat, cot, divide, pi, unit } from "mathjs";
import type p5 from "p5";
import { type Coordinate3d, makeCoordinate3d } from "~/utils/defines/MatrixCoordinateTypes";
import type { Matrix } from "~/utils/defines/MatrixTypes";
import { makeRotate3DMatrix44 } from "~/utils/defines/MatrixUtilities";
import type { ColorRGBArray } from "~/utils/defines/TypeUtilities";

onMounted(async () => {
	const { default: p5 } = await import("p5");

	const sketch = (p: p5) => {
		const canvasSize = [600, 600];
		const center = divide(canvasSize, 2) as [number, number];

		const vertexes: Coordinate3d[] = [
			makeCoordinate3d(-50, 50, 50), // 0
			makeCoordinate3d(50, 50, 50),
			makeCoordinate3d(50, -50, 50),
			makeCoordinate3d(-50, -50, 50),
			makeCoordinate3d(-50, 50, -50),
			makeCoordinate3d(50, 50, -50), // 5
			makeCoordinate3d(50, -50, -50),
			makeCoordinate3d(-50, -50, -50),
		];

		const parts: number[][] = [
			[0, 3, 1, 2],
			[1, 2, 5, 6],
			[5, 6, 4, 7],
			[4, 7, 0, 3],
			[4, 0, 5, 1],
			[3, 7, 2, 6],
		];

		const colors: ColorRGBArray[] = [
			[0, 255, 0],
			[0, 255, 0],
			[0, 255, 0],
			[0, 255, 0],
			[0, 255, 0],
			[0, 255, 0],
		];

		const nextVertexes: Coordinate3d[] = [
			makeCoordinate3d(-60, 0, 0), // 0
			makeCoordinate3d(0, 0, 0),
			makeCoordinate3d(0, 30, 0),
			makeCoordinate3d(60, -15, 40),
			makeCoordinate3d(60, -15, -40), // 4
		];

		const nextParts: number[][] = [
			[0, 3, 2],
			[0, 2, 4],
			[4, 1, 0],
			[1, 3, 0],
			[2, 3, 1],
			[2, 1, 4]
		];

		const nextColors: ColorRGBArray[] = [
			[255, 0, 0],
			[0, 255, 0],
			[0, 0, 255],
			[255, 128, 0],
			[192, 0, 192],
			[0, 192, 192],
		]

		if (parts.length !== colors.length) {
			throw new Error(`parts の長さと colors の長さが不一致\nparts.length: ${parts.length}\ncolors.length: ${colors.length}`);
		}

		const model = new Model3D();
		model.setVertexes(nextVertexes);
		model.setParts(nextParts, nextColors);
		// model.makeBSPTree(0);

		const rotateXId = "rotate-x-control";
		const rotateYId = "rotate-y-control";
		const rotateZId = "rotate-z-control";
		const xId = "x-control";
		const yId = "y-control";
		const zId = "z-control";
		const sizeXId = "size-x-control";
		const sizeYId = "size-y-control";
		const sizeZId = "size-z-control";

		p.setup = () => {
			if (import.meta.dev) {
				const oldWrapper = p.select(".control-wrapper");

				if (oldWrapper) {
					oldWrapper.remove();
				}
			}

			p.createCanvas(600, 600, p.WEBGL).parent("canvas");
			const wrapperDiv = p.createDiv();
			wrapperDiv.addClass("control-wrapper");

			const rotateXControl = createSliderContainer(p, rotateXId, "rotateX", { min: -360, max: 360 });
			const rotateYControl = createSliderContainer(p, rotateYId, "rotateY", { min: -360, max: 360 });
			const rotateZControl = createSliderContainer(p, rotateZId, "rotateZ", { min: -360, max: 360 });
			const xControl = createSliderContainer(p, xId, "x", { max: 300, min: -300 });
			const yControl = createSliderContainer(p, yId, "y", { max: 300, min: -300 });
			const zControl = createSliderContainer(p, zId, "z", { max: 300, min: -300 });
			const sizeXControl = createSliderContainer(p, sizeXId, "sizeX", { min: 0.1, max: 2, value: 1, step: 0.1 });
			const sizeYControl = createSliderContainer(p, sizeYId, "sizeY", { min: 0.1, max: 2, value: 1, step: 0.1 });
			const sizeZControl = createSliderContainer(p, sizeZId, "sizeZ", { min: 0.1, max: 2, value: 1, step: 0.1 });

			wrapperDiv.child(xControl);
			wrapperDiv.child(yControl);
			wrapperDiv.child(zControl);
			wrapperDiv.child(rotateXControl);
			wrapperDiv.child(rotateYControl);
			wrapperDiv.child(rotateZControl);
			wrapperDiv.child(sizeXControl);
			wrapperDiv.child(sizeYControl);
			wrapperDiv.child(sizeZControl);

			wrapperDiv.position(610, 0);

			p.select("#__nuxt")!.child(wrapperDiv);
		}

		p.draw = () => {
			p.clear();
			p.strokeWeight(1);
			p.normalMaterial();
			p.orbitControl();

			const xControl = p.select(`#${xId} .slider`)!;
			const yControl = p.select(`#${yId} .slider`)!;
			const zControl = p.select(`#${zId} .slider`)!;
			const rotateXControl = p.select(`#${rotateXId} .slider`)!;
			const rotateYControl = p.select(`#${rotateYId} .slider`)!;
			const rotateZControl = p.select(`#${rotateZId} .slider`)!;
			const sizeXControl = p.select(`#${sizeXId} .slider`)!;
			const sizeYControl = p.select(`#${sizeYId} .slider`)!;
			const sizeZControl = p.select(`#${sizeZId} .slider`)!;

			const moveX = Number(xControl.value());
			const moveY = Number(yControl.value());
			const moveZ = Number(zControl.value());
			const rotateXDeg = unit(Number(rotateXControl.value()), "deg");
			const rotateYDeg = unit(Number(rotateYControl.value()), "deg");
			const rotateZDeg = unit(Number(rotateZControl.value()), "deg");
			const sizeX = Number(sizeXControl.value());
			const sizeY = Number(sizeYControl.value());
			const sizeZ = Number(sizeZControl.value());

			const sizeMatrix: Matrix<4, 4> = [[sizeX, 0, 0, 0], [0, sizeY, 0, 0], [0, 0, sizeZ, 0], [0, 0, 0, 1]];
			const rotateMatrix: Matrix<4, 4> = makeRotate3DMatrix44(rotateXDeg.toNumber(), rotateYDeg.toNumber(), rotateZDeg.toNumber());
			// const rotateMatrix = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
			const parallelMatrix: Matrix<4, 4> = [[1, 0, 0, moveX], [0, 1, 0, moveY], [0, 0, 1, moveZ], [0, 0, 0, 1]];

			const transformMatrix: Matrix<4, 4> = chain(parallelMatrix).multiply(rotateMatrix).multiply(sizeMatrix).done();

			const renderModel = new Model3D(model);

			const focalLength: number = 300 * cot(pi * 23 / 180);

			// 平行移動は目的地の座標に -1 をかける必要がある
			// カメラパラメータの y軸 は今回はスクリーンの y軸 が逆向きのため、-1 をかける必要は無い
			const cameraMatrix: Matrix<3, 3> = [
				[focalLength, 0, -center[0]],
				[0, focalLength, center[1]],
				[0, 0, 1]
			];
			const externalMatrix: Matrix<3, 4> = concat(makeRotate3DMatrix(0, 0, 0), [[0], [0], [-450]]) as Matrix<3, 4>;

			renderModel.affine(transformMatrix);

			renderModel.renderWithWebgl(p);
		}
	}

	new p5(sketch);
});
</script>

<template>
	<div id="canvas" ref="canvasRef"></div>
</template>

<style scoped>
/* solving Vue - Official 2.1.8 bug */
</style>