import {
	Component,
	Field,
	FieldValue,
	QueryLanguage,
	SugaredRelativeSingleField,
	wrapFilterInHasOnes,
} from '@contember/binding'
import * as React from 'react'
import { Checkbox } from '../../../../ui'
import { DataGridCellPublicProps, DataGridColumn, DataGridHeaderCellPublicProps, DataGridOrderDirection } from '../base'

export type BooleanCellProps = DataGridHeaderCellPublicProps &
	DataGridCellPublicProps &
	SugaredRelativeSingleField & {
		disableOrder?: boolean
		initialOrder?: DataGridOrderDirection
		format?: (value: boolean | null) => React.ReactNode
		fallback?: React.ReactNode
		booleanStyle?: 'yesNo' | 'checkCross' | 'oneZero'
	}

export const BooleanCell = Component<BooleanCellProps>(props => {
	return (
		<DataGridColumn<boolean>
			shrunk
			{...props}
			enableOrdering={!props.disableOrder as true}
			getNewOrderBy={(newDirection, { environment }) =>
				newDirection && QueryLanguage.desugarOrderBy(`${props.field as string} ${newDirection}`, environment)
			}
			getNewFilter={(filterArtifact, { environment }) => {
				const desugared = QueryLanguage.desugarRelativeSingleField(props, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.field]: filterArtifact
						? {
								eq: filterArtifact,
						  }
						: {
								or: [
									{
										eq: filterArtifact,
									},
									{ isNull: true },
								],
						  },
				})
			}}
			filterRenderer={({ filter, setFilter }) => (
				<Checkbox
					checked={filter ?? false}
					onChange={checked => {
						setFilter(checked)
					}}
				>
					{props.header}
				</Checkbox>
			)}
		>
			<Field
				{...props}
				format={value => {
					if (props.fallback !== undefined && value === null) {
						return props.fallback
					}
					if (props.format) {
						return props.format(value as boolean)
					}
					if (value === null) {
						return <i style={{ opacity: 0.4, fontSize: '0.75em' }}>N/A</i>
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
