import {
	Argument,
	EnumValue,
	Field,
	InputField,
	ResolverFn,
	ResolverMap,
	ScalarImplementation,
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
 */
export class JsonTypeRegistry {
	public readonly types: Record<string, Type> = {}
	public readonly resolvers: ResolverMap<Context> = {}
	public readonly extensions: Record<string, Record<string, FieldExtensions>> = {}
	public readonly scalars: Record<string, ScalarImplementation> = {}

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
		this.addOutputFields(name, fields, createFields())
		return name
	}

	public interface(name: string, createFields: () => Record<string, JsonOutputField>): string {
		if (this.types[name]) {
			return name
		}
		const fields: Record<string, Field> = {}
		this.types[name] = [TypeKind.INTERFACE, fields, [], []]
		this.addOutputFields(name, fields, createFields())
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
		Object.assign(fields, createFields())
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
			this.types[name] = description !== undefined ? [TypeKind.SCALAR, description] : [TypeKind.SCALAR]
			if (implementation) {
				this.scalars[name] = implementation
			}
		}
		return name
	}

	/**
	 * Drops the types no root field reaches. Providers create some types speculatively (e.g. an input that the allowed
	 * operations then filter out); graphql-js never sees those because it collects types by reachability.
	 */
	public pruneUnreachable(roots: readonly string[]): void {
		const reachable = new Set<string>()
		const queue = [...roots]
		const visit = (name: string) => {
			if (!reachable.has(name)) {
				queue.push(name)
			}
		}
		while (queue.length > 0) {
			const name = queue.pop()
			if (name === undefined || reachable.has(name)) {
				continue
			}
			const type = this.types[name]
			if (!type) {
				continue
			}
			reachable.add(name)
			switch (type[0]) {
				case TypeKind.OBJECT:
				case TypeKind.INTERFACE:
					for (const field of Object.values(type[1])) {
						visit(field[0][1])
						for (const arg of Object.values(field[1] ?? {})) {
							visit(arg[0][1])
						}
					}
					type[2].forEach(visit)
					if (type[0] === TypeKind.INTERFACE) {
						type[3].forEach(visit)
					}
					break
				case TypeKind.UNION:
					type[1].forEach(visit)
					break
				case TypeKind.INPUT_OBJECT:
					for (const field of Object.values(type[1])) {
						visit(field[0][1])
					}
					break
			}
		}
		for (const name of Object.keys(this.types)) {
			if (!reachable.has(name)) {
				delete this.types[name]
				delete this.resolvers[name]
				delete this.extensions[name]
			}
		}
		for (const type of Object.values(this.types)) {
			if (type[0] === TypeKind.INTERFACE) {
				type[3] = type[3].filter(it => reachable.has(it))
			}
		}
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
				;(this.resolvers[typeName] ??= {})[fieldName] = field.resolve
			}
			if (field.extensions) {
				;(this.extensions[typeName] ??= {})[fieldName] = field.extensions
			}
		}
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
