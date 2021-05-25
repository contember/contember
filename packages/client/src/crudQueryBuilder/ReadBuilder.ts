import type { Input } from '@contember/schema'
import { Literal, ObjectBuilder } from '../graphQlBuilder'
import type { HasManyArguments, HasOneArguments, OrderDirection, ReadArguments, ReductionArguments } from './types'

class ReadBuilder<AllowedArgs extends ReadArguments = ReadArguments> {
	protected constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

	public static instantiate<AllowedArgs extends ReadArguments = ReadArguments>(
		objectBuilder: ObjectBuilder = new ObjectBuilder(),
	): ReadBuilder.Builder<AllowedArgs> {
		return new ReadBuilder<AllowedArgs>(objectBuilder)
	}

	public static instantiateFromFactory<AllowedArgs extends ReadArguments>(
		builder: ReadBuilder.BuilderFactory<AllowedArgs>,
	): ReadBuilder.Builder<never> {
		if (typeof builder === 'function') {
			return builder(ReadBuilder.instantiate())
		}
		return builder
	}

	protected instantiate<AA extends ReadArguments = ReadArguments>(
		objectBuilder: ObjectBuilder = new ObjectBuilder(),
	): ReadBuilder.Builder<AA> {
		return ReadBuilder.instantiate<AA>(objectBuilder)
	}

	public by(by: Input.UniqueWhere<Literal>) {
		return this.instantiate<Exclude<AllowedArgs, 'by'>>(this.objectBuilder.argument('by', by))
	}

	public filter(where: Input.Where<Input.Condition<Input.ColumnValue<Literal>>>) {
		return this.instantiate<Exclude<AllowedArgs, 'filter'>>(this.objectBuilder.argument('filter', where))
	}

	public orderBy(orderBy: Input.OrderBy<OrderDirection>[]) {
		return this.instantiate<Exclude<AllowedArgs, 'orderBy'>>(this.objectBuilder.argument('orderBy', orderBy))
	}

	public offset(offset: number) {
		return this.instantiate<Exclude<AllowedArgs, 'offset'>>(this.objectBuilder.argument('offset', offset))
	}

	public limit(limit: number) {
		return this.instantiate<Exclude<AllowedArgs, 'limit'>>(this.objectBuilder.argument('limit', limit))
	}

	public skip(offset: number) {
		return this.instantiate<Exclude<AllowedArgs, 'skip'>>(this.objectBuilder.argument('skip', offset))
	}

	public first(limit: number) {
		return this.instantiate<Exclude<AllowedArgs, 'first'>>(this.objectBuilder.argument('first', limit))
	}

	public column(name: string) {
		return this.instantiate<AllowedArgs>(this.objectBuilder.field(name))
	}

	public inlineFragment(typeName: string, builder: ReadBuilder.BuilderFactory<never>) {
		builder = ReadBuilder.instantiateFromFactory(builder)
		return this.instantiate<AllowedArgs>(this.objectBuilder.inlineFragment(typeName, builder.objectBuilder))
	}

	public applyFragment(fragmentName: string) {
		return this.instantiate<AllowedArgs>(this.objectBuilder.applyFragment(fragmentName))
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
		builder = ReadBuilder.instantiateFromFactory(builder)

		const [objectName, objectBuilder] =
			typeof alias === 'string' ? [alias, builder.objectBuilder.name(name)] : [name, builder.objectBuilder]

		return this.instantiate<AllowedArgs>(this.objectBuilder.object(objectName, objectBuilder))
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
