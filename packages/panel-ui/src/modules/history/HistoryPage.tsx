import type { EventsArgs, EventsOrder, EventType } from '@contember/graphql-client-system'
import { useTenantQueryLoader } from '@contember/react-client-tenant'
import {
	Button,
	Input,
	Label,
	Loader,
	PropertyItem,
	PropertyList,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@contember/react-ui-lib-base'
import { renderConfigQueryState } from '@contember/react-ui-lib-tenant'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, RefreshCwIcon } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import { PageHeader, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'
import { type HistoryEvent, useEventsQuery } from './hooks.js'

const perPage = 50

const allTypes = 'all'
const eventTypes: readonly EventType[] = ['CREATE', 'UPDATE', 'DELETE', 'TRUNCATE']
const isEventType = (value: string): value is EventType => eventTypes.some(it => it === value)

const eventOrders: readonly EventsOrder[] = ['APPLIED_AT_DESC', 'APPLIED_AT_ASC', 'CREATED_AT_DESC', 'CREATED_AT_ASC']
const isEventsOrder = (value: string): value is EventsOrder => eventOrders.some(it => it === value)
const orderLabels: Record<EventsOrder, string> = {
	APPLIED_AT_DESC: 'Applied at, newest first',
	APPLIED_AT_ASC: 'Applied at, oldest first',
	CREATED_AT_DESC: 'Created at, newest first',
	CREATED_AT_ASC: 'Created at, oldest first',
}

/** The panel has no i18n, so the browser's locale formats the ISO strings the API returns. */
const formatDateTime = (value: string): string => new Date(value).toLocaleString()

/** A truncate event has no row of its own. The generated type says `undefined`, the API sends `null`. */
const formatPrimaryKey = (primaryKey: HistoryEvent['primaryKey']): string => primaryKey ? primaryKey.join(', ') : '—'

interface EventValues {
	label: string
	value: unknown
}

/** Which value blob an event carries depends on its concrete type; presence of the field is the discriminant. */
const valuesOf = (event: HistoryEvent): readonly EventValues[] => {
	const values: EventValues[] = []
	if ('newValues' in event) {
		values.push({ label: 'New values', value: event.newValues })
	}
	if ('diffValues' in event) {
		values.push({ label: 'Changed values', value: event.diffValues })
	}
	if ('oldValues' in event) {
		values.push({ label: 'Old values', value: event.oldValues })
	}
	return values
}

const EventDetail = ({ event }: { event: HistoryEvent }) => (
	<div className="flex flex-col gap-4 py-2">
		<PropertyList>
			<PropertyItem label="Description">{event.description}</PropertyItem>
			<PropertyItem label="Event id">{event.id}</PropertyItem>
			<PropertyItem label="Transaction">{event.transactionId}</PropertyItem>
			<PropertyItem label="Identity id">{event.identityId}</PropertyItem>
		</PropertyList>
		{valuesOf(event).map(({ label, value }) => (
			<div key={label} className="flex flex-col gap-1">
				<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
				<pre className="max-h-80 overflow-auto rounded-md border border-gray-200 bg-gray-50/50 p-3 text-xs">{JSON.stringify(value, null, 2)}</pre>
			</div>
		))}
	</div>
)

const EventsTable = ({ events }: { events: readonly HistoryEvent[] }) => {
	const [expanded, setExpanded] = useState<string>()

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Applied at</TableHead>
					<TableHead>Created at</TableHead>
					<TableHead>Type</TableHead>
					<TableHead>Table</TableHead>
					<TableHead>Row</TableHead>
					<TableHead>Identity</TableHead>
					<TableHead className="w-12" />
				</TableRow>
			</TableHeader>
			{events.length === 0 && (
				<TableRow>
					<TableCell colSpan={7} className="text-gray-500 italic">No event matches this filter.</TableCell>
				</TableRow>
			)}
			{events.map(event => (
				<Fragment key={event.id}>
					<TableRow>
						<TableCell className="whitespace-nowrap">{formatDateTime(event.appliedAt)}</TableCell>
						<TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(event.createdAt)}</TableCell>
						<TableCell className="font-mono text-xs">{event.type}</TableCell>
						<TableCell className="font-medium">{event.tableName ?? '—'}</TableCell>
						<TableCell className="font-mono text-xs">{formatPrimaryKey(event.primaryKey)}</TableCell>
						<TableCell>{event.identityDescription}</TableCell>
						<TableCell>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setExpanded(expanded === event.id ? undefined : event.id)}
							>
								{expanded === event.id ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
								<span className="sr-only">Toggle detail</span>
							</Button>
						</TableCell>
					</TableRow>
					{expanded === event.id && (
						<TableRow>
							<TableCell colSpan={7} className="bg-muted/40">
								<EventDetail event={event} />
							</TableCell>
						</TableRow>
					)}
				</Fragment>
			))}
		</Table>
	)
}

