import { Classes, FormGroup, IFormGroupProps, IconName, Divider } from '@blueprintjs/core'
import cn from 'classnames'
import { isKeyHotkey } from 'is-hotkey'
import * as React from 'react'
import { Editor as CoreEditor, Value } from 'slate'
import HtmlSerializer from 'slate-html-serializer'
import { Editor, EditorProps, Plugin, EventHook } from 'slate-react'
import { BOLD, ITALIC, LINK, RichEditorPluginConfig, UNDERLINED, PARAGRAPH } from './configs'
import { ActionButton, Toolbar, getSlateController } from './utils'
import { assertNever } from 'cms-common'
import JsonSerializer from './JsonSerializer'
import { List } from 'immutable'
import { HEADING } from './configs/heading'

const isBoldHotkey = isKeyHotkey('mod+b')
const isItalicHotkey = isKeyHotkey('mod+i')
const isUnderlinedHotkey = isKeyHotkey('mod+u')

interface Serializer<F, T> {
	serialize(value: F): T
	deserialize(serialized: T): F
}

export enum RichEditorSerializer {
	HTML,
	JSON
}

export enum LineBreakBehaviour {
	NEWLINE = 'newline',
	NEWBLOCK = 'newblock',
	DISABLE = 'disable'
}

export interface RichEditorProps {
	inlineLabel?: boolean
	value: string
	onChange: (value: string) => void
	label?: IFormGroupProps['label']
	serializer: RichEditorSerializer
	lineBreakBehaviour: LineBreakBehaviour
	defaultBlock: Block
	blocks: { block: Block; marks?: Mark[] }[]
}

export interface RichTextFieldState {
	value: Value
}

const CONFIGS: RichEditorPluginConfig[] = [BOLD, ITALIC, UNDERLINED, LINK, PARAGRAPH, HEADING]

export enum Block {
	HEADING = 'heading',
	PARAGRAPH = 'paragraph'
}

export enum Mark {
	BOLD = 'bold',
	ITALIC = 'italic',
	UNDERLINED = 'underlined',
	LINK = 'link'
}

const blockConfigs: { [_ in Block]: RichEditorPluginConfig } = {
	[Block.HEADING]: HEADING,
	[Block.PARAGRAPH]: PARAGRAPH
}

const markConfigs: { [_ in Mark]: RichEditorPluginConfig } = {
	[Mark.BOLD]: BOLD,
	[Mark.ITALIC]: ITALIC,
	[Mark.UNDERLINED]: UNDERLINED,
	[Mark.LINK]: LINK
}

export default class RichEditor extends React.Component<RichEditorProps, RichTextFieldState> {
	serializer: Serializer<Value, string>
	plugins: Plugin[]
	editor?: Editor
	get coreEditor(): CoreEditor | undefined {
		return this.editor && getSlateController(this.editor.controller)
	}
	ref = (editor: Editor) => (this.editor = editor)

	static defaultProps: Partial<RichEditorProps> = {
		serializer: RichEditorSerializer.JSON,
		lineBreakBehaviour: LineBreakBehaviour.NEWBLOCK,
		blocks: [{ block: Block.HEADING }, { block: Block.PARAGRAPH, marks: [Mark.BOLD] }]
	}

	constructor(props: RichEditorProps) {
		super(props)
		const htmlSerializer = new HtmlSerializer({
			rules: CONFIGS.map(c => c.htmlSerializer)
		})
		this.serializer =
			props.serializer == RichEditorSerializer.HTML
				? htmlSerializer
				: props.serializer == RichEditorSerializer.JSON
					? new JsonSerializer(htmlSerializer)
					: assertNever(props.serializer)
		this.plugins = CONFIGS.map(c => c.plugin)
		this.state = { value: this.serializer.deserialize(props.value) }
	}

	private getIcon(node: Mark | Block): IconName {
		switch (node) {
			case Mark.BOLD:
				return 'bold'
			case Mark.ITALIC:
				return 'italic'
			case Mark.UNDERLINED:
				return 'underline'
			case Mark.LINK:
				return 'link'
			case Block.HEADING:
				return 'header'
			case Block.PARAGRAPH:
				return 'paragraph'
			default:
				return assertNever(node)
		}
	}

