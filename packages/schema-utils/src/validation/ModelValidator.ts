import { Model } from '@contember/schema'
import { ErrorBuilder, ValidationError } from './errors.js'
import { acceptEveryFieldVisitor, getTargetEntity, isColumn, isInverseRelation, isOwningRelation } from '../model/index.js'
import { collectUnsupportedJsonSchemaKeywords, SUPPORTED_JSON_SCHEMA_KEYWORDS } from '../json-schema/index.js'

const IDENTIFIER_PATTERN = /^[_a-zA-Z][_a-zA-Z0-9]*$/
// An index operator class is an identifier, optionally schema-qualified (e.g. "public.gin_trgm_ops").
const INDEX_OPCLASS_PATTERN = /^[_a-zA-Z][_a-zA-Z0-9$]*(\.[_a-zA-Z][_a-zA-Z0-9$]*)?$/
const RESERVED_WORDS = ['and', 'or', 'not']

export class ModelValidator {
	constructor(private readonly model: Model.Schema) {}

	public validate(): ValidationError[] {
		const errorBuilder = new ErrorBuilder([], [])
		this.validateEnums(this.model.enums, errorBuilder.for('enums'))
		this.validateEntities(this.model.entities, errorBuilder.for('entities'))

		return errorBuilder.errors
	}

	private validateEnums(enums: Model.Schema['enums'], errors: ErrorBuilder): void {
		for (const [enumName, enumValues] of Object.entries(enums)) {
			for (const value of enumValues) {
				const valueErrors = errors.for(enumName, value)
				this.validateIdentifier(value, valueErrors)
			}
		}
	}

	private validateEntities(entities: Model.Schema['entities'], errors: ErrorBuilder): void {
		for (const [entityName, entity] of Object.entries(entities)) {
			const entityErrors = errors.for(entityName)
			if (entity.name !== entityName) {
				entityErrors.add('MODEL_NAME_MISMATCH', `Entity name "${entity.name}" does not match the name in a map "${entityName}"`)
			}
			this.validateEntity(entity, entityErrors)
		}
		const entitiesArr = Object.values(this.model.entities)
		this.validateMetaSuffixCollisions(entitiesArr, errors)
		this.validateTableNameCollisions(entitiesArr, errors)
		this.validateAliasedTypesCollision(entitiesArr, errors)
	}

	private validateEntity(entity: Model.Entity, errors: ErrorBuilder): void {
		this.validateIdentifier(entity.name, errors)
		this.validateEntityName(entity.name, errors)

		for (const [fieldName, field] of Object.entries(entity.fields)) {
			const fieldErrors = errors.for(fieldName)
			this.validateField(entity, field, fieldErrors)
			if (field.name !== fieldName) {
				fieldErrors.add('MODEL_NAME_MISMATCH', `Field name "${field.name}" does not match the name in a map "${fieldName}"`)
			}
		}
		this.validateUniqueConstraints(
			entity,
			errors.for('unique'),
		)
		this.validateIndexes(
			entity,
			errors.for('indexes'),
		)
		this.validateColumnNamesCollision(entity, errors)
	}

	private validateIndexes(entity: Model.Entity, errors: ErrorBuilder): void {
		for (const index of entity.indexes) {
			for (const field of [...index.fields, ...index.include ?? []]) {
				if (!entity.fields[field]) {
					errors.add('MODEL_UNDEFINED_FIELD', `Referenced field ${field} in an index does not exists`)
				}
			}
			// Postgres rejects an INCLUDE column that is already a key column.
			for (const field of index.include ?? []) {
				if (index.fields.includes(field)) {
					errors.add('MODEL_INVALID_INDEX', `Field ${field} cannot be both an index key and an included (covering) column`)
				}
			}
			// Per-column options (order/nulls/opClass) only apply to key columns.
			for (const field of Object.keys(index.columnOptions ?? {})) {
				if (!index.fields.includes(field)) {
					errors.add('MODEL_INVALID_INDEX', `Column options reference field ${field}, which is not a key column of the index`)
				}
			}
			// columnOptions is keyed by field name, so a key column appearing twice cannot carry distinct
			// per-position options (the duplicate collapses to one entry) — reject the ambiguous shape.
			const seenFields = new Set<string>()
			for (const field of index.fields) {
				if (seenFields.has(field)) {
					errors.add('MODEL_INVALID_INDEX', `Field ${field} is listed more than once as an index key column`)
				}
				seenFields.add(field)
			}
			// Sort order and NULLS placement are btree-only; Postgres rejects them on other methods at apply time.
			if (index.method !== undefined && index.method !== 'btree') {
				for (const [field, options] of Object.entries(index.columnOptions ?? {})) {
					if (options.order !== undefined || options.nulls !== undefined) {
						errors.add('MODEL_INVALID_INDEX', `Column options (order/nulls) on field ${field} are only supported for btree indexes, not "${index.method}"`)
					}
				}
			}
			// opClass is emitted verbatim into CREATE INDEX, so constrain it to an identifier (optionally
			// schema-qualified) — both to block SQL injection and to catch typos early with a clear message.
			for (const opClass of [index.opClass, ...Object.values(index.columnOptions ?? {}).map(it => it.opClass)]) {
				if (opClass !== undefined && !INDEX_OPCLASS_PATTERN.test(opClass)) {
					errors.add(
						'MODEL_INVALID_INDEX',
						`Invalid index operator class "${opClass}": expected an identifier, optionally schema-qualified (e.g. "public.gin_trgm_ops")`,
					)
				}
			}
			// `where` is a raw SQL predicate embedded verbatim into CREATE INDEX. We don't parse SQL,
			// but a couple of basic checks catch the common footguns early with a clear message:
			if (index.where !== undefined && index.where.trim() === '') {
				errors.add('MODEL_INVALID_INDEX', 'Index predicate (where) must not be empty.')
			} else if (index.where?.includes(';')) {
				errors.add('MODEL_INVALID_INDEX', 'Index predicate (where) must not contain ";".')
			}
		}
	}

