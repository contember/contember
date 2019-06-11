import { Input } from 'cms-common'
import { Literal, ObjectBuilder } from '../graphQlBuilder'
import { HasManyArguments, HasOneArguments, OmitMethods, ReductionArguments, SupportedArguments } from './types'

class ReadQueryBuilder<AllowedArgs extends SupportedArguments = SupportedArguments> {
	private constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	public static create<AllowedArgs extends SupportedArguments = SupportedArguments>(
		objectBuilder: ObjectBuilder = new ObjectBuilder()
	): ReadQueryBuilder.Builder<AllowedArgs> {
		return new ReadQueryBuilder<AllowedArgs>(objectBuilder)
	}

	public by(by: Input.UniqueWhere<Literal>) {
		return ReadQueryBuilder.create<Exclude<AllowedArgs, 'by'>>(this.objectBuilder.argument('by', by))
	}

	public filter(where: Input.Where<Input.Condition<Input.ColumnValue<Literal>>>) {
		return ReadQueryBuilder.create<Exclude<AllowedArgs, 'filter'>>(this.objectBuilder.argument('filter', where))
	}

	public orderBy(orderBy: Input.OrderBy) {
		return ReadQueryBuilder.create<Exclude<AllowedArgs, 'orderBy'>>(this.objectBuilder.argument('orderBy', orderBy))
	}

	public offset(offset: number) {
		return ReadQueryBuilder.create<Exclude<AllowedArgs, 'offset'>>(this.objectBuilder.argument('offset', offset))
	}

	public limit(limit: number) {
		return ReadQueryBuilder.create<Exclude<AllowedArgs, 'limit'>>(this.objectBuilder.argument('limit', limit))
	}

	public column(name: string) {
		return ReadQueryBuilder.create<AllowedArgs>(this.objectBuilder.field(name))
	}

	public inlineFragment(typeName: string, builder: ReadQueryBuilder.BuilderFactory<never>) {
		builder = ReadQueryBuilder.createFromFactory(builder)
		return ReadQueryBuilder.create<AllowedArgs>(this.objectBuilder.fragment(typeName, builder.objectBuilder))
	}

	public reductionRelation(name: string, builder: ReadQueryBuilder.BuilderFactory<ReductionArguments>, alias?: string) {
		return this.relation(name, builder, alias)
	}

	public hasOneRelation(name: string, builder: ReadQueryBuilder.BuilderFactory<HasOneArguments>, alias?: string) {
		return this.relation(name, builder, alias)
	}

	public hasManyRelation(name: string, builder: ReadQueryBuilder.BuilderFactory<HasManyArguments>, alias?: string) {
		return this.relation(name, builder, alias)
	}

	public anyRelation(name: string, builder: ReadQueryBuilder.BuilderFactory<never>, alias?: string) {
		return this.relation(name, builder, alias)
	}

	private relation<A extends SupportedArguments>(
		name: string,
		builder: ReadQueryBuilder.BuilderFactory<A>,
		alias?: string
	) {
		builder = ReadQueryBuilder.createFromFactory(builder)

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, builder.objectBuilder.name(name)] : [name, builder.objectBuilder]

		return ReadQueryBuilder.create<AllowedArgs>(this.objectBuilder.object(objectName, objectBuilder))
	}
}

namespace ReadQueryBuilder {
	export type Builder<AllowedArgs extends SupportedArguments> = OmitMethods<
		ReadQueryBuilder<AllowedArgs>,
		Exclude<SupportedArguments, AllowedArgs>
	>

	export type BuilderFactory<AllowedArgs extends SupportedArguments> =
		| ReadQueryBuilder.Builder<never>
		| ((builder: ReadQueryBuilder.Builder<AllowedArgs>) => ReadQueryBuilder.Builder<never>)

	export const createFromFactory = <AllowedArgs extends SupportedArguments>(
		builder: BuilderFactory<AllowedArgs>
	): ReadQueryBuilder.Builder<never> => {
		if (typeof builder === 'function') {
			return builder(ReadQueryBuilder.create())
		}
		return builder
	}
}

export { ReadQueryBuilder }
