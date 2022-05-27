import { Schema } from '@contember/schema'
import { ModificationHandler, ModificationHandlerOptions, ModificationType } from './ModificationHandler'
import { patchAclSchemaModification, updateAclSchemaModification } from './acl'
import { createColumnModification, updateColumnDefinitionModification, updateColumnNameModification } from './columns'
import { createUniqueConstraintModification, removeUniqueConstraintModification } from './constraints'
import {
	configureEntityDatabaseMigrationsModification,
	createEntityModification,
	createViewModification,
	removeEntityModification,
	toggleEventLogModification,
	updateEntityNameModification,
	updateEntityTableNameModification,
	updateViewModification,
} from './entities'
import {
	configureEnumDatabaseMigrationsModification,
	createEnumModification,
	removeEnumModification,
	updateEnumModification,
} from './enums'
import { removeFieldModification, updateFieldNameModification } from './fields'
import {
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
} from './relations'
import { patchValidationSchemaModification, updateValidationSchemaModification } from './validation'
import { createIndexModification, removeIndexModification } from './indexes'


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
	export type ModificationTypes<D> = { [modificationName: string]: ModificationType<string, D> }

	const modificationTypes = [
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
		configureEntityDatabaseMigrationsModification,
		configureEnumDatabaseMigrationsModification,
	]

	export const defaultFactoryMap: ModificationTypes<any> = Object.fromEntries(modificationTypes.map(it => [it.id, it]))
}

export { ModificationHandlerFactory }
