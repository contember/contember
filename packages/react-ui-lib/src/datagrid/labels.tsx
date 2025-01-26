import { SugaredRelativeEntityList, SugaredRelativeSingleEntity, SugaredRelativeSingleField } from '@contember/interface'
import { useDataViewTargetFieldSchema, useDataViewTargetHasManySchema, useDataViewTargetHasOneSchema } from '@contember/react-dataview'
import { useFieldLabelFormatter } from '../labels'

/**
 * `DataViewFieldLabel` renders a label for a specific field within an entity.
 * It utilizes schema information to determine the appropriate label.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <DataViewFieldLabel field="title" />
 * ```
 */
export const DataViewFieldLabel = ({ field }: { field: SugaredRelativeSingleField['field'] }) => {
	const { field: targetField, entity } = useDataViewTargetFieldSchema(field)
	const formatter = useFieldLabelFormatter()
	return <>{formatter(entity.name, targetField.name)}</>
}

/**
 * `DataViewHasOneLabel` renders a label for a has-one relation field within an entity.
 * It extracts the label dynamically from the entity schema.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <DataViewHasOneLabel field="author" />
 * ```
 */
export const DataViewHasOneLabel = ({ field }: { field: SugaredRelativeSingleEntity['field'] }) => {
	const { field: targetField, entity } = useDataViewTargetHasOneSchema(field)
	const formatter = useFieldLabelFormatter()
	return <>{formatter(entity.name, targetField.name)}</>
}

/**
 * `DataViewHasManyLabel` renders a label for a has-many relation field within an entity.
 * It retrieves the correct label dynamically based on the entity schema.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <DataViewHasManyLabel field="comments" />
 * ```
 */
export const DataViewHasManyLabel = ({ field }: { field: SugaredRelativeEntityList['field'] }) => {
	const { field: targetField, entity } = useDataViewTargetHasManySchema(field)
	const formatter = useFieldLabelFormatter()
	return <>{formatter(entity.name, targetField.name)}</>
}
