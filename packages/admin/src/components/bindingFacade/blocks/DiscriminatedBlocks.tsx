import { Component, SugaredRelativeSingleField } from '@contember/binding'
import { FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { NativeSelectFieldInner, NormalizedStaticOption, StaticChoiceField, useStaticChoiceField } from '../fields'
import { useNormalizedBlocks } from './useNormalizedBlocks'

export interface DiscriminatedBlocksProps extends Omit<FormGroupProps, 'children'>, SugaredRelativeSingleField {
	children: React.ReactNode
	allowBlockTypeChange?: boolean
}

export const DiscriminatedBlocks: React.FunctionComponent<DiscriminatedBlocksProps> = Component(
	props => {
		const normalizedBlocks = useNormalizedBlocks(props.children)
		const blocksArray = React.useMemo(() => Array.from(normalizedBlocks.values()), [normalizedBlocks])
		const transformedBlockList = React.useMemo<NormalizedStaticOption[]>(
			() =>
				blocksArray.map(item => ({
					...item,
					label: item.datum.label,
					value: item.discriminateBy,
					searchKeywords: typeof item.datum.label === 'string' ? item.datum.label : '',
				})),
			[blocksArray],
		)
		const metadata = useStaticChoiceField({
			...props,
			options: transformedBlockList,
			arity: 'single',
		})
		return (
			<>
				{props.allowBlockTypeChange !== false && (
					<NativeSelectFieldInner
						label={props.label}
						data={metadata.data}
						currentValue={metadata.currentValue}
						onChange={metadata.onChange}
						environment={metadata.environment}
						errors={metadata.errors}
						placeholder="Choose…"
						isMutating={metadata.isMutating}
					/>
				)}
				{metadata.currentValue in blocksArray && blocksArray[metadata.currentValue].datum.children}
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
