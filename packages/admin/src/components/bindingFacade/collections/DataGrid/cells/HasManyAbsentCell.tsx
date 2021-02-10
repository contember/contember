import {
	Component,
	EntityListBaseProps,
	HasMany,
	QueryLanguage,
	SugaredRelativeEntityList,
	wrapFilterInHasOnes,
} from '@contember/binding'
import * as React from 'react'
import { Checkbox } from '../../../../ui'
import { FieldFallbackViewPublicProps } from '../../../fieldViews'
import { DataGridCellPublicProps, DataGridColumn, DataGridHeaderCellPublicProps } from '../base'

export type HasManyAbsentCellProps = DataGridHeaderCellPublicProps &
	DataGridCellPublicProps &
	FieldFallbackViewPublicProps &
	SugaredRelativeEntityList & {
		render: React.ComponentType<EntityListBaseProps>
		children: React.ReactNode
	}

export const HasManyAbsentCell = Component<HasManyAbsentCellProps>(props => {
	return (
		<DataGridColumn<boolean>
			{...props}
			enableOrdering={false}
			getNewFilter={(filter, { environment }) => {
				if (filter === false) {
					return undefined
				}

				const desugared = QueryLanguage.desugarRelativeEntityList(props, environment)
				return wrapFilterInHasOnes(desugared.hasOneRelationPath, {
					[desugared.hasManyRelation.field]: {
						id: {
							not: { isNull: true },
						},
					},
				})
			}}
			emptyFilter={false}
			filterRenderer={({ filter, setFilter }) => {
				return (
					<Checkbox checked={filter} onChange={checked => setFilter(checked)}>
						Has any
					</Checkbox>
				)
			}}
		>
			<HasMany {...props} listComponent={props.render} />
		</DataGridColumn>
	)
}, 'HasManyAbsentCell') as (props: HasManyAbsentCellProps) => React.ReactElement
