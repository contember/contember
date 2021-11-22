import { Component, SugaredRelativeSingleField } from '@contember/binding'
import type { FormGroupProps } from '@contember/ui'
import { FunctionComponent, ReactNode, useMemo } from 'react'
import { NativeSelectFieldInner, NormalizedStaticOption, StaticSingleChoiceField } from '../fields'
import { useStaticSingleChoiceField } from '../fields/ChoiceField/useStaticSingleChoiceField'
import { useNormalizedBlocks } from './useNormalizedBlocks'

export interface DiscriminatedBlocksProps extends Omit<FormGroupProps, 'children'>, SugaredRelativeSingleField {
	children: ReactNode
	allowBlockTypeChange?: boolean
}

export const DiscriminatedBlocks: FunctionComponent<DiscriminatedBlocksProps> = Component(
	props => {
		const normalizedBlocks = useNormalizedBlocks(props.children)
		const blocksArray = useMemo(() => Array.from(normalizedBlocks.values()), [normalizedBlocks])
		const transformedBlockList = useMemo<NormalizedStaticOption[]>(
			() =>
				blocksArray.map(item => ({
					...item,
					label: item.datum.label,
					value: item.discriminateBy,
					searchKeywords: typeof item.datum.label === 'string' ? item.datum.label : '',
				})),
			[blocksArray],
		)
		const metadata = useStaticSingleChoiceField({
			...props,
			options: transformedBlockList,
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
			<StaticSingleChoiceField {...(props as any)} options={[]} arity="single" isNonbearing={true} />
			{props.children}
		</>
	),
	'DiscriminatedBlocks',
)
