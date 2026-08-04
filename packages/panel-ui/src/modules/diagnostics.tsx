import type { PanelRuntimeConfig } from '../config.js'

export const Diagnostics = ({ config }: { config: PanelRuntimeConfig }) => (
	<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 rounded-md border border-neutral-200 p-4 text-sm">
		<dt className="text-neutral-500">Mount path</dt>
		<dd className="font-mono">{config.basePath}</dd>
		<dt className="text-neutral-500">API base</dt>
		<dd className="font-mono">{config.apiBaseUrl}</dd>
	</dl>
)
