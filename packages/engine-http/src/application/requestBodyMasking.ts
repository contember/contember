import { ASTVisitor, Kind, parse, print, ValueNode, visit } from 'graphql'
import { maskSecrets, REDACTED, SECRET_ARGUMENTS_BY_FIELD, SECRET_FIELD_NAMES } from '@contember/engine-tenant-api'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

// A query that names none of these cannot reference a secret argument (GraphQL names have no escapes), so it is kept unparsed.
const secretNamePattern = new RegExp([...SECRET_FIELD_NAMES, ...Object.keys(SECRET_ARGUMENTS_BY_FIELD)].join('|'))

type MaskedQuery = {
	readonly query: string
	/** Variables bound to a secret argument; `all` when the query could not be read. */
	readonly secretVariables: ReadonlySet<string> | 'all'
}

const maskQuery = (query: string): MaskedQuery => {
	if (!secretNamePattern.test(query)) {
		return { query, secretVariables: new Set() }
	}
	let document
	try {
		document = parse(query)
	} catch {
		// An unparsable query may still inline a secret literal or bind one to any variable.
		return { query: REDACTED, secretVariables: 'all' }
	}
	const secretVariables = new Set<string>()
	let redacted = false
	const collectVariables: ASTVisitor = {
		Variable: node => {
			secretVariables.add(node.name.value)
		},
	}
	const redact = (value: ValueNode): ValueNode => {
		visit(value, collectVariables)
		if (value.kind === Kind.VARIABLE) {
			return value
		}
		redacted = true
		return { kind: Kind.STRING, value: REDACTED }
	}
	const withLiteralsMasked = visit(document, {
		Field: node => {
			const secretArguments = SECRET_ARGUMENTS_BY_FIELD[node.name.value]
			if (secretArguments === undefined || node.arguments === undefined) {
				return undefined
			}
			return { ...node, arguments: node.arguments.map(arg => secretArguments.has(arg.name.value) ? { ...arg, value: redact(arg.value) } : arg) }
		},
		Argument: node => SECRET_FIELD_NAMES.has(node.name.value) ? { ...node, value: redact(node.value) } : undefined,
		ObjectField: node => SECRET_FIELD_NAMES.has(node.name.value) ? { ...node, value: redact(node.value) } : undefined,
	})
	// Variable definitions precede the selections that reveal which variables are secret, hence a second pass.
	const masked = visit(withLiteralsMasked, {
		VariableDefinition: node => {
			if (node.defaultValue === undefined || !secretVariables.has(node.variable.name.value)) {
				return undefined
			}
			redacted = true
			return { ...node, defaultValue: { kind: Kind.STRING, value: REDACTED } }
		},
	})
	// Re-printing changes the formatting, so the query is kept verbatim unless a literal was masked.
	return { query: redacted ? print(masked) : query, secretVariables }
}

const maskVariables = (variables: unknown, secretVariables: ReadonlySet<string> | 'all'): unknown => {
	if (typeof variables === 'string') {
		// GraphQL over GET sends the variables as a JSON string.
		try {
			return maskVariables(JSON.parse(variables), secretVariables)
		} catch {
			return REDACTED
		}
	}
	if (secretVariables === 'all') {
		return maskSecrets(variables, true)
	}
	if (!isRecord(variables)) {
		return maskSecrets(variables)
	}
	return Object.fromEntries(Object.entries(variables).map(([name, value]) => [name, maskSecrets(value, secretVariables.has(name))]))
}

const maskGraphQLRequest = (body: unknown): unknown => {
	if (Array.isArray(body)) {
		return body.map(maskGraphQLRequest)
	}
	if (!isRecord(body) || typeof body.query !== 'string') {
		return maskSecrets(body)
	}
	const { query, secretVariables } = maskQuery(body.query)
	return Object.fromEntries(
		Object.entries(body).map(([key, value]) => {
			if (key === 'query') {
				return [key, query]
			}
			return [key, key === 'variables' ? maskVariables(value, secretVariables) : maskSecrets(value, SECRET_FIELD_NAMES.has(key))]
		}),
	)
}

/**
 * A request body (or the parsed query string) as logs and error reports may carry it: on a route that receives
 * credentials, passwords, OTP codes, tokens and secrets are replaced by a marker, both as GraphQL variables and as
 * literals inlined in the query. Other routes (content, system, transfer) carry project data, which the credential
 * names would only over-mask (`code`, `token` are common column names), so their bodies are logged as sent.
 */
export const maskRequestBody = (body: unknown, carriesCredentials: boolean): unknown => carriesCredentials ? maskGraphQLRequest(body) : body

/** The request URI as it may be logged: on a route that receives credentials, the query string is masked. */
export const maskRequestUri = (uri: string | undefined, carriesCredentials: boolean): string | undefined => {
	if (uri === undefined || !carriesCredentials) {
		return uri
	}
	const queryStart = uri.indexOf('?')
	return queryStart === -1 ? uri : `${uri.slice(0, queryStart)}?${REDACTED}`
}
