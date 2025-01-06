import { SugaredRelativeEntityList, SugaredRelativeSingleEntity, SugaredRelativeSingleField } from '@contember/interface'
import { useDataViewTargetFieldSchema, useDataViewTargetHasManySchema, useDataViewTargetHasOneSchema } from '@contember/react-dataview'
import { useFieldLabelFormatter } from '../labels'

/**
 * Utility component that renders a label for a field.
 */
export const DataViewFieldLabel = ({ field }: { field: SugaredRelativeSingleField['field'] }) => {
	const { field: targetField, entity } = useDataViewTargetFieldSchema(field)
	const formatter = useFieldLabelFormatter()
	return <>{formatter(entity.name, targetField.name)}</>
}

/**
 * Utility component that renders a label for a has-one relation.
 */
export const DataViewHasOneLabel = ({ field }: { field: SugaredRelativeSingleEntity['field'] }) => {
	const { field: targetField, entity } = useDataViewTargetHasOneSchema(field)
	const formatter = useFieldLabelFormatter()
	return <>{formatter(entity.name, targetField.name)}</>
}

/**
 * Utility component that renders a label for a has-many relation.
 */
export const DataViewHasManyLabel = ({ field }: { field: SugaredRelativeEntityList['field'] }) => {
	const { field: targetField, entity } = useDataViewTargetHasManySchema(field)
	const formatter = useFieldLabelFormatter()
	return <>{formatter(entity.name, targetField.name)}</>
}

