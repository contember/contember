import { JsonObject } from '@contember/interface'

export const isJsonContent = (value: unknown): value is { children: any } => {
	if (typeof value !== 'object' || value === null) {
		return false
	}

	return 'children' in value
}

export const isJsonObject = (value: unknown): value is JsonObject => {
	return typeof value === 'object' && value !== null
}
