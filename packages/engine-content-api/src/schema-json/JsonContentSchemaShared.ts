import { builtInScalars, ResolverMap, ScalarImplementation, SchemaInterner } from '@contember/graphql-json'
import { Context } from '../types.js'
import { JsonQueryAstFactory } from './JsonQueryAstFactory.js'
import { FieldExtensions } from './JsonTypeRegistry.js'

/**
 * The parts of the JSON content schemas of one model that do not depend on permissions. Each role combination
 * builds its own schema, but resolvers, field extensions and scalars depend only on the model and are keyed by
 * type and field name, so they accumulate here; the schema data is interned, so a role pays only for what its
 * permissions change.
 */
export class JsonContentSchemaShared {
	public readonly resolvers: ResolverMap<Context> = {}
	public readonly extensions: Record<string, Record<string, FieldExtensions>> = {}
	/** Includes the built-in scalars, so a lookup sees what later builds register. */
	public readonly scalars: Record<string, ScalarImplementation> = { ...builtInScalars }
	public readonly interner = new SchemaInterner()
	public readonly queryAstFactory = new JsonQueryAstFactory(this.scalars, this.extensions)
}
