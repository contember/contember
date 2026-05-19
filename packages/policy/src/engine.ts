import { EvaluationContext, EvaluationResult, MatchTrace, PolicySource, Statement } from './types'
import { globMatchAny } from './glob'
import { hasUnresolvedPlaceholder, substituteString } from './context'
import { ConditionOperator, defaultOperators, evaluateConditions } from './conditions'

export interface PolicyEngineOptions {
	operators?: Record<string, ConditionOperator>
}

/**
 * Aggregates statements from multiple sources, evaluates against (action, resource, context).
 *
 * Decision rules:
 *   1. If any matching statement has effect `deny`, decision is `deny` (deny wins).
 *   2. Else if any matching statement has effect `allow`, decision is `allow`.
 *   3. Else `deny` (default deny).
 *
 * A statement "matches" when:
 *   - one of its `actions` patterns globs the requested action
 *   - one of its `resources` patterns globs the requested resource (default `**`)
 *   - all conditions evaluate to true against the context
 *
 * Conditions are evaluated with the statement's effect (see `evaluateConditions`):
 * for `deny` statements, a condition that references a missing context path is
 * treated as a match — the deny fires fail-closed. For `allow`, the statement
 * is skipped (fail-closed allow).
 *
 * Both action/resource patterns and condition values support `${path}` substitution.
 */
export class PolicyEngine {
	private readonly operators: Record<string, ConditionOperator>

	constructor(
		private readonly sources: readonly PolicySource[],
		options: PolicyEngineOptions = {},
	) {
		this.operators = { ...defaultOperators, ...(options.operators ?? {}) }
	}

	public async evaluate(action: string, resource: string, context: EvaluationContext): Promise<EvaluationResult> {
		const matches: MatchTrace[] = []
		let allowed = false
		for (const source of this.sources) {
			const statements = await source.getStatements(context)
			for (let i = 0; i < statements.length; i++) {
				const stmt = statements[i]
				if (!this.matches(stmt, action, resource, context)) {
					continue
				}
				matches.push({ source: source.name, statementIndex: i, effect: stmt.effect })
				if (stmt.effect === 'deny') {
					return { decision: 'deny', matches }
				}
				allowed = true
			}
		}
		return { decision: allowed ? 'allow' : 'deny', matches }
	}

	public async isAllowed(action: string, resource: string, context: EvaluationContext): Promise<boolean> {
		const result = await this.evaluate(action, resource, context)
		return result.decision === 'allow'
	}

	private matches(stmt: Statement, action: string, resource: string, context: EvaluationContext): boolean {
		const actions = stmt.actions.map(p => substituteString(p, context))
		if (!this.matchAnyPattern(actions, action, stmt.effect)) {
			return false
		}
		const resourcePatterns = stmt.resources
			? stmt.resources.map(p => substituteString(p, context))
			: ['*']
		if (!this.matchAnyPattern(resourcePatterns, resource, stmt.effect)) {
			return false
		}
		return evaluateConditions(stmt.conditions, { context, operators: this.operators }, stmt.effect)
	}

	/**
	 * Glob-match `input` against `patterns` with fail-closed handling of unresolved
	 * placeholders.
	 *
	 * If a pattern still contains a `${...}` after substitution (caller's context
	 * didn't carry the referenced field):
	 *   - `deny` effect: treat as matching so the deny still fires (fail-closed).
	 *     Without this, a deny like `actions: ['tenant:${user.scope}.disable']`
	 *     would silently miss when `user.scope` is absent, defeating the guard.
	 *   - `allow` effect: skip the pattern (fail-closed allow). The remaining
	 *     patterns must match by themselves; if none do, the statement won't apply.
	 */
	private matchAnyPattern(patterns: readonly string[], input: string, effect: 'allow' | 'deny'): boolean {
		const cleaned: string[] = []
		for (const p of patterns) {
			if (hasUnresolvedPlaceholder(p)) {
				if (effect === 'deny') {
					return true
				}
				continue
			}
			cleaned.push(p)
		}
		if (cleaned.length === 0) {
			return false
		}
		return globMatchAny(cleaned, input)
	}
}

/**
 * Stateless source — useful for plugin contributions or tests.
 */
export class StaticPolicySource implements PolicySource {
	constructor(public readonly name: string, private readonly statements: readonly Statement[]) {}

	getStatements(): readonly Statement[] {
		return this.statements
	}
}
