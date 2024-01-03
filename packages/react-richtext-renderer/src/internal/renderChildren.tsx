import type { ReactElement } from 'react'
import { ElementRenderer } from './components/ElementRenderer'
import { LeafRenderer } from './components/LeafRenderer'
import type { RichTextElement } from '../types/structure/RichTextElement'
import type { RichTextLeaf } from '../types/structure/RichTextLeaf'
import { RichTextRenderingOptions } from '../types/RichTextRenderingOptions'
import { RichTextBlock } from '../types/RichTextBlock'
import { RichTextChild } from '../types/structure/RichTextChild'

export const renderChildren = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
>(
	children:
		| RichTextChild<CustomElements, CustomLeaves>
		| readonly RichTextChild<CustomElements, CustomLeaves>[],
	options: RichTextRenderingOptions<CustomElements, CustomLeaves>,
	block: RichTextBlock<CustomElements, CustomLeaves>,
): ReactElement => {
	return (
		<>
			{(Array.isArray(children) ? children : [children]).map((child, i) => {
				if ('text' in child) {
					return <LeafRenderer<CustomElements, CustomLeaves> key={i} leaf={child} options={options} block={block} />
				}
				if ('children' in child) {
					return (
						<ElementRenderer<CustomElements, CustomLeaves> key={i} element={child} options={options} block={block}>
							{renderChildren<CustomElements, CustomLeaves>(child.children as typeof children, options, block)}
						</ElementRenderer>
					)
				}
				return null // Throw?
			})}
		</>
	)
}
