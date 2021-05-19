import { ObjectBuilder, QueryBuilder, RootObjectBuilder } from '../graphQlBuilder'
import { isEmptyObject } from '../utils'
import { CrudQueryBuilderError } from './CrudQueryBuilderError'
import { ReadBuilder } from './ReadBuilder'
import {
	CreateMutationArguments,
	CreateMutationFields,
	DeleteMutationArguments,
	DeleteMutationFields,
	GetQueryArguments,
	ListQueryArguments,
	Mutations,
	PaginateQueryArguments,
	Queries,
	UpdateMutationArguments,
	UpdateMutationFields,
	WriteOperation,
} from './types'
import { WriteBuilder } from './WriteBuilder'

type Variables = {
	[key: string]: any
}
type Client<T extends any> = (query: string | object, variables?: Variables) => PromiseLike<T>

export class CrudQueryBuilder {
	constructor(
		private type: undefined | 'query' | 'mutation' = undefined,
		private rootObjectBuilder: RootObjectBuilder = new RootObjectBuilder(),
	) {}

	public fragment(name: string, typeName: string, query: ReadBuilder.BuilderFactory<never>): CrudQueryBuilder {
		const readBuilder = ReadBuilder.instantiateFromFactory(query)
		const objectBuilder = readBuilder.objectBuilder.name(typeName)

		return new CrudQueryBuilder(this.type, this.rootObjectBuilder.fragment(name, objectBuilder))
	}

	public list(
		name: string,
		query: ReadBuilder.BuilderFactory<ListQueryArguments>,
		alias?: string,
	): Omit<CrudQueryBuilder, Mutations> {
		if (this.type === 'mutation') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		name = `list${name}`
		query = ReadBuilder.instantiateFromFactory(query)

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('query', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public paginate(
		name: string,
		query: ReadBuilder.BuilderFactory<PaginateQueryArguments>,
		alias?: string,
	): Omit<CrudQueryBuilder, Mutations> {
		if (this.type === 'mutation') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		name = `paginate${name}`
		query = ReadBuilder.instantiateFromFactory(query)

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('query', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public get(
		name: string,
		query: ReadBuilder.BuilderFactory<GetQueryArguments>,
		alias?: string,
	): Omit<CrudQueryBuilder, Mutations> {
		if (this.type === 'mutation') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		name = `get${name}`
		query = ReadBuilder.instantiateFromFactory(query)

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('query', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public update(
		name: string,
		query: WriteBuilder.BuilderFactory<UpdateMutationArguments, UpdateMutationFields, WriteOperation.Update>,
		alias?: string,
	): Omit<CrudQueryBuilder, Queries> {
		if (this.type === 'query') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		name = `update${name}`
		query = WriteBuilder.instantiateFromFactory(query)

		if (isEmptyObject(query.objectBuilder.args.data)) {
			return this
		}

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('mutation', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public create(
		name: string,
		query: WriteBuilder.BuilderFactory<CreateMutationArguments, CreateMutationFields, WriteOperation.Create>,
		alias?: string,
	): Omit<CrudQueryBuilder, Queries> {
		if (this.type === 'query') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		name = `create${name}`
		query = WriteBuilder.instantiateFromFactory(query)

		if (isEmptyObject(query.objectBuilder.args.data)) {
			return this
		}

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('mutation', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public delete(
		name: string,
		query: WriteBuilder.BuilderFactory<DeleteMutationArguments, DeleteMutationFields, WriteOperation.Delete>,
		alias?: string,
	): Omit<CrudQueryBuilder, Queries> {
		if (this.type === 'query') {
			throw new CrudQueryBuilderError('Cannot combine queries and mutations')
		}
		name = `delete${name}`
		query = WriteBuilder.instantiateFromFactory(query)

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, query.objectBuilder.name(name)] : [name, query.objectBuilder]

		return new CrudQueryBuilder('mutation', this.rootObjectBuilder.object(objectName, objectBuilder))
	}

	public inTransaction(alias?: string): CrudQueryBuilder {
		const name = 'transaction'
		const [objectName, objectBuilder] =
			typeof alias === 'string'
				? [
						alias,
						new ObjectBuilder(undefined, { ...this.rootObjectBuilder.objects }, undefined, undefined, undefined, name),
				  ]
				: [name, new ObjectBuilder(undefined, { ...this.rootObjectBuilder.objects })]
		return new CrudQueryBuilder(
			this.type,
			new RootObjectBuilder({
				[objectName]: objectBuilder,
			}),
		)
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
