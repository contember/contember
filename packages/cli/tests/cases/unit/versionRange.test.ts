import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { satisfiesVersionRange } from '../../../src/lib/versionRange.js'

interface Corpus {
	readonly versions: readonly string[]
	readonly supported: readonly string[]
	readonly unsupported: readonly string[]
	readonly ranges: readonly string[]
	/** One string per range, one character per version: semver's answer, `1` or `0`. */
	readonly expected: readonly string[]
}

// Recorded from node-semver `satisfies` (default options), see `generatedWith` in the fixture.
const corpus: Corpus = JSON.parse(readFileSync(new URL('./fixtures/semverCorpus.json', import.meta.url), 'utf8'))

describe('satisfiesVersionRange', () => {
	test('agrees with semver wherever it gives an answer', () => {
		const mismatches: string[] = []
		corpus.ranges.forEach((range, rangeIndex) => {
			corpus.versions.forEach((version, versionIndex) => {
				const ours = satisfiesVersionRange(version, range)
				const theirs = corpus.expected[rangeIndex][versionIndex] === '1'
				if (ours !== undefined && ours !== theirs) {
					mismatches.push(`${JSON.stringify(range)} on ${version}: ours ${ours}, semver ${theirs}`)
				}
			})
		})
		expect(mismatches).toEqual([])
	})

	test('answers every supported range form for every valid version', () => {
		// The installed version comes from a package.json, so a `v` prefix or a partial version is not interpreted.
		const validVersions = corpus.versions.filter(version => !['v2.1.0', '2.1', 'latest', '01.2.3'].includes(version))
		const unanswered = corpus.supported.flatMap(range =>
			validVersions.filter(version => satisfiesVersionRange(version, range) === undefined).map(version => `${range} on ${version}`)
		)
		expect(unanswered).toEqual([])
	})

	test('does not interpret tags, protocols, aliases or malformed ranges', () => {
		const answered = corpus.unsupported.filter(range => satisfiesVersionRange('2.1.0', range) !== undefined)
		expect(answered).toEqual([])
	})

	test('does not interpret an invalid installed version', () => {
		expect(satisfiesVersionRange('2.1', '^2.1.0')).toBeUndefined()
		expect(satisfiesVersionRange('latest', '*')).toBeUndefined()
		expect(satisfiesVersionRange('2.1.0-' + 'a'.repeat(260), '>=2.1.0-a')).toBeUndefined()
	})

	test('excludes prereleases unless the range names one with the same version', () => {
		expect(satisfiesVersionRange('2.2.0-alpha.1', '^2.1.0')).toBe(false)
		expect(satisfiesVersionRange('2.1.0-alpha.16', '^2.1.0-alpha.15')).toBe(true)
		expect(satisfiesVersionRange('2.1.0-alpha.16', '*')).toBe(false)
	})
})
