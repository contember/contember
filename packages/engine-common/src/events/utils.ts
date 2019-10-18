import { AnyEvent, ContentEvent } from './Event'
import { ContentEvents } from './EventType'

export const isContentEvent = (it: AnyEvent): it is ContentEvent => {
	return ContentEvents.includes(it.type as ContentEvent['type'])
}
