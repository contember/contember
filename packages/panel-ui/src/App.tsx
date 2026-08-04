import { lazy, Suspense } from 'react'
import type { PanelRuntimeConfig } from './config.js'

// Lazy on purpose, even for a placeholder: the build is embedded into the engine binary, so every
// module has to be a separate chunk from the very first commit — see the plan, §3.4.
const Diagnostics = lazy(() => import('./modules/diagnostics.js').then(it => ({ default: it.Diagnostics })))

export const App = ({ config }: { config: PanelRuntimeConfig }) => (
	<main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-8">
		<div>
			<h1 className="text-2xl font-semibold">Contember management</h1>
			<p className="mt-1 text-sm text-neutral-500">
				The panel is served by the engine. Sign-in and the management modules are not wired up yet.
			</p>
		</div>
		<Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
			<Diagnostics config={config} />
		</Suspense>
	</main>
)
