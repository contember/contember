import { Component, SugaredRelativeSingleField } from '@contember/binding'
import { FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { NormalizedStaticOption, SelectFieldInner, StaticChoiceField, useStaticChoiceField } from '../fields'
import { NormalizedBlock } from './Block'
import { useNormalizedBlocks } from './useNormalizedBlocks'

export interface DiscriminatedBlocksProps extends Omit<FormGroupProps, 'children'>, SugaredRelativeSingleField {
	children: React.ReactNode
	allowBlockTypeChange?: boolean
}

export const DiscriminatedBlocks = Component<DiscriminatedBlocksProps>(
	props => {
		const normalizedBlockList = useNormalizedBlocks(props.children)
		const transformedBlockList = React.useMemo<NormalizedStaticOption[]>(
			() =>
				(normalizedBlockList as NormalizedBlock[]).map(item => ({
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
			<StaticChoiceField {...(props as any)} options={[]} arity="single" isNonbearing={true} />
			{props.children}
		</>
	),
	'DiscriminatedBlocks',
)
