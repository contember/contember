export function isNull(value: unknown): value is null {
  return value === null
}
export function isNotNull<T>(value: unknown): value is T {
  return value !== null
}
export function isUndefined(value: unknown): value is undefined {
  return value === undefined
}
export function isDefined<T>(value: unknown): value is T {
  return value !== undefined
}
export function isNotNullish<T>(value: T): value is Exclude<T, null | undefined> {
  return value != null
}
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}
export function isTrue(value: unknown): value is true {
  return value === true
}
export function isFalse(value: unknown): value is false {
  return value === false
}
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0
}
function isNonEmptyTrimmedStringFactory(trim: 'trim' | 'trimStart' | 'trimEnd' = 'trim') {
  return function isNonEmptyString(value: unknown): value is string {
    return isString(value) && value[trim]().length > 0
  }
}
export const isNonEmptyTrimmedString = isNonEmptyTrimmedStringFactory()
export const isNonEmptyTrimmedStartString = isNonEmptyTrimmedStringFactory('trimStart')
export const isNonEmptyTrimmedEndString = isNonEmptyTrimmedStringFactory('trimEnd')
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && value === value
}
export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0
}
export function isNumericString(value: string): value is string {
  return isString(value) && !isNaN(parseFloat(value))
}
export function isOneOfFactory<U, T = any>(
	members: T extends Array<U> | ReadonlyArray<U> ? T : never,
): (value: unknown) => value is U {
	return function isOneOfFactoryProduct(value: unknown): value is U {
		return members.includes(value as U)
	}
}
export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement
}
export function isObject(value: unknown): value is Object {
  return typeof value === 'object' && value !== null
}
export function isPlainObject<T extends Record<string, unknown>>(value: unknown): value is T {
  return isObject(value) && value.constructor === Object
}
