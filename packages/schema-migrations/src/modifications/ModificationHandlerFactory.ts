import { Schema } from '@contember/schema'
import { ModificationHandler, ModificationHandlerStatic } from './ModificationHandler'
import { CreateColumnModification, UpdateColumnDefinitionModification, UpdateColumnNameModification } from './columns'
import { PatchValidationSchemaModification, UpdateValidationSchemaModification } from './validation'
import { PatchAclSchemaModification, UpdateAclSchemaModification } from './acl'
import { CreateUniqueConstraintModification, RemoveUniqueConstraintModification } from './constraints'
import {
	CreateEntityModification,
	CreateViewModification,
	RemoveEntityModification,
	UpdateEntityNameModification,
	UpdateEntityTableNameModification,
} from './entities'
import { CreateEnumModification, RemoveEnumModification, UpdateEnumModification } from './enums'
import { RemoveFieldModification, UpdateFieldNameModification } from './fields'
import {
	ConvertOneToManyRelationModification,
	CreateRelationInverseSideModification,
	CreateRelationModification,
	DisableOrphanRemovalModification,
	EnableOrphanRemovalModification,
	MakeRelationNotNullModification,
	MakeRelationNullableModification,
	UpdateRelationOnDeleteModification,
	UpdateRelationOrderByModification,
} from './relations'
import { UpdateViewModification } from './entities/UpdateViewModification'

class ModificationHandlerFactory {
	constructor(private readonly map: Record<string, ModificationHandlerStatic<any>>) {}

	public create<D>(name: string, data: D, schema: Schema, version: number): ModificationHandler<D> {
		if (!this.map[name]) {
			throw new Error(`Undefined modification handler for ${name}`)
		}
		return new this.map[name](data, schema, version)
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
	]

	export const defaultFactoryMap: HandlerMap<any> = Object.fromEntries(handlers.map(it => [it.id, it]))
}

export default ModificationHandlerFactory
