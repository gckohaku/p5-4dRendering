// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2024-08-23",
	devtools: { enabled: true },
	imports: {
		dirs: [
			"utils/**",
		],
	},
})
