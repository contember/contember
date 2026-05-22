/**
 * Glob matcher used for actions and resources.
 *
 * Wildcards (AWS-IAM style):
 *   `*`  — any sequence of characters (including `:`, `/`, etc.)
 *   `?`  — exactly one character
 *
 * The pattern is anchored — must match the full input.
 *
 * For finer-grained matching, use multiple patterns or conditions rather than
 * trying to express it in the glob itself.
 *
 * Examples:
 *   `tenant:project.*`   matches `tenant:project.create`
 *   `tenant:*`           matches `tenant:project.create` (greedy)
 *   `*`                  matches anything
 *   `project:webmaster`  exact
 */
/**
 * LRU cap for compiled glob regexes. Pattern strings can flow through
 * `substituteString` and carry user-controlled context values (e.g.
 * `project:${identity.team}` → `project:eng`), so an unbounded cache would
 * leak memory under high-cardinality contexts. The Map's insertion order is
 * used as the LRU policy.
 */
const CACHE_LIMIT = 1024
const cache = new Map<string, RegExp>()

export function globToRegExp(pattern: string): RegExp {
	const cached = cache.get(pattern)
	if (cached) {
		cache.delete(pattern)
		cache.set(pattern, cached)
		return cached
	}
	let out = '^'
	for (let i = 0; i < pattern.length; i++) {
		const c = pattern[i]
		if (c === '*') {
			// Collapse a run of consecutive `*` into a single `.*`. Emitting one
			// `.*` per star (`.*.*.*…`) makes the regex catastrophically backtrack
			// on long non-matching inputs — and patterns can come from
			// user-authored policies, so an actor could stall authorization with
			// `actions: ['**********x']`. Collapsing keeps the pattern linear.
			if (pattern[i - 1] === '*') {
				continue
			}
			out += '.*'
		} else if (c === '?') {
			out += '.'
		} else if ('.+^$()|{}[]\\'.includes(c)) {
			out += '\\' + c
		} else {
			out += c
		}
	}
	out += '$'
	const re = new RegExp(out)
	if (cache.size >= CACHE_LIMIT) {
		const oldest = cache.keys().next().value
		if (oldest !== undefined) {
			cache.delete(oldest)
		}
	}
	cache.set(pattern, re)
	return re
}

export function globMatch(pattern: string, input: string): boolean {
	return globToRegExp(pattern).test(input)
}

export function globMatchAny(patterns: readonly string[], input: string): boolean {
	for (const pattern of patterns) {
		if (globMatch(pattern, input)) {
			return true
		}
	}
	return false
}
