import { introspectionTypes } from '../introspection/types.js'
import type { Argument, Directive, EnumValue, Field, Schema, Type, TypeRef } from '../types/schema.js'
import { TypeKind } from '../types/schema.js'

const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193

const mix = (hash: number, value: number): number => Math.imul(hash ^ value, FNV_PRIME)

// plain loops: interning runs for every node of every role schema, closures and key arrays show in profiles

const sameElements = (a: readonly unknown[], b: readonly unknown[]): boolean => {
	if (a.length !== b.length) {
		return false
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false
		}
	}
	return true
}

/** Same names in the same order with identical values; `bKeys` are the keys of `b`. */
const sameRecord = <V>(a: Record<string, V>, b: Record<string, V>, bKeys: readonly string[]): boolean => {
	let i = 0
	for (const key in a) {
		if (key !== bKeys[i] || a[key] !== b[key]) {
			return false
		}
		i++
	}
	return i === bKeys.length
}

/** Canonical nodes by hash; a hash collision moves to the overflow list. */
class Pool<T extends object> {
	private readonly first = new Map<number, T>()
	private readonly overflow = new Map<number, T[]>()

	public find(hash: number, equals: (candidate: T) => boolean): T | undefined {
		const first = this.first.get(hash)
		if (first === undefined || equals(first)) {
			return first
		}
		return this.overflow.get(hash)?.find(equals)
	}

	public add(hash: number, value: T): void {
		if (!this.first.has(hash)) {
			this.first.set(hash, value)
			return
		}
		const overflow = this.overflow.get(hash)
		if (overflow) {
			overflow.push(value)
		} else {
			this.overflow.set(hash, [value])
		}
	}
}

/**
 * Hash-conses schemas: structurally identical type refs, arguments, fields, field maps, types and type maps become
 * one shared object - within a schema and across all schemas interned by the same instance, e.g. the per-role
 * variants of one API, which differ in a few fields only.
 *
 * Children are interned first, so two nodes are equal exactly when their elements are identical. An input node whose
 * children are already canonical becomes canonical itself, and a canonical node is returned as is - repeated inputs
 * (e.g. shared extension types) then cost one lookup. Neither the input nor the interned schema may be mutated.
 */
export class SchemaInterner {
	private readonly ids = new WeakMap<object, number>()
	private nextId = 1

	private readonly values = new Map<string, object>()
	/** Strings hash through the engine's own string hashing instead of a loop over their characters. */
	private readonly stringIds = new Map<string, number>()
	/** Type refs by type name, indexed by pattern - the most frequent node, interned without hashing. */
	private readonly typeRefs = new Map<string, TypeRef[]>()
	private readonly nameLists = new Pool<string[]>()
	private readonly arguments = new Pool<Argument>()
	private readonly argumentMaps = new Pool<Record<string, Argument>>()
	private readonly fields = new Pool<Field>()
	private readonly fieldMaps = new Pool<Record<string, Field>>()
	private readonly enumValues = new Pool<EnumValue>()
	private readonly enumValueMaps = new Pool<Record<string, EnumValue>>()
	private readonly directives = new Pool<Directive>()
	private readonly directiveMaps = new Pool<Record<string, Directive>>()
	private readonly typeMaps = new Pool<Record<string, Type>>()
	private readonly schemas = new Pool<Schema>()
	/** Types are equal only under the same name; a name has as many variants as there are distinct schemas. */
	private readonly typesByName = new Map<string, Type[]>()

	public intern(schema: Schema): Schema {
		const t = this.internRecord(this.typeMaps, schema.t, (type, name) => this.internType(name, type))
		const d = schema.d ? this.internRecord(this.directiveMaps, schema.d, this.internDirective) : undefined
		const interned: Schema = d ? { q: schema.q, m: schema.m, s: schema.s, t, d } : { q: schema.q, m: schema.m, s: schema.s, t }
		const elements = [schema.q, schema.m, schema.s, t, d]
		return this.canonical(
			this.schemas,
			this.hashElements(elements),
			interned,
			it => sameElements([it.q, it.m, it.s, it.t, it.d], elements),
		)
	}

