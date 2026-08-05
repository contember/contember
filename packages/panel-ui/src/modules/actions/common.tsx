import type { EventState } from '@contember/graphql-client-actions'
import { isForbiddenError } from '@contember/react-client-tenant'
import { Button } from '@contember/react-ui-lib-base'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

/** One dispatch attempt, as the dispatcher appends it to the event's `log`. */
export interface EventLogEntry {
	readonly ok: boolean | undefined
	readonly code: number | undefined
	readonly durationMs: number | undefined
	readonly errorMessage: string | undefined
	readonly response: string | undefined
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/** `log` is a `Json` column, so the schema guarantees nothing about its shape — read it defensively. */
export const eventLogEntries = (log: unknown): readonly EventLogEntry[] =>
	(Array.isArray(log) ? log : []).filter(isRecord).map((entry): EventLogEntry => ({
		ok: typeof entry.ok === 'boolean' ? entry.ok : undefined,
		code: typeof entry.code === 'number' ? entry.code : undefined,
		durationMs: typeof entry.durationMs === 'number' ? entry.durationMs : undefined,
		errorMessage: typeof entry.errorMessage === 'string' ? entry.errorMessage : undefined,
		response: typeof entry.response === 'string' ? entry.response : undefined,
	}))

/** The attempt that put the event in its current state, which is the one an operator is looking for. */
export const lastEventLogEntry = (log: unknown): EventLogEntry | undefined => eventLogEntries(log).at(-1)

/** Whatever the last attempt has to say about going wrong; `undefined` when it went fine or said nothing. */
export const eventErrorText = (log: unknown): string | undefined => {
	const entry = lastEventLogEntry(log)
	if (entry === undefined || entry.ok === true) {
		return undefined
	}
	if (entry.errorMessage !== undefined) {
		return entry.code === undefined ? entry.errorMessage : `${entry.code}: ${entry.errorMessage}`
	}
	return entry.code === undefined ? undefined : `HTTP ${entry.code}`
}

const stateClassName: Record<EventState, string> = {
	created: 'bg-gray-100 text-gray-700',
	retrying: 'bg-amber-100 text-amber-800',
	processing: 'bg-blue-100 text-blue-800',
	succeed: 'bg-emerald-100 text-emerald-800',
	failed: 'bg-destructive/10 text-destructive',
	stopped: 'bg-gray-200 text-gray-600',
}

export const EventStateBadge = ({ state }: { state: EventState }) => (
	<span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs font-medium ${stateClassName[state]}`}>{state}</span>
)

const formatJson = (value: unknown): string => {
	try {
		return JSON.stringify(value, null, 2) ?? String(value)
	} catch {
		return String(value)
	}
}

/** Payload and log are JSON; on one collapsed line they are unreadable, so give them room and a scrollbar. */
export const JsonBlock = ({ value }: { value: unknown }) => (
	<pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-xs">{formatJson(value)}</pre>
)

export const formatDateTime = (value: string | undefined): string => value === undefined ? '—' : new Date(value).toLocaleString()

/** The queue puts two timestamps in every row; in full they crowd out the error message. */
export const formatDateTimeShort = (value: string | undefined): string =>
	value === undefined
		? '—'
		: new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })

/** A denied mutation throws; without this split a denial reads as "try again", which is advice nobody can act on. */
export const actionsErrorMessage = (error: unknown): string =>
	isForbiddenError(error)
		? 'Not allowed: this account may not do that in the actions API.'
		: 'The actions API rejected the request.'

export interface OffsetPagerProps {
	page: number
	onPage: (page: number) => void
	/** A full page is the only hint there is more — the API reports no total. */
	hasFullPage: boolean
}

export const OffsetPager = ({ page, onPage, hasFullPage }: OffsetPagerProps) => (
	<div className="flex items-center gap-2">
		<Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>
			<ChevronLeftIcon className="size-4" />
			<span className="sr-only">Previous page</span>
		</Button>
		<span className="text-xs text-muted-foreground">Page {page + 1}</span>
		<Button variant="outline" size="sm" disabled={!hasFullPage} onClick={() => onPage(page + 1)}>
			<ChevronRightIcon className="size-4" />
			<span className="sr-only">Next page</span>
		</Button>
	</div>
)
