import { BinaryLike } from 'node:crypto'
import { DatabaseContext } from '../utils/index.js'
import { Operator, SelectBuilder } from '@contember/database'
import { Config } from '../type/Config.js'

/**
 * Risk weights per signal (A03 v1). Cumulative: a login from a new country on a
 * new device scores HIGH + MEDIUM. Chosen so that the shipped default thresholds
 * (email >= 1, step-up >= 3) map intuitively to "any single low signal emails,
 * a high signal steps up".
 */
export const RiskWeight = {
	/** New country (from the trusted reverse-proxy geo header). */
	newCountry: 3,
	/** New user-agent fingerprint. */
	newDevice: 2,
	/** New IP / IP-prefix. */
	newIpPrefix: 1,
} as const

export type RiskAction = 'allow' | 'email' | 'stepUp'

/**
 * Auth-log `type` values that represent a successful *interactive* sign-in which
 * issued a session for the person from their own client — i.e. the rows whose
 * geo/device/IP form the baseline for the next sign-in's anomaly check. Password
 * (`login`), federated (`idp_login`), and magic-link (`passwordless_login`) all
 * qualify. Deliberately excluded: `passwordless_login_exchange` (the OTP
 * activation step issues no session) and `create_session_token` (an admin minting
 * a token carries the admin's client info, not the person's).
 */
export const BASELINE_SIGN_IN_TYPES = ['login', 'idp_login', 'passwordless_login'] as const

export interface LoginSignals {
	/** Country code from the trusted geo header, or null when unavailable. */
	readonly geoCountry: string | null
	/** Hash of the client user-agent, or null when no UA was provided. */
	readonly deviceFingerprint: string | null
	/** Client IP, or null when unavailable. */
	readonly ip: string | null
}

export interface PriorLogin {
	readonly geoCountry: string | null
	readonly deviceFingerprint: string | null
	readonly ip: string | null
}

export interface RiskAssessment {
	readonly score: number
	readonly action: RiskAction
	/** Greppable list of which signals fired, e.g. ['new_country', 'new_device']. */
	readonly reasons: readonly string[]
}

/**
 * A03 — sign-in anomaly detection (v1). Runs after password verification (and any
 * standing MFA), before a session is issued. Pure scoring lives in {@link score};
 * {@link analyze} loads the comparison history and applies the configured policy.
 *
 * v1 scope (locked): no GeoIP DB — country comes from a trusted reverse-proxy
 * header read through the same trust gate as the forwarded IP/UA. No
 * impossible-travel detection. Opt-in, disabled by default.
 */
export class LoginRiskAnalyzer {
	constructor(
		private readonly hash: (value: BinaryLike, algo: string) => Buffer,
	) {}

	/**
	 * Deterministic user-agent fingerprint: a hex sha256 of the raw UA. We never
	 * store the raw UA in a second column nor any cross-site fingerprint — just a
	 * stable hash so "same browser" comparisons work without retaining the string.
	 * Returns null for an absent/empty UA.
	 */
	fingerprint(userAgent: string | undefined | null): string | null {
		if (!userAgent) {
			return null
		}
		return this.hash(userAgent, 'sha256').toString('hex')
	}

	/**
	 * Pure scoring. Compares the current sign-in's signals against the set of prior
	 * successful logins. A signal fires only when (a) the current value is known,
	 * (b) a baseline for *that* signal exists in history — at least one prior login
	 * recorded a non-null value for it — and (c) the current value is absent from
	 * that baseline. With no history at all, or no baseline yet for a given signal
	 * (e.g. the geo header or device fingerprint only started being collected when
	 * the feature was enabled, so every prior row is null for it), that signal is
	 * treated as known. This keeps the documented "no baseline to deviate from →
	 * trusted" rule true per signal, so turning the feature on does not score every
	 * returning user's first login as anomalous.
	 */
	score(current: LoginSignals, history: readonly PriorLogin[], config: Config['login']['anomalyDetection']): RiskAssessment {
		const reasons: string[] = []
		let total = 0

		if (history.length === 0) {
			return { score: 0, action: 'allow', reasons }
		}

		if (current.geoCountry !== null) {
			const baseline = history.filter(h => h.geoCountry !== null)
			if (baseline.length > 0 && !baseline.some(h => h.geoCountry === current.geoCountry)) {
				total += RiskWeight.newCountry
				reasons.push('new_country')
			}
		}

		const currentFingerprint = current.deviceFingerprint
		if (currentFingerprint !== null) {
			const baseline = history.filter(h => h.deviceFingerprint !== null)
			if (baseline.length > 0 && !baseline.some(h => h.deviceFingerprint === currentFingerprint)) {
				total += RiskWeight.newDevice
				reasons.push('new_device')
			}
		}

		const currentPrefix = ipPrefix(current.ip)
		if (currentPrefix !== null) {
			const baselinePrefixes = history.map(h => ipPrefix(h.ip)).filter((p): p is string => p !== null)
			if (baselinePrefixes.length > 0 && !baselinePrefixes.includes(currentPrefix)) {
				total += RiskWeight.newIpPrefix
				reasons.push('new_ip_prefix')
			}
		}

		return { score: total, action: this.decide(total, config), reasons }
	}

