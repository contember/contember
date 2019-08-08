import { IconName, Divider } from '@blueprintjs/core'
import cn from 'classnames'
import { isKeyHotkey } from 'is-hotkey'
import * as React from 'react'
import { Editor as CoreEditor, Value } from 'slate'
import HtmlSerializer from 'slate-html-serializer'
import { Editor, Plugin, EventHook } from 'slate-react'
import { BOLD, ITALIC, LINK, UNDERLINED, PARAGRAPH, HEADING, RichEditorPluginConfig } from './configs'
import { ActionButton, Toolbar, getSlateController } from './utils'
import { assertNever } from 'cms-common'
import JsonSerializer from './JsonSerializer'
import { IconNames } from '@blueprintjs/icons'
import { FormGroup, FormGroupProps } from '../ui'

const isBoldHotkey = isKeyHotkey('mod+b')
const isItalicHotkey = isKeyHotkey('mod+i')
const isUnderlinedHotkey = isKeyHotkey('mod+u')

interface Serializer<F, T> {
	serialize(value: F): T
	deserialize(serialized: T): F
}

export enum RichEditorSerializer {
	HTML,
	JSON,
}

export enum LineBreakBehavior {
	NEWLINE = 'newline',
	NEWBLOCK = 'newblock',
	DISABLE = 'disable',
	SMART = 'smart',
}

export interface RichEditorProps {
	inlineLabel?: boolean
	value: string
	onChange: (value: string) => void
	label?: FormGroupProps['label']
	errors?: FormGroupProps['errors']
	serializer: RichEditorSerializer
	lineBreakBehavior: LineBreakBehavior
	defaultBlock: Block
	blocks: { block: Block; marks?: Mark[] }[]
	readOnly?: boolean
}

export interface RichTextFieldState {
	value: Value
}

const CONFIGS: RichEditorPluginConfig[] = [BOLD, ITALIC, UNDERLINED, LINK, PARAGRAPH, HEADING]

export enum Block {
	HEADING = 'heading',
	PARAGRAPH = 'paragraph',
}

export enum Mark {
	BOLD = 'bold',
	ITALIC = 'italic',
	UNDERLINED = 'underlined',
	LINK = 'link',
}

const blockConfigs: { [_ in Block]: RichEditorPluginConfig } = {
	[Block.HEADING]: HEADING,
	[Block.PARAGRAPH]: PARAGRAPH,
}

const markConfigs: { [_ in Mark]: RichEditorPluginConfig } = {
	[Mark.BOLD]: BOLD,
	[Mark.ITALIC]: ITALIC,
	[Mark.UNDERLINED]: UNDERLINED,
	[Mark.LINK]: LINK,
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
		lineBreakBehavior: LineBreakBehavior.NEWBLOCK,
		blocks: [{ block: Block.HEADING }, { block: Block.PARAGRAPH, marks: [Mark.BOLD] }],
	}

	constructor(props: RichEditorProps) {
		super(props)
		const htmlSerializer = new HtmlSerializer({
			rules: CONFIGS.map(c => c.htmlSerializer),
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
				return IconNames.BOLD
			case Mark.ITALIC:
				return IconNames.ITALIC
			case Mark.UNDERLINED:
				return IconNames.UNDERLINE
			case Mark.LINK:
				return IconNames.LINK
			case Block.HEADING:
				return IconNames.HEADER
			case Block.PARAGRAPH:
				return IconNames.PARAGRAPH
			default:
				return assertNever(node)
		}
	}

	public render() {
		const { blocks } = this.props
		const [firstBlockMarks, ...otherBlocksMarks] = blocks
			.filter(block => this.isBlockActive(block.block))
			.map(block => (block.marks || []).sort())
		const marksToShow = firstBlockMarks
			? firstBlockMarks.filter(mark => otherBlocksMarks.every(otherMarks => otherMarks.includes(mark)))
			: []

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
						{/*{blocks.length > 1 && marksToShow.length > 0 && <Divider />}*/}
						{marksToShow.map(mark => (
							<ActionButton
								icon={this.getIcon(mark)}
								isActive={this.isMarkActive(mark)}
								onClick={this.changeMarkMarkingTo(mark)}
							/>
						))}
					</Toolbar>
					<div className="inputGroup">
						<Editor
							ref={this.ref}
							className={cn('inputGroup-text', 'input', 'view-autoHeight')}
							spellCheck
							plugins={this.plugins}
							value={this.state.value}
							onChange={this.onChange}
							onKeyDown={this.onKeyDown}
							readOnly={this.props.readOnly}
						/>
					</div>
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
	private changeMarkingTo(config: RichEditorPluginConfig): () => unknown {
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

		let mark: Mark

		if (isBoldHotkey(event)) {
			mark = Mark.BOLD
		} else if (isItalicHotkey(event)) {
			mark = Mark.ITALIC
		} else if (isUnderlinedHotkey(event)) {
			mark = Mark.UNDERLINED
		} else if (event.key === 'Enter') {
			event.preventDefault()
			if (this.props.lineBreakBehavior === LineBreakBehavior.SMART && event.shiftKey) {
				editor.insertText('\n')
				return
			}
			switch (this.props.lineBreakBehavior) {
				case LineBreakBehavior.DISABLE:
					break
				case LineBreakBehavior.NEWLINE:
					editor.insertText('\n')
					break
				case LineBreakBehavior.SMART:
				case LineBreakBehavior.NEWBLOCK:
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
							type: 'paragraph',
						})
					}
					break
				default:
					assertNever(this.props.lineBreakBehavior)
					break
			}
			return
		} else {
			return next()
		}

		const currentBlockTypes = editor.value.blocks.toArray().map(block => block.type)
		const blockDefinitions = currentBlockTypes.map(currentBlock =>
			this.props.blocks.find(block => block.block === currentBlock),
		)
		if (blockDefinitions.every(b => typeof b !== 'undefined' && (b.marks || []).includes(mark))) {
			event.preventDefault()
			editor.toggleMark(mark)
		} else {
			console.warn(
				`Mark "${mark}" is not available in at least some of following blocks: ${blockDefinitions
					.map(block => block && block.block)
					.join(', ')}.`,
			)
		}

		return
	}
}
