import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { convertOneHasManyToManyHasManyRelationModification } from './modifications/ConvertOneHasManyToManyHasManyRelationModification'
import { convertOneToManyRelationModification } from './modifications/ConvertOneToManyRelationModification'
import { createColumnModification } from './modifications/CreateColumnModification'
import { createEntityModification } from './modifications/CreateEntityModification'
import { createEnumModification } from './modifications/CreateEnumModification'
import { createRelationModification } from './modifications/CreateRelationModification'
import { createUniqueConstraintModification } from './modifications/CreateUniqueConstraintModification'
import { createViewModification } from './modifications/CreateViewModification'
import { makeRelationNotNullModification } from './modifications/MakeRelationNotNullModification'
import { makeRelationNullableModification } from './modifications/MakeRelationNullableModification'
import { removeEntityModification } from './modifications/RemoveEntityModification'
import { removeEnumModification } from './modifications/RemoveEnumModification'
import { removeUniqueConstraintModification } from './modifications/RemoveUniqueConstraintModification'
import { updateColumnDefinitionModification } from './modifications/UpdateColumnDefinitionModification'
import { updateEntityTableNameModification } from './modifications/UpdateEntityTableNameModification'
import { updateEnumModification } from './modifications/UpdateEnumModification'
import { updateFieldNameModification } from './modifications/UpdateFieldNameModification'
import { updateViewModification } from './modifications/UpdateViewModification'
import { removeFieldModification } from './modifications/RemoveFieldModification'
import { updateColumnNameModification } from './modifications/UpdateColumnNameModification'
import { updateEntityNameModification } from './modifications/UpdateEntityNameModification'

export const getModificationTypes = (): ModificationHandlerFactory.ModificationTypes<any> => {
	const originalTypes = ModificationHandlerFactory.defaultFactoryMap
	const overrides = [
		convertOneHasManyToManyHasManyRelationModification,
		convertOneToManyRelationModification,
		createColumnModification,
		createEntityModification,
		createEnumModification,
		createRelationModification,
		createUniqueConstraintModification,
		createViewModification,
		makeRelationNotNullModification,
		makeRelationNullableModification,
		removeEntityModification,
		removeEnumModification,
		removeFieldModification,
		removeUniqueConstraintModification,
		updateColumnDefinitionModification,
		updateColumnNameModification,
		updateEntityNameModification,
		updateEntityTableNameModification,
		updateEnumModification,
		updateFieldNameModification,
		updateViewModification,
	]
	return {
		...originalTypes,
		...Object.fromEntries(overrides.map(it => [it.id, it])),
	}
}
