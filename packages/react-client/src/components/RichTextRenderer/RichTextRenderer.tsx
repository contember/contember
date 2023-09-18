import { ComponentType, createElement, memo, ReactElement, ReactNode, useMemo } from 'react'
import { defaultDeserialize } from './defaultDeserialize'
import type { RenderElement } from './ElementRenderer'
import type { RenderLeaf } from './LeafRenderer'
import type { NormalizedRichTextBlock } from './NormalizedRichTextBlock'
import type { ReferenceRenderer } from './ReferenceRenderer'
import { renderChildren } from './renderChildren'
import type { RichTextBlock } from './RichTextBlock'
import type { RichTextElement } from './RichTextElement'
import type { RichTextLeaf } from './RichTextLeaf'
import type { RichTextReference } from './RichTextReference'
import { RichTextRendererError } from './RichTextRendererError'
import { RichTextRenderMetadataContext } from './RichTextRenderMetadataContext'
import type { RootEditorNode } from './RootEditorNode'

export interface RichTextRendererFieldProps {
	source: string | null
}

export interface RichTextRendererBlockProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
> {
	blocks: readonly RichTextBlock[]
	referenceRenderers?: Record<string, ReferenceRenderer<any, CustomElements, CustomLeaves>>
	sourceField?: string
	referencesField?: string
	referenceDiscriminationField?: string
}

export type RichTextRendererProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
> = {
	deserialize?: (source: string) => RootEditorNode<CustomElements, CustomLeaves>
	renderElement?: RenderElement<CustomElements, CustomLeaves>
	renderLeaf?: RenderLeaf<CustomLeaves>
	attributeNamePrefix?: string
	renderBlock?: ComponentType<{ block: unknown, children?: ReactNode }>
} & (RichTextRendererFieldProps | RichTextRendererBlockProps<CustomElements, CustomLeaves>)

/**
 * @group Content rendering
 */
export const RichTextRenderer = memo(function RichTextRenderer<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
>({
	deserialize = defaultDeserialize,
	renderElement,
	renderLeaf,
	renderBlock = ({ children }) => <>{children}</>,
	attributeNamePrefix,
	...sourceProps
}: RichTextRendererProps<CustomElements, CustomLeaves>) {
	const normalizedSource = useMemo<NormalizedRichTextBlock<CustomElements, CustomLeaves>[]>(() => {
		if ('source' in sourceProps && !('blocks' in sourceProps)) {
			return [
				{
					content: sourceProps.source
						? deserialize(sourceProps.source)
						: {
							formatVersion: 0,
							children: [],
						},
					id: undefined,
					referencesField: undefined,
					referenceDiscriminationField: undefined,
					referenceRenderers: {},
					references: undefined,
				},
			]
		}
		if (!('source' in sourceProps)) {
			const sourceField = sourceProps.sourceField ?? 'source'
			const referencesField = sourceProps.referencesField ?? 'references'
			const referenceDiscriminationField = sourceProps.referenceDiscriminationField ?? 'type'

			return sourceProps.blocks.map(block => {
				if (!(sourceField in block)) {
					throw new RichTextRendererError(
						`Found a block without a '${sourceField}' field. ` +
						(sourceProps.sourceField === undefined
							? `The 'sourceField' prop has not been supplied, and so '${sourceField}' was used as a default.`
							: `That is what the 'sourceField' prop has been set to, and so either this is a typo, ` +
							`or the data supplied is invalid.`),
					)
				}
				const source = block[sourceField]
				if (typeof source !== 'string') {
					throw new RichTextRendererError(`Found a block whose source is not a string.`)
				}

				if (sourceProps.referencesField !== undefined && !(referencesField in block)) {
					throw new RichTextRendererError(
						`The 'referencesField' prop is set to '${referencesField}' but a block without such field ` +
						`has been encountered. Unless this is just a typo, ` +
						`if you do not wish to use references, avoid supplying the 'referencesField' prop.`,
					)
				}
				const references = block[referencesField]

				let normalizedReferences: Map<string, RichTextReference> | undefined = undefined
				if (references) {
					if (typeof Object(references)[Symbol.iterator] !== 'function') {
						throw new RichTextRendererError(`The set of references must be an iterable!`)
					}

					normalizedReferences = new Map()
					for (const reference of references as Iterable<RichTextReference>) {
						if (!('id' in reference)) {
							throw new RichTextRendererError(`Found a reference without an id field.`)
						}
						if (!(referenceDiscriminationField in reference)) {
							throw new RichTextRendererError(
								`Found a reference without a '${referenceDiscriminationField}' field. ` +
								(sourceProps.referenceDiscriminationField === undefined
									? `The 'referenceDiscriminationField' prop has not been supplied, ` +
									`and so '${referenceDiscriminationField}' was used as a default.`
									: `That is what the 'referenceDiscriminationField' prop has been set to, ` +
									`and so either this is a typo, or the data supplied is invalid.`),
							)
						}
						normalizedReferences.set(reference.id, reference)
					}
				}
				return {
					id: typeof block.id === 'string' ? block.id : undefined,
					content: deserialize(source),
					referenceDiscriminationField,
					referenceRenderers: sourceProps.referenceRenderers ?? {},
					referencesField,
					references: normalizedReferences,
				}
			})
		}
		throw new RichTextRendererError(`RichTextRenderer: invalid data supplied.`)
	}, [deserialize, sourceProps])

	return (
		<>
			{normalizedSource.map((block, i) => (
				<RichTextRenderMetadataContext.Provider
					key={block.id ?? i}
					value={{
						formatVersion: block.content.formatVersion,
						referenceRenderers: block.referenceRenderers,
						referencesField: block.referencesField,
						referenceDiscriminationField: block.referenceDiscriminationField,
						references: block.references,
					}}
				>
					{createElement(
						renderBlock, {
						block,
					}, renderChildren(block.content.children, {
						renderLeaf,
						renderElement,
						attributeNamePrefix,
					}),
					)}
				</RichTextRenderMetadataContext.Provider>
			))}
		</>
	)
}) as <CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = never>(
	props: RichTextRendererProps<CustomElements, CustomLeaves>,
) => ReactElement
