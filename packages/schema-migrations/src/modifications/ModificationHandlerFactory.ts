import { Schema } from '@contember/schema'
import { ModificationHandler, ModificationHandlerOptions, ModificationType } from './ModificationHandler'
import { patchAclSchemaModification, updateAclSchemaModification } from './acl'
import { createColumnModification, updateColumnDefinitionModification, updateColumnNameModification } from './columns'
import { createUniqueConstraintModification, removeUniqueConstraintModification } from './constraints'
import {
	createEntityModification, createViewModification,
	removeEntityModification, toggleEventLogModification,
	updateEntityNameModification,
	updateEntityTableNameModification,
} from './entities'
import { updateViewModification } from './entities/UpdateViewModification'
import {
	createEnumModification,
	removeEnumModification,
	updateEnumModification,
} from './enums'
import { removeFieldModification, updateFieldNameModification } from './fields'
import {
	convertOneHasManyToManyHasManyRelationModification,
	convertOneToManyRelationModification,
	createRelationInverseSideModification,
	createRelationModification, disableOrphanRemovalModification,
	enableOrphanRemovalModification,
	makeRelationNotNullModification,
	makeRelationNullableModification, toggleJunctionEventLogModification,
	updateRelationOnDeleteModification,
	updateRelationOrderByModification,
} from './relations'
import { patchValidationSchemaModification, updateValidationSchemaModification } from './validation'
import { createIndexModification, removeIndexModification } from './indexes'
import { SchemaWithMeta } from './utils/schemaMeta'
import { updateSettingsModification } from './settings'


class ModificationHandlerFactory {
	constructor(private readonly map: Record<string, ModificationType<string, any>>) {}

	public create<D>(name: string, data: D, schema: SchemaWithMeta, options: ModificationHandlerOptions): ModificationHandler<D> {
		if (!this.map[name]) {
			throw new Error(`Undefined modification handler for ${name}`)
		}
		return this.map[name].createHandler(data, schema, options)
	}
}

namespace ModificationHandlerFactory {
	type HandlerMap<D> = { [modificationName: string]: ModificationType<string, D> }

	const handlers = [
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
		toggleEventLogModification,
		toggleJunctionEventLogModification,
		convertOneHasManyToManyHasManyRelationModification,
	]

	export const defaultFactoryMap: HandlerMap<any> = Object.fromEntries(handlers.map(it => [it.id, it]))
}

export { ModificationHandlerFactory }
