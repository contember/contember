import { Component, Field, FieldValue, OptionallyVariableFieldValue, SugaredRelativeSingleField } from '@contember/react-binding'
import { ComponentType, ReactNode } from 'react'
import { useStaticSingleChoiceField } from './hooks/useStaticSingleChoiceField'
import { SelectFuseOptionsProps } from './hooks/useFuseFilteredOptions'
import { SingleChoiceFieldRendererProps } from './Renderers'

export interface StaticOption {
	label: ReactNode
	description?: ReactNode
}

export interface NormalizedStaticOption extends StaticOption {
	value: FieldValue
	searchKeywords: string
}

export interface OptionallyVariableStaticOption extends StaticOption {
	value: OptionallyVariableFieldValue
	searchKeywords?: string
}

export type StaticSingleChoiceFieldProps =
	& SugaredRelativeSingleField
	& SelectFuseOptionsProps<FieldValue>
	& {
		options: OptionallyVariableStaticOption[]
	}


export type AllStaticSingleChoiceFieldRendererProps<OwnRendererProps extends {}> =
	& StaticSingleChoiceFieldProps
	& SingleChoiceFieldRendererProps<FieldValue>
	& OwnRendererProps

export const createStaticSingleChoiceField = <RendererProps extends {}>({ FieldRenderer }: {
	FieldRenderer: ComponentType<AllStaticSingleChoiceFieldRendererProps<RendererProps>>
}) => Component<StaticSingleChoiceFieldProps & Omit<RendererProps, keyof AllStaticSingleChoiceFieldRendererProps<{}>>>(
	props => {
		const rendererProps = useStaticSingleChoiceField(props)

		return <FieldRenderer {...props as StaticSingleChoiceFieldProps & RendererProps} {...rendererProps} />
	},
	props => <Field {...props} />,
	'StaticSingleChoiceField',
)
