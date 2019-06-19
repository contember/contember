import { Input } from 'cms-common'
import { Literal, ObjectBuilder } from '../graphQlBuilder'
import { HasManyArguments, HasOneArguments, ReductionArguments, ReadArguments } from './types'

class ReadBuilder<AllowedArgs extends ReadArguments = ReadArguments> {
	protected constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	public static create<AllowedArgs extends ReadArguments = ReadArguments>(
		objectBuilder: ObjectBuilder = new ObjectBuilder()
	): ReadBuilder.Builder<AllowedArgs> {
		return new ReadBuilder<AllowedArgs>(objectBuilder)
	}

	public static createFromFactory<AllowedArgs extends ReadArguments>(
		builder: ReadBuilder.BuilderFactory<AllowedArgs>
	): ReadBuilder.Builder<never> {
		if (typeof builder === 'function') {
			return builder(ReadBuilder.create())
		}
		return builder
	}

	protected create<AA extends ReadArguments = ReadArguments>(
		objectBuilder: ObjectBuilder = new ObjectBuilder()
	): ReadBuilder.Builder<AA> {
		return ReadBuilder.create<AA>(objectBuilder)
	}

	public by(by: Input.UniqueWhere<Literal>) {
		return this.create<Exclude<AllowedArgs, 'by'>>(this.objectBuilder.argument('by', by))
	}

	public filter(where: Input.Where<Input.Condition<Input.ColumnValue<Literal>>>) {
		return this.create<Exclude<AllowedArgs, 'filter'>>(this.objectBuilder.argument('filter', where))
	}

	public orderBy(orderBy: Input.OrderBy) {
		return this.create<Exclude<AllowedArgs, 'orderBy'>>(this.objectBuilder.argument('orderBy', orderBy))
	}

	public offset(offset: number) {
		return this.create<Exclude<AllowedArgs, 'offset'>>(this.objectBuilder.argument('offset', offset))
	}

	public limit(limit: number) {
		return this.create<Exclude<AllowedArgs, 'limit'>>(this.objectBuilder.argument('limit', limit))
	}

	public column(name: string) {
		return this.create<AllowedArgs>(this.objectBuilder.field(name))
	}

	public inlineFragment(typeName: string, builder: ReadBuilder.BuilderFactory<never>) {
		builder = ReadBuilder.createFromFactory(builder)
		return this.create<AllowedArgs>(this.objectBuilder.fragment(typeName, builder.objectBuilder))
	}

	public reductionRelation(name: string, builder: ReadBuilder.BuilderFactory<ReductionArguments>, alias?: string) {
		return this.relation(name, builder, alias)
	}

	public hasOneRelation(name: string, builder: ReadBuilder.BuilderFactory<HasOneArguments>, alias?: string) {
		return this.relation(name, builder, alias)
	}

	public hasManyRelation(name: string, builder: ReadBuilder.BuilderFactory<HasManyArguments>, alias?: string) {
		return this.relation(name, builder, alias)
	}

	public anyRelation(name: string, builder: ReadBuilder.BuilderFactory<never>, alias?: string) {
		return this.relation(name, builder, alias)
	}

	protected relation<A extends ReadArguments>(name: string, builder: ReadBuilder.BuilderFactory<A>, alias?: string) {
		builder = ReadBuilder.createFromFactory(builder)

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, builder.objectBuilder.name(name)] : [name, builder.objectBuilder]

		return this.create<AllowedArgs>(this.objectBuilder.object(objectName, objectBuilder))
	}
}

namespace ReadBuilder {
	export type Builder<AllowedArgs extends ReadArguments> = Omit<
		ReadBuilder<AllowedArgs>,
		Exclude<ReadArguments, AllowedArgs>
	>
	export type BuilderFactory<AllowedArgs extends ReadArguments> =
		| Builder<never>
		| ((builder: Builder<AllowedArgs>) => Builder<never>)
}

export { ReadBuilder }
