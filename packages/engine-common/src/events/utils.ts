import { AnyEvent, ContentEvent } from './Event.js'
import { ContentEvents } from './EventType.js'

export const isContentEvent = (it: AnyEvent): it is ContentEvent => {
	return ContentEvents.includes(it.type as ContentEvent['type'])
}
