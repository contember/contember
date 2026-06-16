import { describe, expect, test } from 'bun:test'
import crypto from 'node:crypto'
import { ipPrefix, LoginRiskAnalyzer, PriorLogin, RiskWeight } from '../../../src/index.js'

const hash = (value: crypto.BinaryLike, algo: string) => crypto.createHash(algo).update(value).digest()
const analyzer = new LoginRiskAnalyzer(hash)

const policy = (overrides: Partial<{ enabled: boolean; historySize: number; emailThreshold: number; stepUpThreshold: number }> = {}) => ({
	enabled: true,
	historySize: 10,
	emailThreshold: 1,
	stepUpThreshold: 3,
	...overrides,
})

const prior = (overrides: Partial<PriorLogin> = {}): PriorLogin => ({
	geoCountry: 'CZ',
	deviceFingerprint: 'fp-known',
	ip: '10.0.0.5',
	...overrides,
})

describe('LoginRiskAnalyzer.fingerprint', () => {
	test('hashes the user-agent deterministically', () => {
		const ua = 'Mozilla/5.0 (X11; Linux x86_64)'
		expect(analyzer.fingerprint(ua)).toBe(crypto.createHash('sha256').update(ua).digest('hex'))
	})

	test('returns null for absent/empty UA', () => {
		expect(analyzer.fingerprint(undefined)).toBeNull()
		expect(analyzer.fingerprint(null)).toBeNull()
		expect(analyzer.fingerprint('')).toBeNull()
	})
})

describe('ipPrefix', () => {
	test('coarsens IPv4 to /24', () => {
		expect(ipPrefix('203.0.113.42')).toBe('203.0.113.0/24')
		// same /24, different host → same prefix → treated as known
		expect(ipPrefix('203.0.113.1')).toBe(ipPrefix('203.0.113.200'))
	})

	test('different /24 yields a different prefix', () => {
		expect(ipPrefix('203.0.113.1')).not.toBe(ipPrefix('203.0.99.1'))
	})

	test('coarsens IPv6 to /48', () => {
		expect(ipPrefix('2001:db8:abcd:1234::1')).toBe('2001:db8:abcd::/48')
	})

	test('IPv6 is canonicalized: case and leading zeros do not change the prefix', () => {
		// Same /48 written upper-case / with leading zeros must map to one key, or the
		// IP signal would falsely fire `new_ip_prefix` for a known network.
		expect(ipPrefix('2001:DB8:ABCD::1')).toBe('2001:db8:abcd::/48')
		expect(ipPrefix('2001:0db8:00ab::1')).toBe('2001:db8:ab::/48')
		expect(ipPrefix('2001:0db8:00ab::1')).toBe(ipPrefix('2001:db8:ab:0:0:0:0:5'))
	})

	test('IPv6 :: compression is expanded consistently', () => {
		// `2001:db8::1` and `2001:db8:0:0::5` are the same /48 → same key.
		expect(ipPrefix('2001:db8::1')).toBe('2001:db8:0::/48')
		expect(ipPrefix('2001:db8::1')).toBe(ipPrefix('2001:db8:0:0::5'))
		// ...but a different third hextet is a different /48 → not collapsed.
		expect(ipPrefix('2001:db8::1')).not.toBe(ipPrefix('2001:db8:1::1'))
	})

	test('unwraps IPv4-mapped IPv6', () => {
		expect(ipPrefix('::ffff:203.0.113.42')).toBe('203.0.113.0/24')
		// also the fully/partly expanded mapped form, not just the `::ffff:` shorthand.
		expect(ipPrefix('0:0:0:0:0:ffff:203.0.113.42')).toBe('203.0.113.0/24')
	})

	test('a non-mapped IPv6 ending in :ffff:<dotted-quad> stays a /48, not a bogus /24', () => {
		// The IPv4-mapped form requires the leading 80 bits to be zero. An address with
		// a non-zero prefix that merely ends in `:ffff:1.2.3.4` (or NAT64 `64:ff9b::`)
		// is a normal IPv6 address — it must coarsen to its /48, never collapse to the
		// embedded dotted-quad's /24 (which would both miss real network changes and
		// false-fire when the same /48 is written two ways).
		expect(ipPrefix('2001:db8::ffff:1.2.3.4')).toBe('2001:db8:0::/48')
		expect(ipPrefix('64:ff9b::ffff:1.2.3.4')).toBe('64:ff9b:0::/48')
		expect(ipPrefix('64:ff9b::1.2.3.4')).toBe('64:ff9b:0::/48')
		// ...and they must not collide with the genuine IPv4-mapped /24.
		expect(ipPrefix('2001:db8::ffff:1.2.3.4')).not.toBe(ipPrefix('::ffff:1.2.3.4'))
		// two different non-mapped /48s sharing a trailing dotted-quad stay distinct.
		expect(ipPrefix('2001:db8::ffff:1.2.3.4')).not.toBe(ipPrefix('2001:dba::ffff:1.2.3.4'))
	})

	test('falls back to the raw value for an unparseable IPv6', () => {
		// expandIpv6 rejects malformed input → ipPrefix returns a stable, lower-cased raw
		// string (never throws, never mints a bogus prefix), and two distinct junk values
		// do not collapse to one key.
		expect(ipPrefix('1::2::3')).toBe('1::2::3')
		expect(ipPrefix('2001:db8::g')).toBe('2001:db8::g')
		expect(ipPrefix('1::2::3')).not.toBe(ipPrefix('4::5::6'))
	})

	test('returns null for empty/null', () => {
		expect(ipPrefix(null)).toBeNull()
		expect(ipPrefix('')).toBeNull()
		expect(ipPrefix('   ')).toBeNull()
	})
})

