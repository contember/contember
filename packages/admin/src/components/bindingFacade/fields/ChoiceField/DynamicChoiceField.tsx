import {
	Component,
	EntityListSubTree,
	Field,
	HasMany,
	HasOne,
	QueryLanguage,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
} from '@contember/binding'
import { useConstantValueInvariant } from '@contember/react-utils'
import { assertNever } from '@contember/utils'
import * as React from 'react'
import { ChoiceFieldData } from './ChoiceFieldData'
import { DynamicMultipleChoiceFieldProps, useDynamicMultipleChoiceField } from './useDynamicMultipleChoiceField'
import { DynamicSingleChoiceFieldProps, useDynamicSingleChoiceField } from './useDynamicSingleChoiceField'

export type DynamicChoiceFieldProps =
	| ({
			arity: 'single'
	  } & DynamicSingleChoiceFieldProps)
	| ({
			arity: 'multiple'
	  } & DynamicMultipleChoiceFieldProps)

export const DynamicChoiceField = Component<DynamicChoiceFieldProps & ChoiceFieldData.MetadataPropsByArity>(
	props => {
		useConstantValueInvariant(props.arity, `Cannot change dynamic choice field arity between renders!`)

		// While this is correct, as enforced above by useConstantValueInvariant, I really would expect to have to silence
		// the rules of hooks lint rule. Why is it silent?!
		if (props.arity === 'multiple') {
			return props.children(useDynamicMultipleChoiceField(props))
		} else if (props.arity === 'single') {
			return props.children(useDynamicSingleChoiceField(props))
		}
		return assertNever(props)
	},
	(props: DynamicChoiceFieldProps & ChoiceFieldData.MetadataPropsByArity, environment) => {
		let reference: React.ReactNode
		let entityListDataProvider: React.ReactNode

		if (props.arity === 'single') {
			reference = <HasOne field={props.field} expectedMutation="connectOrDisconnect" />
		} else if (props.arity === 'multiple') {
			reference = <HasMany field={props.field} expectedMutation="connectOrDisconnect" initialEntityCount={0} />
		} else {
			assertNever(props)
		}

		// TODO const sugaredFields =
		// 		searchByFields === undefined ? [] : Array.isArray(searchByFields) ? searchByFields : [searchByFields]
		if ('renderOption' in props) {
			const sugaredEntityList: SugaredQualifiedEntityList =
				typeof props.options === 'string' || !('entities' in props.options)
					? {
							entities: props.options,
					  }
					: props.options
			entityListDataProvider = (
				<EntityListSubTree {...sugaredEntityList}>
					{typeof props.optionsStaticRender === 'function'
						? props.optionsStaticRender(environment)
						: props.optionsStaticRender}
				</EntityListSubTree>
			)
		} else {
			const sugaredFieldList: SugaredQualifiedFieldList =
				typeof props.options === 'string' || !('fields' in props.options)
					? {
							fields: props.options,
					  }
					: props.options
			const fieldList = QueryLanguage.desugarQualifiedFieldList(sugaredFieldList, environment)
			entityListDataProvider = (
				<EntityListSubTree {...fieldList} entities={fieldList}>
					<Field field={fieldList.field} />
				</EntityListSubTree>
			)
		}

		return (
			<>
				{entityListDataProvider}
				{reference}
			</>
		)
	},
	'DynamicChoiceField',
)
DynamicChoiceField.displayName = 'DynamicChoiceField'
