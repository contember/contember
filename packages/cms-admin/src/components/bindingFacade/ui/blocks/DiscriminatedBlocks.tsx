import { FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { RelativeSingleField } from '../../../../binding/bindingTypes'
import { Component } from '../../../../binding/coreComponents'
import { SelectFieldInner } from '../../fields'
import {
	ChoiceArity,
	ChoiceField,
	LiteralStaticOption,
	ScalarStaticOption,
	SingleChoiceFieldMetadata,
} from '../../fields/ChoiceField'
import { NormalizedDynamicBlockProps, NormalizedStaticBlockProps } from './Block'
import { useNormalizedBlockList } from './useNormalizedBlockList'

export interface DiscriminatedBlocksProps extends Omit<FormGroupProps, 'children'> {
	name: RelativeSingleField
	children: React.ReactNode

	allowBlockTypeChange?: boolean
}

export const DiscriminatedBlocks = Component<DiscriminatedBlocksProps>(
	props => {
		const normalizedBlockList = useNormalizedBlockList(props.children)
		const transformedBlockList = React.useMemo(
			() =>
				(normalizedBlockList as Array<NormalizedStaticBlockProps | NormalizedDynamicBlockProps>).map(item => ({
					...item,
					value: item.discriminateBy,
				})),
			[normalizedBlockList],
		) as ScalarStaticOption[] | LiteralStaticOption[]
		return (
			<ChoiceField name={props.name} options={transformedBlockList} arity={ChoiceArity.Single}>
				{({ data, currentValue, onChange, isMutating, environment, errors }: SingleChoiceFieldMetadata) => (
					<>
						{props.allowBlockTypeChange !== false && (
							<SelectFieldInner
								label={props.label}
								data={data}
								currentValue={currentValue}
								onChange={onChange}
								environment={environment}
								errors={errors}
								firstOptionCaption="Choose…"
								isMutating={isMutating}
							/>
						)}
						{currentValue in normalizedBlockList && normalizedBlockList[currentValue].children}
					</>
				)}
			</ChoiceField>
		)
	},
	(props, environment) => (
		<>
			{ChoiceField.generateSyntheticChildren(
				{
					name: props.name,
					arity: ChoiceArity.Single,
					options: [],
				},
				environment,
			)}
			{props.children}
		</>
	),
	'DiscriminatedBlocks',
)
