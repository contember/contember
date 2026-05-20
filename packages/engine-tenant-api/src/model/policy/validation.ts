import { ConditionBlock, defaultOperators, Policy } from '@contember/policy'

export class PolicyValidationError extends Error {
}

const SLUG_RE = /^[a-zA-Z0-9_][a-zA-Z0-9_.\-:]{0,127}$/

export function validatePolicySlug(slug: string): void {
	if (!SLUG_RE.test(slug)) {
		throw new PolicyValidationError(`Invalid policy slug: ${slug} (must be 1-128 chars: alphanumeric, _, -, ., :)`)
	}
	if (slug.startsWith('builtin:')) {
		throw new PolicyValidationError('Slug prefix "builtin:" is reserved')
	}
}

export function validatePolicyDocument(doc: Policy): void {
	if (!Array.isArray(doc.statements)) {
		throw new PolicyValidationError('document.statements must be an array')
	}
	for (let i = 0; i < doc.statements.length; i++) {
		const stmt = doc.statements[i]
		if (stmt.effect !== 'allow' && stmt.effect !== 'deny') {
			throw new PolicyValidationError(`statement[${i}].effect must be 'allow' or 'deny'`)
		}
		if (!Array.isArray(stmt.actions) || stmt.actions.length === 0) {
			throw new PolicyValidationError(`statement[${i}].actions must be a non-empty array`)
		}
		for (const action of stmt.actions) {
			if (typeof action !== 'string' || action.length === 0) {
				throw new PolicyValidationError(`statement[${i}].actions must contain non-empty strings`)
			}
		}
		if (stmt.resources !== undefined) {
			if (!Array.isArray(stmt.resources)) {
				throw new PolicyValidationError(`statement[${i}].resources must be an array if provided`)
			}
			for (const res of stmt.resources) {
				if (typeof res !== 'string' || res.length === 0) {
					throw new PolicyValidationError(`statement[${i}].resources must contain non-empty strings`)
				}
			}
		}
		if (stmt.conditions !== undefined) {
			validateConditionBlock(stmt.conditions, i)
		}
	}
}

function validateConditionBlock(block: ConditionBlock, statementIndex: number): void {
	if (block === null || typeof block !== 'object' || Array.isArray(block)) {
		throw new PolicyValidationError(`statement[${statementIndex}].conditions must be an object`)
	}
	for (const [operator, paths] of Object.entries(block)) {
		if (typeof operator !== 'string' || operator.length === 0) {
			throw new PolicyValidationError(`statement[${statementIndex}].conditions: operator names must be non-empty strings`)
		}
		if (!(operator in defaultOperators)) {
			throw new PolicyValidationError(`statement[${statementIndex}].conditions: unknown operator "${operator}"`)
		}
		if (paths === null || typeof paths !== 'object' || Array.isArray(paths)) {
			throw new PolicyValidationError(
				`statement[${statementIndex}].conditions[${operator}] must be an object of path → value`,
			)
		}
		for (const [path, value] of Object.entries(paths)) {
			if (typeof path !== 'string' || path.length === 0) {
				throw new PolicyValidationError(
					`statement[${statementIndex}].conditions[${operator}]: path keys must be non-empty strings`,
				)
			}
			validateConditionLeaf(value, `statement[${statementIndex}].conditions[${operator}][${path}]`)
		}
	}
}

function validateConditionLeaf(value: unknown, where: string): void {
	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			if (!isConditionPrimitive(value[i])) {
				throw new PolicyValidationError(`${where}[${i}] must be string, number, boolean, null or Date`)
			}
		}
		return
	}
	if (!isConditionPrimitive(value)) {
		throw new PolicyValidationError(`${where} must be a primitive or array of primitives`)
	}
}

function isConditionPrimitive(value: unknown): boolean {
	return value === null
		|| typeof value === 'string'
		|| typeof value === 'number'
		|| typeof value === 'boolean'
		|| value instanceof Date
}

const TEMPLATE_SYNTAX_RE = /\$\{/

/**
 * Tag values are baked into actions, resources and condition values at policy
 * load time. Allowing template syntax (`${...}`) in tag values would let any
 * caller with `policy:assign` rewrite the policy's effective surface at
 * evaluation time — reject up front.
 */
export function validateAssignmentTags(tags: Record<string, unknown>): void {
	if (tags === null || typeof tags !== 'object' || Array.isArray(tags)) {
		throw new PolicyValidationError('assignment tags must be a plain object')
	}
	for (const [key, value] of Object.entries(tags)) {
		if (typeof key !== 'string' || key.length === 0) {
			throw new PolicyValidationError('assignment tag keys must be non-empty strings')
		}
		checkTagValue(value, key)
	}
}

function checkTagValue(value: unknown, where: string): void {
	if (typeof value === 'string') {
		if (TEMPLATE_SYNTAX_RE.test(value)) {
			throw new PolicyValidationError(`assignment tag "${where}" must not contain template syntax \${...}`)
		}
		return
	}
	if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
		return
	}
	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			checkTagValue(value[i], `${where}[${i}]`)
		}
		return
	}
	throw new PolicyValidationError(`assignment tag "${where}" must be primitive or array of primitives`)
}
