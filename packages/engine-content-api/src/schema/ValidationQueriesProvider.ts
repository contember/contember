import { GraphQLFieldConfig, GraphQLNonNull } from 'graphql'
import { Context } from '../types.js'
import { WhereTypeProvider } from './WhereTypeProvider.js'
import { EntityInputProvider, EntityInputType } from './mutations/index.js'
import { Input, Model } from '@contember/schema'
import { filterObject } from '../utils/index.js'
import { ResultSchemaTypeProvider } from './ResultSchemaTypeProvider.js'

type FieldConfig<TArgs> = GraphQLFieldConfig<Context, any, TArgs>

export class ValidationQueriesProvider {
	constructor(
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly createEntityInputProvider: EntityInputProvider<EntityInputType.create>,
		private readonly updateEntityInputProvider: EntityInputProvider<EntityInputType.update>,
		private readonly resultSchemaTypeProvider: ResultSchemaTypeProvider,
	) {}

	public getQueries(entity: Model.Entity): { [fieldName: string]: FieldConfig<any> } {
		const entityName = entity.name
		const validations: { [fieldName: string]: FieldConfig<any> | undefined } = {}
		validations[`validateCreate${entityName}`] = this.getValidateCreateQuery(entity)
		validations[`validateUpdate${entityName}`] = this.getValidateUpdateQuery(entity)

		return filterObject(validations, (key, value): value is FieldConfig<any> => value !== undefined)
	}

	private getValidateCreateQuery(entity: Model.Entity): FieldConfig<Input.CreateInput> | undefined {
		const entityName = entity.name
		const dataType = this.createEntityInputProvider.getInput(entityName)
		if (dataType === undefined) {
			return undefined
		}
		return {
			type: new GraphQLNonNull(this.resultSchemaTypeProvider.validationResultType),
			args: {
				data: { type: new GraphQLNonNull(dataType) },
			},
			resolve: (parent, args, context: Context, info) =>
				context.timer(`GraphQL.query.${info.fieldName}`, () =>
					context.executionContainer.validationResolver.validateCreate(entity, args),
				),
		}
	}

	private getValidateUpdateQuery(entity: Model.Entity): FieldConfig<Input.UpdateInput> | undefined {
		const entityName = entity.name
		const dataType = this.updateEntityInputProvider.getInput(entityName)
		if (dataType === undefined) {
			return undefined
		}
		const uniqueWhere = this.whereTypeProvider.getEntityUniqueWhereType(entityName)
		if (!uniqueWhere) {
			return undefined
		}
		return {
			type: new GraphQLNonNull(this.resultSchemaTypeProvider.validationResultType),
			args: {
				by: {
					type: new GraphQLNonNull(uniqueWhere),
				},
				data: { type: new GraphQLNonNull(dataType) },
			},
			resolve: (parent, args, context: Context, info) =>
				context.timer(`GraphQL.query.${info.fieldName}`, () =>
					context.executionContainer.validationResolver.validateUpdate(entity, args),
				),
		}
	}
}
