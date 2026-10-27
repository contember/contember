import {
	Argument,
	EnumValue,
	Field,
	InputField,
	isSpecifiedScalarTypeName,
	ResolverFn,
	ResolverMap,
	ScalarImplementation,
	specifiedScalarTypes,
	Type,
	TypeKind,
	TypeRef,
} from '@contember/graphql-json'
import { Context } from '../types.js'

export type FieldExtensions = Record<string, unknown>

export interface JsonOutputField {
	type: TypeRef
	args?: Record<string, Argument>
	resolve?: ResolverFn<unknown, Context>
	extensions?: FieldExtensions
	deprecationReason?: string
}

/**
 * Collects the JSON types of one content schema. Types are referenced by name, so a type is registered before its
 * fields are created - a recursive reference (e.g. `Where.and`) then only resolves the name.
 * Fields are created later, by `fillPending`: one type at a time, so that a build can pause between them instead of
 * running the whole graph a single entity reaches in one go.
 * Resolvers, field extensions and scalars go to maps shared by all schemas of the model; the first registration wins.
 */
export class JsonTypeRegistry {
	public readonly types: Record<string, Type> = {}
	private readonly pending: (() => void)[] = []

	constructor(
		public readonly resolvers: ResolverMap<Context>,
		public readonly extensions: Record<string, Record<string, FieldExtensions>>,
		public readonly scalars: Record<string, ScalarImplementation>,
	) {}

	public has(name: string): boolean {
		return name in this.types
	}

	public object(name: string, createFields: () => Record<string, JsonOutputField>, interfaces: string[] = []): string {
		if (this.types[name]) {
			return name
		}
		const fields: Record<string, Field> = {}
		this.types[name] = [TypeKind.OBJECT, fields, interfaces]
		for (const interfaceName of interfaces) {
			this.addPossibleType(interfaceName, name)
		}
		this.pending.push(() => this.addOutputFields(name, fields, createFields()))
		return name
	}

	public interface(name: string, createFields: () => Record<string, JsonOutputField>): string {
		if (this.types[name]) {
			return name
		}
		const fields: Record<string, Field> = {}
		this.types[name] = [TypeKind.INTERFACE, fields, [], []]
		this.pending.push(() => this.addOutputFields(name, fields, createFields()))
		return name
	}

	public union(name: string, possibleTypes: string[]): string {
		if (!this.types[name]) {
			this.types[name] = [TypeKind.UNION, possibleTypes]
		}
		return name
	}

	public inputObject(name: string, createFields: () => Record<string, InputField>): string {
		if (this.types[name]) {
			return name
		}
		const fields: Record<string, InputField> = {}
		this.types[name] = [TypeKind.INPUT_OBJECT, fields]
		this.pending.push(() => Object.assign(fields, createFields()))
		return name
	}

	public enum(name: string, values: readonly string[]): string {
		if (!this.types[name]) {
			const enumValues: Record<string, EnumValue> = {}
			for (const value of values) {
				enumValues[value] = [value]
			}
			this.types[name] = [TypeKind.ENUM, enumValues]
		}
		return name
	}

	public scalar(name: string, implementation: ScalarImplementation | undefined, description?: string): string {
		if (!this.types[name]) {
			this.types[name] = isSpecifiedScalarTypeName(name)
				? specifiedScalarTypes[name]
				: description !== undefined
				? [TypeKind.SCALAR, description]
				: [TypeKind.SCALAR]
		}
		if (implementation) {
			this.scalars[name] ??= implementation
		}
		return name
	}

	/** Creates the fields of the registered types, including the types that creates; yields after each type. */
	public *fillPending(): Generator<void, void> {
		// the queue grows while it is processed
		for (let i = 0; i < this.pending.length; i++) {
			this.pending[i]()
			yield
		}
		this.pending.length = 0
	}

