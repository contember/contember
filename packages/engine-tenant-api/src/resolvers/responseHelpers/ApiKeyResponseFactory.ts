import { ApiKey as ApiKeyDto } from '../../model/index.js'
import { ApiKeyListRow } from '../../model/queries/apiKey/index.js'
import { ApiKey, ApiKeyType } from '../../schema/index.js'

const apiKeyTypeToSchema = (type: ApiKeyDto.Type): ApiKeyType => {
	switch (type) {
		case ApiKeyDto.Type.SESSION:
			return 'SESSION'
		case ApiKeyDto.Type.PERMANENT:
			return 'PERMANENT'
		case ApiKeyDto.Type.ONE_OFF:
			return 'ONE_OFF'
	}
}

export class ApiKeyResponseFactory {
	public static createApiKeyResponse(row: ApiKeyListRow): ApiKey {
		return {
			id: row.id,
			type: apiKeyTypeToSchema(row.type),
			description: row.description,
			enabled: row.disabled_at === null,
			createdAt: row.created_at,
			lastUsedAt: row.last_used_at,
			expiresAt: row.expires_at,
			// projects/sessions left empty so IdentityTypeResolver resolves them lazily —
			// apiKey.identity.projects exposes the key's memberships for cloning.
			identity: {
				id: row.identity_id,
				description: row.description,
				projects: [],
				sessions: [],
			},
		}
	}
}
