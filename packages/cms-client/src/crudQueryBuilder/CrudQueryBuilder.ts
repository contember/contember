import { isEmptyObject } from 'cms-common'
import { QueryBuilder, RootObjectBuilder } from '../graphQlBuilder'
import { CreateBuilder } from './CreateBuilder'
import { CrudQueryBuilderError } from './CrudQueryBuilderError'
import { DeleteBuilder } from './DeleteBuilder'
import { ReadQueryBuilder } from './ReadQueryBuilder'
import { GetQueryArguments, ListQueryArguments, Mutations, OmitMethods, Queries } from './types'
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
		query: ReadQueryBuilder.BuilderFactory<ListQueryArguments>,
		alias?: string
	): OmitMethods<CrudQueryBuilder, Mutations> {
		if (this.type === 'mutation') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		query = ReadQueryBuilder.createFromFactory(query)

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('query', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public get(
		name: string,
		query: ReadQueryBuilder.BuilderFactory<GetQueryArguments>,
		alias?: string
	): OmitMethods<CrudQueryBuilder, Mutations> {
		if (this.type === 'mutation') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		query = ReadQueryBuilder.createFromFactory(query)

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('query', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public update(
		name: string,
		query: ((builder: UpdateBuilder) => UpdateBuilder) | UpdateBuilder,
		alias?: string
	): OmitMethods<CrudQueryBuilder, Queries> {
		if (this.type === 'query') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		if (typeof query === 'function') {
			query = query(new UpdateBuilder())
		}

		if (isEmptyObject(query.objectBuilder.args.data)) {
			return this
		}

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('mutation', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public create(
		name: string,
		query: ((builder: CreateBuilder) => CreateBuilder) | CreateBuilder,
		alias?: string
	): OmitMethods<CrudQueryBuilder, Queries> {
		if (this.type === 'query') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		if (typeof query === 'function') {
			query = query(new CreateBuilder())
		}

		if (isEmptyObject(query.objectBuilder.args.data)) {
			return this
		}

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('mutation', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public delete(
		name: string,
		query: ((builder: DeleteBuilder) => DeleteBuilder) | DeleteBuilder,
		alias?: string
	): OmitMethods<CrudQueryBuilder, Queries> {
		if (this.type === 'query') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		if (typeof query === 'function') {
			query = query(new DeleteBuilder())
		}

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
