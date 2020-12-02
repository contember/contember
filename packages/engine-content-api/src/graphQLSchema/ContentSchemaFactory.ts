import { IExecutableSchemaDefinition } from 'graphql-tools'
import schema from './content-schema.graphql'
import * as ContentSchema from './content-schema.types'
import { Model, Validation } from '@contember/schema'
import { assertNever } from '../utils'
import { EntityRulesResolver } from '../input-validation/EntityRulesResolver'
import { acceptEveryFieldVisitor, getEntity } from '@contember/schema-utils'
import Authorizator from '../acl/Authorizator'
import Acl from '@contember/schema/dist/src/schema/acl'
import ColumnType = Model.ColumnType
import Operation = Acl.Operation

type AdditionalFieldInfo =
	| Omit<ContentSchema._Relation, 'name' | 'type' | 'rules' | 'validators'>
	| Omit<ContentSchema._Column, 'name' | 'type' | 'rules' | 'validators'>

export class ContentSchemaFactory {
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
					side: ContentSchema._RelationSide.Inversed,
					ownedBy: relation.ownedBy,
					orderBy: relation.orderBy?.map(convertOrderBy),
				}
			},
			visitManyHasManyOwner(entity: Model.Entity, relation: Model.ManyHasManyOwnerRelation) {
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
					side: ContentSchema._RelationSide.Inversed,
					ownedBy: relation.ownedBy,
					orderBy: relation.orderBy?.map(convertOrderBy),
				}
			},
			visitOneHasOneInverse(entity: Model.Entity, relation: Model.OneHasOneInverseRelation) {
				return {
					__typename: '_Relation',
					targetEntity: relation.target,
					side: ContentSchema._RelationSide.Inversed,
					ownedBy: relation.ownedBy,
					nullable: relation.nullable,
				}
			},
			visitOneHasOneOwner(entity: Model.Entity, relation: Model.OneHasOneOwnerRelation) {
				return {
					__typename: '_Relation',
					targetEntity: relation.target,
					side: ContentSchema._RelationSide.Owning,
					inversedBy: relation.inversedBy,
					onDelete: convertOnDelete(relation.joiningColumn.onDelete),
					nullable: relation.nullable,
				}
			},
			visitColumn(entity: Model.Entity, column: Model.AnyColumn) {
				return {
					__typename: '_Column',
					defaultValue: column.default ?? undefined,
					enumName: column.type === ColumnType.Enum ? column.enumName : null,
					nullable: column.nullable,
				}
			},
		})
		return Object.values(getEntity(this.model, entityName).fields)
			.filter(it => this.authorizator.isAllowed(Operation.read, entityName, it.name))
			.map((it): ContentSchema._Column | ContentSchema._Relation => ({
				...additionalInfo[it.name],
				name: it.name,
				type: it.type,
				...this.createValidationSchema(entityRules[it.name] || []),
			}))
	}

	createValidationSchema(rules: Validation.ValidationRule[]): Pick<ContentSchema._Field, 'rules' | 'validators'> {
		const validators: ContentSchema._Validator[] = []

		const createValue = (value: number | string | boolean): ContentSchema._AnyValue & { __typename: string } => {
			if (value === undefined) {
				return { __typename: '_UndefinedValue', undefinedValue: true }
			}
			if (typeof value === 'string') {
				return { __typename: '_StringValue', stringValue: value }
			}
			if (typeof value === 'number') {
				return value % 1 === 0
					? { __typename: '_IntValue', intValue: value }
					: { __typename: '_FloatValue', floatValue: value }
			}
			if (typeof value === 'boolean') {
				return { __typename: '_BooleanValue', booleanValue: value }
			}
			throw new Error(`Argument of type ${typeof value} is not supported yet`)
		}

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
						args.push({ __typename: '_LiteralArgument', value: createValue(arg.value) })
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

	public create(): IExecutableSchemaDefinition {
		return {
			typeDefs: schema,
			resolvers: {
				Query: {
					schema: (): ContentSchema._Schema => {
						const entities = Object.values(this.model.entities)
							.filter(it => this.authorizator.isAllowed(Operation.read, it.name))
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
							.map(([name, values]) => ({ name, values }))
						return {
							enums,
							entities,
						}
					},
				},
			},
		}
	}
}
