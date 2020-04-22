import { AnyEvent, ContentEvent, isContentEvent } from '@contember/engine-common'

export function assertEveryIsContentEvent(events: AnyEvent[]): asserts events is ContentEvent[] {
	if (!events.every(isContentEvent)) {
		throw new Error('Unable to diff/apply non-content event')
	}
}
