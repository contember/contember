import { CliError, ExitCode } from '@contember/cli-common'
import { GraphQlClientError, GraphQlErrorType } from '@contember/graphql-client'

export interface TransportErrorContext {
	/** Human-readable service name used in error messages. */
	readonly service: string
	/** Stable machine-readable prefix, for example `TENANT_API`. */
	readonly codePrefix: string
	/** Endpoint only. Credentials, query parameters, and fragments are removed. */
	readonly url?: string
}

export type HttpErrorKind = 'forbidden' | 'not-found' | 'conflict' | 'transient' | 'input' | 'internal'

export interface HttpStatusClassification {
	readonly kind: HttpErrorKind
	readonly codeSuffix: string
	readonly exitCode: ExitCode
}

export interface HttpErrorResponse {
	readonly status: number
	readonly retryAfter?: string | null
}

/** Classifies HTTP failures independently of any particular API client. */
export const classifyHttpStatus = (status: number): HttpStatusClassification => {
	if (status === 401) {
		return { kind: 'forbidden', codeSuffix: 'UNAUTHORIZED', exitCode: ExitCode.Forbidden }
	}
	if (status === 403) {
		return { kind: 'forbidden', codeSuffix: 'FORBIDDEN', exitCode: ExitCode.Forbidden }
	}
	if (status === 404) {
		return { kind: 'not-found', codeSuffix: 'NOT_FOUND', exitCode: ExitCode.NotFound }
	}
	if (status === 408) {
		return { kind: 'transient', codeSuffix: 'TIMEOUT', exitCode: ExitCode.Transient }
	}
	if (status === 409) {
		return { kind: 'conflict', codeSuffix: 'CONFLICT', exitCode: ExitCode.Conflict }
	}
	if (status === 425) {
		return { kind: 'transient', codeSuffix: 'TOO_EARLY', exitCode: ExitCode.Transient }
	}
	if (status === 429) {
		return { kind: 'transient', codeSuffix: 'RATE_LIMITED', exitCode: ExitCode.Transient }
	}
	if (status >= 500 && status <= 599) {
		return { kind: 'transient', codeSuffix: 'SERVER_ERROR', exitCode: ExitCode.Transient }
	}
	if (status >= 400 && status <= 499) {
		return { kind: 'input', codeSuffix: 'BAD_REQUEST', exitCode: ExitCode.InputError }
	}
	return { kind: 'internal', codeSuffix: 'HTTP_ERROR', exitCode: ExitCode.InternalError }
}

/** Creates a safe CLI error for a received HTTP failure without copying its body. */
export const toHttpTransportError = (
	response: HttpErrorResponse,
	context: TransportErrorContext,
	cause?: unknown,
): CliError => {
	const classification = classifyHttpStatus(response.status)
	return new CliError(`${context.service} request failed with HTTP ${response.status}`, {
		code: `${context.codePrefix}_${classification.codeSuffix}`,
		exitCode: classification.exitCode,
		details: createDetails(context, {
			status: response.status,
			retryAfter: sanitizeRetryAfter(response.retryAfter),
		}),
		cause: sanitizeCause(cause, context),
	})
}

/**
 * Normalizes an error thrown by a transport call. Call this only at a transport boundary: a plain
 * thrown error is treated as a rejected network operation and is therefore retryable.
 */
export const toTransportError = (error: unknown, context: TransportErrorContext): CliError => {
	if (error instanceof CliError) {
		return error
	}
	if (error instanceof GraphQlClientError) {
		return graphQlTransportError(error, context)
	}
	return new CliError(`${context.service} request failed: network error`, {
		code: `${context.codePrefix}_UNREACHABLE`,
		exitCode: ExitCode.Transient,
		details: createDetails(context, { status: null }),
		cause: sanitizeCause(error, context),
	})
}

interface TransportErrorDetails {
	readonly type?: GraphQlErrorType
	readonly url?: string
	readonly status: number | null
	readonly retryAfter?: string
}

