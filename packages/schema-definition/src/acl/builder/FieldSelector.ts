import { Model } from '@contember/schema'

type Matcher = (schema: Model.Schema, entity: Model.Entity, field: Model.AnyField) => boolean

export default class FieldSelector {
	private constructor(private readonly matchers: Matcher[]) {}

	public static every() {
		return new FieldSelector([])
	}

	public static named(...name: string[]) {
		return FieldSelector.every().named(...name)
	}

	public named(...name: string[]) {
		return this.matching((schema, entity, field) => name.includes(field.name))
	}

	public except(...name: string[]) {
		return this.matching((schema, entity, field) => !name.includes(field.name))
	}

	public matching(matcher: Matcher): FieldSelector {
		return new FieldSelector([...this.matchers, matcher])
	}

	public matches(schema: Model.Schema, entity: Model.Entity, field: Model.AnyField): boolean {
		return this.matchers.reduce<boolean>((prev, predicate) => prev && predicate(schema, entity, field), true)
	}
}
