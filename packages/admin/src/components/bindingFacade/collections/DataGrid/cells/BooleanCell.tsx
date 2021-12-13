import { Component, QueryLanguage, wrapFilterInHasOnes } from '@contember/binding'
import type { Input } from '@contember/client'
import { Checkbox } from '@contember/ui'
import type { FunctionComponent } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { BooleanFieldView, BooleanFieldViewProps } from '../../../fieldViews'
import { DataGridColumn, DataGridColumnPublicProps, DataGridOrderDirection } from '../base'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'

export type BooleanCellProps =
	& DataGridColumnPublicProps
	& BooleanFieldViewProps
	& {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
	}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type BooleanFilterArtifacts = {
	includeTrue: boolean
	includeFalse: boolean
	includeNull: boolean
}

export const BooleanCell: FunctionComponent<BooleanCellProps> = Component(props => {
	return (
		<DataGridColumn<BooleanFilterArtifacts>
			shrunk
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection ? QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment) : undefined
			}
			getNewFilter={(filterArtifact, { environment }) => {
				const conditions: Input.Condition<boolean>[] = []

				if (filterArtifact.includeTrue) {
					conditions.push({ eq: true })
				}
				if (filterArtifact.includeFalse) {
					conditions.push({ eq: false })
				}
				if (filterArtifact.includeNull) {
					conditions.push({ isNull: true })
				}
				if (conditions.length === 0 || conditions.length === 3) {
					return undefined
				}

				const desugared = QueryLanguage.desugarRelativeSingleField(props.field, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: conditions.length > 1 ? { or: conditions } : conditions[0],
				})
			}}
			emptyFilter={{
				includeFalse: false,
				includeTrue: false,
				includeNull: false,
			}}
			filterRenderer={({ filter, setFilter }) => {
				const formatMessage = useMessageFormatter(dataGridCellsDictionary)
				return (
					<div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
						{(
							[
								['includeTrue', formatMessage('dataGridCells.booleanCell.includeTrue')],
								['includeFalse', formatMessage('dataGridCells.booleanCell.includeFalse')],
								['includeNull', formatMessage('dataGridCells.booleanCell.includeNull')],
							] as const
						).map(([item, label]) => (
							<Checkbox
								key={item}
								value={filter[item]}
								onChange={checked => {
									setFilter({ ...filter, [item]: checked })
								}}
							>
								{label}
							</Checkbox>
						))}
					</div>
				)
			}}
		>
			<BooleanFieldView {...props} />
		</DataGridColumn>
	)
}, 'BooleanCell')