	/**
	 * The types the schema consists of, collected the way graphql-js collects them (`GraphQLSchema` constructor):
	 * `includedTypes` first, then everything `roots` reach, depth-first. The order is what introspection and the
	 * printed schema list, so it stays the order graphql-js produced. Providers create some types speculatively
	 * (e.g. an input that the allowed operations then filter out); unreachable ones are left out.
	 * Returns a new record: deleting from a large object would turn it into a slow dictionary.
	 * Yields after each collected type.
	 */
	public *collectReachableTypes(
		includedTypes: readonly string[],
		roots: readonly string[],
		otherTypes: Record<string, Type>,
	): Generator<void, Record<string, Type>> {
		const reachable = new Set<string>(includedTypes)
		const getType = (name: string): Type | undefined => this.types[name] ?? otherTypes[name]
		// an explicit stack instead of recursion keeps the pre-order of a recursive walk and can pause after any type
		const collect = function*(name: string): Generator<void, void> {
			const stack: Iterator<string>[] = [[name].values()]
			while (stack.length > 0) {
				const next = stack[stack.length - 1].next()
				if (next.done) {
					stack.pop()
					continue
				}
				const type = reachable.has(next.value) ? undefined : getType(next.value)
				if (!type) {
					continue
				}
				reachable.add(next.value)
				stack.push(referencedTypes(type))
				yield
			}
		}
		// graphql-js seeds the set with the included types and re-adds each one, which moves it to the end
		for (const name of includedTypes) {
			reachable.delete(name)
			yield* collect(name)
		}
		for (const root of roots) {
			yield* collect(root)
		}

		const types: Record<string, Type> = {}
		for (const name of reachable) {
			const type = getType(name)
			if (!type) {
				continue
			}
			// replaced, not mutated: extension types are shared between schemas
			if (type[0] === TypeKind.INTERFACE && type[3].some(it => !reachable.has(it))) {
				const possibleTypes = type[3].filter(it => reachable.has(it))
				types[name] = type[4] !== undefined
					? [TypeKind.INTERFACE, type[1], type[2], possibleTypes, type[4]]
					: [TypeKind.INTERFACE, type[1], type[2], possibleTypes]
			} else {
				types[name] = type
			}
		}
		return types
	}

	private addPossibleType(interfaceName: string, typeName: string): void {
		const interfaceType = this.types[interfaceName]
		if (!interfaceType || interfaceType[0] !== TypeKind.INTERFACE) {
			throw new Error(`Interface ${interfaceName} must be registered before ${typeName}`)
		}
		interfaceType[3].push(typeName)
	}

	private addOutputFields(typeName: string, target: Record<string, Field>, fields: Record<string, JsonOutputField>): void {
		for (const [fieldName, field] of Object.entries(fields)) {
			target[fieldName] = field.deprecationReason !== undefined
				? [field.type, field.args ?? null, undefined, field.deprecationReason]
				: [field.type, field.args ?? null]
			if (field.resolve) {
				;(this.resolvers[typeName] ??= {})[fieldName] ??= field.resolve
			}
			if (field.extensions) {
				;(this.extensions[typeName] ??= {})[fieldName] ??= field.extensions
			}
		}
	}
}

/** The names a type refers to, in the order graphql-js visits them: interfaces, then each field's type and arguments. */
function* referencedTypes(type: Type): Generator<string, void> {
	switch (type[0]) {
		case TypeKind.OBJECT:
		case TypeKind.INTERFACE:
			yield* type[2]
			for (const fieldName in type[1]) {
				const field = type[1][fieldName]
				if (!field) {
					continue
				}
				yield field[0][1]
				for (const argName in field[1]) {
					const arg = field[1][argName]
					if (arg) {
						yield arg[0][1]
					}
				}
			}
			break
		case TypeKind.UNION:
			yield* type[1]
			break
		case TypeKind.INPUT_OBJECT:
			for (const fieldName in type[1]) {
				const field = type[1][fieldName]
				if (field) {
					yield field[0][1]
				}
			}
			break
	}
}

/** Wrap patterns of graphql-json `TypeRef`, named after the SDL they produce. */
const TypeRefPattern = {
	named: 0, // T
	nonNull: 1, // T!
	list: 2, // [T]
	listOfNonNull: 3, // [T!]
	nonNullListOfNonNull: 5, // [T!]!
	nonNullListOfNonNullListOfNonNull: 13, // [[T!]!]!
} as const

export const namedRef = (name: string): TypeRef => [TypeRefPattern.named, name]
export const nonNullRef = (name: string): TypeRef => [TypeRefPattern.nonNull, name]
export const listRef = (name: string): TypeRef => [TypeRefPattern.list, name]
export const listOfNonNullRef = (name: string): TypeRef => [TypeRefPattern.listOfNonNull, name]
export const nonNullListOfNonNullRef = (name: string): TypeRef => [TypeRefPattern.nonNullListOfNonNull, name]
export const nonNullListOfNonNullListOfNonNullRef = (name: string): TypeRef => [TypeRefPattern.nonNullListOfNonNullListOfNonNull, name]

/** `T` → `T!`, `[T!]` → `[T!]!` */
export const toNonNull = (ref: TypeRef): TypeRef => {
	switch (ref[0]) {
		case TypeRefPattern.named:
			return [TypeRefPattern.nonNull, ref[1]]
		case TypeRefPattern.listOfNonNull:
			return [TypeRefPattern.nonNullListOfNonNull, ref[1]]
		default:
			throw new Error(`Cannot wrap type ref pattern ${ref[0]} in non-null`)
	}
}
