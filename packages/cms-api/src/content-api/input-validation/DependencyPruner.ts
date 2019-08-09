import DependencyCollector from './DependencyCollector'
import { Input, Model } from '@contember/schema'
import { acceptEveryFieldVisitor } from '../../content-schema/modelUtils'
import { filterObject } from '../../utils/object'

export default class DependencyPruner {
	constructor(private readonly model: Model.Schema) {}

	public pruneDependencies(
		entity: Model.Entity,
		dependencies: DependencyCollector.Dependencies,
		input: Input.UpdateDataInput,
	): DependencyCollector.Dependencies {
		return filterObject(
			acceptEveryFieldVisitor<DependencyCollector.Dependencies | undefined>(this.model, entity, {
				visitColumn(entity, column) {
					return input[column.name] === undefined ? dependencies[column.name] : undefined
				},
				visitHasMany({}, relation) {
					return dependencies[relation.name]
				},
				visitHasOne({}, relation) {
					return input[relation.name] === undefined ? dependencies[relation.name] : undefined
				},
			}),
			(key, value) => value !== undefined,
		)
	}
}
