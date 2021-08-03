import { Component, QueryLanguage, wrapFilterInHasOnes } from '@contember/binding'
import type { Input } from '@contember/client'
import { Checkbox } from '@contember/ui'
import type { FunctionComponent } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { BooleanFieldView, BooleanFieldViewProps } from '../../../fieldViews'
import { DataGridCellPublicProps, DataGridColumn, DataGridHeaderCellPublicProps, DataGridOrderDirection } from '../base'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'

export type BooleanCellProps = DataGridHeaderCellPublicProps &
	DataGridCellPublicProps &
	BooleanFieldViewProps & {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
	}

type SingleBooleanFilterArtifact = 'includeTrue' | 'includeFalse' | 'includeNull'

type BooleanFilterArtifacts = Set<SingleBooleanFilterArtifact>

export const BooleanCell: FunctionComponent<BooleanCellProps> = Component(props => {
	return (
		<DataGridColumn<BooleanFilterArtifacts>
			shrunk
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection && QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment)
			}
			getNewFilter={(filterArtifact, { environment }) => {
				const conditions: Input.Condition<boolean>[] = []

				if (filterArtifact.has('includeTrue')) {
					conditions.push({ eq: true })
				}
				if (filterArtifact.has('includeFalse')) {
					conditions.push({ eq: false })
				}
				if (filterArtifact.has('includeNull')) {
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
			emptyFilter={new Set()}
			filterRenderer={({ filter, setFilter }) => {
				const formatMessage = useMessageFormatter(dataGridCellsDictionary)
				return (
					<div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
						{(
							[
								['includeTrue', formatMessage('dataGirdCells.booleanCell.includeTrue')],
								['includeFalse', formatMessage('dataGirdCells.booleanCell.includeFalse')],
								['includeNull', formatMessage('dataGirdCells.booleanCell.includeNull')],
							] as const
						).map(([item, label]) => (
							<Checkbox
								key={item}
								value={filter.has(item)}
								onChange={checked => {
									const clone: BooleanFilterArtifacts = new Set(filter)

									if (checked) {
										clone.add(item)
									} else {
										clone.delete(item)
									}

									setFilter(clone)
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
