import { isEmptyObject, OmitMethods } from 'cms-common'
import { QueryBuilder, RootObjectBuilder } from '../graphQlBuilder'
import { CreateBuilder } from './CreateBuilder'
import { CrudQueryBuilderError } from './CrudQueryBuilderError'
import { ReadBuilder } from './ReadBuilder'
import {
	CreateMutationArguments,
	DeleteMutationArguments,
	GetQueryArguments,
	ListQueryArguments,
	Mutations,
	Queries,
	UpdateMutationArguments
} from './types'
import { UpdateBuilder } from './UpdateBuilder'

type Variables = {
	[key: string]: any
}
type Client<T extends any> = (query: string | object, variables?: Variables) => PromiseLike<T>

export class CrudQueryBuilder {
	constructor(
		private type: undefined | 'query' | 'mutation' = undefined,
		private rootObjectBuilder: RootObjectBuilder = new RootObjectBuilder()
	) {}

	public list(
		name: string,
		query: ReadBuilder.BuilderFactory<ListQueryArguments>,
		alias?: string
	): OmitMethods<CrudQueryBuilder, Mutations> {
		if (this.type === 'mutation') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		name = `list${name}`
		query = ReadBuilder.createFromFactory(query)

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('query', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public get(
		name: string,
		query: ReadBuilder.BuilderFactory<GetQueryArguments>,
		alias?: string
	): OmitMethods<CrudQueryBuilder, Mutations> {
		if (this.type === 'mutation') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		name = `get${name}`
		query = ReadBuilder.createFromFactory(query)

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('query', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public update(
		name: string,
		query: UpdateBuilder.BuilderFactory<UpdateMutationArguments>,
		alias?: string
	): OmitMethods<CrudQueryBuilder, Queries> {
		if (this.type === 'query') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		name = `update${name}`
		query = UpdateBuilder.createFromFactory(query)

		if (isEmptyObject(query.objectBuilder.args.data)) {
			return this
		}

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('mutation', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public create(
		name: string,
		query: CreateBuilder.BuilderFactory<CreateMutationArguments>,
		alias?: string
	): OmitMethods<CrudQueryBuilder, Queries> {
		if (this.type === 'query') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		name = `create${name}`
		query = CreateBuilder.createFromFactory(query)

		if (isEmptyObject(query.objectBuilder.args.data)) {
			return this
		}

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('mutation', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public delete(
		name: string,
		query: ReadBuilder.BuilderFactory<DeleteMutationArguments>,
		alias?: string
	): OmitMethods<CrudQueryBuilder, Queries> {
		if (this.type === 'query') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		name = `delete${name}`
		query = ReadBuilder.createFromFactory(query)

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('mutation', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	getGql(): string {
		const builder = new QueryBuilder()
		switch (this.type) {
			case 'mutation':
				return builder.mutation(this.rootObjectBuilder)
			case 'query':
				return builder.query(this.rootObjectBuilder)
			default:
				throw new CrudQueryBuilderError(`Invalid type ${this.type}`)
		}
	}

	async execute<T>(client: Client<T>, variables?: Variables): Promise<T> {
		return client(this.getGql(), variables)
	}
}
