import * as React from 'react'
import { ReactNode } from 'react'
import { Loader } from '@contember/react-ui-lib-base'
import { isForbiddenError, TenantQueryLoaderState } from '@contember/react-client-tenant'
import { TerminalIcon } from 'lucide-react'
import { dict } from '../dict.js'

export interface ConfigQueryStateProps {
	forbiddenMessage: string
	failedMessage: string
}

/**
 * Renders the non-data states of a configuration query, or `null` once data is
 * available — a plain helper, not a component, so the caller can `return` it and
 * then narrow on `'data' in query`.
 *
 * The read-only configuration views all share one shape: a permission-gated
 * query that throws rather than returning an empty result, so "you may not see
 * this" has to be rendered as an ordinary state instead of a failure.
 */
export const renderConfigQueryState = <Result,>(
	{ query, forbiddenMessage, failedMessage }: ConfigQueryStateProps & { query: TenantQueryLoaderState<Result> },
): ReactNode => {
	if (query.state === 'error') {
		return isForbiddenError(query.error)
			? <div className="text-gray-500 italic">{forbiddenMessage}</div>
			: <div className="text-destructive italic">{failedMessage}</div>
	}
	if (!('data' in query)) {
		return (
			<div className="relative min-h-24">
				<Loader position="absolute" />
			</div>
		)
	}
	return null
}

/** Points at the write path these views deliberately do not offer. */
export const ManagedByCliNote = () => (
	<p className="flex items-center gap-2 text-sm text-gray-500">
		<TerminalIcon className="w-3.5 h-3.5 shrink-0" />
		<span>
			{dict.tenant.configView.managedByCli} <code className="font-mono">{dict.tenant.configView.managedByCliCommand}</code>
		</span>
	</p>
)

export const ConfigSection = ({ title, children }: { title: string; children: ReactNode }) => (
	<div className="flex flex-col gap-2">
		<h3 className="text-sm font-semibold text-gray-700">{title}</h3>
		{children}
	</div>
)

/** Formats a config leaf value for display; `null`/`undefined` read as "not set". */
export const formatConfigValue = (value: unknown): string => {
	if (value === null || value === undefined) {
		return dict.tenant.configView.notSet
	}
	if (typeof value === 'boolean') {
		return value ? dict.tenant.configView.enabled : dict.tenant.configView.disabled
	}
	if (Array.isArray(value)) {
		// An empty list is a meaningful setting, not a missing one — for the panel policy it means
		// nobody may enter — so it must not fall through to `String([])` and render as a blank cell.
		return value.length === 0 ? dict.tenant.configView.emptyList : value.join(', ')
	}
	return String(value)
}
