<script lang="ts" setup>

onMounted(async() => {
	const {default: p5} = await import("p5")

	const sketch = (p: InstanceType<typeof p5>) => {
		p.setup = () => {
			p.createCanvas(600, 600).parent("canvas");
		}

		p.draw = () => {
			p.fill(0, 0, 0, 0);
			p.ellipse(50, 50, 80, 80);
			p.triangle(20, 20, 300, 50, 200, 250);
		}
	}

	new p5(sketch);
});

</script>

<template>
	<div id="canvas" ref="canvasRef"></div>
</template>

<style></style>