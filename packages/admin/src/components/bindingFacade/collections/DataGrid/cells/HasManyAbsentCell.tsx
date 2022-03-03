import {
	Component,
	EntityListBaseProps,
	HasMany,
	QueryLanguage,
	SugaredRelativeEntityList,
	wrapFilterInHasOnes,
} from '@contember/binding'
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
					label="Has any"
					labelPosition="labelInlineRight"
				>
					<Checkbox value={filter} onChange={checked => setFilter(!!checked)} />
				</FieldContainer>
			}}
		>
			<HasMany {...props} listComponent={props.render} />
		</DataGridColumn>
	)
}, 'HasManyAbsentCell') as (props: HasManyAbsentCellProps) => ReactElement
