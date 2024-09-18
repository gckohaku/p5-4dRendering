<script setup lang="ts">
import { chain, concat, cos, divide, multiply, sin, unit } from "mathjs";
import type p5 from "p5";
import { type Coordinate2d, makeCoordinate2d } from "~/utils/defines/MatrixCoordinateTypes";
import type { Matrix } from "~/utils/defines/MatrixTypes";
import { Polygon2D } from "~/utils/defines/Polygon2D";

onMounted(async () => {
	const { default: p5 } = await import("p5")

	const sketch = (p: p5) => {
		const canvasSize = [600, 600];
		const center = divide(canvasSize, 2) as [number, number];

		const pos1: Coordinate2d = makeCoordinate2d(-150, -50);
		const pos2: Coordinate2d = makeCoordinate2d(150, -20);
		const pos3: Coordinate2d = makeCoordinate2d(-50, 150);

		const poly = new Polygon2D(pos1, pos2, pos3);

		const rotateId = "rotate-control";
		const xId = "x-control";
		const yId = "y-control";
		const sizeXId = "size-x-control";
		const sizeYId = "size-y-control";

		p.setup = () => {
			p.createCanvas(600, 600).parent("canvas");
			const wrapperDiv = p.createDiv();
			wrapperDiv.addClass("control-wrapper");

			const rotateControl = createSliderContainer(p, rotateId, "rotate", { min: 0, max: 360 });
			const xControl = createSliderContainer(p, xId, "x", { max: 300, min: -300 });
			const yControl = createSliderContainer(p, yId, "y", { max: 300, min: -300 });
			const sizeXControl = createSliderContainer(p, sizeXId, "sizeX", { min: 0.1, max: 2, value: 1, step: 0.1 });
			const sizeYControl = createSliderContainer(p, sizeYId, "sizeY", { min: 0.1, max: 2, value: 1, step: 0.1 });

			wrapperDiv.child(xControl);
			wrapperDiv.child(yControl);
			wrapperDiv.child(rotateControl);
			wrapperDiv.child(sizeXControl);
			wrapperDiv.child(sizeYControl);

			wrapperDiv.position(610, 0);

			p.select("#__nuxt")!.child(wrapperDiv);
		}

		p.draw = () => {
			p.clear();
			p.stroke(0, 0, 0, 128);
			p.strokeWeight(1);
			p.line(center[0], 0, center[0], canvasSize[1]);
			p.line(0, center[1], canvasSize[0], center[1]);

			const xControl = p.select(`#${xId} .slider`)!;
			const yControl = p.select(`#${yId} .slider`)!;
			const rotateControl = p.select(`#${rotateId} .slider`)!;
			const sizeXControl = p.select(`#${sizeXId} .slider`)!;
			const sizeYControl = p.select(`#${sizeYId} .slider`)!;

			const moveX = Number(xControl.value());
			const moveY = Number(yControl.value());
			const rotateDeg = unit(Number(rotateControl.value()), "deg");
			const sizeX = Number(sizeXControl.value());
			const sizeY = Number(sizeYControl.value());

			const sizeMatrix: Matrix<3, 3> = [[sizeX, 0, 0], [0, sizeY, 0], [0, 0, 1]];
			const rotateMatrix: Matrix<3, 3> = [[cos(rotateDeg), -sin(rotateDeg), 0], [sin(rotateDeg), cos(rotateDeg), 0], [0, 0, 1]];
			const parallelMatrix: Matrix<3, 3> = [[1, 0, moveX], [0, 1, moveY], [0, 0, 1]];

			const transformMatrix: Matrix<3, 3> = chain(parallelMatrix).multiply(rotateMatrix).multiply(sizeMatrix).done();

			const renderPoly = new Polygon2D(poly);

			renderPoly.affine(transformMatrix);
			renderPoly.renderFrame(p, { center: center });
		}
	}

	new p5(sketch);
});
</script>

<template>
	<div id="canvas" ref="canvasRef"></div>
</template>

<style scoped></style>