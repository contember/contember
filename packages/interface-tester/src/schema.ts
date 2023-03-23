import { SchemaEntities, SchemaField, SchemaStore } from '@contember/admin'
import { Model, Schema } from '@contember/schema'
import { acceptFieldVisitor, normalizeSchema } from '@contember/schema-utils'

export const convertModelToAdminSchema = (model: Model.Schema): SchemaStore => {
	const enums: SchemaStore['enums'] = new Map()
	for (const [name, values] of Object.entries(model.enums)) {
		enums.set(name, new Set(values))
	}
	const entities: SchemaEntities = new Map()
	for (const entity of Object.values(model.entities)) {
		entities.set(entity.name, {
			name: entity.name,
			customPrimaryAllowed: false, // todo
			unique: Object.values(entity.unique).map(it => ({
				fields: new Set(it.fields),
			})),
			fields: new Map(Object.values(entity.fields).map((it): [string, SchemaField] => {
				const schemaField = acceptFieldVisitor<SchemaField>(model, entity, it, {
					visitColumn: ({ column }) => {
						return {
							__typename: '_Column',
							name: column.name,
							nullable: column.nullable,
							type: column.type,
							defaultValue: column.default ?? null,
							enumName: column.type === Model.ColumnType.Enum ? column.columnType : null,
						}
					},
					visitManyHasManyInverse: ({ relation }) => {
						return {
							__typename: '_Relation',
							type: 'ManyHasMany',
							name: relation.name,
							side: 'inverse',
							ownedBy: relation.ownedBy,
							targetEntity: relation.target,
							nullable: null,
							onDelete: null,
							orphanRemoval: null,
							// todo
							orderBy: null,
						}
					},
					visitManyHasManyOwning: ({ relation }) => {
						return {
							__typename: '_Relation',
							type: 'ManyHasMany',
							name: relation.name,
							side: 'owning',
							inversedBy: relation.inversedBy ?? null,
							targetEntity: relation.target,
							nullable: null,
							onDelete: null,
							orphanRemoval: null,
							// todo
							orderBy: null,
						}
					},
					visitManyHasOne: ({ relation }) => {
						return {
							__typename: '_Relation',
							type: 'ManyHasOne',
							name: relation.name,
							side: 'owning',
							inversedBy: relation.inversedBy ?? null,
							targetEntity: relation.target,
							nullable: relation.nullable,
							orphanRemoval: null,
							orderBy: null,
							// todo
							onDelete: null,
						}
					},
					visitOneHasMany: ({ relation }) => {
						return {
							__typename: '_Relation',
							type: 'OneHasMany',
							name: relation.name,
							side: 'inverse',
							ownedBy: relation.ownedBy,
							targetEntity: relation.target,
							nullable: null,
							orphanRemoval: null,
							onDelete: null,
							// todo
							orderBy: null,
						}
					},
					visitOneHasOneInverse: ({ relation }) => {
						return {
							__typename: '_Relation',
							type: 'ManyHasOne',
							name: relation.name,
							side: 'inverse',
							ownedBy: relation.ownedBy,
							targetEntity: relation.target,
							nullable: relation.nullable,
							orderBy: null,
							orphanRemoval: null,
							onDelete: null,
						}
					},
					visitOneHasOneOwning: ({ relation }) => {
						return {
							__typename: '_Relation',
							type: 'ManyHasOne',
							name: relation.name,
							side: 'owning',
							inversedBy: relation.inversedBy ?? null,
							targetEntity: relation.target,
							nullable: relation.nullable,
							orderBy: null,
							// todo
							onDelete: null,
							orphanRemoval: null,
						}
					},
				})
				return [
					it.name,
					schemaField,
				]
			})),
		})
	}
	return {
		enums,
		entities,
	}
}


export const createModelForRole = (schema: Schema, role: string): Model.Schema => {
	schema = normalizeSchema(schema)
	const { model, acl } = schema
	const canAccessField = (entityName: string, fieldName: string) => {
		return (acl.roles[role]?.entities?.[entityName]?.operations.read?.[fieldName] ?? false) !== false
	}

	const entities: Model.Entity[] = []
	for (const entity of Object.values(model.entities)) {
		const fields = Object.values(entity.fields).filter(it => canAccessField(entity.name, it.name))

		if (fields.length > 0) {
			entities.push({
				...entity,
				fields: {
					[entity.primary]: entity.fields[entity.primary],
					...Object.fromEntries(fields.map(it => [it.name, it])),
				},
			})
		}
	}
	return {
		...model,
		entities: Object.fromEntries(entities.map(it => [it.name, it])),
	}
}
