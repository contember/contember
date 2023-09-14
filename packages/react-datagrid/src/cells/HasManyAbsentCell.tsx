import {
	Component,
	EntityListBaseProps,
	HasMany,
	QueryLanguage,
	SugaredRelativeEntityList,
	wrapFilterInHasOnes,
} from '@contember/react-binding'
import type { ComponentType, FunctionComponent, ReactElement, ReactNode } from 'react'
import { DataGridColumnCommonProps, FilterRendererProps } from '../types'
import { DataGridColumn } from '../grid'

export type HasManyAbsentCellProps =
	& DataGridColumnCommonProps
	& SugaredRelativeEntityList
	& {
		render: ComponentType<EntityListBaseProps>
		children: ReactNode
	}

export const createHasManyAbsentCell = <ColumnProps extends {}>({ FilterRenderer }: {
	FilterRenderer: ComponentType<FilterRendererProps<boolean>>,
}): FunctionComponent<HasManyAbsentCellProps & ColumnProps> =>  Component(props => {
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
			filterRenderer={FilterRenderer}
		>
			<HasMany {...props} listComponent={props.render} />
		</DataGridColumn>
	)
}, 'HasManyAbsentCell') as (props: HasManyAbsentCellProps) => ReactElement
