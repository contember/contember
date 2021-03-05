import { Literal } from './Literal'
import { QueryCompiler } from './QueryCompiler'
import { RootObjectBuilder } from './RootObjectBuilder'

class QueryBuilder {
	query(builder: ((builder: RootObjectBuilder) => RootObjectBuilder) | RootObjectBuilder): string {
		if (!(builder instanceof RootObjectBuilder)) {
			builder = builder(new RootObjectBuilder())
		}
		const compiler = new QueryCompiler('query', builder)
		return compiler.create()
	}

	mutation(builder: ((builder: RootObjectBuilder) => RootObjectBuilder) | RootObjectBuilder): string {
		if (!(builder instanceof RootObjectBuilder)) {
			builder = builder(new RootObjectBuilder())
		}
		const compiler = new QueryCompiler('mutation', builder)
		return compiler.create()
	}
}

namespace QueryBuilder {
	export interface Object {
		[key: string]: Value
	}

	export interface List extends Array<Value> {}

	export type AtomicValue = string | null | number | boolean | Literal
	export type Value = AtomicValue | QueryBuilder.Object | List
}

export { QueryBuilder }
