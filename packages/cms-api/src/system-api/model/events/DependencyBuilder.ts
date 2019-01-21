import { Event } from '../dtos/Event'

interface DependencyBuilder {
	build(events: Event[]): Promise<DependencyBuilder.Dependencies>
}

namespace DependencyBuilder {
	export type Dependencies = { [eventId: string]: string[] }

	export class DependencyBuilderList implements DependencyBuilder {
		constructor(private readonly builders: DependencyBuilder[]) {}

		async build(events: Event[]): Promise<Dependencies> {
			return (await Promise.all(this.builders.map(builder => builder.build(events)))).reduce((result, val) => {
				for (let event in val) {
					const current = (result[event] || [])
					result[event] = [...current, ...val[event].filter(it => !current.includes(it))]
				}
				return result
			}, {})
		}
	}
}

export default DependencyBuilder
