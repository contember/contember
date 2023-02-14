import { QueryLanguage, SugarableRelativeSingleField } from '@contember/react-binding'
import { Checkbox, FieldContainer } from '@contember/ui'
import { useMessageFormatter } from '../../../../../../i18n'
import { dataGridCellsDictionary } from '../dict/dataGridCellsDictionary'
import { FilterRendererProps } from '../../types'

export type NullConditionArtifacts = { nullCondition: boolean }

export type NullConditionFilterPublicProps = {
	showNullConditionFilter?: boolean
}

export type NullConditionFilterProps<FA extends NullConditionArtifacts> =
	& FilterRendererProps<FA>
	& NullConditionFilterPublicProps
	& {
		field: SugarableRelativeSingleField | string
	}

export const NullConditionFilter = <FA extends NullConditionArtifacts>({ filter, setFilter, field, environment, showNullConditionFilter }: NullConditionFilterProps<FA>) => {
	const formatMessage = useMessageFormatter(dataGridCellsDictionary)
	const desugared = QueryLanguage.desugarRelativeSingleField({ field }, environment)
	const entitySchema = environment.getSubTreeNode().entity
	const fieldSchema = entitySchema.fields.get(desugared.field)
	const showFilter = showNullConditionFilter ?? fieldSchema?.nullable === true
	if (!showFilter) {
		return null
	}

	return (
		<FieldContainer
			key={'__null'}
			label={<i style={{ opacity: 0.8, fontWeight: 'normal' }}>
				{formatMessage('dataGridCells.includeNull')}
			</i>}
			display="inline"
			labelPosition="right"
		>
			<Checkbox
				notNull
				value={filter.nullCondition}
				onChange={checked => {
					setFilter({
						...filter,
						nullCondition: !!checked,
					})
				}}
			/>
		</FieldContainer>
	)
}
