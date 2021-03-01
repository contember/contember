import { RuntimeId } from '../accessorTree'

export class AliasTransformer {
	// This is just a random character we use to make sure the alias doesn't start with a number as UUIDs often do.
	private static COMMON_PREFIX = '_'

	private static ALIAS_SECTION_SEPARATOR = '__'

	public static entityToAlias(entityId: RuntimeId): string {
		return `${this.COMMON_PREFIX}${entityId.value.replace(/-/g, '_')}`
	}

	public static aliasToEntityId(alias: string): string {
		return `${alias.substring(this.COMMON_PREFIX.length).replace(/_/g, '-')}`
	}

	public static joinAliasSections(...sections: string[]): string {
		return sections.join(this.ALIAS_SECTION_SEPARATOR)
	}

	public static splitAliasSections(joinedAlias: string): string[] {
		return joinedAlias.split(this.ALIAS_SECTION_SEPARATOR)
	}
}
