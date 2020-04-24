import { DependencyBuilder, EventsDependencies } from '../DependencyBuilder'
import { ContentEvent } from '@contember/engine-common'
import { Schema } from '@contember/schema'

export class DependencyBuilderList implements DependencyBuilder {
	constructor(private readonly builders: DependencyBuilder[]) {}

	async build(schema: Schema, events: ContentEvent[]): Promise<EventsDependencies> {
		const emptyDeps = events.map(it => it.id).reduce((acc, val) => ({ ...acc, [val]: [] }), {})

		return (await Promise.all(this.builders.map(builder => builder.build(schema, events)))).reduce((result, val) => {
			for (let event in val) {
				const current = result[event] || []
				result[event] = [...current, ...val[event].filter(it => !current.includes(it) && it !== event)]
			}
			return result
		}, emptyDeps)
	}
}
