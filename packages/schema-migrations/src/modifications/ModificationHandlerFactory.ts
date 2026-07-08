import { Schema } from '@contember/schema'
import { ModificationHandler, ModificationHandlerOptions, ModificationType } from './ModificationHandler.js'
import { patchAclSchemaModification, updateAclSchemaModification } from './acl/index.js'
import { createColumnModification, updateColumnDefinitionModification, updateColumnNameModification } from './columns/index.js'
import { createUniqueConstraintModification, removeUniqueConstraintModification } from './constraints/index.js'
import {
	createEntityModification,
	createViewModification,
	removeEntityModification,
	toggleEventLogModification,
	updateEntityNameModification,
	updateEntityTableNameModification,
} from './entities/index.js'
import { updateViewModification } from './entities/UpdateViewModification.js'
import { createEnumModification, removeEnumModification, updateEnumModification } from './enums/index.js'
import { removeFieldModification, updateFieldNameModification } from './fields/index.js'
import {
	convertManyHasManyToJoiningEntityModification,
	convertOneHasManyToManyHasManyRelationModification,
	convertOneToManyRelationModification,
	createRelationInverseSideModification,
	createRelationModification,
	disableOrphanRemovalModification,
	enableOrphanRemovalModification,
	makeRelationNotNullModification,
	makeRelationNullableModification,
	toggleJunctionEventLogModification,
	updateRelationOnDeleteModification,
	updateRelationOrderByModification,
} from './relations/index.js'
import { patchValidationSchemaModification, updateValidationSchemaModification } from './validation/index.js'
import { createIndexModification, removeIndexModification } from './indexes/index.js'
import { updateSettingsModification } from './settings/index.js'
import { createTriggerModification, patchTriggerModification, removeTriggerModification, updateTriggerModification } from './actions/index.js'
import { createTargetModification } from './actions/CreateTargetModification.js'
import { removeTargetModification } from './actions/RemoveTargetModification.js'
import { updateTargetModification } from './actions/UpdateTargetModification.js'
import { createRetentionPolicyModification, removeRetentionPolicyModification, updateRetentionPolicyModification } from './retention/index.js'
import { updateEntityOrderByModification } from './entities/UpdateEntityOrderByModification.js'
import { toggleEntityImmutableModification } from './entities/ToggleEntityImmutableModification.js'
import { removeIndexNamesModification } from './upgrade/RemoveIndexNamesModification.js'
import { convertOneHasManyToOneHasOneRelationModification } from './relations/ConvertOneHasManyToOneHasOneRelationModification.js'

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
		convertManyHasManyToJoiningEntityModification,
		updateEntityOrderByModification,
		toggleEntityImmutableModification,
		createTriggerModification,
		updateTriggerModification,
		patchTriggerModification,
		removeTriggerModification,
		createTargetModification,
		updateTargetModification,
		removeTargetModification,
		createRetentionPolicyModification,
		updateRetentionPolicyModification,
		removeRetentionPolicyModification,
	]

	export const defaultFactoryMap: HandlerMap<any> = Object.fromEntries(handlers.map(it => [it.id, it]))
}

export { ModificationHandlerFactory }
