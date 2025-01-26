import { Component, FieldView, SugaredRelativeSingleField } from '@contember/interface'
import { RichTextFieldRenderer, RichTextFieldRendererProps } from '@contember/react-client'

export type RichTextRendererProps =
	& {
		/** Field containing rich text content */
		field: SugaredRelativeSingleField['field']
	}
	& Omit<RichTextFieldRendererProps, 'source'>

/**
 * RichTextView component - Displays formatted rich text content from a Contember field
 *
 * #### Purpose
 * Renders stored rich text content with proper formatting and structure
 *
 * #### Features
 * - Safe JSON parsing of stored rich text data
 * - Conditional rendering when content is empty
 * - Integration with Contember's rich text rendering system
 * - Customizable through RichTextFieldRenderer props
 *
 * #### Example
 * ```tsx
 * <RichTextView field="content" />
 * ```
 *
 * #### Example with renderers
 * ```tsx
 * const renderLeaf = (leaf: Leaf) => {
 * 	let content = <>{leaf.text}</>
 *
 *  if (leaf.isBold) {
 *    content = <strong>{content}</strong>
 * 	}
 *
 * 	if (leaf.isItalic) {
 *    content = <em>{content}</em>
 * 	}
 *
 * 	if (leaf.isUnderlined) {
 *    content = <u>{content}</u>
 * 	}
 *
 * 	return content
 * }
 *
 * const renderElement = (element: RichTextElement, leafRenderer: LeafRenderer) => {
 *   if (isLeaf(element)) {
 *     return leafRenderer(element)
 *   }
 *
 *   if (element.type === 'anchor') {
 *     const children = element.children.map((child, index) => (
 *       <Fragment key={index}>
 *         {isLeaf(child) && leafRenderer(child)}
 *       </Fragment>
 *     ))
 *
 *     return (
 *       <a href={element.href}>
 *         {children}
 *       </a>
 *     )
 *   }
 *
 *   return null
 * }
 *
 * <RichTextView
 *   field="content"
 *   renderLeaf={renderLeaf}
 *   renderElement={renderElement}
 *   referenceRenderers={{
 *      image: ({ reference }) => <img src={reference.url} />
 *   }}
 * />
 * ```
 */
export const RichTextView = Component<RichTextRendererProps>(({ field, ...props }) => {
	return <FieldView<string> field={field} render={it => {
		if (!it.value) {
			return null
		}
		return <RichTextFieldRenderer source={JSON.parse(it.value)} {...props} />
	}} />
})
