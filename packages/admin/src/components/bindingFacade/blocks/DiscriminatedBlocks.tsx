import { Component, SugaredRelativeSingleField } from '@contember/react-binding'
import type { FieldContainerProps } from '@contember/ui'
import { FunctionComponent, ReactNode, useMemo } from 'react'
import { ChoiceFieldData, NormalizedStaticOption, SelectFieldInner, StaticSingleChoiceField } from '../fields'
import { useStaticSingleChoiceField } from '../fields/ChoiceField/hooks/useStaticSingleChoiceField'
import { useNormalizedBlocks } from './useNormalizedBlocks'

export type DiscriminatedBlocksProps =
	& {
		children: ReactNode
		allowBlockTypeChange?: boolean
	}
	& FieldContainerProps
	& SugaredRelativeSingleField

/**
 * Renders different blocks based on a value in a discrimination field.
 *
 * @example
 * ```
 * <DiscriminatedBlocks label="Link" field="type">
 *   <Block discriminateBy="article" label="Articles">
 *     <SelectField options="Article.slug" field="article" label="Article" />
 *   </Block>
 *   <Block discriminateBy="url" label="External link">
 *     <TextField label="Url" field="url" />
 *   </Block>
 * </DiscriminatedBlocks>
 * ```
 *
 * @group Blocks and repeaters
 */
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
		const metadata: ChoiceFieldData.SingleChoiceFieldMetadata<any> = useStaticSingleChoiceField({
			...props,
			options: transformedBlockList,
		})
		return (
			<>
				{props.allowBlockTypeChange !== false && (
					<SelectFieldInner
						{...metadata}
						label={props.label}
						placeholder="Choose…"
					/>
				)}
				{metadata.currentValue && normalizedBlocks.get(metadata.currentValue.value)?.datum.children}
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
