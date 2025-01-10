<script setup lang="ts">
const moveX = defineModel<number | string>("moveX", { required: true });
const moveY = defineModel<number | string>("moveY", { required: true });
const moveZ = defineModel<number | string>("moveZ", { required: true });
const rotateX = defineModel<number | string>("rotateX", { required: true });
const rotateY = defineModel<number | string>("rotateY", { required: true });
const rotateZ = defineModel<number | string>("rotateZ", { required: true });
const sizeX = defineModel<number | string>("sizeX", { required: true });
const sizeY = defineModel<number | string>("sizeY", { required: true });
const sizeZ = defineModel<number | string>("sizeZ", { required: true });
</script>

<template>
	<div class="controller-container">
		<ModuleSlider text="x" max="500" min="-500" v-model="moveX" />
		<ModuleSlider text="y" max="500" min="-500" v-model="moveY" />
		<ModuleSlider text="z" max="500" min="-500" v-model="moveZ" />
		<ModuleSlider text="rotateX" max="360" min="-360" v-model="rotateX" :isRolling="true" />
		<ModuleSlider text="rotateY" max="360" min="-360" v-model="rotateY" :isRolling="true" />
		<ModuleSlider text="rotateZ" max="360" min="-360" v-model="rotateZ" :isRolling="true" />
		<ModuleSlider text="sizeX" max="2.0" min="0.1" step="0.1" v-model="sizeX" />
		<ModuleSlider text="sizeY" max="2.0" min="0.1" step="0.1" v-model="sizeY" />
		<ModuleSlider text="sizeZ" max="2.0" min="0.1" step="0.1" v-model="sizeZ" />
	</div>
</template>

<style scoped>
.controller-container {
	display: grid;
	grid-template-columns: auto;
	height: min-content;
}
</style>