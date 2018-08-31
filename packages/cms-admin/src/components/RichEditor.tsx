import { Button, Icon, Image, Toolbar } from './EditorComponents'
import { Editor, getEventRange, getEventTransfer } from 'slate-react'
import { isKeyHotkey } from 'is-hotkey'
// import { Value } from 'slate'
import * as React from 'react'
import Plain from 'slate-plain-serializer'
import isUrl from 'is-url'
import { LAST_CHILD_TYPE_INVALID } from 'slate-schema-violations'
import imageExtensions from '../data/image-extensions'

/**
 * Define the default node type.
 *
 * @type {String}
 */

const DEFAULT_NODE = 'paragraph'

/**
 * Define hotkey matchers.
 *
 * @type {Function}
 */

const isBoldHotkey = isKeyHotkey('mod+b')
const isItalicHotkey = isKeyHotkey('mod+i')
const isUnderlinedHotkey = isKeyHotkey('mod+u')
const isCodeHotkey = isKeyHotkey('mod+`')

/**
 * The rich text example.
 *
 * @type {Component}
 */

export default class RichEditor extends React.Component {
	/**
	 * Deserialize the initial editor value.
	 */
	state = {
		value: Plain.deserialize('')
	}

	/**
	 * Check if the current selection has a mark with `type` in it.
	 */
	hasMark = (type: string) => {
		const { value } = this.state
		return value.activeMarks.some((mark: any) => mark.type == type)
	}

	/**
	 * Check if the any of the currently selected blocks are of `type`.
	 */
	hasBlock = (type: string) => {
		const { value } = this.state
		return value.blocks.some((node: any) => node.type == type)
	}

	/**
	 * Check whether the current selection has a link in it.
	 */
	hasLinks = () => {
		const { value } = this.state
		return value.inlines.some((inline: any) => inline.type == 'link')
	}

	/**
	 * Render.
	 */
	render() {
		return (
			<div>
				<Toolbar>
					{this.renderMarkButton('bold', 'format_bold')}
					{this.renderMarkButton('italic', 'format_italic')}
					{this.renderMarkButton('underlined', 'format_underlined')}
					<Button active={this.hasLinks()} onMouseDown={this.onClickLink}>
						<Icon>link</Icon>
					</Button>
					<Button onMouseDown={this.onClickImage}>
						<Icon>image</Icon>
					</Button>
					{this.renderBlockButton('heading-one', 'looks_one')}
					{this.renderBlockButton('heading-two', 'looks_two')}
					{this.renderBlockButton('heading-three', 'looks_3')}
					{this.renderBlockButton('block-quote', 'format_quote')}
					{this.renderBlockButton('numbered-list', 'format_list_numbered')}
					{this.renderBlockButton('bulleted-list', 'format_list_bulleted')}
				</Toolbar>
				<Editor
					spellCheck
					autoFocus
					placeholder="Enter some rich text..."
					value={this.state.value}
					onChange={this.onChange}
					onKeyDown={this.onKeyDown}
					onPaste={this.onPaste}
					onDrop={this.onDropOrPaste}
					renderNode={this.renderNode}
					renderMark={this.renderMark}
				/>
			</div>
		)
	}

	/**
	 * Render a mark-toggling toolbar button.
	 */
	renderMarkButton = (type: string, icon: string) => {
		const isActive = this.hasMark(type)

		return (
			<Button active={isActive} onMouseDown={(event: any) => this.onClickMark(event, type)}>
				<Icon>{icon}</Icon>
			</Button>
		)
	}

	/**
	 * Render a block-toggling toolbar button.
	 */
	renderBlockButton = (type: string, icon: string) => {
		let isActive = this.hasBlock(type)

		if (['numbered-list', 'bulleted-list'].includes(type)) {
			const { value } = this.state
			const parent = value.document.getParent(value.blocks.first().key)
			isActive = this.hasBlock('list-item') && parent && parent.type === type
		}

		return (
			<Button active={isActive} onMouseDown={(event: any) => this.onClickBlock(event, type)}>
				<Icon>{icon}</Icon>
			</Button>
		)
	}

	/**
	 * Render a Slate node.
	 */
	renderNode = (props: any) => {
		const { attributes, children, node, isFocused } = props

		switch (node.type) {
			case 'block-quote':
				return <blockquote {...attributes}>{children}</blockquote>
			case 'bulleted-list':
				return <ul {...attributes}>{children}</ul>
			case 'heading-one':
				return <h1 {...attributes}>{children}</h1>
			case 'heading-two':
				return <h2 {...attributes}>{children}</h2>
			case 'heading-three':
				return <h3 {...attributes}>{children}</h3>
			case 'list-item':
				return <li {...attributes}>{children}</li>
			case 'numbered-list':
				return <ol {...attributes}>{children}</ol>
			case 'link': {
				const { data } = node
				const href = data.get('href')
				return (
					<a {...attributes} href={href}>
						{children}
					</a>
				)
			}
			case 'image': {
				const src = node.data.get('src')
				return <Image src={src} selected={isFocused} {...attributes} />
			}
		}
	}

	/**
	 * Render a Slate mark.
	 */
	renderMark = (props: any) => {
		const { children, mark, attributes } = props

		switch (mark.type) {
			case 'bold':
				return <strong {...attributes}>{children}</strong>
			case 'code':
				return <code {...attributes}>{children}</code>
			case 'italic':
				return <em {...attributes}>{children}</em>
			case 'underlined':
				return <u {...attributes}>{children}</u>
		}
	}

