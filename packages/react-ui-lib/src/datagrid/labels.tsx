import { SugaredRelativeEntityList, SugaredRelativeSingleEntity, SugaredRelativeSingleField } from '@contember/interface'
import { useDataViewTargetFieldSchema, useDataViewTargetHasManySchema, useDataViewTargetHasOneSchema } from '@contember/react-dataview'
import { useFieldLabelFormatter } from '../labels'

export const DataViewFieldLabel = ({ field }: { field: SugaredRelativeSingleField['field'] }) => {
	const { field: targetField, entity } = useDataViewTargetFieldSchema(field)
	const formatter = useFieldLabelFormatter()
	return <>{formatter(entity.name, targetField.name)}</>
}


export const DataViewHasOneLabel = ({ field }: { field: SugaredRelativeSingleEntity['field'] }) => {
	const { field: targetField, entity } = useDataViewTargetHasOneSchema(field)
	const formatter = useFieldLabelFormatter()
	return <>{formatter(entity.name, targetField.name)}</>
}
export const DataViewHasManyLabel = ({ field }: { field: SugaredRelativeEntityList['field'] }) => {
	const { field: targetField, entity } = useDataViewTargetHasManySchema(field)
	const formatter = useFieldLabelFormatter()
	return <>{formatter(entity.name, targetField.name)}</>
}

