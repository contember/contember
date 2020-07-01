export type UnknownObject = Record<string, unknown>

export function isObject(input: unknown): input is UnknownObject {
	return typeof input === 'object' && input !== null
}

export function isArray(input: unknown): input is unknown[] {
	return Array.isArray(input)
}

export function hasStringProperty<Input extends UnknownObject, Property extends string>(
	input: Input,
	property: Property,
): input is Input & { [key in Property]: string } {
	return typeof input[property] === 'string'
}

export function hasNumberProperty<Input extends UnknownObject, Property extends string>(
	input: Input,
	property: Property,
): input is Input & { [key in Property]: number } {
	return typeof input[property] === 'number'
}

export function hasObjectProperty<Input extends UnknownObject, Property extends string>(
	input: Input,
	property: Property,
): input is Input & { [key in Property]: UnknownObject } {
	return isObject(input[property])
}

export function hasArrayProperty<Input extends UnknownObject, Property extends string>(
	input: Input,
	property: Property,
): input is Input & { [key in Property]: unknown[] } {
	return isArray(input[property])
}

export function everyIs<Type>(input: unknown[], predicate: (it: unknown) => it is Type): input is Type[] {
	return input.every(it => predicate(it))
}

export function checkExtraProperties(object: UnknownObject, allowedKeys: string[]): string[] {
	return Object.keys(object).filter(it => !allowedKeys.includes(it))
}
