import { filterObject, mapObject } from '../utils/index.js'
import { Model, Validation } from '@contember/schema'
import { acceptEveryFieldVisitor, acceptFieldVisitor } from '@contember/schema-utils'
import { InputValidation } from '@contember/schema-definition'
import { DependencyCollector } from './dependencies/index.js'
import { NotSupportedError } from './exceptions.js'

export class EntityRulesResolver {
	constructor(private readonly validationSchema: Validation.Schema, private readonly model: Model.Schema) {}

	public getSimpleRules(entityName: string): Validation.EntityRules {
		return mapObject(this.getEntityRules(entityName), (rules, field) => {
			acceptFieldVisitor(this.model, entityName, field, {
				visitColumn: () => null,
				visitHasOne: () => null,
				visitHasMany: () => {
					throw new NotSupportedError('Rules on has-many relations are currently not supported.')
				},
			})
			for (const rule of rules) {
				const dependencies = DependencyCollector.collect(rule.validator)
				for (const dep of Object.keys(dependencies)) {
					const isRelation = acceptFieldVisitor(this.model, entityName, dep, {
						visitColumn: () => false,
						visitRelation: () => true,
					})
					if (isRelation) {
						throw new NotSupportedError('Rules depending on relations are currently not supported.')
					}
				}
			}
			return rules
		})
	}

	public getEntityRules(entityName: string): Validation.EntityRules {
		const definedRules = this.validationSchema[entityName] || {}
		const fieldsNotNullFlag = acceptEveryFieldVisitor(this.model, entityName, new NotNullFieldsVisitor())
		const notNullFields = Object.keys(filterObject(fieldsNotNullFlag, (field, val) => val))
		return notNullFields.reduce(
			(entityRules, field) => ({
				...entityRules,
				[field]: [
					...(entityRules[field] || []),
					{ validator: InputValidation.rules.defined(), message: { text: 'Field is required' } },
				],
			}),
			definedRules,
		)
	}
}

class NotNullFieldsVisitor implements Model.RelationByTypeVisitor<boolean>, Model.ColumnVisitor<boolean> {
	visitColumn(entity: Model.Entity, column: Model.AnyColumn): boolean {
		return !column.nullable
	}

	visitManyHasManyInverse(): boolean {
		return false
	}

	visitManyHasManyOwning(): boolean {
		return false
	}

	visitManyHasOne(entity: Model.Entity, relation: Model.ManyHasOneRelation): boolean {
		return !relation.nullable
	}

	visitOneHasMany(): boolean {
		return false
	}

	visitOneHasOneInverse(entity: Model.Entity, relation: Model.OneHasOneInverseRelation, targetEntity: Model.Entity): boolean {
		return !relation.nullable && !targetEntity.view
	}

	visitOneHasOneOwning(entity: Model.Entity, relation: Model.OneHasOneOwningRelation): boolean {
		return !relation.nullable
	}
}