	private internType(name: string, type: Type): Type {
		const variants = this.typesByName.get(name) ?? []
		if (variants.includes(type)) {
			return type
		}
		// graphql-json recognizes its own introspection types by identity, so they are kept as they are
		const elements = introspectionTypes[name] === type ? type : this.internTypeElements(type)
		const interned = sameElements(type, elements) ? type : elements
		const existing = variants.find(it => sameElements(it, interned))
		if (existing) {
			return existing
		}
		variants.push(interned)
		this.typesByName.set(name, variants)
		this.ids.set(interned, this.nextId++)
		return interned
	}

	private internTypeElements(type: Type): Type {
		switch (type[0]) {
			case TypeKind.SCALAR:
				return type[1] !== undefined ? [TypeKind.SCALAR, type[1]] : [TypeKind.SCALAR]
			case TypeKind.OBJECT: {
				const fields = this.internRecord(this.fieldMaps, type[1], this.internField)
				const interfaces = this.internNames(type[2])
				return type[3] !== undefined ? [TypeKind.OBJECT, fields, interfaces, type[3]] : [TypeKind.OBJECT, fields, interfaces]
			}
			case TypeKind.INTERFACE: {
				const fields = this.internRecord(this.fieldMaps, type[1], this.internField)
				const interfaces = this.internNames(type[2])
				const possibleTypes = this.internNames(type[3])
				return type[4] !== undefined
					? [TypeKind.INTERFACE, fields, interfaces, possibleTypes, type[4]]
					: [TypeKind.INTERFACE, fields, interfaces, possibleTypes]
			}
			case TypeKind.UNION: {
				const possibleTypes = this.internNames(type[1])
				return type[2] !== undefined ? [TypeKind.UNION, possibleTypes, type[2]] : [TypeKind.UNION, possibleTypes]
			}
			case TypeKind.ENUM: {
				const values = this.internRecord(this.enumValueMaps, type[1], this.internEnumValue)
				return type[2] !== undefined ? [TypeKind.ENUM, values, type[2]] : [TypeKind.ENUM, values]
			}
			case TypeKind.INPUT_OBJECT: {
				const fields = this.internRecord(this.argumentMaps, type[1], this.internArgument)
				return type[3] !== undefined
					? [TypeKind.INPUT_OBJECT, fields, type[2], type[3]]
					: type[2] !== undefined
					? [TypeKind.INPUT_OBJECT, fields, type[2]]
					: [TypeKind.INPUT_OBJECT, fields]
			}
		}
	}

	private readonly internField = (field: Field): Field => {
		if (this.ids.has(field)) {
			return field
		}
		const type = this.internTypeRef(field[0])
		const args = field[1] ? this.internRecord(this.argumentMaps, field[1], this.internArgument) : null
		const [, , description, deprecationReason] = field
		const copy: Field = deprecationReason !== undefined
			? [type, args, description, deprecationReason]
			: description !== undefined
			? [type, args, description]
			: [type, args]
		return this.canonicalTuple(this.fields, field, copy)
	}

	/** Also interns input fields, which have the same shape. */
	private readonly internArgument = (argument: Argument): Argument => {
		if (this.ids.has(argument)) {
			return argument
		}
		const type = this.internTypeRef(argument[0])
		const defaultValue = this.internValue(argument[1])
		const description = argument[2]
		const copy: Argument = description !== undefined
			? [type, defaultValue, description]
			: defaultValue !== undefined
			? [type, defaultValue]
			: [type]
		return this.canonicalTuple(this.arguments, argument, copy)
	}

	private readonly internEnumValue = (enumValue: EnumValue): EnumValue => {
		if (this.ids.has(enumValue)) {
			return enumValue
		}
		const value = this.internValue(enumValue[0])
		const [, description, deprecationReason] = enumValue
		const copy: EnumValue = deprecationReason !== undefined
			? [value, description, deprecationReason]
			: description !== undefined
			? [value, description]
			: value !== undefined
			? [value]
			: []
		return this.canonicalTuple(this.enumValues, enumValue, copy)
	}

