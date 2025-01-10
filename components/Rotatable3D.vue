<script setup lang="ts">
import { chain, concat, cot, divide, mean, pi, unit } from "mathjs";
import type p5 from "p5";
import App from "~/app.vue";
import { type Coordinate3d, makeCoordinate3d } from "~/utils/defines/MatrixCoordinateTypes";
import type { Matrix } from "~/utils/defines/MatrixTypes";
import { makeRotate3DMatrix44 } from "~/utils/defines/MatrixUtilities";
import type { ColorRGBArray } from "~/utils/defines/TypeUtilities";
import ControllerUi3D from "./ControllerUi3D.vue";

const moveX: Ref<string> = ref("0");
const moveY: Ref<string> = ref("0");
const moveZ: Ref<string> = ref("0");
const rotateX: Ref<string> = ref("0");
const rotateY: Ref<string> = ref("0");
const rotateZ: Ref<string> = ref("0");
const sizeX: Ref<string> = ref("1.0");
const sizeY: Ref<string> = ref("1.0");
const sizeZ: Ref<string> = ref("1.0");

const cameraMoveX: Ref<string> = ref("0");
const cameraMoveY: Ref<string> = ref("0");
const cameraMoveZ: Ref<string> = ref("0");
const cameraRotateX: Ref<string> = ref("0");
const cameraRotateY: Ref<string> = ref("0");
const cameraRotateZ: Ref<string> = ref("0");
const cameraSizeX: Ref<string> = ref("1.0");
const cameraSizeY: Ref<string> = ref("1.0");
const cameraSizeZ: Ref<string> = ref("1.0");

onMounted(async () => {
	if (process.env.NODE_ENV === "development") {
		console.log("develop");

		const initializeState = localStorage.getItem("initializeState");

		if (initializeState === "initialized") {
			console.log("a");
			localStorage.setItem("initializeState", "reload");
			console.log("page reloading");
			location.reload();
			return;
		}

		localStorage.setItem("initializeState", "initialized");
	}

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
		model.makeBSPTree(0);
		console.log(model.bspTree?.toString());

		p.setup = () => {
			if (import.meta.dev) {
				const oldWrapper = p.select(".control-wrapper");

				if (oldWrapper) {
					oldWrapper.remove();
				}
			}

			p.createCanvas(600, 600).parent("canvas");
		}

		p.draw = () => {
			p.clear();
			p.stroke(0, 0, 0, 128);
			p.strokeWeight(1);
			p.line(center[0], 0, center[0], canvasSize[1]);
			p.line(0, center[1], canvasSize[0], center[1]);

			const sizeMatrix: ComputedRef<Matrix<4, 4>> = computed(() => [[Number(sizeX.value), 0, 0, 0], [0, Number(sizeY.value), 0, 0], [0, 0, Number(sizeZ.value), 0], [0, 0, 0, 1]]);
			const rotateMatrix: ComputedRef<Matrix<4, 4>> = computed(() => makeRotate3DMatrix44(Number(rotateX.value), Number(rotateY.value), Number(rotateZ.value)));
			const parallelMatrix: ComputedRef<Matrix<4, 4>> = computed(() => [[1, 0, 0, Number(moveX.value)], [0, 1, 0, Number(moveY.value)], [0, 0, 1, Number(moveZ.value)], [0, 0, 0, 1]]);

			const transformMatrix: ComputedRef<Matrix<4, 4>> = computed(() => chain(parallelMatrix.value).multiply(rotateMatrix.value).multiply(sizeMatrix.value).done());

			const renderModel = new Model3D(model);

			const focalLength: number = 300 * cot(pi * 23 / 180);

			// 平行移動は目的地の座標に -1 をかける必要がある
			// カメラパラメータの y軸 は今回はスクリーンの y軸 が逆向きのため、-1 をかける必要は無い
			const cameraMatrix: Matrix<3, 3> = [
				[focalLength, 0, -center[0]],
				[0, focalLength, center[1]],
				[0, 0, 1]
			];
			const externalMatrix: Matrix<3, 4> = concat(makeRotate3DMatrix(Number(cameraRotateX.value), Number(cameraRotateY.value), Number(cameraRotateZ.value)), [[Number(cameraMoveX.value)], [Number(cameraMoveY.value)], [-450]]) as Matrix<3, 4>;

			renderModel.affine(transformMatrix.value);

			// renderModel.renderFrame2DPerspective(p, cameraMatrix, externalMatrix, { center: center, strokeColor: "green", subGridColor: "rgb(96, 32, 0)", isSubGrid: false });
			renderModel.render(p, cameraMatrix, externalMatrix, { standardLuminousDistance: 450 });
			// renderModel.renderFrame(p, { center: center, strokeColor: "green", subGridColor: "rgba(96, 32, 0)", subGridAlpha: 0 });
		}
	}

	new p5(sketch);
});
</script>

<template>
	<div class="page-container">
		<div id="canvas" ref="canvasRef"></div>

		<div class="controller-container">
			<ControllerTabContainer>
				<template v-slot:object>
					<ControllerUi3D v-model:move-x="moveX" v-model:move-y="moveY" v-model:move-z="moveZ" v-model:rotate-x="rotateX" v-model:rotate-y="rotateY" v-model:rotate-z="rotateZ" v-model:size-x="sizeX" v-model:size-y="sizeY" v-model:size-z="sizeZ" />
				</template>
				<template v-slot:camera>
					<ControllerUi3D v-model:move-x="cameraMoveX" v-model:move-y="cameraMoveY" v-model:move-z="cameraMoveZ" v-model:rotate-x="cameraRotateX" v-model:rotate-y="cameraRotateY" v-model:rotate-z="cameraRotateZ" v-model:size-x="cameraSizeX" v-model:size-y="cameraSizeY" v-model:size-z="cameraSizeZ" />
				</template>
			</ControllerTabContainer>
		</div>
	</div>

</template>

<style scoped>
.page-container {
	display: flex;
}
</style>