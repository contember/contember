import { Model } from '@contember/schema'

export class EnumDefinition<Values extends string = string> {
	constructor(
		public readonly values: Values[],
		public readonly migrations: Model.EntityMigrations,
	) {}

	public disableMigrations(): EnumDefinition<Values> {
		return new EnumDefinition(this.values, { enabled: false })
	}
}

export function createEnum<Values extends string>(...values: Values[]): EnumDefinition<Values> {
	return new EnumDefinition<Values>(values, { enabled: true })
}
