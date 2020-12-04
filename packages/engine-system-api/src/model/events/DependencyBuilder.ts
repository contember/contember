import { ContentEvent } from '@contember/engine-common'
import { Schema } from '@contember/schema'
import { MapSet } from '../../utils'

export interface DependencyBuilder {
	build(schema: Schema, events: ContentEvent[]): Promise<EventsDependencies>
}

export type EventsDependencies = MapSet<string, string>
