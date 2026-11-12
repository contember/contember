/**
 * A subset of npm semver range matching (node-semver `satisfies` with default options), used by the CLI
 * version check. Supported: exact versions, `=`, `<`, `<=`, `>`, `>=`, `~`, `^`, x-ranges (`x`, `X`, `*`,
 * partial versions), hyphen ranges and `||`. Anything else is not parsed and yields `undefined`, so the
 * caller can skip the check instead of guessing.
 */

interface Version {
	readonly major: number
	readonly minor: number
	readonly patch: number
	readonly prerelease: readonly (string | number)[]
}

type Operator = '<' | '<=' | '>' | '>=' | '='

interface Comparator {
	readonly operator: Operator
	readonly version: Version
}

/** `null` stands for the "any version" comparator. */
type ComparatorSet = readonly (Comparator | null)[]

interface PartialVersion {
	readonly major: number | undefined
	readonly minor: number | undefined
	readonly patch: number | undefined
	readonly prerelease: readonly (string | number)[]
}

const numericPart = '0|[1-9]\\d*'
const prereleasePart = `(?:${numericPart}|\\d*[a-zA-Z-][a-zA-Z0-9-]*)`
const prereleaseSuffix = `(?:-(${prereleasePart}(?:\\.${prereleasePart})*))?`
const buildSuffix = '(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?'
const versionPattern = new RegExp(`^(${numericPart})\\.(${numericPart})\\.(${numericPart})${prereleaseSuffix}${buildSuffix}$`)
const xPart = `${numericPart}|[xX*]`
const partialPattern = new RegExp(`^(${xPart})(?:\\.(${xPart})(?:\\.(${xPart})${prereleaseSuffix}${buildSuffix})?)?$`)
const comparatorPattern = /^(\^|~>?|<=?|>=?|=)?(.*)$/

// semver throws on a bound above MAX_SAFE_INTEGER (e.g. `^MAX` → `<MAX+1`) and answers false; we skip instead.
const isInRange = (value: number): boolean => Number.isSafeInteger(value) && value < Number.MAX_SAFE_INTEGER

// semver rejects longer version strings and answers false; we skip instead.
const maxLength = 256

const parsePrerelease = (value: string | undefined): (string | number)[] =>
	value === undefined ? [] : value.split('.').map(part => (/^\d+$/.test(part) ? Number(part) : part))

const parseVersion = (value: string): Version | undefined => {
	const match = versionPattern.exec(value)
	if (!match) {
		return undefined
	}
	const [major, minor, patch] = [Number(match[1]), Number(match[2]), Number(match[3])]
	if (![major, minor, patch].every(isInRange)) {
		return undefined
	}
	return { major, minor, patch, prerelease: parsePrerelease(match[4]) }
}

const parseXPart = (value: string | undefined): number | undefined | null => {
	if (value === undefined || value === 'x' || value === 'X' || value === '*') {
		return undefined
	}
	const number = Number(value)
	return isInRange(number) ? number : null
}

const parsePartial = (value: string): PartialVersion | undefined => {
	const match = partialPattern.exec(value)
	if (!match) {
		return undefined
	}
	const major = parseXPart(match[1])
	const minor = parseXPart(match[2])
	const patch = parseXPart(match[3])
	if (major === null || minor === null || patch === null) {
		return undefined
	}
	const prerelease = parsePrerelease(match[4])
	// A wildcard after a number-free part (`x.1`) or a prerelease on a wildcard is not something we interpret.
	if ((major === undefined && (minor !== undefined || patch !== undefined)) || (minor === undefined && patch !== undefined)) {
		return undefined
	}
	if (prerelease.length > 0 && patch === undefined) {
		return undefined
	}
	return { major, minor, patch, prerelease }
}

const version = (major: number, minor: number, patch: number, prerelease: readonly (string | number)[] = []): Version => ({
	major,
	minor,
	patch,
	prerelease,
})

const comparator = (operator: Operator, value: Version): Comparator => ({ operator, version: value })

/** Upper bounds use a `-0` prerelease, so that prereleases of the next version stay excluded. */
const below = (major: number, minor: number, patch: number): Comparator => comparator('<', version(major, minor, patch, [0]))