const graphQlTransportError = (error: GraphQlClientError, context: TransportErrorContext): CliError => {
	const graphQlCodes = extractGraphQlCodes(error)
	const semantic = classifyGraphQlCodes(graphQlCodes)
	if (semantic !== null) {
		return createGraphQlError(error, context, semantic)
	}

	if (error.type === 'aborted') {
		return createGraphQlError(
			error,
			context,
			{ kind: 'transient', codeSuffix: 'ABORTED', exitCode: ExitCode.Transient },
		)
	}
	if (error.type === 'network error') {
		return createGraphQlError(
			error,
			context,
			{ kind: 'transient', codeSuffix: 'UNREACHABLE', exitCode: ExitCode.Transient },
		)
	}
	if (error.type === 'invalid response body') {
		return createGraphQlError(
			error,
			context,
			{ kind: 'internal', codeSuffix: 'INVALID_RESPONSE', exitCode: ExitCode.InternalError },
		)
	}
	if (error.response !== undefined && error.response.status >= 400) {
		return createGraphQlError(error, context, classifyHttpStatus(error.response.status))
	}
	if (error.type === 'server error') {
		return createGraphQlError(
			error,
			context,
			{ kind: 'transient', codeSuffix: 'SERVER_ERROR', exitCode: ExitCode.Transient },
		)
	}
	if (error.type === 'unauthorized') {
		return createGraphQlError(
			error,
			context,
			{ kind: 'forbidden', codeSuffix: 'UNAUTHORIZED', exitCode: ExitCode.Forbidden },
		)
	}
	if (error.type === 'forbidden') {
		return createGraphQlError(
			error,
			context,
			{ kind: 'forbidden', codeSuffix: 'FORBIDDEN', exitCode: ExitCode.Forbidden },
		)
	}
	return createGraphQlError(
		error,
		context,
		{ kind: 'input', codeSuffix: error.type === 'bad request' ? 'BAD_REQUEST' : 'ERROR', exitCode: ExitCode.InputError },
	)
}

const createGraphQlError = (
	error: GraphQlClientError,
	context: TransportErrorContext,
	classification: HttpStatusClassification,
): CliError =>
	new CliError(`${context.service} request failed: ${describeFailure(classification.kind)}`, {
		code: `${context.codePrefix}_${classification.codeSuffix}`,
		exitCode: classification.exitCode,
		details: createDetails(
			{ ...context, url: error.request.url },
			{
				type: error.type,
				status: error.response?.status ?? null,
				retryAfter: sanitizeRetryAfter(error.response?.headers.get('retry-after')),
			},
		),
		cause: sanitizeCause(error, context),
	})

const describeFailure = (kind: HttpErrorKind): string => {
	switch (kind) {
		case 'forbidden':
			return 'authentication or permission denied'
		case 'not-found':
			return 'resource not found'
		case 'conflict':
			return 'conflict'
		case 'transient':
			return 'temporary failure'
		case 'input':
			return 'request rejected'
		case 'internal':
			return 'invalid response'
	}
}

const authGraphQlCodes = new Set(['ForbiddenError', 'FORBIDDEN', 'UNAUTHENTICATED', 'UNAUTHORIZED'])
const serverGraphQlCodes = new Set(['INTERNAL_SERVER_ERROR', 'InternalServerError'])

const classifyGraphQlCodes = (codes: readonly string[]): HttpStatusClassification | null => {
	if (codes.some(code => authGraphQlCodes.has(code))) {
		return { kind: 'forbidden', codeSuffix: 'FORBIDDEN', exitCode: ExitCode.Forbidden }
	}
	if (codes.some(code => serverGraphQlCodes.has(code))) {
		return { kind: 'transient', codeSuffix: 'SERVER_ERROR', exitCode: ExitCode.Transient }
	}
	return null
}

const extractGraphQlCodes = (error: GraphQlClientError): readonly string[] => {
	const values: readonly unknown[] = error.errors ?? []
	return values.flatMap(value => {
		if (typeof value !== 'object' || value === null || !('extensions' in value)) {
			return []
		}
		const extensions = value.extensions
		if (typeof extensions !== 'object' || extensions === null || !('code' in extensions) || typeof extensions.code !== 'string') {
			return []
		}
		return [extensions.code]
	})
}

const createDetails = (
	context: TransportErrorContext,
	values: Omit<TransportErrorDetails, 'url'>,
): TransportErrorDetails => {
	const safeUrl = context.url === undefined ? undefined : sanitizeUrl(context.url)
	return {
		status: values.status,
		...(values.type === undefined ? {} : { type: values.type }),
		...(safeUrl === undefined ? {} : { url: safeUrl }),
		...(values.retryAfter === undefined ? {} : { retryAfter: values.retryAfter }),
	}
}

const sanitizeUrl = (value: string): string | undefined => {
	try {
		const url = new URL(value)
		return `${url.protocol}//${url.host}${url.pathname}`
	} catch {
		return undefined
	}
}

const sanitizeCause = (cause: unknown, context: TransportErrorContext): Error | undefined =>
	cause === undefined ? undefined : new Error(`${context.service} transport failure`)

const sanitizeRetryAfter = (value: string | null | undefined): string | undefined => {
	if (value === undefined || value === null) {
		return undefined
	}
	if (/^\d{1,10}$/.test(value)) {
		return value
	}
	if (/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(value)) {
		return value
	}
	return undefined
}
