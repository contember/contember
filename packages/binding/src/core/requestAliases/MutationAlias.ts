import type { RuntimeId } from '../../accessorTree'

export class MutationAlias {
	public static encodeEntityId(entityId: RuntimeId): string {
		return `_${String(entityId.value).replace(/-/g, '_')}`
	}

	public static decodeEntityId(alias: string): RuntimeId['value'] {
		const stringId = `${alias.substring(1).replace(/_/g, '-')}`
		const intId = parseInt(stringId)
		return intId.toString() === stringId ? intId : stringId
	}
}
