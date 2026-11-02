import { Acl } from '@contember/schema'

export namespace WorkloadIdentity {
	export type Profile = 'oidc' | 'github-actions'

	export type ConditionOperator =
		| { readonly equals: string | number | boolean }
		| { readonly in: readonly (string | number)[] }
		| { readonly startsWith: string }
		| { readonly arrayContains: string }

	/** A literal claim key XOR explicit path segments — never a dot-path fallback. */
	export type ConditionTarget =
		| { readonly claim: string }
		| { readonly path: readonly string[] }

	export type Condition = ConditionTarget & ConditionOperator

	/** A stored trust, as the verifier and the apply diff read it. */
	export interface TrustRow {
		readonly id: string
		readonly slug: string
		readonly identityId: string
		readonly issuer: string
		readonly audience: string
		readonly profile: Profile
		readonly jwksUri: string | null
		readonly signingAlgs: readonly string[]
		/** A `null` element accepts a token without a `typ` header. */
		readonly acceptedTyp: readonly (string | null)[]
		readonly acceptAudienceArray: boolean
		readonly requireDpop: boolean
		readonly conditions: readonly Condition[]
		readonly maxTokenLifetimeSeconds: number
		/** Unix seconds; tokens with an earlier `iat` (minus skew) are rejected. */
		readonly tokensValidAfter: number
		readonly trustForwardedInfo: boolean
		readonly disabled: boolean
		readonly description: string | null
		readonly roles: readonly string[]
	}

	export interface MembershipDefinition extends Acl.Membership {
		readonly project: string
		/** The assume-membership envelope rule bound to this membership (§7a). */
		readonly assumeMembership?: Acl.MembershipMatchRule
	}

	/** The parsed `applyWorkloadIdentityTrust` input; defaults are not filled in yet. */
	export interface TrustDefinition {
		readonly profile: Profile
		readonly issuer: string
		readonly audience: string
		readonly conditions: readonly Condition[]
		readonly jwksUri?: string
		readonly signingAlgs?: readonly string[]
		readonly acceptedTyp?: readonly (string | null)[]
		readonly acceptAudienceArray?: boolean
		readonly requireDpop?: boolean
		readonly maxTokenLifetime?: number
		readonly trustForwardedInfo?: boolean
		readonly description?: string
		readonly roles: readonly string[]
		readonly memberships: readonly MembershipDefinition[]
		readonly disabled: boolean
	}

	/**
	 * Instance-level (server config, never tenant config) relaxations of the issuer fetch policy (§16).
	 * Read by both the fetcher and apply-time validation, so a tenant config cannot widen them.
	 */
	export interface InstanceConfig {
		/** Hostnames or CIDRs exempt from the private-range ban; still `https://` only. */
		readonly egressAllowlist: readonly string[]
		/** Hostnames allowed over `http://`, loopback included — development only. */
		readonly insecureIssuers: readonly string[]
		/** Extra PEM CA certificates trusted for issuer fetches only. */
		readonly caCertificates: readonly string[]
		/** How long last-known-good keys stay accepted while the issuer is unreachable. */
		readonly jwksMaxStalenessSeconds: number
	}

	export const defaultInstanceConfig: InstanceConfig = {
		egressAllowlist: [],
		insecureIssuers: [],
		caCertificates: [],
		jwksMaxStalenessSeconds: 6 * 3600,
	}
}