	private decide(total: number, config: Config['login']['anomalyDetection']): RiskAction {
		// step-up wins over email when both thresholds are crossed. A threshold of 0
		// would always fire, so it is only meaningful when the feature is enabled.
		if (total >= config.stepUpThreshold) {
			return 'stepUp'
		}
		if (total >= config.emailThreshold) {
			return 'email'
		}
		return 'allow'
	}

	/**
	 * Loads the last N successful logins for the person and scores the current
	 * sign-in against them. Returns `allow` with no DB work when the feature is
	 * disabled (the default), so an opted-out deployment runs exactly as before.
	 */
	async analyze(
		dbContext: DatabaseContext,
		personId: string,
		current: LoginSignals,
		config: Config['login']['anomalyDetection'],
	): Promise<RiskAssessment> {
		if (!config.enabled) {
			return { score: 0, action: 'allow', reasons: [] }
		}

		const limit = Math.max(1, config.historySize)
		const rows = await SelectBuilder.create<{ geo_country: string | null; device_fingerprint: string | null; ip_address: string | null }>()
			.select(['person_auth_log', 'geo_country'])
			.select(['person_auth_log', 'device_fingerprint'])
			.select(['person_auth_log', 'ip_address'])
			.from('person_auth_log')
			.where(it =>
				it
					.compare(['person_auth_log', 'person_id'], Operator.eq, personId)
					// Baseline = any successful interactive sign-in that issued a session
					// (password / IdP / passwordless), not just password logins — otherwise
					// a person who normally signs in via IdP/passwordless has no baseline and
					// their rare password sign-in is wrongly treated as a trusted first login.
					.in(['person_auth_log', 'type'], [...BASELINE_SIGN_IN_TYPES])
					.compare(['person_auth_log', 'success'], Operator.eq, true)
			)
			.orderBy(['person_auth_log', 'created_at'], 'desc')
			.limit(limit)
			.getResult(dbContext.client)

		const history: PriorLogin[] = rows.map(row => ({
			geoCountry: row.geo_country,
			deviceFingerprint: row.device_fingerprint,
			ip: row.ip_address,
		}))

		return this.score(current, history, config)
	}
}

/**
 * Coarsens an IP to a prefix so a roaming client on the same network is treated
 * as "known": /24 for IPv4, /48 for IPv6 (the typical site-allocation boundary).
 * Returns null for an absent or unparseable address. Intentionally string-based
 * to avoid pulling a parser onto the sign-in hot path, but the IPv6 form is fully
 * canonicalized (lower-cased, leading zeros stripped, `::` expanded) so the same
 * /48 written two different ways compares equal against stored values.
 */
export const ipPrefix = (ip: string | null): string | null => {
	if (!ip) {
		return null
	}
	const trimmed = ip.trim().toLowerCase()
	if (trimmed.length === 0) {
		return null
	}
	// IPv4-mapped IPv6 (::ffff:a.b.c.d, in any compressed/expanded form) → the
	// embedded IPv4. Matches `::ffff:1.2.3.4` and `0:0:0:0:0:ffff:1.2.3.4` alike.
	const mapped = /:ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(trimmed)
	const value = mapped ? mapped[1] : trimmed
	if (value.includes('.') && !value.includes(':')) {
		const octets = value.split('.')
		if (octets.length === 4) {
			return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`
		}
		return value
	}
	if (value.includes(':')) {
		const hextets = expandIpv6(value)
		if (hextets === null || hextets.length < 3) {
			return value
		}
		// Canonical /48 = the first three hextets, each with leading zeros stripped.
		const network = hextets.slice(0, 3).map(h => parseInt(h, 16).toString(16))
		return `${network.join(':')}::/48`
	}
	return value
}

/**
 * Expands an IPv6 address to its 8 hextets (as lower-case hex strings, leading
 * zeros kept — the caller strips them). Handles a single `::` run. Returns null
 * for anything that does not look like a valid IPv6 address so the caller can
 * fall back to a raw compare rather than mint a bogus prefix.
 */
const expandIpv6 = (value: string): string[] | null => {
	const parts = value.split('::')
	if (parts.length > 2) {
		return null
	}
	const head = parts[0] === '' ? [] : parts[0].split(':')
	const tail = parts.length === 2 ? (parts[1] === '' ? [] : parts[1].split(':')) : []
	const groups = parts.length === 2
		? [...head, ...Array(Math.max(0, 8 - head.length - tail.length)).fill('0'), ...tail]
		: head
	if (parts.length === 2 ? groups.length > 8 : groups.length !== 8) {
		return null
	}
	if (groups.some(g => !/^[0-9a-f]{1,4}$/.test(g))) {
		return null
	}
	return groups
}
