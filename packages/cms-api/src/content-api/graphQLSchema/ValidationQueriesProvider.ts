import { GraphQLFieldConfig, GraphQLNonNull } from 'graphql'
import { Context } from '../types'
import { getEntity } from '@contember/schema-utils'
import WhereTypeProvider from './WhereTypeProvider'
import EntityInputProvider from './mutations/EntityInputProvider'
import MutationProvider from './MutationProvider'
import { Input, Model } from '@contember/schema'
import { filterObject } from '../../utils/object'

type FieldConfig<TArgs> = GraphQLFieldConfig<Context, any, TArgs>

export class ValidationQueriesProvider {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereTypeProvider: WhereTypeProvider,
		private readonly createEntityInputProvider: EntityInputProvider<EntityInputProvider.Type.create>,
		private readonly updateEntityInputProvider: EntityInputProvider<EntityInputProvider.Type.update>,
	) {}

	public getQueries(entityName: string): { [fieldName: string]: FieldConfig<any> } {
		const validations: { [fieldName: string]: FieldConfig<any> | undefined } = {}
		validations[`validateCreate${entityName}`] = this.getValidateCreateQuery(entityName)
		validations[`validateUpdate${entityName}`] = this.getValidateUpdateQuery(entityName)

		return filterObject(validations, (key, value): value is FieldConfig<any> => value !== undefined)
	}

	private getValidateCreateQuery(entityName: string): FieldConfig<Input.CreateInput> | undefined {
		const entity = getEntity(this.schema, entityName)
		const dataType = this.createEntityInputProvider.getInput(entityName)
		if (dataType === undefined) {
			return undefined
		}
		return {
			type: new GraphQLNonNull(MutationProvider.validationResultType),
			args: {
				data: { type: new GraphQLNonNull(dataType) },
			},
			resolve: (parent, args, context: Context) =>
				context.executionContainer.validationResolver.validateCreate(entity, args),
		}
	}

	private getValidateUpdateQuery(entityName: string): FieldConfig<Input.UpdateInput> | undefined {
		const entity = getEntity(this.schema, entityName)
		const dataType = this.updateEntityInputProvider.getInput(entityName)
		if (dataType === undefined) {
			return undefined
		}
		return {
			type: new GraphQLNonNull(MutationProvider.validationResultType),
			args: {
				by: { type: new GraphQLNonNull(this.whereTypeProvider.getEntityUniqueWhereType(entityName)) },
				data: { type: new GraphQLNonNull(dataType) },
			},
			resolve: (parent, args, context: Context) =>
				context.executionContainer.validationResolver.validateUpdate(entity, args),
		}
	}
}
