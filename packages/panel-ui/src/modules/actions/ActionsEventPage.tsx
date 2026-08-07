import { useProjectSlug } from '@contember/react-client'
import { useTenantQueryLoader } from '@contember/react-client-tenant'
import { Link, useCurrentRequest } from '@contember/react-routing'
import { AnchorButton, Button, Loader, PropertyItem, PropertyList, ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import { renderConfigQueryState } from '@contember/react-ui-lib-tenant'
import { ArrowLeftIcon, SearchXIcon } from 'lucide-react'
import { useState } from 'react'
import { stringParameter } from '../../shell/requestParameters.js'
import { EmptyState, PageHeader, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'
import { actionsErrorMessage, EventStateBadge, formatDateTime, JsonBlock, lastEventLogEntry } from './common.js'
import { type ActionsEventDetail, useEventQuery, useRetryEventMutation, useStopEventMutation } from './hooks.js'

const LastAttempt = ({ log }: { log: unknown }) => {
	const entry = lastEventLogEntry(log)
	if (entry === undefined) {
		return <p className="text-sm text-muted-foreground">No attempt has been recorded yet.</p>
	}

	return (
		<div className="flex flex-col gap-4">
			<PropertyList>
				<PropertyItem label="Result">
					{entry.ok === undefined ? '—' : entry.ok ? 'Delivered' : <span className="text-destructive">Failed</span>}
				</PropertyItem>
				<PropertyItem label="HTTP code">{entry.code ?? '—'}</PropertyItem>
				<PropertyItem label="Duration">{entry.durationMs === undefined ? '—' : `${entry.durationMs} ms`}</PropertyItem>
			</PropertyList>
			{entry.errorMessage !== undefined && <p className="text-sm text-destructive">{entry.errorMessage}</p>}
			{entry.response !== undefined && (
				<div className="flex flex-col gap-2">
					<h3 className="text-sm font-medium">Response body</h3>
					<JsonBlock value={entry.response} />
				</div>
			)}
		</div>
	)
}

const EventDetail = ({ event, onChanged }: { event: ActionsEventDetail; onChanged: () => void }) => {
	const showToast = useShowToast()
	const retryEvent = useRetryEventMutation()
	const stopEvent = useStopEventMutation()
	const [pending, setPending] = useState(false)
	const projectSlug = useProjectSlug()

	const runEventAction = async (action: (id: string) => Promise<void>, done: string) => {
		setPending(true)
		try {
			await action(event.id)
			showToast(<ToastContent>{done}</ToastContent>, { type: 'success' })
			onChanged()
		} catch (error) {
			showToast(<ToastContent title="Action failed">{actionsErrorMessage(error)}</ToastContent>, { type: 'error' })
		} finally {
			setPending(false)
		}
	}

	return (
		<>
			<PageHeader
				title="Event"
				description={event.id}
				actions={
					<>
						<Link to={{ pageName: 'actionsQueue', parameters: { project: projectSlug } }}>
							<AnchorButton variant="ghost" size="sm" className="gap-1.5">
								<ArrowLeftIcon className="size-4" />
								Queue
							</AnchorButton>
						</Link>
						<Button variant="outline" size="sm" disabled={pending} onClick={() => runEventAction(retryEvent, 'Event queued for another attempt')}>
							Retry
						</Button>
						<Button variant="outline" size="sm" disabled={pending} onClick={() => runEventAction(stopEvent, 'Event stopped')}>
							Stop
						</Button>
					</>
				}
			/>
			<PanelSection title="Event" description="Where this change came from and where it is going.">
				<PropertyList>
					<PropertyItem label="State">
						<EventStateBadge state={event.state} />
					</PropertyItem>
					<PropertyItem label="Target">
						<span className="font-mono text-xs">{event.target}</span>
					</PropertyItem>
					<PropertyItem label="Stage">
						<span className="font-mono text-xs">{event.stage}</span>
					</PropertyItem>
					<PropertyItem label="Created at">{formatDateTime(event.createdAt)}</PropertyItem>
					<PropertyItem label="Last state change">{formatDateTime(event.lastStateChange)}</PropertyItem>
					{/* For a retrying event this is when the worker may pick it up again. */}
					<PropertyItem label="Visible at">{formatDateTime(event.visibleAt)}</PropertyItem>
					<PropertyItem label="Retries">{event.numRetries}</PropertyItem>
					<PropertyItem label="Transaction">
						<span className="font-mono text-xs">{event.transactionId}</span>
					</PropertyItem>
					<PropertyItem label="Identity">
						<span className="font-mono text-xs">{event.identityId ?? '—'}</span>
					</PropertyItem>
					<PropertyItem label="IP address">
						<span className="font-mono text-xs">{event.ipAddress ?? '—'}</span>
					</PropertyItem>
					<PropertyItem label="User agent">{event.userAgent ?? '—'}</PropertyItem>
				</PropertyList>
			</PanelSection>
			<PanelSection title="Last attempt" description="What the target answered the last time this event was delivered.">
				<LastAttempt log={event.log} />
			</PanelSection>
			<PanelSection
				title="Payload"
				description="The change itself. On delivery the dispatcher adds a meta block (event id, transaction, identity) and batches it into the target's body."
			>
				<JsonBlock value={event.payload} />
			</PanelSection>
			<PanelSection title="Attempt history" description="One entry per delivery attempt, raw — the log is a JSON column the dispatcher alone writes.">
				<JsonBlock value={event.log} />
			</PanelSection>
		</>
	)
}

const ActionsEvent = ({ eventId }: { eventId: string }) => {
	// `useTenantQueryLoader` is generic despite the name — the repo's one loader, reused instead of a second one.
	const [query, { refresh }] = useTenantQueryLoader(useEventQuery(), { id: eventId })
	// The resolver rejects rather than answering nothing, so "not yours to see" is an ordinary state.
	const nonData = renderConfigQueryState({
		query,
		forbiddenMessage: 'This account may not read actions events; viewing them needs the project admin role.',
		failedMessage: 'The event could not be loaded.',
	})
	if (nonData !== null) {
		return nonData
	}
	if (!('data' in query)) {
		return null
	}
	const event = query.data

	return (
		<div className="relative flex flex-col gap-6">
			{query.state === 'refreshing' && <Loader position="absolute" />}
			{event === undefined
				? <EmptyState icon={<SearchXIcon className="size-5" />} title="Event not found" description="No event with this id exists in this project." />
				: <EventDetail event={event} onChanged={refresh} />}
		</div>
	)
}

export const ActionsEventPage = () => {
	const eventId = stringParameter(useCurrentRequest()?.parameters.eventId)

	return (
		<PageStack>
			<PanelSlots.Title>Actions</PanelSlots.Title>
			{eventId === undefined
				? <EmptyState icon={<SearchXIcon className="size-5" />} title="No event selected" description="This address carries no event id." />
				: <ActionsEvent eventId={eventId} />}
		</PageStack>
	)
}
