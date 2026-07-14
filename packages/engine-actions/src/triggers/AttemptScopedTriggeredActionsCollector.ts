import { TriggeredActionEvent, TriggeredActionsCollector } from '@contember/engine-content-api'

export class AttemptScopedTriggeredActionsCollector implements TriggeredActionsCollector {
	private readonly events: TriggeredActionEvent[] = []
	private published = false

	constructor(
		private readonly requestCollector: TriggeredActionsCollector,
	) {
	}

	add(events: readonly TriggeredActionEvent[]): void {
		this.events.push(...events)
	}

	getEvents(): readonly TriggeredActionEvent[] {
		return this.events
	}

	publish(): void {
		if (this.published) {
			return
		}
		this.published = true
		this.requestCollector.add(this.events)
	}
}

export const createAttemptScopedTriggeredActionsCollector = (
	requestCollector: TriggeredActionsCollector | undefined,
	publishAfterCommit: (publish: () => void) => void,
): TriggeredActionsCollector | undefined => {
	if (requestCollector === undefined) {
		return undefined
	}
	const attemptCollector = new AttemptScopedTriggeredActionsCollector(requestCollector)
	publishAfterCommit(() => attemptCollector.publish())
	return attemptCollector
}