	public render() {
		const { blocks } = this.props
		const marksToShow = blocks.filter(block => this.isBlockActive(block.block)).flatMap(block => block.marks || [])
		return (
			<div className="editor">
				<FormGroup label={this.props.label}>
					<Toolbar>
						{blocks.length > 1 &&
							blocks.map(block => (
								<ActionButton
									icon={this.getIcon(block.block)}
									isActive={this.isBlockActive(block.block)}
									onClick={this.changeBlockMarkingTo(block.block)}
								/>
							))}
						{blocks.length > 1 && marksToShow.length > 0 && <Divider />}
						{marksToShow.map(mark => (
							<ActionButton
								icon={this.getIcon(mark)}
								isActive={this.isMarkActive(mark)}
								onClick={this.changeMarkMarkingTo(mark)}
							/>
						))}
					</Toolbar>
					<Editor
						ref={this.ref}
						className={cn(Classes.INPUT, 'input', 'view-autoHeight')}
						spellCheck
						plugins={this.plugins}
						value={this.state.value}
						onChange={this.onChange}
						onKeyDown={this.onKeyDown}
					/>
				</FormGroup>
			</div>
		)
	}

	private isMarkActive(mark: Mark): boolean {
		return this.state.value.activeMarks.some(node => node !== undefined && node.type === markConfigs[mark].type)
	}

	private isBlockActive(block: Block): boolean {
		return this.state.value.blocks.some(node => node !== undefined && node.type === blockConfigs[block].type)
	}

	private changeBlockMarkingTo(block: Block) {
		return this.changeMarkingTo(blockConfigs[block])
	}

	private changeMarkMarkingTo(mark: Mark) {
		return this.changeMarkingTo(markConfigs[mark])
	}

	private onMarkClickCache = new Map<RichEditorPluginConfig, () => unknown>()
	private changeMarkingTo(config: RichEditorPluginConfig): (() => unknown) {
		if (this.onMarkClickCache.has(config)) return this.onMarkClickCache.get(config)!
		else
			return this.onMarkClickCache
				.set(config, () => {
					if (this.coreEditor) {
						return config.onToggle(this.coreEditor)
					}
				})
				.get(config)!
	}

	/**
	 * On change, save the new `value`.
	 */
	lastChanged: string | null = null
	onChange = ({ value }: { value: Value }) => {
		const serialized = this.serializer.serialize(value)
		this.setState({ value })
		if (this.lastChanged !== null && this.lastChanged === serialized) {
			return
		}
		this.lastChanged = serialized
		this.props.onChange(serialized)
	}

	/**
	 * On key down, if it's a formatting command toggle a mark.
	 */
	private onKeyDown: EventHook = (event_: Event, editor: CoreEditor, next): unknown => {
		const event = event_ as KeyboardEvent

		let mark

		if (isBoldHotkey(event)) {
			mark = 'bold'
		} else if (isItalicHotkey(event)) {
			mark = 'italic'
		} else if (isUnderlinedHotkey(event)) {
			mark = 'underlined'
		} else if (event.key === 'Enter') {
			event.preventDefault()
			switch (this.props.lineBreakBehaviour) {
				case LineBreakBehaviour.DISABLE:
					break
				case LineBreakBehaviour.NEWLINE:
					editor.insertText('\n')
					break
				case LineBreakBehaviour.NEWBLOCK:
					if (editor.value.selection.isExpanded) {
						editor.delete()
					}
					editor.splitBlock(1)
					let first
					if (
						editor.value.anchorBlock.nodes.size == 1 &&
						(first = editor.value.anchorBlock.nodes.first()) &&
						first.object === 'text' &&
						first.text === ''
					) {
						editor.setBlocks({
							type: 'paragraph'
						})
					}
					break
				default:
					console.error(`Unknown lineBreakBehaviour ${this.props.lineBreakBehaviour} for RichEditor`)
					break
			}
			return
		} else {
			return next()
		}

		event.preventDefault()
		editor.toggleMark(mark)
		return
	}
}
