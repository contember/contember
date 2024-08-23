import * as Typesafe from '@contember/typesafe'
import { ResponseType } from 'openid-client'

export interface OIDCSessionData {
	nonce: string
	state: string
}

export const OIDCConfigurationOptions = Typesafe.partial({
	responseType: Typesafe.enumeration<ResponseType>('code', 'code id_token', 'code id_token token', 'code token', 'id_token', 'id_token token', 'none'),
	claims: Typesafe.string,
	additionalAuthorizedParties: Typesafe.array(Typesafe.string),
	idTokenSignedResponseAlg: Typesafe.string,
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
