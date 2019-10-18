import { AnyEvent } from '@contember/engine-common'

interface DependencyBuilder {
	build(events: AnyEvent[]): Promise<DependencyBuilder.Dependencies>
}

namespace DependencyBuilder {
	export type Dependencies = { [eventId: string]: string[] }

	export class DependencyBuilderList implements DependencyBuilder {
		constructor(private readonly builders: DependencyBuilder[]) {}

		async build(events: AnyEvent[]): Promise<Dependencies> {
			const emptyDeps = events.map(it => it.id).reduce((acc, val) => ({ ...acc, [val]: [] }), {})

			return (await Promise.all(this.builders.map(builder => builder.build(events)))).reduce((result, val) => {
				for (let event in val) {
					const current = result[event] || []
					result[event] = [...current, ...val[event].filter(it => !current.includes(it) && it !== event)]
				}
				return result
			}, emptyDeps)
		}
	}
}

export default DependencyBuilder
