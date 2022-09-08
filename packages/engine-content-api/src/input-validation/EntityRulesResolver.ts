import { filterObject, mapObject } from '../utils'
import { Model, Validation } from '@contember/schema'
import { acceptEveryFieldVisitor, acceptFieldVisitor } from '@contember/schema-utils'
import { InputValidation } from '@contember/schema-definition'
import { DependencyCollector } from './dependencies'
import { NotSupportedError } from './exceptions'

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
		const fieldsNotNullFlag = acceptEveryFieldVisitor(this.model, entityName, new RequiredFieldsVisitor())
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

class RequiredFieldsVisitor implements Model.RelationByTypeVisitor<boolean>, Model.ColumnVisitor<boolean> {
	visitColumn({ column }: Model.ColumnContext): boolean {
		return !column.nullable && typeof column.default === 'undefined' && !column.sequence
	}

	visitManyHasManyInverse(): boolean {
		return false
	}

	visitManyHasManyOwning(): boolean {
		return false
	}

	visitManyHasOne({ relation }: Model.ManyHasOneContext): boolean {
		return !relation.nullable
	}

	visitOneHasMany(): boolean {
		return false
	}

	visitOneHasOneInverse({ targetEntity, relation }: Model.OneHasOneInverseContext): boolean {
		return !relation.nullable && !targetEntity.view
	}

	visitOneHasOneOwning({ relation }: Model.OneHasOneOwningContext): boolean {
		return !relation.nullable
	}
}
