import { FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { Component, RelativeSingleField } from '../../../binding'
import { ChoiceField, ChoiceFieldData, LiteralStaticOption, ScalarStaticOption, SelectFieldInner } from '../fields'
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
			<ChoiceField name={props.name} options={transformedBlockList} arity={ChoiceFieldData.ChoiceArity.Single}>
				{({
					data,
					currentValue,
					onChange,
					isMutating,
					environment,
					errors,
				}: ChoiceFieldData.SingleChoiceFieldMetadata) => (
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
					arity: ChoiceFieldData.ChoiceArity.Single,
					options: [],
				},
				environment,
			)}
			{props.children}
		</>
	),
	'DiscriminatedBlocks',
)
