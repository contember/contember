import { EntityRegistry, EnumRegistry } from './internal/index.js'
import { StrictDefinitionValidator } from '../../strict.js'
import { NamingConventions } from '@contember/schema-utils'

export type CommonContext = {
	conventions: NamingConventions
	enumRegistry: EnumRegistry
	entityRegistry: EntityRegistry
	strictDefinitionValidator: StrictDefinitionValidator
	options: {
		defaultCollation?: string
	}
}
