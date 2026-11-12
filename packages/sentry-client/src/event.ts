import { normalizeToSize, truncate } from './normalize.js'
import { ModuleResolver, parseStack } from './stack.js'
import { ExceptionValue, Mechanism } from './types.js'

/** Linked errors (causes, `AggregateError.errors`) reported besides the error itself. */
const maxLinkedErrors = 5

const exceptionValue = (error: Error, resolveModule: ModuleResolver): ExceptionValue => {
	// both can be overwritten with anything; a bad one must not lose the event and its causes
	const stack: unknown = error.stack
	const message: unknown = error.message
	const frames = typeof stack === 'string' ? parseStack(stack, resolveModule) : []
	return {
		type: error.name || error.constructor.name,
		value: typeof message === 'string' ? message : String(message),
		...(frames.length > 0 ? { stacktrace: { frames } } : {}),
	}
}

const sortedKeysMessage = (value: object, maxLength = 40): string => {
	const keys = Object.keys(value).sort()
	if (keys.length === 0) {
		return '[object has no keys]'
	}
	if (keys[0].length >= maxLength) {
		return truncate(keys[0], maxLength)
	}
	for (let included = keys.length; included > 0; included--) {
		const serialized = keys.slice(0, included).join(', ')
		if (serialized.length <= maxLength) {
			return included === keys.length ? serialized : truncate(serialized, maxLength)
		}
	}
	return ''
}

const messageForObject = (value: object): string => {
	const name: unknown = Reflect.get(value, 'name')
	const message: unknown = Reflect.get(value, 'message')
	if (typeof name === 'string') {
		return `'${name}' captured as exception${typeof message === 'string' ? ` with message '${message}'` : ''}`
	}
	if (typeof message === 'string') {
		return message
	}
	return `Object captured as exception with keys: ${sortedKeysMessage(value)}`
}

export interface BuiltException {
	readonly values: ExceptionValue[]
	/** Set for a value that is not an `Error`: its normalized form, sent as `extra.__serialized__`. */
	readonly serialized?: unknown
}

const maxValueLength = 250
/** @sentry/node 7's `normalizeToSize` limit for the serialized value. */
const maxSerializedBytes = 100 * 1024

/**
 * Adds the causes and `AggregateError.errors` of `error`, depth first, in front of `chain`, as @sentry/node 7 did, each
 * linked to its parent by `exception_id` and `parent_id`. At most 5 besides the error itself: v7 let all members of
 * an AggregateError through, so a large one made an event Sentry rejected.
 */
const addLinkedErrors = (
	error: Error,
	parent: ExceptionValue,
	parentId: number,
	chain: ExceptionValue[],
	resolveModule: ModuleResolver,
): ExceptionValue[] => {
	if (chain.length >= maxLinkedErrors + 1) {
		return chain
	}
	const linked: [string, Error][] = []
	if (error.cause instanceof Error) {
		linked.push(['cause', error.cause])
	}
	const errors: unknown = Reflect.get(error, 'errors')
	if (Array.isArray(errors)) {
		for (const [index, child] of errors.entries()) {
			if (child instanceof Error) {
				linked.push([`errors[${index}]`, child])
			}
		}
	}
	let result = chain
	for (const [source, child] of linked) {
		if (result.length >= maxLinkedErrors + 1) {
			break
		}
		parent.mechanism = {
			...(parent.mechanism ?? { type: 'generic', handled: true }),
			...(parent.type === 'AggregateError' ? { is_exception_group: true } : {}),
			exception_id: parentId,
		}
		const childValue: ExceptionValue = {
			...exceptionValue(child, resolveModule),
			mechanism: { type: 'chained', handled: true, source, exception_id: result.length, parent_id: parentId },
		}
		result = addLinkedErrors(child, childValue, result.length, [childValue, ...result], resolveModule)
	}
	return result
}

/**
 * The exception values for `error`: linked errors first, the error itself last. A value that is not an Error is
 * reported through `syntheticError`, created where it was captured, as @sentry/node 7 did.
 */
export const buildException = (
	error: unknown,
	syntheticError: Error,
	mechanism: Pick<Mechanism, 'type' | 'handled'>,
	resolveModule: ModuleResolver,
	normalizeDepth: number,
	normalizeBreadth: number,
): BuiltException => {
	if (!(error instanceof Error)) {
		const isPlainObject = Object.prototype.toString.call(error) === '[object Object]' && typeof error === 'object' && error !== null
		syntheticError.message = isPlainObject ? messageForObject(error) : String(error)
		const value = { ...exceptionValue(syntheticError, resolveModule), type: 'Error', mechanism: { ...mechanism, synthetic: true } }
		return {
			values: [{ ...value, value: truncate(value.value, maxValueLength) }],
			serialized: isPlainObject ? normalizeToSize(error, normalizeDepth, normalizeBreadth, maxSerializedBytes) : undefined,
		}
	}
	const root: ExceptionValue = { ...exceptionValue(error, resolveModule), mechanism: { ...mechanism } }
	const values = addLinkedErrors(error, root, 0, [root], resolveModule)
	return { values: values.map(it => ({ ...it, value: truncate(it.value, maxValueLength) })) }
}
