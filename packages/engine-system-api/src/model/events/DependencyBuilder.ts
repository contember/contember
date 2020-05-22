import { ContentEvent } from '@contember/engine-common'
import { Schema } from '@contember/schema'

export interface DependencyBuilder {
	build(schema: Schema, events: ContentEvent[]): Promise<EventsDependencies>
}

export type EventsDependencies = { [eventId: string]: string[] }
