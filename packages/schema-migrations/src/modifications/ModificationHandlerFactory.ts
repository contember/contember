import { Schema } from '@contember/schema'
import { ModificationHandler, ModificationHandlerOptions, ModificationType } from './ModificationHandler'
import { patchAclSchemaModification, updateAclSchemaModification } from './acl'
import { createColumnModification, updateColumnDefinitionModification, updateColumnNameModification } from './columns'
import { createUniqueConstraintModification, removeUniqueConstraintModification } from './constraints'
import {
	createEntityModification,
	createViewModification,
	removeEntityModification,
	toggleEventLogModification,
	updateEntityNameModification,
	updateEntityTableNameModification,
} from './entities'
import { updateViewModification } from './entities/UpdateViewModification'
import { createEnumModification, removeEnumModification, updateEnumModification } from './enums'
import { removeFieldModification, updateFieldNameModification } from './fields'
import {
	convertOneHasManyToManyHasManyRelationModification,
	convertOneToManyRelationModification,
	createRelationInverseSideModification,
	createRelationModification,
	disableOrphanRemovalModification,
	enableOrphanRemovalModification,
	makeRelationDeprecatedModification,
	makeRelationNotDeprecatedModification,
	makeRelationNotNullModification,
	makeRelationNullableModification,
	toggleJunctionEventLogModification,
	updateRelationOnDeleteModification,
	updateRelationOrderByModification,
} from './relations'
import { patchValidationSchemaModification, updateValidationSchemaModification } from './validation'
import { createIndexModification, removeIndexModification } from './indexes'
import { updateSettingsModification } from './settings'
import { createTriggerModification, patchTriggerModification, removeTriggerModification, updateTriggerModification } from './actions'
import { createTargetModification } from './actions/CreateTargetModification'
import { removeTargetModification } from './actions/RemoveTargetModification'
import { updateTargetModification } from './actions/UpdateTargetModification'
import { updateEntityOrderByModification } from './entities/UpdateEntityOrderByModification'
import { removeIndexNamesModification } from './upgrade/RemoveIndexNamesModification'
import { convertOneHasManyToOneHasOneRelationModification } from './relations/ConvertOneHasManyToOneHasOneRelationModification'


class ModificationHandlerFactory {
	constructor(private readonly map: Record<string, ModificationType<string, any>>) {}

	public create<D>(name: string, data: D, schema: Schema, options: ModificationHandlerOptions): ModificationHandler<D> {
		if (!this.map[name]) {
			throw new Error(`Undefined modification handler for ${name}`)
		}
		return this.map[name].createHandler(data, schema, options)
	}
}

namespace ModificationHandlerFactory {
	type HandlerMap<D> = { [modificationName: string]: ModificationType<string, D> }

	const handlers = [
		removeIndexNamesModification,
		updateSettingsModification,
		updateAclSchemaModification,
		patchAclSchemaModification,
		createColumnModification,
		updateColumnDefinitionModification,
		updateColumnNameModification,
		createUniqueConstraintModification,
		removeUniqueConstraintModification,
		createIndexModification,
		removeIndexModification,
		createEntityModification,
		removeEntityModification,
		updateEntityNameModification,
		updateEntityTableNameModification,
		updateViewModification,
		createViewModification,
		createEnumModification,
		removeEnumModification,
		updateEnumModification,
		removeFieldModification,
		updateFieldNameModification,
		createRelationInverseSideModification,
		createRelationModification,
		updateRelationOnDeleteModification,
		updateRelationOrderByModification,
		makeRelationDeprecatedModification,
		makeRelationNotDeprecatedModification,
		makeRelationNotNullModification,
		makeRelationNullableModification,
		enableOrphanRemovalModification,
		disableOrphanRemovalModification,
		updateValidationSchemaModification,
		patchValidationSchemaModification,
		convertOneToManyRelationModification,
		convertOneHasManyToOneHasOneRelationModification,
		toggleEventLogModification,
		toggleJunctionEventLogModification,
		convertOneHasManyToManyHasManyRelationModification,
		updateEntityOrderByModification,
		createTriggerModification,
		updateTriggerModification,
		patchTriggerModification,
		removeTriggerModification,
		createTargetModification,
		updateTargetModification,
		removeTargetModification,
	]

	export const defaultFactoryMap: HandlerMap<any> = Object.fromEntries(handlers.map(it => [it.id, it]))
}

export { ModificationHandlerFactory }