const desugarTilde = ({ major, minor, patch, prerelease }: PartialVersion): ComparatorSet => {
	if (major === undefined) {
		return [null]
	}
	if (minor === undefined) {
		return [comparator('>=', version(major, 0, 0)), below(major + 1, 0, 0)]
	}
	return [comparator('>=', version(major, minor, patch ?? 0, prerelease)), below(major, minor + 1, 0)]
}

const desugarCaret = ({ major, minor, patch, prerelease }: PartialVersion): ComparatorSet => {
	if (major === undefined) {
		return [null]
	}
	if (minor === undefined) {
		return [comparator('>=', version(major, 0, 0)), below(major + 1, 0, 0)]
	}
	if (patch === undefined) {
		return [comparator('>=', version(major, minor, 0)), major === 0 ? below(major, minor + 1, 0) : below(major + 1, 0, 0)]
	}
	const lower = comparator('>=', version(major, minor, patch, prerelease))
	if (major !== 0) {
		return [lower, below(major + 1, 0, 0)]
	}
	return [lower, minor === 0 ? below(major, minor, patch + 1) : below(major, minor + 1, 0)]
}

const desugarPrimitive = (operator: Operator | undefined, partial: PartialVersion): ComparatorSet => {
	const { major, minor, patch, prerelease } = partial
	if (major !== undefined && minor !== undefined && patch !== undefined) {
		return [comparator(operator ?? '=', version(major, minor, patch, prerelease))]
	}
	if (major === undefined) {
		return operator === '<' || operator === '>' ? [below(0, 0, 0)] : [null]
	}
	if (operator === undefined || operator === '=') {
		return minor === undefined
			? [comparator('>=', version(major, 0, 0)), below(major + 1, 0, 0)]
			: [comparator('>=', version(major, minor, 0)), below(major, minor + 1, 0)]
	}
	const next = minor === undefined ? version(major + 1, 0, 0) : version(major, minor + 1, 0)
	const floor = version(major, minor ?? 0, 0)
	switch (operator) {
		case '>':
			return [comparator('>=', next)]
		case '>=':
			return [comparator('>=', floor)]
		case '<':
			return [comparator('<', version(floor.major, floor.minor, 0, [0]))]
		case '<=':
			return [comparator('<', version(next.major, next.minor, next.patch, [0]))]
	}
}

const desugarHyphen = (from: PartialVersion, to: PartialVersion): ComparatorSet => {
	const lower: Comparator | null = from.major === undefined
		? null
		: comparator('>=', version(from.major, from.minor ?? 0, from.patch ?? 0, from.prerelease))
	let upper: Comparator | null
	if (to.major === undefined) {
		upper = null
	} else if (to.minor === undefined) {
		upper = below(to.major + 1, 0, 0)
	} else if (to.patch === undefined) {
		upper = below(to.major, to.minor + 1, 0)
	} else {
		upper = comparator('<=', version(to.major, to.minor, to.patch, to.prerelease))
	}
	return [lower, upper]
}

const parseComparator = (token: string): ComparatorSet | undefined => {
	const match = comparatorPattern.exec(token)
	if (!match) {
		return undefined
	}
	const [, operator, rest] = match
	const hasV = rest.startsWith('v')
	const partial = parsePartial(hasV ? rest.slice(1) : rest)
	if (!partial) {
		return undefined
	}
	// semver turns only a literal `>=0.0.0` into "any"; `>=v0.0.0` stays a plain comparator there.
	if (hasV && operator === '>=' && partial.major === 0 && partial.minor === 0 && partial.patch === 0 && partial.prerelease.length === 0) {
		return undefined
	}
	if (operator === '^') {
		return desugarCaret(partial)
	}
	if (operator === '~' || operator === '~>') {
		return desugarTilde(partial)
	}
	if (operator === '<' || operator === '<=' || operator === '>' || operator === '>=' || operator === '=' || operator === undefined) {
		return desugarPrimitive(operator, partial)
	}
	return undefined
}

const isNullComparator = (it: Comparator | null): boolean =>
	it !== null && it.operator === '<' && it.version.major === 0 && it.version.minor === 0 && it.version.patch === 0
	&& it.version.prerelease.length === 1 && it.version.prerelease[0] === 0

const isGreaterOrEqualZero = (it: Comparator): boolean =>
	it.operator === '>=' && it.version.major === 0 && it.version.minor === 0 && it.version.patch === 0 && it.version.prerelease.length === 0

const comparatorKey = (it: Comparator | null): string =>
	it === null ? '' : `${it.operator}${it.version.major}.${it.version.minor}.${it.version.patch}-${it.version.prerelease.join('.')}`

