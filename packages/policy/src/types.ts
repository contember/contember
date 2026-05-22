export type Effect = 'allow' | 'deny'

export type Decision = 'allow' | 'deny'

/**
 * A single permission statement.
 *
 * `actions` and `resources` use glob matching with `*` (any chars) and `?`
 * (one char). A missing `resources` defaults to `['*']`.
 */
export interface Statement {
	effect: Effect
	actions: readonly string[]
	resources?: readonly string[]
	conditions?: ConditionBlock
}

/**
 * `{ stringEquals: { 'subject.role': 'editor' } }`
 *
 * All operator entries must match for the statement to apply. Within one operator,
 * all key/value pairs must match. Values may be a single primitive or an array
 * (treated as "any of").
 */
export interface ConditionBlock {
	readonly [operator: string]: {
		readonly [path: string]: ConditionValue
	}
}

export type ConditionPrimitive = string | number | boolean | null | Date
export type ConditionValue = ConditionPrimitive | readonly ConditionPrimitive[]

export interface Policy {
	readonly version?: string
	readonly statements: readonly Statement[]
}

/**
 * Free-form evaluation context. Conditions can reference any path via `a.b.c`
 * dot notation, and statement strings can substitute `${a.b.c}` placeholders.
 */
export interface EvaluationContext {
	readonly [key: string]: unknown
}

/**
 * A policy source contributes statements to the engine at evaluation time.
 * Typical sources: tenant DB (identity_policy), project schema, plugins.
 */
export interface PolicySource {
	readonly name: string

	getStatements(context: EvaluationContext): readonly Statement[] | Promise<readonly Statement[]>
}

export interface MatchTrace {
	readonly source: string
	readonly statementIndex: number
	readonly effect: Effect
}

export interface EvaluationResult {
	readonly decision: Decision
	readonly matches: readonly MatchTrace[]
}