const HistoryBrowser = () => {
	const [page, setPage] = useState(0)
	const [type, setType] = useState<EventType | typeof allTypes>(allTypes)
	const [tables, setTables] = useState('')
	const [order, setOrder] = useState<EventsOrder>('APPLIED_AT_DESC')

	// `useTenantQueryLoader` compares its variables one level deep, so the args object has to keep its identity.
	const args = useMemo((): EventsArgs => {
		// The API has no table introspection here, so tables are a free-text, comma separated, OR-combined list.
		const tableList = tables.split(',').map(it => it.trim()).filter(Boolean)
		return {
			filter: {
				types: type === allTypes ? undefined : [type],
				tables: tableList.length === 0 ? undefined : tableList,
			},
			order,
			offset: page * perPage,
			limit: perPage,
		}
	}, [order, page, tables, type])

	// `useTenantQueryLoader` is the repo's query loader — generic despite the name — so system reads get the same states.
	const [query, { refresh }] = useTenantQueryLoader(useEventsQuery(), { args })
	const nonData = renderConfigQueryState({
		query,
		forbiddenMessage: 'This account may not read the history of this project — it is open to project administrators only.',
		failedMessage: 'Failed to load the history.',
	})

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end">
				<div className="flex flex-col gap-2 sm:w-48">
					<Label htmlFor="history-type">Type</Label>
					<Select
						value={type}
						onValueChange={value => {
							setPage(0)
							setType(isEventType(value) ? value : allTypes)
						}}
					>
						<SelectTrigger id="history-type">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={allTypes}>All types</SelectItem>
							{eventTypes.map(it => <SelectItem key={it} value={it}>{it}</SelectItem>)}
						</SelectContent>
					</Select>
				</div>
				<div className="flex grow flex-col gap-2">
					<Label htmlFor="history-tables">Tables</Label>
					<Input
						id="history-tables"
						type="text"
						value={tables}
						placeholder="article, article_locale"
						onChange={e => {
							setPage(0)
							setTables(e.target.value)
						}}
					/>
				</div>
				<div className="flex flex-col gap-2 sm:w-64">
					<Label htmlFor="history-order">Order</Label>
					<Select
						value={order}
						onValueChange={value => {
							setPage(0)
							if (isEventsOrder(value)) {
								setOrder(value)
							}
						}}
					>
						<SelectTrigger id="history-order">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{eventOrders.map(it => <SelectItem key={it} value={it}>{orderLabels[it]}</SelectItem>)}
						</SelectContent>
					</Select>
				</div>
				<Button variant="outline" onClick={refresh}>
					<RefreshCwIcon className="size-4" />
					<span className="sr-only">Refresh</span>
				</Button>
			</div>
			{nonData ?? ('data' in query
				? (
					<>
						<div className="relative">
							{query.state === 'refreshing' && <Loader position="absolute" />}
							<EventsTable events={query.data} />
						</div>
						{/* The API reports no total, so paging goes as far as a full page keeps arriving. */}
						<div className="flex justify-between gap-2">
							<Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
								<ChevronLeftIcon className="size-4" />
								<span className="sr-only">Previous page</span>
							</Button>
							<Button variant="outline" disabled={query.data.length < perPage} onClick={() => setPage(page + 1)}>
								<ChevronRightIcon className="size-4" />
								<span className="sr-only">Next page</span>
							</Button>
						</div>
					</>
				)
				: null)}
		</div>
	)
}

/**
 * The project's data event log. Read-only: the log is what the content API wrote, and nothing in the
 * system API offers to change it.
 */
export const HistoryPage = () => (
	<PageStack>
		<PanelSlots.Title>History</PanelSlots.Title>
		<PageHeader
			title="History"
			description="Every create, update, delete and truncate the content API recorded for this project, with who did it and what changed."
		/>
		<PanelSection>
			<HistoryBrowser />
		</PanelSection>
	</PageStack>
)
