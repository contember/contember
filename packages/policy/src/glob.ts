/**
 * Glob matcher used for actions and resources.
 *
 * Wildcards (AWS-IAM style):
 *   `*`  — any sequence of characters (including `:`, `/`, newlines, etc.)
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
 * Linear, backtracking-free glob matcher (greedy two-pointer with a single
 * star-rollback). Worst case is O(pattern × input); there is no recursion and
 * no compiled regex, so it cannot be driven into catastrophic backtracking.
 *
 * This matters because patterns can come from user-authored policies and flow
 * through `substituteString` carrying user-controlled context values. The
 * previous implementation compiled each pattern to an anchored `RegExp`, which
 * is exponential on inputs like `*?*?*?…` (a chain of `.*` separated by single
 * `.`): an actor whose grantable surface includes a `*` could author such a
 * pattern and stall every authorization check it is evaluated against — a DoS
 * on the authz layer. A direct matcher removes that surface entirely (and the
 * regex cache it required along with it).
 *
 * Algorithm: walk both strings. On a literal/`?` match, advance both. On a `*`,
 * remember its position and the input cursor, then try to consume zero input;
 * if a later mismatch occurs, roll back to that `*` and let it consume one more
 * input character. Trailing `*`s in the pattern match the empty string.
 */
export function globMatch(pattern: string, input: string): boolean {
	let p = 0
	let s = 0
	let starPattern = -1
	let starInput = 0
	while (s < input.length) {
		if (p < pattern.length && (pattern[p] === '?' || pattern[p] === input[s])) {
			p++
			s++
		} else if (p < pattern.length && pattern[p] === '*') {
			// Record the rollback point and let the star match zero chars for now.
			starPattern = p
			starInput = s
			p++
		} else if (starPattern !== -1) {
			// Mismatch after a star: the star must absorb one more input char.
			p = starPattern + 1
			starInput++
			s = starInput
		} else {
			return false
		}
	}
	// Input consumed — the rest of the pattern matches only if it is all `*`.
	while (p < pattern.length && pattern[p] === '*') {
		p++
	}
	return p === pattern.length
}

export function globMatchAny(patterns: readonly string[], input: string): boolean {
	for (const pattern of patterns) {
		if (globMatch(pattern, input)) {
			return true
		}
	}
	return false
}
