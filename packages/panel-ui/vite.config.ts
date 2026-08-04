import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
	// Relative base + the `<base href>` that PanelController injects. Vite then resolves lazy chunks
	// through `import.meta.url`, so the panel works at any mount path (CONTEMBER_PANEL_PATH) and at
	// any route depth — an absolute base would bake `/panel/` into every chunk.
	base: './',
	plugins: [tailwindcss(), react()],
	build: {
		// Every asset is content-hashed, so PanelController can serve them immutable; index.html is the
		// only mutable entry.
		assetsDir: 'assets',
		rollupOptions: {
			output: {
				// Modules are lazy-loaded (see the module registry), and the whole build is embedded into
				// the engine binary — keep React in its own chunk so it is not duplicated across them.
				manualChunks: {
					react: ['react', 'react-dom', 'react-dom/client'],
				},
			},
		},
	},
})
