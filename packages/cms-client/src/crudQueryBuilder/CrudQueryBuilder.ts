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
		query: ((builder: ListQueryBuilder) => ListQueryBuilder) | ListQueryBuilder
	): Pick<CrudQueryBuilder, Exclude<keyof CrudQueryBuilder, Mutations>> {
		if (this.type === 'mutation') {
			throw new Error('Cannot combine queries and mutations')
		}
		if (typeof query === 'function') {
			query = query(new ListQueryBuilder())
		}
		return new CrudQueryBuilder('query', this.rootObjectBuilder.object(name, query.objectBuilder))
	}

	public get(
		name: string,
		query: ((builder: UnboundedGetQueryBuilder) => BoundedGetQueryBuilder) | BoundedGetQueryBuilder
	): Pick<CrudQueryBuilder, Exclude<keyof CrudQueryBuilder, Mutations>> {
		if (this.type === 'mutation') {
			throw new Error('Cannot combine queries and mutations')
		}
		if (typeof query === 'function') {
			query = query(new UnboundedGetQueryBuilder())
		}
		return new CrudQueryBuilder('query', this.rootObjectBuilder.object(name, query.objectBuilder))
	}

	public update(
		name: string,
		query: ((builder: UpdateBuilder) => UpdateBuilder) | UpdateBuilder
	): Pick<CrudQueryBuilder, Exclude<keyof CrudQueryBuilder, Queries>> {
		if (this.type === 'query') {
			throw new Error('Cannot combine queries and mutations')
		}
		if (typeof query === 'function') {
			query = query(new UpdateBuilder())
		}
		return new CrudQueryBuilder('mutation', this.rootObjectBuilder.object(name, query.objectBuilder))
	}

	public create(
		name: string,
		query: ((builder: CreateBuilder) => CreateBuilder) | CreateBuilder
	): Pick<CrudQueryBuilder, Exclude<keyof CrudQueryBuilder, Queries>> {
		if (this.type === 'query') {
			throw new Error('Cannot combine queries and mutations')
		}
		if (typeof query === 'function') {
			query = query(new CreateBuilder())
		}
		return new CrudQueryBuilder('mutation', this.rootObjectBuilder.object(name, query.objectBuilder))
	}

	public delete(
		name: string,
		query: ((builder: DeleteBuilder) => DeleteBuilder) | DeleteBuilder
	): Pick<CrudQueryBuilder, Exclude<keyof CrudQueryBuilder, Queries>> {
		if (this.type === 'query') {
			throw new Error('Cannot combine queries and mutations')
		}
		if (typeof query === 'function') {
			query = query(new DeleteBuilder())
		}
		return new CrudQueryBuilder('mutation', this.rootObjectBuilder.object(name, query.objectBuilder))
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
