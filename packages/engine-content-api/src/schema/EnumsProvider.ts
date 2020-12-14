import { GraphQLEnumType } from 'graphql'
import { GraphQLEnumValueConfigMap } from 'graphql/type/definition'
import { Model } from '@contember/schema'
import { singletonFactory } from '../utils'
import { capitalizeFirstLetter } from '../utils'
import { GraphQLObjectsFactory } from '@contember/graphql-utils'

export class EnumsProvider {
	private schema: Model.Schema

	private enums = singletonFactory(name => this.createEnum(name))

	constructor(schema: Model.Schema, private readonly graphqlObjectFactories: GraphQLObjectsFactory) {
		this.schema = schema
	}

	public getEnum(name: string): GraphQLEnumType {
		return this.enums(name)
	}

	public hasEnum(name: string): boolean {
		return this.schema.enums[name] !== undefined
	}

	private createEnum(name: string): GraphQLEnumType {
		const valuesConfig: GraphQLEnumValueConfigMap = {}
		for (const val of this.schema.enums[name]) {
			valuesConfig[val] = { value: val }
		}

		return this.graphqlObjectFactories.createEnumType({
			name: capitalizeFirstLetter(name),
			values: valuesConfig,
		})
	}
}
