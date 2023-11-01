import { EntityRegistry, EnumRegistry } from './internal'
import { StrictDefinitionValidator } from '../../strict'
import { NamingConventions } from '@contember/schema-utils'

export type CommonContext = {
	conventions: NamingConventions
	enumRegistry: EnumRegistry
	entityRegistry: EntityRegistry
	strictDefinitionValidator: StrictDefinitionValidator
}
