import { Acl, Model, Validation } from '@contember/schema'
import { EntityRulesResolver } from '../input-validation'
import { Authorizator } from '../acl'
import * as ContentSchema from './content-schema.types'
import { assertNever } from '../utils'
import { acceptEveryFieldVisitor, getEntity } from '@contember/schema-utils'

type AdditionalFieldInfo =
	| Omit<ContentSchema._Relation, 'name' | 'type' | 'rules' | 'validators'>
	| Omit<ContentSchema._Column, 'name' | 'type' | 'rules' | 'validators'>

export class IntrospectionSchemaFactory {
	constructor(
		private readonly model: Model.Schema,
		private readonly rulesResolver: EntityRulesResolver,
		private readonly authorizator: Authorizator,
	) {}

	createFieldsSchema(entityName: string): readonly (ContentSchema._Column | ContentSchema._Relation)[] {
		const entityRules = this.rulesResolver.getEntityRules(entityName)
		const convertOnDelete = (onDelete: Model.OnDelete): ContentSchema._OnDeleteBehaviour => {
			switch (onDelete) {
				case Model.OnDelete.cascade:
					return ContentSchema._OnDeleteBehaviour.Cascade
				case Model.OnDelete.restrict:
					return ContentSchema._OnDeleteBehaviour.Restrict
				case Model.OnDelete.setNull:
					return ContentSchema._OnDeleteBehaviour.SetNull
				default:
					assertNever(onDelete)
			}
		}
		const convertOrderBy = ({ path, direction }: Model.OrderBy): ContentSchema._OrderBy => {
			return {
				path,
				direction:
					direction === Model.OrderDirection.desc
						? ContentSchema._OrderByDirection.Desc
						: ContentSchema._OrderByDirection.Asc,
			}
		}
		const additionalInfo = acceptEveryFieldVisitor<AdditionalFieldInfo>(this.model, entityName, {
			visitManyHasManyInverse(entity: Model.Entity, relation: Model.ManyHasManyInverseRelation) {
				return {
					__typename: '_Relation',
					targetEntity: relation.target,
					side: ContentSchema._RelationSide.Inverse,
					ownedBy: relation.ownedBy,
					orderBy: relation.orderBy?.map(convertOrderBy),
				}
			},
			visitManyHasManyOwning(entity: Model.Entity, relation: Model.ManyHasManyOwningRelation) {
				return {
					__typename: '_Relation',
					targetEntity: relation.target,
					side: ContentSchema._RelationSide.Owning,
					inversedBy: relation.inversedBy,
					orderBy: relation.orderBy?.map(convertOrderBy),
				}
			},
			visitManyHasOne(entity: Model.Entity, relation: Model.ManyHasOneRelation) {
				return {
					__typename: '_Relation',
					targetEntity: relation.target,
					side: ContentSchema._RelationSide.Owning,
					inversedBy: relation.inversedBy,
					onDelete: convertOnDelete(relation.joiningColumn.onDelete),
					nullable: relation.nullable,
				}
			},
			visitOneHasMany(entity: Model.Entity, relation: Model.OneHasManyRelation) {
				return {
					__typename: '_Relation',
					targetEntity: relation.target,
					side: ContentSchema._RelationSide.Inverse,
					ownedBy: relation.ownedBy,
					orderBy: relation.orderBy?.map(convertOrderBy),
				}
			},
			visitOneHasOneInverse(entity: Model.Entity, relation: Model.OneHasOneInverseRelation) {
				return {
					__typename: '_Relation',
					targetEntity: relation.target,
					side: ContentSchema._RelationSide.Inverse,
					ownedBy: relation.ownedBy,
					nullable: relation.nullable,
				}
			},
			visitOneHasOneOwning(entity: Model.Entity, relation: Model.OneHasOneOwningRelation) {
				return {
					__typename: '_Relation',
					targetEntity: relation.target,
					side: ContentSchema._RelationSide.Owning,
					inversedBy: relation.inversedBy,
					onDelete: convertOnDelete(relation.joiningColumn.onDelete),
					nullable: relation.nullable,
					orphanRemoval: relation.orphanRemoval === true,
				}
			},
			visitColumn(entity: Model.Entity, column: Model.AnyColumn) {
				return {
					__typename: '_Column',
					defaultValue: column.default ?? undefined,
					enumName: column.type === Model.ColumnType.Enum ? column.columnType : null,
					nullable: column.nullable,
				}
			},
		})
		return Object.values(getEntity(this.model, entityName).fields)
			.filter(it => this.authorizator.getFieldPermissions(Acl.Operation.read, entityName, it.name) !== 'no')
			.map((it): ContentSchema._Column | ContentSchema._Relation => ({
				...additionalInfo[it.name],
				name: it.name,
				type: it.type,
				...this.createValidationSchema(entityRules[it.name] || []),
			}))
	}

	createValidationSchema(rules: readonly Validation.ValidationRule[]): Pick<ContentSchema._Field, 'rules' | 'validators'> {
		const validators: ContentSchema._Validator[] = []

		const processValidator = (validator: Validation.Validator) => {
			const i = validators.length
			const args: (ContentSchema._Argument & { __typename: string })[] = []
			const apiValidator: ContentSchema._Validator = { operation: validator.operation, arguments: args }
			validators.push(apiValidator)
			for (const arg of validator.args) {
				switch (arg.type) {
					case Validation.ArgumentType.path:
						args.push({ __typename: '_PathArgument', path: arg.path })
						break
					case Validation.ArgumentType.literal:
						args.push({ __typename: '_LiteralArgument', value: arg.value })
						break
					case Validation.ArgumentType.validator:
						args.push({ __typename: '_ValidatorArgument', validator: processValidator(arg.validator) })
						break
					default:
						assertNever(arg)
				}
			}

			return i
		}

		const processedRules = rules.map(
			(it): ContentSchema._Rule => ({ message: it.message, validator: processValidator(it.validator) }),
		)
		return {
			rules: processedRules,
			validators: validators,
		}
	}

	public create(): ContentSchema._Schema {
		const entities = Object.values(this.model.entities)
			.filter(it => this.authorizator.getEntityPermission(Acl.Operation.read, it.name) !== 'no')
			.map(entity => ({
				name: entity.name,
				customPrimaryAllowed: this.authorizator.isCustomPrimaryAllowed(entity.name),
				fields: this.createFieldsSchema(entity.name),
				unique: Object.values(entity.unique).map(({ fields }) => ({ fields })),
			}))
		const usedEnums = new Set(
			entities
				.flatMap(it => it.fields)
				.map(it => (it.__typename === '_Column' ? it.enumName : undefined))
				.filter((it): it is string => !!it),
		)
		const enums = Object.entries(this.model.enums)
			.filter(([name]) => usedEnums.has(name))
			.map(([name, enum_]) => ({ name, values: enum_.values }))
		return {
			enums,
			entities,
		}
	}
}