	/**
	 * On change, save the new `value`.
	 */
	onChange = ({ value }: any) => {
		this.setState({ value })
	}

	/**
	 * On key down, if it's a formatting command toggle a mark.
	 */
	onKeyDown = (event: KeyboardEvent, change: any) => {
		let mark

		if (isBoldHotkey(event)) {
			mark = 'bold'
		} else if (isItalicHotkey(event)) {
			mark = 'italic'
		} else if (isUnderlinedHotkey(event)) {
			mark = 'underlined'
		} else if (isCodeHotkey(event)) {
			mark = 'code'
		} else {
			return
		}

		event.preventDefault()
		change.toggleMark(mark)
		return true
	}

	/**
	 * When a mark button is clicked, toggle the current mark.
	 */
	onClickMark = (event: MouseEvent, type: any) => {
		event.preventDefault()
		const { value } = this.state
		const change = value.change().toggleMark(type)
		this.onChange(change)
	}

	/**
	 * When a block button is clicked, toggle the block type.
	 */
	onClickBlock = (event: MouseEvent, type: any) => {
		event.preventDefault()
		const { value } = this.state
		const change = value.change()
		const { document } = value

		// Handle everything but list buttons.
		if (type != 'bulleted-list' && type != 'numbered-list') {
			const isActive = this.hasBlock(type)
			const isList = this.hasBlock('list-item')

			if (isList) {
				change
					.setBlocks(isActive ? DEFAULT_NODE : type)
					.unwrapBlock('bulleted-list')
					.unwrapBlock('numbered-list')
			} else {
				change.setBlocks(isActive ? DEFAULT_NODE : type)
			}
		} else {
			// Handle the extra wrapping required for list buttons.
			const isList = this.hasBlock('list-item')
			const isType = value.blocks.some((block: any) => {
				return !!document.getClosest(block.key, (parent: any) => parent.type == type)
			})

			if (isList && isType) {
				change
					.setBlocks(DEFAULT_NODE)
					.unwrapBlock('bulleted-list')
					.unwrapBlock('numbered-list')
			} else if (isList) {
				change.unwrapBlock(type == 'bulleted-list' ? 'numbered-list' : 'bulleted-list').wrapBlock(type)
			} else {
				change.setBlocks('list-item').wrapBlock(type)
			}
		}

		this.onChange(change)
	}

	/**
	 * When clicking a link, if the selection has a link in it, remove the link.
	 * Otherwise, add a new link with an href and text.
	 */
	onClickLink = (event: MouseEvent) => {
		event.preventDefault()
		const { value } = this.state
		const hasLinks = this.hasLinks()
		const change = value.change()

		if (hasLinks) {
			change.call(unwrapLink)
		} else if (value.isExpanded) {
			const href = window.prompt('Enter the URL of the link:')
			change.call(wrapLink, href)
		} else {
			const href = '' + window.prompt('Enter the URL of the link:')
			const text = '' + window.prompt('Enter the text for the link:')

			change
				.insertText(text)
				.extend(0 - text.length)
				.call(wrapLink, href)
		}

		this.onChange(change)
	}

	/**
	 * On clicking the image button, prompt for an image and insert it.
	 */
	onClickImage = (event: MouseEvent) => {
		event.preventDefault()
		const src = window.prompt('Enter the URL of the image:')
		if (!src) return

		const change = this.state.value.change().call(insertImage, src)

		this.onChange(change)
	}

	/**
	 * On paste, if the text is a link, wrap the selection in a link.
	 */
	onPaste = (event: any, change: any) => {
		if (change.value.isCollapsed) return

		const transfer = getEventTransfer(event)
		const { type, text } = transfer
		if (type != 'text' && type != 'html') return
		if (!isUrl(text)) return

		if (this.hasLinks()) {
			change.call(unwrapLink)
		}

		change.call(wrapLink, text)
		return true
	}

	/**
	 * On drop, insert the image wherever it is dropped.
	 */
	onDropOrPaste = (event: any, change: any, editor: any) => {
		const target = getEventRange(event, change.value)
		if (!target && event.type == 'drop') return

		const transfer = getEventTransfer(event)
		const { type, text, files } = transfer

		if (type == 'files') {
			for (const file of files) {
				const reader = new FileReader()
				const [mime] = file.type.split('/')
				if (mime != 'image') continue

				reader.addEventListener('load', () => {
					editor.change((c: any) => {
						c.call(insertImage, reader.result, target)
					})
				})

				reader.readAsDataURL(file)
			}
		}

		if (type == 'text') {
			if (!isUrl(text)) return
			if (!isImage(text)) return
			change.call(insertImage, text, target)
		}
	}
}

/**
 * A change helper to standardize wrapping links.
 */
function wrapLink(change: any, href: string) {
	change.wrapInline({
		type: 'link',
		data: { href }
	})

	change.collapseToEnd()
}

/**
 * A change helper to standardize unwrapping links.
 */
function unwrapLink(change: any) {
	change.unwrapInline('link')
}

/**
 * A function to determine whether a URL has an image extension.
 */
function isImage(url: string) {
	return !!imageExtensions.find(url.endsWith)
}

/**
 * A change function to standardize inserting images.
 */
function insertImage(change: any, src: string, target: any) {
	if (target) {
		change.select(target)
	}

	change.insertBlock({
		type: 'image',
		isVoid: true,
		data: { src }
	})
}
