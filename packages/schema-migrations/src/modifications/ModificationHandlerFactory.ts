import { Schema } from '@contember/schema'
import { ModificationHandler, ModificationHandlerOptions, ModificationHandlerStatic } from './ModificationHandler.js'
import { CreateColumnModification, UpdateColumnDefinitionModification, UpdateColumnNameModification } from './columns/index.js'
import { PatchValidationSchemaModification, UpdateValidationSchemaModification } from './validation/index.js'
import { PatchAclSchemaModification, UpdateAclSchemaModification } from './acl/index.js'
import { CreateUniqueConstraintModification, RemoveUniqueConstraintModification } from './constraints/index.js'
import {
	CreateEntityModification,
	CreateViewModification,
	RemoveEntityModification,
	ToggleEventLogModification,
	UpdateEntityNameModification,
	UpdateEntityTableNameModification,
} from './entities/index.js'
import { CreateEnumModification, RemoveEnumModification, UpdateEnumModification } from './enums/index.js'
import { RemoveFieldModification, UpdateFieldNameModification } from './fields/index.js'
import {
	ConvertOneHasManyToManyHasManyRelationModification,
	ConvertOneToManyRelationModification,
	CreateRelationInverseSideModification,
	CreateRelationModification,
	DisableOrphanRemovalModification,
	EnableOrphanRemovalModification,
	MakeRelationNotNullModification,
	MakeRelationNullableModification,
	ToggleJunctionEventLogModification,
	UpdateRelationOnDeleteModification,
	UpdateRelationOrderByModification,
} from './relations/index.js'
import { UpdateViewModification } from './entities/UpdateViewModification.js'

class ModificationHandlerFactory {
	constructor(private readonly map: Record<string, ModificationHandlerStatic<any>>) {}

	public create<D>(name: string, data: D, schema: Schema, options: ModificationHandlerOptions): ModificationHandler<D> {
		if (!this.map[name]) {
			throw new Error(`Undefined modification handler for ${name}`)
		}
		return new this.map[name](data, schema, options)
	}
}

namespace ModificationHandlerFactory {
	export type HandlerMap<D> = { [modificationName: string]: ModificationHandlerStatic<D> }

	const handlers = [
		UpdateAclSchemaModification,
		PatchAclSchemaModification,
		CreateColumnModification,
		UpdateColumnDefinitionModification,
		UpdateColumnNameModification,
		CreateUniqueConstraintModification,
		RemoveUniqueConstraintModification,
		CreateEntityModification,
		RemoveEntityModification,
		UpdateEntityNameModification,
		UpdateEntityTableNameModification,
		UpdateViewModification,
		CreateViewModification,
		CreateEnumModification,
		RemoveEnumModification,
		UpdateEnumModification,
		RemoveFieldModification,
		UpdateFieldNameModification,
		CreateRelationInverseSideModification,
		CreateRelationModification,
		UpdateRelationOnDeleteModification,
		UpdateRelationOrderByModification,
		MakeRelationNotNullModification,
		MakeRelationNullableModification,
		EnableOrphanRemovalModification,
		DisableOrphanRemovalModification,
		UpdateValidationSchemaModification,
		PatchValidationSchemaModification,
		ConvertOneToManyRelationModification,
		ToggleEventLogModification,
		ToggleJunctionEventLogModification,
		ConvertOneHasManyToManyHasManyRelationModification,
	]

	export const defaultFactoryMap: HandlerMap<any> = Object.fromEntries(handlers.map(it => [it.id, it]))
}

export default ModificationHandlerFactory
