import { useProjectSlug } from '@contember/react-client'
import { type TenantQueryLoaderState, useTenantQueryLoader } from '@contember/react-client-tenant'
import { Link } from '@contember/react-routing'
import {
	AnchorButton,
	Button,
	Loader,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	ToastContent,
	useShowToast,
} from '@contember/react-ui-lib-base'
import { renderConfigQueryState } from '@contember/react-ui-lib-tenant'
import { PlayIcon, RefreshCwIcon, SlidersHorizontalIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { PageHeader, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'
import { actionsErrorMessage, eventErrorText, EventStateBadge, formatDateTime, OffsetPager } from './common.js'
import {
	type ActionsEventListItem,
	type EventListFetcher,
	useEventsInProcessingQuery,
	useEventsToProcessQuery,
	useFailedEventsQuery,
	useProcessBatchMutation,
	useRetryEventMutation,
	useStopEventMutation,
} from './hooks.js'

const perPage = 20

interface EventList {
	readonly query: TenantQueryLoaderState<readonly ActionsEventListItem[]>
	readonly page: number
	readonly setPage: (page: number) => void
	readonly refresh: () => void
}

/** `useTenantQueryLoader` is generic despite the name — the repo's one loader, reused instead of a second one. */
const useEventList = (fetcher: EventListFetcher): EventList => {
	const [page, setPage] = useState(0)
	const [query, { refresh }] = useTenantQueryLoader(fetcher, { offset: page * perPage, limit: perPage })

	return { query, page, setPage, refresh }
}

interface EventListSectionProps {
	title: string
	description: string
	/** What an empty list means here — for failed events that is the good case, not "no results". */
	emptyMessage: string
	list: EventList
	rowActions?: (event: ActionsEventListItem) => ReactNode
}

const EventListSection = ({ title, description, emptyMessage, list, rowActions }: EventListSectionProps) => {
	const projectSlug = useProjectSlug()
	// The resolvers reject rather than answering an empty list, so "not yours to see" is an ordinary state.
	const nonData = renderConfigQueryState({
		query: list.query,
		forbiddenMessage: 'This account may not read the actions queue; viewing events needs the project admin role.',
		failedMessage: 'The event list could not be loaded.',
	})
	const events = 'data' in list.query ? list.query.data : undefined

	return (
		<PanelSection
			title={title}
			description={description}
			actions={
				<>
					<Button variant="outline" size="sm" onClick={list.refresh}>
						<RefreshCwIcon className="size-3.5" />
						<span className="sr-only">Refresh</span>
					</Button>
					<OffsetPager page={list.page} onPage={list.setPage} hasFullPage={events !== undefined && events.length === perPage} />
				</>
			}
		>
			{nonData !== null ? nonData : (
				<div className="relative">
					{list.query.state === 'refreshing' && <Loader position="absolute" />}
					{events !== undefined && events.length === 0
						? <p className="text-sm text-muted-foreground">{emptyMessage}</p>
						: (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>State</TableHead>
										<TableHead>Target</TableHead>
										<TableHead>Created</TableHead>
										<TableHead>Last state change</TableHead>
										<TableHead>Retries</TableHead>
										<TableHead>Error</TableHead>
										<TableHead />
									</TableRow>
								</TableHeader>
								<TableBody>
									{events?.map(event => {
										const error = eventErrorText(event.log)
										return (
											<TableRow key={event.id}>
												<TableCell>
													<EventStateBadge state={event.state} />
												</TableCell>
												<TableCell className="font-mono text-xs">
													{event.target}
													<span className="text-muted-foreground">{' @ '}{event.stage}</span>
												</TableCell>
												<TableCell className="whitespace-nowrap">{formatDateTime(event.createdAt)}</TableCell>
												<TableCell className="whitespace-nowrap">{formatDateTime(event.lastStateChange)}</TableCell>
												<TableCell>{event.numRetries}</TableCell>
												<TableCell className="max-w-sm truncate text-destructive" title={error}>{error ?? '—'}</TableCell>
												<TableCell>
													<div className="flex items-center justify-end gap-2">
														{rowActions?.(event)}
														<Link to={{ pageName: 'actionsEvent', parameters: { project: projectSlug, eventId: event.id } }}>
															<AnchorButton variant="ghost" size="xs">Detail</AnchorButton>
														</Link>
													</div>
												</TableCell>
											</TableRow>
										)
									})}
								</TableBody>
							</Table>
						)}
				</div>
			)}
		</PanelSection>
	)
}

/**
 * The dispatch queue in its three states. The lists carry no total and no cursor — `EventArgs` is
 * offset and limit — so paging forward stops where a page comes back short.
 */
const ActionsQueue = () => {
	const showToast = useShowToast()
	const failed = useEventList(useFailedEventsQuery())
	const toProcess = useEventList(useEventsToProcessQuery())
	const inProcessing = useEventList(useEventsInProcessingQuery())
	const processBatch = useProcessBatchMutation()
	const retryEvent = useRetryEventMutation()
	const stopEvent = useStopEventMutation()
	const [pending, setPending] = useState(false)
	const projectSlug = useProjectSlug()

	const runProcessBatch = async () => {
		setPending(true)
		try {
			await processBatch()
			showToast(<ToastContent>Batch processed</ToastContent>, { type: 'success' })
			failed.refresh()
			toProcess.refresh()
			inProcessing.refresh()
		} catch (error) {
			showToast(<ToastContent title="Batch not processed">{actionsErrorMessage(error)}</ToastContent>, { type: 'error' })
		} finally {
			setPending(false)
		}
	}

	const runEventAction = async (action: (id: string) => Promise<void>, id: string, done: string) => {
		setPending(true)
		try {
			await action(id)
			showToast(<ToastContent>{done}</ToastContent>, { type: 'success' })
			failed.refresh()
			toProcess.refresh()
		} catch (error) {
			showToast(<ToastContent title="Action failed">{actionsErrorMessage(error)}</ToastContent>, { type: 'error' })
		} finally {
			setPending(false)
		}
	}

	return (
		<PageStack>
			<PageHeader
				title="Actions"
				description="Entity changes queued for delivery to webhook targets. The dispatch worker drains the queue on its own; processing a batch here only makes it happen now."
				actions={
					<>
						<Link to={{ pageName: 'actionsVariables', parameters: { project: projectSlug } }}>
							<AnchorButton variant="outline" size="sm" className="gap-1.5">
								<SlidersHorizontalIcon className="size-4" />
								Variables
							</AnchorButton>
						</Link>
						<Button size="sm" className="gap-1.5" disabled={pending} onClick={runProcessBatch}>
							<PlayIcon className="size-4" />
							Process batch
						</Button>
					</>
				}
			/>
			<EventListSection
				title="Failed"
				description="Retries exhausted or the target refused permanently. These stay here until someone retries or stops them."
				emptyMessage="No failed events. Everything that was dispatched either succeeded or is still on its way."
				list={failed}
				rowActions={event => (
					<>
						<Button variant="outline" size="xs" disabled={pending} onClick={() => runEventAction(retryEvent, event.id, 'Event queued for another attempt')}>
							Retry
						</Button>
						<Button variant="outline" size="xs" disabled={pending} onClick={() => runEventAction(stopEvent, event.id, 'Event stopped')}>
							Stop
						</Button>
					</>
				)}
			/>
			<EventListSection
				title="Waiting to be processed"
				description="Queued or waiting out a retry backoff. The worker picks these up on its next round."
				emptyMessage="Nothing is waiting. The queue is drained."
				list={toProcess}
			/>
			<EventListSection
				title="In processing"
				description="Handed to a target right now. An entry stuck here past the ten-minute acknowledgement timeout is requeued automatically."
				emptyMessage="Nothing is being dispatched at the moment."
				list={inProcessing}
			/>
		</PageStack>
	)
}

export const ActionsQueuePage = () => (
	<>
		<PanelSlots.Title>Actions</PanelSlots.Title>
		<ActionsQueue />
	</>
)
