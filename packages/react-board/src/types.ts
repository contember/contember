import { ReactNode } from 'react'
import { SugaredQualifiedEntityList, SugaredRelativeEntityList, SugaredRelativeSingleEntity, SugaredRelativeSingleField } from '@contember/react-binding'

export type BoardDynamicColumnsBindingProps = {
	columns: SugaredQualifiedEntityList['entities']
	columnsSortableBy?: string | SugaredRelativeSingleField
	discriminationField: string | SugaredRelativeSingleEntity
}

export type BoardStaticColumnsBindingProps = {
	columns: {
		value: string,
		label: ReactNode
	}[]
	discriminationField: string | SugaredRelativeSingleField
}

export type BoardNullBehaviourProps = {
	nullColumn?: 'never' | 'always' | 'auto'
	nullColumnPlacement?: 'start' | 'end'
}
export type BoardCommonProps =
	& BoardNullBehaviourProps
	& {
		children: ReactNode
		sortableBy?: string | SugaredRelativeSingleField
		sortScope?: 'column' | 'board'
	}

export type BoardQualifiedItemsProps =
	& Pick<SugaredQualifiedEntityList, 'entities' | 'orderBy' | 'limit' | 'offset'>

export type BoardRelativeItemsProps =
	& Pick<SugaredRelativeEntityList, 'field' | 'orderBy' | 'limit' | 'offset'>


export type BoardQualifiedDynamicProps =
	& BoardCommonProps
	& BoardDynamicColumnsBindingProps
	& BoardQualifiedItemsProps

export type BoardRelativeDynamicProps =
	& BoardCommonProps
	& BoardDynamicColumnsBindingProps
	& BoardRelativeItemsProps

export type BoardQualifiedStaticProps =
	& BoardCommonProps
	& BoardStaticColumnsBindingProps
	& BoardQualifiedItemsProps

export type BoardRelativeStaticProps =
	& BoardCommonProps
	& BoardStaticColumnsBindingProps
	& BoardRelativeItemsProps

export type BoardBaseProps<RendererExtraProps> =
	& (
		| BoardQualifiedDynamicProps
		| BoardRelativeDynamicProps
		| BoardQualifiedStaticProps
		| BoardRelativeStaticProps
	)
	& RendererExtraProps
