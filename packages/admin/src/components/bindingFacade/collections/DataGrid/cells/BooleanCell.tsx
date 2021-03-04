import { Component, Field, QueryLanguage, SugaredRelativeSingleField, wrapFilterInHasOnes } from '@contember/binding'
import { Input } from '@contember/client'
import * as React from 'react'
import { Checkbox } from '../../../../ui'
import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../fieldViews'
import { DataGridCellPublicProps, DataGridColumn, DataGridHeaderCellPublicProps, DataGridOrderDirection } from '../base'

export type BooleanCellProps = DataGridHeaderCellPublicProps &
	DataGridCellPublicProps &
	FieldFallbackViewPublicProps &
	SugaredRelativeSingleField & {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
		format?: (value: boolean | null) => React.ReactNode
		booleanStyle?: 'yesNo' | 'checkCross' | 'oneZero'
	}

type SingleBooleanFilterArtifact = 'includeTrue' | 'includeFalse' | 'includeNull'

type BooleanFilterArtifacts = Set<SingleBooleanFilterArtifact>

export const BooleanCell: React.FunctionComponent<BooleanCellProps> = Component(props => {
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

				const desugared = QueryLanguage.desugarRelativeSingleField(props, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: conditions.length > 1 ? { or: conditions } : conditions[0],
				})
			}}
			emptyFilter={new Set()}
			filterRenderer={({ filter, setFilter }) => (
				<div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
					{([
						['includeTrue', 'Yes'],
						['includeFalse', 'No'],
						['includeNull', 'N/A'],
					] as const).map(([item, label]) => (
						<Checkbox
							key={item}
							checked={filter.has(item)}
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
			)}
		>
			<Field
				{...props}
				format={value => {
					if (value === null) {
						return <FieldFallbackView fallback={props.fallback} fallbackStyle={props.fallbackStyle} />
					}
					if (props.format) {
						return props.format(value as boolean)
					}
					switch (props.booleanStyle) {
						case 'checkCross':
							return value ? '✔' : '❌'
						case 'oneZero':
							return value ? '1' : '0'
						case 'yesNo':
						default:
							return value ? 'Yes' : 'No'
					}
				}}
			/>
		</DataGridColumn>
	)
}, 'BooleanCell')
