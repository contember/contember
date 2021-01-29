class InvalidConfigError extends Error {}

export function configError(err: string): never {
	throw new InvalidConfigError(err)
}

export function typeConfigError(property: string, value: any, expectedType: string): never {
	return configError(`Invalid property ${property} in config file. ${expectedType} expected, ${typeof value} found`)
}

export type UnknownObject = Record<string, unknown>

export function isObject(input: unknown): input is UnknownObject {
	return typeof input === 'object' && input !== null
}

export function hasStringProperty<Input extends UnknownObject, Property extends string>(
	input: Input,
	property: Property,
): input is Input & { [key in Property]: string } {
	return typeof input[property] === 'string'
}

export function hasBooleanProperty<Input extends UnknownObject, Property extends string>(
	input: Input,
	property: Property,
): input is Input & { [key in Property]: boolean } {
	return typeof input[property] === 'boolean'
}

export function hasNumberProperty<Input extends UnknownObject, Property extends string>(
	input: Input,
	property: Property,
): input is Input & { [key in Property]: number } {
	return typeof input[property] === 'number'
}
