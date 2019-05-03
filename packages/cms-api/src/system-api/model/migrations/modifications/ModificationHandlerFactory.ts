import UpdateAclSchemaModification from './acl/UpdateAclSchemaModification'
import { Schema } from 'cms-common'
import { Modification } from './Modification'
import CreateColumnModification from './columns/CreateColumnModification'
import UpdateColumnDefinitionModification from './columns/UpdateColumnDefinitionModification'
import UpdateColumnNameModification from './columns/UpdateColumnNameModification'
import CreateUniqueConstraintModification from './constraints/CreateUniqueConstraintModification'
import UpdateRelationOnDeleteModification from './relations/UpdateRelationOnDeleteModification'
import CreateRelationModification from './relations/CreateRelationModification'
import CreateRelationInverseSideModification from './relations/CreateRelationInverseSideModification'
import UpdateFieldNameModification from './fields/UpdateFieldNameModification'
import RemoveFieldModification from './fields/RemoveFieldModification'
import UpdateEnumModification from './enums/UpdateEnumModification'
import RemoveEnumModification from './enums/RemoveEnumModification'
import CreateEnumModification from './enums/CreateEnumModification'
import UpdateEntityTableNameModification from './entities/UpdateEntityTableNameModification'
import RemoveEntityModification from './entities/RemoveEntityModification'
import CreateEntityModification from './entities/CreateEntityModification'
import RemoveUniqueConstraintModification from './constraints/RemoveUniqueConstraintModification'
import UpdateEntityNameModification from './entities/UpdateEntityNameModification'
import PatchAclSchemaModification from './acl/PatchAclSchemaModification'

class ModificationHandlerFactory {
	constructor(private readonly map: ModificationHandlerFactory.FactoryMap<any>) {}

	public create<D>(name: string, data: D, schema: Schema): Modification<D> {
		if (!this.map[name]) {
			throw new Error(`Undefined modification handler for ${name}`)
		}
		return this.map[name]({ data, schema })
	}
}

namespace ModificationHandlerFactory {
	export type FactoryDefinition<D> = (input: { schema: Schema; data: D }) => Modification<D>
	export type FactoryMap<D> = { [modificationName: string]: FactoryDefinition<D> }

	export const defaultFactoryMap: FactoryMap<any> = {
		[UpdateAclSchemaModification.id]: ({ data }) => new UpdateAclSchemaModification(data),
		[PatchAclSchemaModification.id]: ({ data }) => new PatchAclSchemaModification(data),

		[CreateColumnModification.id]: ({ data, schema }) => new CreateColumnModification(data, schema),
		[UpdateColumnDefinitionModification.id]: ({ data, schema }) => new UpdateColumnDefinitionModification(data, schema),
		[UpdateColumnNameModification.id]: ({ data, schema }) => new UpdateColumnNameModification(data, schema),

		[CreateUniqueConstraintModification.id]: ({ data, schema }) => new CreateUniqueConstraintModification(data, schema),
		[RemoveUniqueConstraintModification.id]: ({ data, schema }) => new RemoveUniqueConstraintModification(data, schema),

		[CreateEntityModification.id]: ({ data, schema }) => new CreateEntityModification(data, schema),
		[RemoveEntityModification.id]: ({ data, schema }) => new RemoveEntityModification(data, schema),
		[UpdateEntityNameModification.id]: ({ data, schema }) => new UpdateEntityNameModification(data, schema),
		[UpdateEntityTableNameModification.id]: ({ data, schema }) => new UpdateEntityTableNameModification(data, schema),

		[CreateEnumModification.id]: ({ data, schema }) => new CreateEnumModification(data, schema),
		[RemoveEnumModification.id]: ({ data, schema }) => new RemoveEnumModification(data, schema),
		[UpdateEnumModification.id]: ({ data, schema }) => new UpdateEnumModification(data, schema),

		[RemoveFieldModification.id]: ({ data, schema }) => new RemoveFieldModification(data, schema),
		[UpdateFieldNameModification.id]: ({ data, schema }) => new UpdateFieldNameModification(data, schema),

		[CreateRelationInverseSideModification.id]: ({ data, schema }) =>
			new CreateRelationInverseSideModification(data, schema),
		[CreateRelationModification.id]: ({ data, schema }) => new CreateRelationModification(data, schema),
		[UpdateRelationOnDeleteModification.id]: ({ data, schema }) => new UpdateRelationOnDeleteModification(data, schema),
	}
}

export default ModificationHandlerFactory
