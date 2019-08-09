import { Model } from '@contember/schema'
import { acceptFieldVisitor } from '@contember/schema-utils'

type Matcher = (schema: Model.Schema, entity: Model.Entity) => boolean

export default class EntitySelector {
	private constructor(private readonly matchers: Matcher[]) {}

	public static every() {
		return new EntitySelector([])
	}

	public static named(...name: string[]) {
		return EntitySelector.every().named(...name)
	}

	public named(...name: string[]) {
		return this.matching((schema, entity) => name.includes(entity.name))
	}

	public havingRelation(name: string, targetEntity?: string) {
		return this.matching(
			(schema, entity) =>
				entity.fields[name] &&
				acceptFieldVisitor(schema, entity, name, {
					visitColumn: () => false,
					visitRelation: ({}, {}, target) => !targetEntity || target.name === targetEntity,
				}),
		)
	}

	public matching(matcher: Matcher): EntitySelector {
		return new EntitySelector([...this.matchers, matcher])
	}

	public matches(schema: Model.Schema, entity: Model.Entity): boolean {
		return this.matchers.reduce<boolean>((prev, predicate) => prev && predicate(schema, entity), true)
	}
}
