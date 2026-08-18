import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig } from 'vite'

// Workspace packages are consumed as TypeScript sources: `dist/` only exists after the repo-wide
// `ts:build`, and the panel is built from a clean checkout by engine-panel's pre-build step.
// Same mapping as `scripts/vite/resolveConfig.ts`, inlined so the package builds on its own.
const packagesDir = resolve(import.meta.dirname, '..')
const workspaceSources = Object.fromEntries(
	readdirSync(packagesDir, { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(entry => [`@contember/${entry.name}`, join(packagesDir, entry.name, 'src')]),
)

export default defineConfig({
	// Relative base + the `<base href>` that PanelController injects. Vite then resolves lazy chunks
	// through `import.meta.url`, so the panel works at any mount path (CONTEMBER_PANEL_PATH) and at
	// any route depth — an absolute base would bake `/panel/` into every chunk.
	base: './',
	plugins: [tailwindcss(), react()],
	resolve: {
		alias: workspaceSources,
	},
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
