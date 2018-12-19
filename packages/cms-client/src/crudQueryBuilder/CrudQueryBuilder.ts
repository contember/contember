import { isEmptyObject } from 'cms-common'
import UnboundedGetQueryBuilder from './UnboundedGetQueryBuilder'
import UpdateBuilder from './UpdateBuilder'
import QueryBuilder from '../graphQlBuilder/QueryBuilder'
import RootObjectBuilder from '../graphQlBuilder/RootObjectBuilder'
import ListQueryBuilder from './ListQueryBuilder'
import BoundedGetQueryBuilder from './BoundedGetQueryBuilder'
import CreateBuilder from './CreateBuilder'
import DeleteBuilder from './DeleteBuilder'

type Mutations = 'create' | 'update' | 'delete'
type Queries = 'get' | 'list'

type Variables = {
	[key: string]: any
}
type Client<T extends any> = (query: string | object, variables?: Variables) => PromiseLike<T>

export default class CrudQueryBuilder {
	constructor(
		private type: undefined | 'query' | 'mutation' = undefined,
		private rootObjectBuilder: RootObjectBuilder = new RootObjectBuilder()
	) {}

	public list(
		name: string,
		query: ((builder: ListQueryBuilder) => ListQueryBuilder) | ListQueryBuilder,
		alias?: string
	): Pick<CrudQueryBuilder, Exclude<keyof CrudQueryBuilder, Mutations>> {
		if (this.type === 'mutation') {
			throw new Error('Cannot combine queries and mutations')
		}
		if (typeof query === 'function') {
			query = query(new ListQueryBuilder())
		}

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('query', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public get(
		name: string,
		query: ((builder: UnboundedGetQueryBuilder) => BoundedGetQueryBuilder) | BoundedGetQueryBuilder,
		alias?: string
	): Pick<CrudQueryBuilder, Exclude<keyof CrudQueryBuilder, Mutations>> {
		if (this.type === 'mutation') {
			throw new Error('Cannot combine queries and mutations')
		}
		if (typeof query === 'function') {
			query = query(new UnboundedGetQueryBuilder())
		}

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('query', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public update(
		name: string,
		query: ((builder: UpdateBuilder) => UpdateBuilder) | UpdateBuilder,
		alias?: string
	): Pick<CrudQueryBuilder, Exclude<keyof CrudQueryBuilder, Queries>> {
		if (this.type === 'query') {
			throw new Error('Cannot combine queries and mutations')
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
	): Pick<CrudQueryBuilder, Exclude<keyof CrudQueryBuilder, Queries>> {
		if (this.type === 'query') {
			throw new Error('Cannot combine queries and mutations')
		}
		if (typeof query === 'function') {
			query = query(new CreateBuilder())
		}

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('mutation', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public delete(
		name: string,
		query: ((builder: DeleteBuilder) => DeleteBuilder) | DeleteBuilder,
		alias?: string
	): Pick<CrudQueryBuilder, Exclude<keyof CrudQueryBuilder, Queries>> {
		if (this.type === 'query') {
			throw new Error('Cannot combine queries and mutations')
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
				throw new Error(`Invalid type ${this.type}`)
		}
	}

	async execute<T>(client: Client<T>, variables?: Variables): Promise<T> {
		return await client(this.getGql(), variables)
	}
}
