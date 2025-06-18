import { Model, Schema } from '@contember/schema'
import { isColumn, isRelation } from '@contember/schema-utils'
import { Migration } from '../../Migration'
import { updateColumnDefinitionModification } from '../columns/UpdateColumnDefinitionModification'
import { Differ } from '../ModificationHandler'
import { createRelationAliasesModification } from '../relations/CreateRelationAliasesModification'
import { updateFieldNameModification } from './UpdateFieldNameModification'

export class UpdateFieldNameWithAliasDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema): Migration.Modification[] {
		const modifications: Migration.Modification[] = []

		for (const updatedEntity of Object.values(updatedSchema.model.entities)) {
			const originalEntity = originalSchema.model.entities[updatedEntity.name]
			if (!originalEntity) {
				continue
			}

			for (const updatedField of Object.values(updatedEntity.fields)) {
				if (!updatedField.aliases || updatedField.aliases.length === 0) {
					continue
				}

				for (const alias of updatedField.aliases) {
					const originalField = originalEntity.fields[alias]
					if (originalField && !updatedEntity.fields[alias]) {
						if (this.areFieldsCompatibleForRename(originalField, updatedField)) {

							let updateFieldNameData: any = {
								entityName: updatedEntity.name,
								fieldName: alias,
								newFieldName: updatedField.name,
							}

							if (isRelation(originalField) && isRelation(updatedField) && 'joiningColumn' in originalField && 'joiningColumn' in updatedField) {
								const originalColumnName = originalField.joiningColumn.columnName
								const updatedColumnName = updatedField.joiningColumn.columnName

								if (originalColumnName !== updatedColumnName) {
									updateFieldNameData.columnName = updatedColumnName
								}
							}

							if (isColumn(originalField) && isColumn(updatedField) &&
								originalField.columnName !== updatedField.columnName) {
								updateFieldNameData.columnName = updatedField.columnName
							}

							const updateFieldName = updateFieldNameModification.createModification(updateFieldNameData)
							modifications.push(updateFieldName)

							if (isRelation(updatedField)) {
								const aliasModification = createRelationAliasesModification.createModification({
									entityName: updatedEntity.name,
									fieldName: updatedField.name,
									aliases: updatedField.aliases,
								})
								modifications.push(aliasModification)
							}

							if (isColumn(updatedField)) {
								const columnDefinition = updateColumnDefinitionModification.createModification({
									entityName: updatedEntity.name,
									fieldName: updatedField.name,
									definition: {
										type: updatedField.type,
										columnType: updatedField.columnType,
										nullable: updatedField.nullable,
										aliases: updatedField.aliases, // Add the aliases
									},
								})
								modifications.push(columnDefinition)
							}
						}
					}
				}
			}
		}

		return modifications
	}

	private areFieldsCompatibleForRename(originalField: Model.AnyField, updatedField: Model.AnyField): boolean {
		if (isColumn(originalField) && isColumn(updatedField)) {
			return (
				originalField.type === updatedField.type &&
				originalField.nullable === updatedField.nullable
			)
		}

		if (isRelation(originalField) && isRelation(updatedField)) {
			const basicMatch = (
				originalField.type === updatedField.type &&
				originalField.target === updatedField.target
			)

			if (this.hasNullableProperty(originalField) && this.hasNullableProperty(updatedField)) {
				return basicMatch && originalField.nullable === updatedField.nullable
			}

			return basicMatch
		}

		return false
	}

	private hasNullableProperty(relation: Model.AnyRelation): relation is Model.ManyHasOneRelation | Model.OneHasOneInverseRelation | Model.OneHasOneOwningRelation {
		return 'nullable' in relation
	}
}
