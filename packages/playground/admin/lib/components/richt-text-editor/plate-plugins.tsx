import { withProps } from '@udecode/cn'
import {
	autoformatArrow,
	autoformatLegal,
	autoformatMath,
	autoformatPunctuation,
	createAutoformatPlugin,
} from '@udecode/plate-autoformat'
import {
	createBoldPlugin,
	createItalicPlugin,
	createStrikethroughPlugin,
	createUnderlinePlugin,
	MARK_BOLD,
	MARK_ITALIC,
	MARK_STRIKETHROUGH,
	MARK_UNDERLINE,
} from '@udecode/plate-basic-marks'
import { createPlugins, PlateElement, PlateLeaf, RenderAfterEditable } from '@udecode/plate-common'
import { createDndPlugin } from '@udecode/plate-dnd'
import {
	createHeadingPlugin,
	ELEMENT_H1,
	ELEMENT_H2,
	ELEMENT_H3,
	ELEMENT_H4,
	ELEMENT_H5,
	ELEMENT_H6,
} from '@udecode/plate-heading'
import { createLinkPlugin, ELEMENT_LINK } from '@udecode/plate-link'
import { createListPlugin, ELEMENT_LI, ELEMENT_OL, ELEMENT_UL } from '@udecode/plate-list'
import { createNodeIdPlugin } from '@udecode/plate-node-id'
import { createParagraphPlugin, ELEMENT_PARAGRAPH } from '@udecode/plate-paragraph'
import { createDeserializeDocxPlugin } from '@udecode/plate-serializer-docx'
import { createDeserializeMdPlugin } from '@udecode/plate-serializer-md'
import { autoFormatBlocks, autoFormatMarks } from './lib/auto-format'
import { dragOverCursorPlugin } from './lib/drag-over-plugin'
import { HeadingElement } from './plate-ui/heading-element'
import { LinkElement } from './plate-ui/link-element'
import { LinkFloatingToolbar } from './plate-ui/link-floating-toolbar'
import { ListElement } from './plate-ui/list-element'
import { ParagraphElement } from './plate-ui/paragraph-element'
import { withPlaceholders } from './plate-ui/placeholder'
import { withDraggables } from './plate-ui/with-draggables'

export const plugins = createPlugins([
	// Nodes
	createParagraphPlugin(),
	createHeadingPlugin(),
	createNodeIdPlugin(),
	createDndPlugin({
		options: { enableScroller: true },
	}),
	createLinkPlugin({
		renderAfterEditable: LinkFloatingToolbar as RenderAfterEditable,
	}),

	// Marks
	createBoldPlugin(),
	createItalicPlugin(),
	createStrikethroughPlugin(),
	createUnderlinePlugin(),

	// Block style
	createListPlugin(),

	// Functionality
	createAutoformatPlugin({
		options: {
			rules: [
				...autoFormatBlocks,
				...autoFormatMarks,
				...autoformatPunctuation,
				...autoformatLegal,
				...autoformatArrow,
				...autoformatMath,
			],
			enableUndoOnDelete: true,
		},
	}),
	dragOverCursorPlugin,

	// Deserialization
	createDeserializeDocxPlugin(),
	createDeserializeMdPlugin(),
], {
	components: withDraggables(
		withPlaceholders({
			[ELEMENT_LINK]: LinkElement,
			[ELEMENT_H1]: withProps(HeadingElement, { variant: 'h1' }),
			[ELEMENT_H2]: withProps(HeadingElement, { variant: 'h2' }),
			[ELEMENT_H3]: withProps(HeadingElement, { variant: 'h3' }),
			[ELEMENT_H4]: withProps(HeadingElement, { variant: 'h4' }),
			[ELEMENT_H5]: withProps(HeadingElement, { variant: 'h5' }),
			[ELEMENT_H6]: withProps(HeadingElement, { variant: 'h6' }),
			[ELEMENT_PARAGRAPH]: ParagraphElement,
			[MARK_BOLD]: withProps(PlateLeaf, { as: 'strong' }),
			[MARK_ITALIC]: withProps(PlateLeaf, { as: 'em' }),
			[MARK_STRIKETHROUGH]: withProps(PlateLeaf, { as: 's' }),
			[MARK_UNDERLINE]: withProps(PlateLeaf, { as: 'u' }),
			[ELEMENT_UL]: withProps(ListElement, { variant: 'ul' }),
			[ELEMENT_OL]: withProps(ListElement, { variant: 'ol' }),
			[ELEMENT_LI]: withProps(PlateElement, { as: 'li' }),
		}),
	),
})
