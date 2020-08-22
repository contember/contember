import * as React from 'react'
import { defaultDeserialize } from './defaultDeserialize'
import { RenderElement } from './ElementRenderer'
import { RenderLeaf } from './LeafRenderer'
import { renderChildren } from './renderChildren'
import { RichTextElement } from './RichTextElement'
import { RichTextFormatVersionContext } from './RichTextFormatVersionContext'
import { RichTextLeaf } from './RichTextLeaf'
import { RootEditorNode } from './RootEditorNode'

export interface RichTextRendererProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> {
	source: string
	deserialize?: (source: string) => RootEditorNode<CustomElements, CustomLeaves>
	renderElement?: RenderElement<CustomElements, CustomLeaves>
	renderLeaf?: RenderLeaf<CustomLeaves>
}

export const RichTextRenderer = React.memo(function RichTextRenderer<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
>({ source, deserialize, renderElement, renderLeaf }: RichTextRendererProps<CustomElements, CustomLeaves>) {
	const rootNode = React.useMemo(() => {
		if (deserialize) {
			return deserialize(source)
		}
		return defaultDeserialize<CustomElements, CustomLeaves>(source)
	}, [source, deserialize])

	return (
		<RichTextFormatVersionContext.Provider value={rootNode.formatVersion}>
			{renderChildren(rootNode.children, {
				renderLeaf,
				renderElement,
				formatVersion: rootNode.formatVersion,
			})}
		</RichTextFormatVersionContext.Provider>
	)
}) as <CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = never>(
	props: RichTextRendererProps<CustomElements, CustomLeaves>,
) => React.ReactElement | null
