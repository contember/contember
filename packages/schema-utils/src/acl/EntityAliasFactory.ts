import { Model } from '@contember/schema'

export class EntityAliasFactory {
	constructor(private readonly entity: Model.Entity) { }

	public create(): Model.Entity['fields'] {
		const newFields = { ...this.entity.fields }

		Object.entries(this.entity.fields).forEach(([_fieldName, field]) => {
			if (field.aliases?.length) {
				field.aliases.forEach(alias => {
					const { aliases, ...fieldWithoutAliases } = field
					newFields[alias] = {
						...fieldWithoutAliases,
						name: alias,
						deprecationReason: field.deprecationReason || `Use the ${field.name} field instead.`,
					}
				})
			}
		})

		return newFields
	}
}
