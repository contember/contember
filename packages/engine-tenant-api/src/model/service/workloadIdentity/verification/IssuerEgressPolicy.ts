import { BlockList, isIP, isIPv4 } from 'node:net'
import { WorkloadIdentity } from '../../../type/index.js'

// IPv4 special-purpose ranges (IANA): unspecified, private, CGNAT, loopback, link-local, protocol assignments,
// documentation, 6to4 relay, benchmarking, multicast, reserved and broadcast.
const SPECIAL_PURPOSE_IPV4: readonly [string, number][] = [
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['172.16.0.0', 12],
	['192.0.0.0', 24],
	['192.0.2.0', 24],
	['192.88.99.0', 24],
	['192.168.0.0', 16],
	['198.18.0.0', 15],
	['198.51.100.0', 24],
	['203.0.113.0', 24],
	['224.0.0.0', 4],
	['240.0.0.0', 4],
]

// Only global unicast (2000::/3) is reachable; within it, protocol assignments (incl. Teredo), documentation and
// 6to4 (which embeds an arbitrary IPv4 address) are refused too. Everything outside 2000::/3 — unspecified, loopback,
// IPv4-mapped, NAT64, unique-local, link-local, multicast — never passes.
const GLOBAL_UNICAST_IPV6: readonly [string, number] = ['2000::', 3]
const SPECIAL_PURPOSE_IPV6: readonly [string, number][] = [
	['2001::', 23],
	['2001:db8::', 32],
	['2002::', 16],
	['3fff::', 20],
]

const normalizeHost = (host: string): string => host.toLowerCase().replace(/^\[(.*)]$/, '$1').replace(/\.$/, '')

const ipFamily = (address: string): 'ipv4' | 'ipv6' | null => {
	const version = isIP(address)
	return version === 4 ? 'ipv4' : version === 6 ? 'ipv6' : null
}

export class IssuerEgressError extends Error {}

/**
 * The §10.4 / §16 egress rules for issuer fetches: `https://` only, no special-purpose addresses, with the
 * instance-level exceptions. Checked per connection (on the resolved address), so DNS rebinding cannot bypass it.
 */
export class IssuerEgressPolicy {
	private readonly specialPurpose = new BlockList()
	private readonly globalUnicastIpv6 = new BlockList()
	private readonly allowedNetworks = new BlockList()
	private readonly allowedHosts: ReadonlySet<string>
	private readonly insecureHosts: ReadonlySet<string>

	constructor(config: Pick<WorkloadIdentity.InstanceConfig, 'egressAllowlist' | 'insecureIssuers'>) {
		for (const [network, prefix] of SPECIAL_PURPOSE_IPV4) {
			this.specialPurpose.addSubnet(network, prefix, 'ipv4')
		}
		for (const [network, prefix] of SPECIAL_PURPOSE_IPV6) {
			this.specialPurpose.addSubnet(network, prefix, 'ipv6')
		}
		this.globalUnicastIpv6.addSubnet(GLOBAL_UNICAST_IPV6[0], GLOBAL_UNICAST_IPV6[1], 'ipv6')

		const allowedHosts = new Set<string>()
		for (const entry of config.egressAllowlist) {
			const [network, prefixText, ...rest] = entry.trim().split('/')
			const family = ipFamily(network)
			if (family === null) {
				if (prefixText !== undefined || network === '') {
					throw new IssuerEgressError(`Invalid workload identity egress allowlist entry ${entry}`)
				}
				allowedHosts.add(normalizeHost(network))
				continue
			}
			const maxPrefix = family === 'ipv4' ? 32 : 128
			if (rest.length > 0 || (prefixText !== undefined && !/^\d{1,3}$/.test(prefixText))) {
				throw new IssuerEgressError(`Invalid workload identity egress allowlist entry ${entry}`)
			}
			const prefix = prefixText === undefined ? maxPrefix : Number(prefixText)
			if (prefix > maxPrefix) {
				throw new IssuerEgressError(`Invalid workload identity egress allowlist entry ${entry}`)
			}
			this.allowedNetworks.addSubnet(network, prefix, family)
		}
		this.allowedHosts = allowedHosts
		this.insecureHosts = new Set(config.insecureIssuers.map(normalizeHost))
	}

	/** Throws unless the URL may be fetched; an IP-literal host is checked here because no lookup will run for it. */
	public checkUrl(url: URL): void {
		const host = normalizeHost(url.hostname)
		if (url.username !== '' || url.password !== '') {
			throw new IssuerEgressError('Issuer URLs must not carry credentials')
		}
		if (url.protocol !== 'https:' && !(url.protocol === 'http:' && this.insecureHosts.has(host))) {
			throw new IssuerEgressError(`Only https:// issuer URLs are allowed, got ${url.protocol}//${host}`)
		}
		if (ipFamily(host) !== null) {
			this.checkAddress(host, host)
		}
	}

	/** Throws unless a connection to `address`, resolved from `host`, is allowed. */
	public checkAddress(host: string, address: string): void {
		const normalizedHost = normalizeHost(host)
		if (this.insecureHosts.has(normalizedHost) || this.allowedHosts.has(normalizedHost)) {
			return
		}
		const family = ipFamily(address)
		if (family === null) {
			throw new IssuerEgressError(`Invalid address ${address} for ${normalizedHost}`)
		}
		if (this.allowedNetworks.check(address, family)) {
			return
		}
		const isPublic = isIPv4(address)
			? !this.specialPurpose.check(address, 'ipv4')
			: this.globalUnicastIpv6.check(address, 'ipv6') && !this.specialPurpose.check(address, 'ipv6')
		if (!isPublic) {
			throw new IssuerEgressError(`${normalizedHost} resolves to the non-public address ${address}`)
		}
	}
}