describe('LoginRiskAnalyzer.score', () => {
	test('no history → no signals, allow (first login is trusted)', () => {
		const result = analyzer.score({ geoCountry: 'US', deviceFingerprint: 'fp-new', ip: '198.51.100.7' }, [], policy())
		expect(result).toEqual({ score: 0, action: 'allow', reasons: [] })
	})

	test('all signals match a prior login → score 0, allow', () => {
		const history = [prior()]
		const result = analyzer.score({ geoCountry: 'CZ', deviceFingerprint: 'fp-known', ip: '10.0.0.99' }, history, policy())
		expect(result.score).toBe(0)
		expect(result.action).toBe('allow')
		expect(result.reasons).toEqual([])
	})

	test('new country alone is high → step-up at default thresholds', () => {
		const history = [prior()]
		const result = analyzer.score({ geoCountry: 'US', deviceFingerprint: 'fp-known', ip: '10.0.0.5' }, history, policy())
		expect(result.score).toBe(RiskWeight.newCountry)
		expect(result.reasons).toEqual(['new_country'])
		expect(result.action).toBe('stepUp')
	})

	test('new device alone is medium → email (below step-up threshold)', () => {
		const history = [prior()]
		const result = analyzer.score({ geoCountry: 'CZ', deviceFingerprint: 'fp-new', ip: '10.0.0.5' }, history, policy())
		expect(result.score).toBe(RiskWeight.newDevice)
		expect(result.reasons).toEqual(['new_device'])
		expect(result.action).toBe('email')
	})

	test('new IP prefix alone is low → email', () => {
		const history = [prior({ ip: '10.0.0.5' })]
		const result = analyzer.score({ geoCountry: 'CZ', deviceFingerprint: 'fp-known', ip: '203.0.113.9' }, history, policy())
		expect(result.score).toBe(RiskWeight.newIpPrefix)
		expect(result.reasons).toEqual(['new_ip_prefix'])
		expect(result.action).toBe('email')
	})

	test('signals are cumulative across signals', () => {
		const history = [prior()]
		const result = analyzer.score({ geoCountry: 'US', deviceFingerprint: 'fp-new', ip: '203.0.113.9' }, history, policy())
		expect(result.score).toBe(RiskWeight.newCountry + RiskWeight.newDevice + RiskWeight.newIpPrefix)
		expect(result.reasons).toEqual(['new_country', 'new_device', 'new_ip_prefix'])
		expect(result.action).toBe('stepUp')
	})

	test('a signal with no baseline in history does not fire (cold start)', () => {
		// History exists, but no prior login ever recorded a country or a device
		// fingerprint (those columns were null before the feature/geo header was
		// turned on). With nothing to deviate from, neither signal may fire —
		// otherwise enabling the feature would step-up every returning user's first
		// login. Only the IP signal has a baseline here, and it matches → allow.
		const history: PriorLogin[] = [
			{ geoCountry: null, deviceFingerprint: null, ip: '10.0.0.5' },
			{ geoCountry: null, deviceFingerprint: null, ip: '10.0.0.6' },
		]
		const result = analyzer.score({ geoCountry: 'US', deviceFingerprint: 'fp-new', ip: '10.0.0.9' }, history, policy())
		expect(result.reasons).toEqual([])
		expect(result.score).toBe(0)
		expect(result.action).toBe('allow')
	})

	test('a signal fires once a baseline for it exists, even when other rows are null', () => {
		// One prior login carries a country; the rest are null. A different current
		// country is now genuinely new because there is a baseline to deviate from.
		const history: PriorLogin[] = [
			{ geoCountry: null, deviceFingerprint: 'fp-known', ip: '10.0.0.5' },
			{ geoCountry: 'CZ', deviceFingerprint: null, ip: '10.0.0.6' },
		]
		const result = analyzer.score({ geoCountry: 'US', deviceFingerprint: 'fp-known', ip: '10.0.0.5' }, history, policy())
		expect(result.reasons).toEqual(['new_country'])
		expect(result.score).toBe(RiskWeight.newCountry)
	})

	test('a value known from ANY prior login does not fire', () => {
		// country only ever seen on login A, device only on login B → both known.
		const history = [
			prior({ geoCountry: 'DE', deviceFingerprint: 'fp-a', ip: '10.1.0.1' }),
			prior({ geoCountry: 'CZ', deviceFingerprint: 'fp-b', ip: '10.2.0.1' }),
		]
		const result = analyzer.score({ geoCountry: 'CZ', deviceFingerprint: 'fp-a', ip: '10.3.0.1' }, history, policy())
		expect(result.reasons).toEqual(['new_ip_prefix'])
	})

	test('absent current country never fires the country signal', () => {
		const history = [prior({ geoCountry: 'CZ' })]
		const result = analyzer.score({ geoCountry: null, deviceFingerprint: 'fp-known', ip: '10.0.0.5' }, history, policy())
		expect(result.reasons).not.toContain('new_country')
		expect(result.score).toBe(0)
	})

	test('thresholds are honored: a higher email threshold suppresses the email action', () => {
		const history = [prior()]
		// new device = 2; with emailThreshold 3, that is below → allow.
		const result = analyzer.score(
			{ geoCountry: 'CZ', deviceFingerprint: 'fp-new', ip: '10.0.0.5' },
			history,
			policy({ emailThreshold: 3, stepUpThreshold: 5 }),
		)
		expect(result.score).toBe(2)
		expect(result.action).toBe('allow')
	})
})
