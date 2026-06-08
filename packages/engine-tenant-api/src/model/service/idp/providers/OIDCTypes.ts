import * as Typesafe from '@contember/typesafe'
import { ClientAuthMethod, ResponseType } from 'openid-client'
import { IDPRevalidationConfig } from '../IDPRevalidation.js'

export interface OIDCSessionData {
	nonce: string
	state: string
}

/** OIDC re-validation config: the generic settings plus the OIDC-specific probe method. */
export const OIDCRevalidationConfig = Typesafe.intersection(
	IDPRevalidationConfig,
	Typesafe.partial({
		/** How to probe the IdP. `refresh` needs `offline_access`; default `refresh`. */
		method: Typesafe.enumeration('refresh', 'userinfo', 'introspection'),
	}),
)

export type OIDCRevalidationConfig = ReturnType<typeof OIDCRevalidationConfig>

/**
 * Maps provider claims onto the normalized {@link IDPResponse} fields. Each value is a claim
 * name, dot-path supported (e.g. `address.region`). Lets a provider whose claims don't follow
 * the OIDC defaults still be consumed without a per-provider code change.
 */
export const OIDCClaimMapping = Typesafe.partial({
	/**
	 * Claim used as the stable external identifier (the IdP subject). Default `sub`.
	 * Must resolve to a scalar (string/number) — a non-scalar claim is rejected at sign-in.
	 * Mapping this to a claim that only appears in userInfo / `attributes` takes the federation
	 * key off the signature-verified ID-token subject; prefer a signed claim where possible.
	 */
	externalIdentifier: Typesafe.string,
	/** Claim used as the e-mail address. Default `email`. */
	email: Typesafe.string,
	/** Claim used as the display name. Default `name`. */
	name: Typesafe.string,
	/**
	 * Key of a nested object whose properties are lifted to the top level before mapping.
	 * Some providers (notably Apereo CAS userinfo) nest the actual claims under `attributes`.
	 */
	attributesKey: Typesafe.string,
})

export type OIDCClaimMapping = ReturnType<typeof OIDCClaimMapping>

export const OIDCConfigurationOptions = Typesafe.partial({
	responseType: Typesafe.enumeration<ResponseType>('code', 'code id_token', 'code id_token token', 'code token', 'id_token', 'id_token token', 'none'),
	claims: Typesafe.string, // deprecated, use scope instead
	scope: Typesafe.string,
	additionalAuthorizedParties: Typesafe.array(Typesafe.string),
	idTokenSignedResponseAlg: Typesafe.string,
	/**
	 * How the client authenticates to the token endpoint. `openid-client` defaults to
	 * `client_secret_basic`; set `client_secret_post` for providers (e.g. some Apereo CAS
	 * registrations) that only accept the secret in the request body.
	 */
	tokenEndpointAuthMethod: Typesafe.enumeration<ClientAuthMethod>(
		'client_secret_basic',
		'client_secret_post',
		'client_secret_jwt',
		'private_key_jwt',
		'tls_client_auth',
		'self_signed_tls_client_auth',
		'none',
	),
	fetchUserInfo: Typesafe.boolean,
	returnOIDCResult: Typesafe.boolean,
	timeout: Typesafe.number,
	revalidation: OIDCRevalidationConfig,
	claimMapping: OIDCClaimMapping,
})
export const BaseOIDCConfiguration = Typesafe.intersection(
	Typesafe.object({
		url: Typesafe.string,
		clientId: Typesafe.string,
		clientSecret: Typesafe.string,
	}),
	OIDCConfigurationOptions,
)

export const OIDCConfiguration = Typesafe.intersection(
	BaseOIDCConfiguration,
	Typesafe.object({
		url: Typesafe.string,
	}),
)

export type OIDCConfiguration = ReturnType<typeof OIDCConfiguration>

export const OIDCResponseData = Typesafe.intersection(
	Typesafe.union(
		Typesafe.object({
			url: Typesafe.string,
		}),
		Typesafe.object({
			parameters: Typesafe.record(Typesafe.string, Typesafe.string),
		}),
	),
	Typesafe.partial({
		redirectUrl: Typesafe.string,
		sessionData: Typesafe.partial({
			nonce: Typesafe.string,
			state: Typesafe.string,
		}),
	}),
)

export type OIDCResponseData = ReturnType<typeof OIDCResponseData>

export const OIDCInitData = Typesafe.noExtraProps(Typesafe.intersection(
	Typesafe.object({
		redirectUrl: Typesafe.string,
	}),
	Typesafe.partial({
		responseMode: Typesafe.string,
	}),
))

export type OIDCInitData = ReturnType<typeof OIDCInitData>
