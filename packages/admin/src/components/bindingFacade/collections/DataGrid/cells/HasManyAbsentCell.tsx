import {
	Component,
	EntityListBaseProps,
	HasMany,
	QueryLanguage,
	SugaredRelativeEntityList,
	wrapFilterInHasOnes,
} from '@contember/react-binding'
import { Checkbox, FieldContainer } from '@contember/ui'
import type { ComponentType, FunctionComponent, ReactElement, ReactNode } from 'react'
import type { FieldFallbackViewPublicProps } from '../../../fieldViews'
import { DataGridColumn, DataGridColumnPublicProps } from '../base'

export type HasManyAbsentCellProps =
	& DataGridColumnPublicProps
	& FieldFallbackViewPublicProps
	& SugaredRelativeEntityList
	& {
		render: ComponentType<EntityListBaseProps>
		children: ReactNode
	}

/**
 * Cell for displaying has-many values. Allows only simple filter whether the list is empty or not. For most cases, {@link HasManySelectCell} is recommended.
 *
 * @group Data grid
 */
export const HasManyAbsentCell: FunctionComponent<HasManyAbsentCellProps> = Component(props => {
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
				return <FieldContainer
					display="inline"
					label="Has any"
					labelPosition="right"
				>
					<Checkbox notNull value={filter} onChange={checked => setFilter(!!checked)} />
				</FieldContainer>
			}}
		>
			<HasMany {...props} listComponent={props.render} />
		</DataGridColumn>
	)
}, 'HasManyAbsentCell') as (props: HasManyAbsentCellProps) => ReactElement