	private validateUniqueConstraints(entity: Model.Entity, errors: ErrorBuilder): void {
		for (const constraint of entity.unique) {
			if (entity.view?.materialized && !constraint.index) {
				errors.add('MODEL_INVALID_CONSTRAINT', 'For materialized views, Unique must be defined as an index. Please set index: true.')
			}
			for (const field of constraint.fields) {
				const fieldDef = entity.fields[field]
				if (!fieldDef) {
					errors.add('MODEL_UNDEFINED_FIELD', `Referenced field ${field} in a constraint does not exists`)
				} else if (isColumn(fieldDef) && fieldDef.list) {
					errors.add('MODEL_INVALID_FIELD', `Field ${field} in a unique constraint cannot be an array`)
				}
			}
		}
	}

	private validateColumnNamesCollision(entity: Model.Entity, errors: ErrorBuilder): void {
		const existingColumnNames = new Map<string, string>()
		const addColumnName = (fieldName: string, columnName: string) => {
			if (existingColumnNames.has(columnName)) {
				const exitingName = existingColumnNames.get(columnName)
				errors
					.for(fieldName)
					.add('MODEL_NAME_COLLISION', `Column name "${columnName}" on field "${fieldName}" collides with a column name on field "${exitingName}".`)
			}
			existingColumnNames.set(columnName, fieldName)
		}
		acceptEveryFieldVisitor(this.model, entity, {
			visitColumn: ({ column }) => {
				addColumnName(column.name, column.columnName)
			},
			visitOneHasOneOwning: ({ relation }) => {
				addColumnName(relation.name, relation.joiningColumn.columnName)
			},
			visitManyHasOne: ({ relation }) => {
				addColumnName(relation.name, relation.joiningColumn.columnName)
			},
			visitOneHasOneInverse: () => {},
			visitOneHasMany: () => {},
			visitManyHasManyInverse: () => {},
			visitManyHasManyOwning: () => {},
		})
	}

	private validateField(partialEntity: Model.Entity, field: Model.AnyField, errors: ErrorBuilder): void {
		this.validateIdentifier(field.name, errors)
		if (isRelation(field)) {
			this.validateRelation(partialEntity, field, errors)
		} else {
			if (field.sequence && field.nullable) {
				errors.add('MODEL_INVALID_COLUMN_DEFINITION', 'Column with sequence cannot be nullable.')
			}
			this.validateColumnJsonSchema(field, errors)
		}
	}

	private validateColumnJsonSchema(column: Model.AnyColumn, errors: ErrorBuilder): void {
		if (column.type !== Model.ColumnType.Json || column.schema === undefined) {
			return
		}
		for (const { keyword, path } of collectUnsupportedJsonSchemaKeywords(column.schema)) {
			const location = path === '' ? 'at the schema root' : `at "${path}"`
			errors.add(
				'MODEL_INVALID_JSON_SCHEMA',
				`JSON Schema on column "${column.name}" uses unsupported keyword "${keyword}" ${location}. `
					+ `Only the following keywords are supported: ${SUPPORTED_JSON_SCHEMA_KEYWORDS.join(', ')}.`,
			)
		}
	}