/** Mirrors node-semver's set normalisation: `>=0.0.0` is "any", "nothing" wins, duplicates and redundant "any" go. */
const normalizeSet = (set: ComparatorSet): ComparatorSet => {
	const nullComparator = set.find(isNullComparator)
	if (nullComparator) {
		return [nullComparator]
	}
	const unique = new Map<string, Comparator | null>()
	for (const it of set) {
		const normalized = it !== null && isGreaterOrEqualZero(it) ? null : it
		unique.set(comparatorKey(normalized), normalized)
	}
	if (unique.size > 1) {
		unique.delete('')
	}
	return [...unique.values()]
}

/** Mirrors node-semver's range normalisation: "nothing" sets drop out, and a bare "any" set replaces all others. */
const normalizeSets = (sets: readonly ComparatorSet[]): readonly ComparatorSet[] => {
	if (sets.length <= 1) {
		return sets
	}
	const meaningful = sets.filter(set => !isNullComparator(set[0] ?? null))
	if (meaningful.length === 0) {
		return [sets[0]]
	}
	const any = meaningful.find(set => set.length === 1 && set[0] === null)
	return any ? [any] : meaningful
}

const parseSet = (value: string): ComparatorSet | undefined => {
	const trimmed = value.trim()
	if (trimmed === '') {
		return [null]
	}
	const hyphen = /^(\S+)\s+-\s+(\S+)$/.exec(trimmed)
	if (hyphen) {
		const from = parsePartial(hyphen[1])
		const to = parsePartial(hyphen[2])
		return from && to ? desugarHyphen(from, to) : undefined
	}
	const result: (Comparator | null)[] = []
	for (const token of trimmed.split(/\s+/)) {
		const parsed = parseComparator(token)
		if (!parsed) {
			return undefined
		}
		result.push(...parsed)
	}
	return result
}

const compareIdentifiers = (a: string | number, b: string | number): number => {
	if (typeof a === 'number' && typeof b === 'number') {
		return a - b
	}
	if (typeof a === 'number') {
		return -1
	}
	if (typeof b === 'number') {
		return 1
	}
	return a < b ? -1 : a > b ? 1 : 0
}

const compareVersions = (a: Version, b: Version): number => {
	const main = a.major - b.major || a.minor - b.minor || a.patch - b.patch
	if (main !== 0) {
		return main
	}
	if (a.prerelease.length === 0 || b.prerelease.length === 0) {
		return b.prerelease.length - a.prerelease.length
	}
	for (let i = 0; i < Math.max(a.prerelease.length, b.prerelease.length); i++) {
		const left = a.prerelease[i]
		const right = b.prerelease[i]
		if (left === undefined || right === undefined) {
			return left === undefined ? -1 : 1
		}
		const result = compareIdentifiers(left, right)
		if (result !== 0) {
			return result
		}
	}
	return 0
}

const testComparator = (value: Version, { operator, version: bound }: Comparator): boolean => {
	const result = compareVersions(value, bound)
	switch (operator) {
		case '<':
			return result < 0
		case '<=':
			return result <= 0
		case '>':
			return result > 0
		case '>=':
			return result >= 0
		case '=':
			return result === 0
	}
}

const testSet = (value: Version, set: ComparatorSet): boolean => {
	if (!set.every(it => it === null || testComparator(value, it))) {
		return false
	}
	if (value.prerelease.length === 0) {
		return true
	}
	// A prerelease only matches when the range names a prerelease of the same major.minor.patch.
	return set.some(it =>
		it !== null && it.version.prerelease.length > 0 && it.version.major === value.major && it.version.minor === value.minor
		&& it.version.patch === value.patch
	)
}

/** Whether `installed` satisfies `range` as npm semver decides it, or `undefined` when either one is not understood. */
export const satisfiesVersionRange = (installed: string, range: string): boolean | undefined => {
	if (installed.length > maxLength || range.length > maxLength) {
		return undefined
	}
	const parsedVersion = parseVersion(installed.trim())
	if (!parsedVersion) {
		return undefined
	}
	const sets: ComparatorSet[] = []
	for (const part of range.split('||')) {
		const set = parseSet(part)
		if (!set) {
			return undefined
		}
		sets.push(normalizeSet(set))
	}
	return normalizeSets(sets).some(set => testSet(parsedVersion, set))
}