	private readonly internDirective = (directive: Directive): Directive => {
		if (this.ids.has(directive)) {
			return directive
		}
		const args = this.internRecord(this.argumentMaps, directive[0], this.internArgument)
		const locations = this.internNames(directive[1])
		const [, , isRepeatable, description] = directive
		const copy: Directive = description !== undefined
			? [args, locations, isRepeatable, description]
			: isRepeatable !== undefined
			? [args, locations, isRepeatable]
			: [args, locations]
		return this.canonicalTuple(this.directives, directive, copy)
	}

	private internTypeRef(ref: TypeRef): TypeRef {
		const [pattern, name] = ref
		let byPattern = this.typeRefs.get(name)
		if (!byPattern) {
			byPattern = []
			this.typeRefs.set(name, byPattern)
		}
		const existing = byPattern[pattern]
		if (existing) {
			return existing
		}
		const canonical: TypeRef = ref.length === 2 ? ref : [pattern, name]
		byPattern[pattern] = canonical
		this.ids.set(canonical, this.nextId++)
		return canonical
	}

	private internNames(names: string[]): string[] {
		if (this.ids.has(names)) {
			return names
		}
		return this.canonicalTuple(this.nameLists, names, names)
	}

	/** Default and enum values are arbitrary JSON; equal values become one object, so tuples compare by identity. */
	private internValue(value: unknown): unknown {
		if (value === null || typeof value !== 'object') {
			return value
		}
		const key = JSON.stringify(value)
		const existing = this.values.get(key)
		if (existing !== undefined) {
			return existing
		}
		this.values.set(key, value)
		this.ids.set(value, this.nextId++)
		return value
	}

	private internRecord<V extends object>(
		pool: Pool<Record<string, V>>,
		record: Record<string, V>,
		internValue: (value: V, name: string) => V,
	): Record<string, V> {
		if (this.ids.has(record)) {
			return record
		}
		const interned: Record<string, V> = {}
		const keys: string[] = []
		let unchanged = true
		let hash = FNV_OFFSET
		for (const name in record) {
			const value = record[name]
			if (value === undefined) {
				unchanged = false
				continue
			}
			const internedValue = internValue(value, name)
			interned[name] = internedValue
			keys.push(name)
			unchanged &&= internedValue === value
			hash = mix(mix(hash, this.stringId(name)), this.id(internedValue))
		}
		const candidate = unchanged ? record : interned
		return this.canonical(pool, hash, candidate, it => sameRecord(it, candidate, keys))
	}

	/** `normalized` has canonical children and no trailing absent elements; the input is kept when it matches. */
	private canonicalTuple<T extends readonly unknown[]>(pool: Pool<T>, input: T, normalized: T): T {
		const value = sameElements(input, normalized) ? input : normalized
		return this.canonical(pool, this.hashElements(value), value, it => sameElements(it, value))
	}

	private canonical<T extends object>(pool: Pool<T>, hash: number, value: T, equals: (candidate: T) => boolean): T {
		const existing = pool.find(hash, equals)
		if (existing !== undefined) {
			return existing
		}
		pool.add(hash, value)
		this.ids.set(value, this.nextId++)
		return value
	}

	private hashElements(elements: readonly unknown[]): number {
		let hash = mix(FNV_OFFSET, elements.length)
		for (const element of elements) {
			switch (typeof element) {
				case 'string':
					hash = mix(mix(hash, 1), this.stringId(element))
					break
				case 'number':
					hash = mix(mix(hash, 2), element | 0)
					break
				case 'boolean':
					hash = mix(hash, element ? 3 : 4)
					break
				case 'object':
					hash = element === null ? mix(hash, 5) : mix(mix(hash, 6), this.id(element))
					break
				default:
					hash = mix(hash, 7)
			}
		}
		return hash
	}

	private stringId(value: string): number {
		let id = this.stringIds.get(value)
		if (id === undefined) {
			id = this.stringIds.size + 1
			this.stringIds.set(value, id)
		}
		return id
	}

	private id(value: object): number {
		const id = this.ids.get(value)
		if (id === undefined) {
			throw new Error('SchemaInterner: value was not interned')
		}
		return id
	}
}
