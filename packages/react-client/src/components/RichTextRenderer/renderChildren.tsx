import type { ReactElement } from 'react'
import type { BuiltinElements } from './BuiltinElements'
import type { BuiltinLeaves } from './BuiltinLeaves'
import { ElementRenderer, RenderElement } from './ElementRenderer'
import { LeafRenderer, RenderLeaf } from './LeafRenderer'
import type { RichTextElement } from './RichTextElement'
import type { RichTextLeaf } from './RichTextLeaf'

export interface RenderChildrenOptions<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
> {
	renderElement?: RenderElement<CustomElements, CustomLeaves>
	renderLeaf?: RenderLeaf<CustomLeaves>
	attributeNamePrefix?: string
}

export const renderChildren = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
>(
	children:
		| CustomElements
		| BuiltinElements<CustomElements, CustomLeaves>
		| CustomLeaves
		| BuiltinLeaves
		| Array<CustomElements | BuiltinElements<CustomElements, CustomLeaves> | CustomLeaves | BuiltinLeaves>,
	options: RenderChildrenOptions<CustomElements, CustomLeaves>,
): ReactElement => {
	if (!Array.isArray(children)) {
		children = [children]
	}
	return (
		<>
			{children.map((child, i) => {
				if ('text' in child) {
					return <LeafRenderer<CustomLeaves> key={i} leaf={child} renderLeaf={options.renderLeaf} />
				}
				if ('children' in child) {
					return (
						<ElementRenderer<CustomElements, CustomLeaves> key={i} element={child} options={options}>
							{renderChildren<CustomElements, CustomLeaves>(child.children as typeof children, options)}
						</ElementRenderer>
					)
				}
				return null // Throw?
			})}
		</>
	)
}
