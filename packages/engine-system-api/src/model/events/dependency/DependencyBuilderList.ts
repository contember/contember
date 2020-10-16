import { DependencyBuilder, EventsDependencies } from '../DependencyBuilder'
import { ContentEvent } from '@contember/engine-common'
import { Schema } from '@contember/schema'
import { MapSet } from '../../../utils'

export class DependencyBuilderList implements DependencyBuilder {
	constructor(private readonly builders: DependencyBuilder[]) {}

	async build(schema: Schema, events: ContentEvent[]): Promise<EventsDependencies> {
		const deps: EventsDependencies = new MapSet()
		for (const event of events) {
			deps.add(event.id)
		}
		const buildersDeps = await Promise.all(this.builders.map(builder => builder.build(schema, events)))
		deps.merge(...buildersDeps)
		return deps
	}
}
