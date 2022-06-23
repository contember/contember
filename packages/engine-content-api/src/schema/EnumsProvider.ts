import { GraphQLEnumType, GraphQLEnumValueConfigMap } from 'graphql'
import { Model } from '@contember/schema'
import { singletonFactory, capitalizeFirstLetter } from '../utils/index.js'

export class EnumsProvider {
	private schema: Model.Schema

	private enums = singletonFactory(name => this.createEnum(name))

	constructor(schema: Model.Schema) {
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

		return new GraphQLEnumType({
			name: capitalizeFirstLetter(name),
			values: valuesConfig,
		})
	}
}