	private validateRelation(partialEntity: Model.Entity, field: Model.AnyRelation, errors: ErrorBuilder): void {
		const entityName = partialEntity.name
		const targetEntityName = field.target
		const targetEntity = this.model.entities[targetEntityName] || undefined
		if (!targetEntity) {
			return errors.add('MODEL_UNDEFINED_ENTITY', `Target entity ${targetEntityName} not found`)
		}
		if (((it: Model.AnyRelation): it is Model.AnyRelation & Model.OrderableRelation => 'orderBy' in it)(field)) {
			;(field as Model.OrderableRelation).orderBy?.forEach(it => {
				let entity = targetEntity

				for (let i = 0; i < it.path.length; i++) {
					const orderByField = entity.fields[it.path[i]]
					const pathStr = it.path.slice(0, i + 1).join('.')
					if (!orderByField) {
						errors.add('MODEL_UNDEFINED_FIELD', `Invalid orderBy of ${entityName}::${field.name}: field ${pathStr} is not defined`)
						return
					}
					if (i + 1 < it.path.length) {
						const targetEntity = getTargetEntity(this.model, entity, orderByField.name)
						if (!targetEntity) {
							errors.add('MODEL_RELATION_REQUIRED', `Invalid orderBy of ${entityName}::${field.name}: field ${pathStr} is not a relation`)
							return
						}
						entity = targetEntity
					}
				}
			})
		}
		if (partialEntity.view) {
			if (field.type === Model.RelationType.ManyHasMany) {
				return errors.add('MODEL_INVALID_VIEW_USAGE', 'Many-has-many relation is not allowed on a view entity.')
			}
			if (
				!targetEntity.view
				&& field.type === Model.RelationType.OneHasMany
			) {
				return errors.add('MODEL_INVALID_VIEW_USAGE', 'One-has-many relation fields on views must point to a view entity.')
			}
			if (
				!targetEntity.view
				&& field.type === Model.RelationType.OneHasOne
				&& !('joiningColumn' in field)
			) {
				return errors.add('MODEL_INVALID_VIEW_USAGE', 'One-has-one relation fields on views must be owning or point to a view entity.')
			}
		}
		if (isInverseRelation(field)) {
			const ownedBy = field.ownedBy
			const targetField = targetEntity.fields[ownedBy]
			const relationDescription = `Target relation ${targetEntityName}::${ownedBy}:`
			if (!targetField) {
				return errors.add('MODEL_UNDEFINED_FIELD', `${relationDescription} not exists`)
			}

			if (!isRelation(targetField)) {
				return errors.add('MODEL_RELATION_REQUIRED', `${relationDescription} not a relation`)
			}
			if (targetField.target !== entityName) {
				return errors.add(
					'MODEL_INVALID_RELATION_DEFINITION',
					`${relationDescription} back reference to entity ${entityName} expected, but ${targetField.target} given`,
				)
			}
			if (!isOwningRelation(targetField)) {
				errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} not an owning relation`)
				return
			}
			if (!targetField.inversedBy) {
				return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} inverse relation is not set`)
			}
			if (targetField.inversedBy !== field.name) {
				return errors.add(
					'MODEL_INVALID_RELATION_DEFINITION',
					`${relationDescription} back reference ${entityName}::${field.name} expected, ${targetField.target}::${targetField.inversedBy} given`,
				)
			}
			if (field.type === Model.RelationType.OneHasOne && targetField.type !== Model.RelationType.OneHasOne) {
				return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} "OneHasOne" type expected, "${targetField.type}" given`)
			}
			if (field.type === Model.RelationType.OneHasMany && targetField.type !== Model.RelationType.ManyHasOne) {
				return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} "ManyHasOne" type expected, "${targetField.type}" given`)
			}
			if (field.type === Model.RelationType.ManyHasMany && targetField.type !== Model.RelationType.ManyHasMany) {
				return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} "ManyHasMany" type expected, "${targetField.type}" given`)
			}
		} else {
			const inversedBy = field.inversedBy
			if (inversedBy) {
				const targetField = targetEntity.fields[inversedBy]
				const relationDescription = `Target relation ${targetEntityName}::${inversedBy}:`
				if (!targetField) {
					return errors.add('MODEL_UNDEFINED_FIELD', `${relationDescription} not exists`)
				}
				if (!isRelation(targetField)) {
					return errors.add('MODEL_RELATION_REQUIRED', `${relationDescription} not a relation`)
				}
				if (targetField.target !== entityName) {
					return errors.add(
						'MODEL_INVALID_RELATION_DEFINITION',
						`${relationDescription} back reference to entity ${entityName} expected, but ${targetField.target} given`,
					)
				}
				if (!isInverseRelation(targetField)) {
					return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} not an inverse relation`)
				}
				if (!targetField.ownedBy) {
					return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} owning relation is not set`)
				}
				if (targetField.ownedBy !== field.name) {
					return errors.add(
						'MODEL_INVALID_RELATION_DEFINITION',
						`${relationDescription} back reference ${entityName}::${field.name} expected, ${targetField.target}::${targetField.ownedBy} given`,
					)
				}
				if (field.type === Model.RelationType.OneHasOne && targetField.type !== Model.RelationType.OneHasOne) {
					return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} "OneHasOne" type expected, "${targetField.type}" given`)
				}
				if (field.type === Model.RelationType.ManyHasOne && targetField.type !== Model.RelationType.OneHasMany) {
					return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} "ManyHasOne" type expected, "${targetField.type}" given`)
				}
				if (field.type === Model.RelationType.ManyHasMany && targetField.type !== Model.RelationType.ManyHasMany) {
					return errors.add('MODEL_INVALID_RELATION_DEFINITION', `${relationDescription} "ManyHasMany" type expected, "${targetField.type}" given`)
				}
			}
		}
	}

	private validateIdentifier(value: string, errorBuilder: ErrorBuilder) {
		if (!value.match(IDENTIFIER_PATTERN)) {
			return errorBuilder.add('MODEL_INVALID_IDENTIFIER', `${value} must match pattern ${IDENTIFIER_PATTERN.source}`)
		}
		if (RESERVED_WORDS.includes(value)) {
			errorBuilder.add('MODEL_INVALID_IDENTIFIER', `${value} is reserved word`)
		}
	}

	private validateEntityName(value: string, errorBuilder: ErrorBuilder) {
		if (['Query', 'Mutation'].includes(value)) {
			errorBuilder.add('MODEL_INVALID_ENTITY_NAME', `${value} is reserved word`)
		}
	}

	private validateMetaSuffixCollisions(entities: Model.Entity[], errorBuilder: ErrorBuilder) {
		const entityNames = new Set(entities.map(it => it.name))
		for (const entity of entities) {
			if (entity.name.endsWith('Meta')) {
				const baseName = entity.name.substring(0, entity.name.length - 4)
				if (entityNames.has(baseName)) {
					errorBuilder.for(entity.name)
						.add(
							'MODEL_NAME_COLLISION',
							`entity ${entity.name} collides with entity ${baseName}, because a GraphQL type with "Meta" suffix is created for every entity`,
						)
				}
			}
		}
	}

	private validateTableNameCollisions(entities: Model.Entity[], errorBuilder: ErrorBuilder) {
		const relationNames: Record<string, string> = {}
		for (const entity of entities) {
			const description = `table name ${entity.tableName} of entity ${entity.name}`
			if (relationNames[entity.tableName]) {
				errorBuilder
					.for(entity.name)
					.add('MODEL_NAME_COLLISION', `${description} collides with a ${relationNames[entity.tableName]}`)
			} else {
				relationNames[entity.tableName] = description
			}
		}
		for (const entity of entities) {
			const entityErrorBuilder = errorBuilder.for(entity.name)
			acceptEveryFieldVisitor(this.model, entity, {
				visitManyHasManyOwning: ({ entity, relation }) => {
					const joiningTable = relation.joiningTable
					const description = `joining table name ${joiningTable.tableName} of relation ${entity.name}::${relation.name}`
					if (relationNames[joiningTable.tableName]) {
						entityErrorBuilder
							.for(relation.name)
							.add(
								'MODEL_NAME_COLLISION',
								`${description} collides with a ${relationNames[joiningTable.tableName]}.`
									+ 'Consider using plural for a relation name or change the joining table name using .joiningTable(...) in schema definition.',
							)
					} else {
						relationNames[joiningTable.tableName] = description
					}
				},
				visitColumn: () => {},
				visitManyHasManyInverse: () => {},
				visitOneHasMany: () => {},
				visitOneHasOneInverse: () => {},
				visitOneHasOneOwning: () => {},
				visitManyHasOne: () => {},
			})
		}
	}

	private validateAliasedTypesCollision(entities: Model.Entity[], errorBuilder: ErrorBuilder) {
		const aliasedTypes = new Map<string, Model.ColumnType>()
		for (const entity of entities) {
			acceptEveryFieldVisitor(this.model, entity, {
				visitColumn: ({ column }) => {
					if (!column.typeAlias) {
						return
					}
					if (aliasedTypes.has(column.typeAlias) && aliasedTypes.get(column.typeAlias) !== column.type) {
						errorBuilder
							.for(column.name)
							.add('MODEL_NAME_COLLISION', `Type alias ${column.typeAlias} already exists for base type ${column.type}`)
					}
					aliasedTypes.set(column.typeAlias, column.type)
				},
				visitManyHasManyOwning: () => {},
				visitManyHasManyInverse: () => {},
				visitOneHasMany: () => {},
				visitOneHasOneInverse: () => {},
				visitOneHasOneOwning: () => {},
				visitManyHasOne: () => {},
			})
		}
	}
}

const isRelation = (field: Model.AnyField): field is Model.AnyRelation => Object.values(Model.RelationType).includes(field.type as Model.RelationType)
