<script setup lang="ts">
const isOpenPanel: Ref<boolean[]> = ref([true, false]);

const onButtonClick = (index: number) => {
	isOpenPanel.value.fill(false);
	isOpenPanel.value[index] = true;
}
</script>

<template>
	<div class="controllers-wrapper">
		<div class="tabs-container">
			<div class="tab-list" aria-label="Selecting Controller Tabs">
				<button role="tab" :aria-selected="isOpenPanel[0]" aria-controls="object-controller" id="tab-object" tabindex="0" @click="onButtonClick(0)">Object</button>
				<button role="tab" :aria-selected="isOpenPanel[1]" aria-controls="camera-controller" id="tab-camera" tabindex="0" @click="onButtonClick(1)">Camera</button>
			</div>
		</div>
		
		<div class="controller-container">
			<div id="object-controller" role="tabpanel" tabindex="0" aria-labelledby="tab-object" :hidden="!isOpenPanel[0]">
				<slot name="object"></slot>
			</div>
			<div id="camera-controller" role="tabpanel" tabindex="0" aria-labelledby="tab-camera" :hidden="!isOpenPanel[1]">
				<slot name="camera"></slot>
			</div>
		</div>
	</div>


</template>

<style scoped>
.controllers-wrapper {
	.tabs-container {
		.tab-list {
			display: flex;

			button {
				border: 1px #1c1c1c solid;
				border-radius: .4rem .4rem 0 0;
				margin: 0;
				padding: .1rem .2rem;
				font-size: .9rem;
				background-color: #e8e8e8;

				&:hover {
					background-color: #c8c8c8;
				}

				&[aria-selected="true"] {
					background-color: #c8e0e0;
				}
			}
		}
	}

	.controller-container {
		border: #1c1c1c 2px solid;
		border-radius: 5px;
		padding: .25rem;
	}
}
</style>