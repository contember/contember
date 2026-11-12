export type ClassDictionary = Record<string, unknown>
export type ClassArray = ClassValue[]
export type ClassValue = ClassArray | ClassDictionary | string | number | bigint | null | boolean | undefined

const toClassString = (value: ClassValue): string => {
	if (typeof value === 'string' || typeof value === 'number') {
		return String(value)
	}
	if (typeof value !== 'object' || value === null) {
		return ''
	}
	let result = ''
	if (Array.isArray(value)) {
		for (const item of value) {
			const itemString = item ? toClassString(item) : ''
			if (itemString) {
				result += (result ? ' ' : '') + itemString
			}
		}
		return result
	}
	for (const key in value) {
		if (value[key]) {
			result += (result ? ' ' : '') + key
		}
	}
	return result
}

/**
 * Joins class names; same semantics as `clsx`: strings and numbers are kept, arrays are flattened,
 * objects contribute their keys with truthy values, everything else is dropped.
 */
export const cx = (...inputs: ClassValue[]): string => toClassString(inputs)

type ConfigSchema = Record<string, Record<string, ClassValue>>

type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T

type ClassProp =
	| { class: ClassValue; className?: never }
	| { class?: never; className: ClassValue }
	| { class?: never; className?: never }

type CvaVariants<T extends ConfigSchema> = {
	[Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | null | undefined
}

type CvaVariantsMulti<T extends ConfigSchema> = {
	[Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | StringToBoolean<keyof T[Variant]>[] | undefined
}

type CvaConfig<T> = T extends ConfigSchema ? {
		variants?: T
		defaultVariants?: CvaVariants<T>
		compoundVariants?: ((CvaVariants<T> | CvaVariantsMulti<T>) & ClassProp)[]
	}
	: never

type CvaProps<T> = T extends ConfigSchema ? CvaVariants<T> & ClassProp : ClassProp

export type VariantProps<Component extends (props?: never) => string> = Omit<Exclude<Parameters<Component>[0], undefined>, 'class' | 'className'>

const variantKey = (value: unknown): unknown => typeof value === 'boolean' ? `${value}` : value === 0 ? '0' : value

/**
 * Builds a class name from a base, variant classes, compound variant classes and `class` / `className`;
 * same semantics as `cva` from `class-variance-authority` 0.7.
 */
export const cva = <T>(base?: ClassValue, config?: CvaConfig<T>) => (props?: CvaProps<T>): string => {
	const propsRecord: Record<string, unknown> = { ...props }
	const variants: ConfigSchema | undefined = config?.variants
	if (variants == null) {
		return cx(base, props?.class, props?.className)
	}
	const defaultVariants: Record<string, unknown> = { ...config?.defaultVariants }

	const variantClassNames = Object.keys(variants).map(variant => {
		const variantProp = propsRecord[variant]
		if (variantProp === null) {
			return null
		}
		const key = variantKey(variantProp) || variantKey(defaultVariants[variant])
		// Property access converts the key with String(), like cva's `variants[variant][key]`.
		return variants[variant][String(key)]
	})

	const resolvedVariants: Record<string, unknown> = { ...defaultVariants }
	for (const [key, value] of Object.entries(propsRecord)) {
		if (value !== undefined) {
			resolvedVariants[key] = value
		}
	}

	const compoundClassNames: ClassValue[] = []
	for (const compoundVariant of config?.compoundVariants ?? []) {
		const { class: cvClass, className: cvClassName, ...conditions } = compoundVariant
		const matches = Object.entries(conditions).every(([key, value]) =>
			Array.isArray(value) ? value.includes(resolvedVariants[key]) : resolvedVariants[key] === value
		)
		if (matches) {
			compoundClassNames.push(cvClass, cvClassName)
		}
	}

	return cx(base, variantClassNames, compoundClassNames, props?.class, props?.className)
}
