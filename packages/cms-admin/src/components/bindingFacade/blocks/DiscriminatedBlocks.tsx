import { FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { Component, SugaredRelativeSingleField } from '../../../binding'
import { NormalizedStaticOption, SelectFieldInner, StaticChoiceField, useStaticChoiceField } from '../fields'
import { NormalizedDynamicBlockProps, NormalizedStaticBlockProps } from './Block'
import { useNormalizedBlockList } from './useNormalizedBlockList'

export interface DiscriminatedBlocksProps extends Omit<FormGroupProps, 'children'>, SugaredRelativeSingleField {
	children: React.ReactNode
	allowBlockTypeChange?: boolean
}

export const DiscriminatedBlocks = Component<DiscriminatedBlocksProps>(
	props => {
		const normalizedBlockList = useNormalizedBlockList(props.children)
		const transformedBlockList = React.useMemo<NormalizedStaticOption[]>(
			() =>
				(normalizedBlockList as Array<NormalizedStaticBlockProps | NormalizedDynamicBlockProps>).map(item => ({
					...item,
					label: item.label,
					value: item.discriminateBy,
				})),
			[normalizedBlockList],
		)
		const metadata = useStaticChoiceField({
			...props,
			options: transformedBlockList,
			arity: 'single',
		})
		return (
			<>
				{props.allowBlockTypeChange !== false && (
					<SelectFieldInner
						label={props.label}
						data={metadata.data}
						currentValue={metadata.currentValue}
						onChange={metadata.onChange}
						environment={metadata.environment}
						errors={metadata.errors}
						firstOptionCaption="Choose…"
						isMutating={metadata.isMutating}
					/>
				)}
				{metadata.currentValue in normalizedBlockList && normalizedBlockList[metadata.currentValue].children}
			</>
		)
	},
	props => (
		<>
			<StaticChoiceField {...(props as any)} options={[]} arity="single" />
			{props.children}
		</>
	),
	'DiscriminatedBlocks',
)
