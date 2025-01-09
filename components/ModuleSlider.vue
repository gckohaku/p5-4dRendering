<script setup lang="ts">

const modelValue = defineModel<string | number>();

interface Props {
	text: string;
	name?: string;
	id?: string;
	min?: string | number;
	max?: string | number;
	step?: string | number;
	isRolling?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	min: 0,
	max: 100,
	step: 1,
	isRolling: false,
}); 

const onPushLeftButton = async () => {
	if (!props.isRolling && Number(modelValue.value) <= Number(props.min)) {
		return;
	}

	modelValue.value = Number(modelValue.value) - Number(props.step);

	await nextTick();

	if (modelValue.value && props.isRolling && Number(modelValue.value) < Number(props.min)) {
		const afterRollingValue: number = Number(modelValue.value) + (Number(props.max) - Number(props.min));
		modelValue.value = afterRollingValue;
	}
}

const onPushRightButton = async () => {
	if (!props.isRolling && Number(modelValue.value) >= Number(props.max)) {
		return;	
	}
	
	modelValue.value = Number(modelValue.value) + Number(props.step);

	await nextTick();

	if (modelValue.value && props.isRolling && Number(modelValue.value) > Number(props.max)) {
		const afterRollingValue: number = Number(modelValue.value) - (Number(props.max) - Number(props.min));
		modelValue.value = afterRollingValue;
	}
}
</script>

<template>
	<div class="module-wrapper">
		<p>{{ text }}: {{modelValue}}</p>
		<div class="slider-container">
			<button @click="onPushLeftButton"><</button>
			<input type="range" :name="name" :id="id" :min="min" :max="max" :step="step" v-model="modelValue">
			<button @click="onPushRightButton">></button>
		</div>
	</div>
</template>

<style scoped>
.module-wrapper {
	.slider-container {
		display: flex;
	}
}
</style>