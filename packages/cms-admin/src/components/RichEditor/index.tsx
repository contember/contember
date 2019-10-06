import { assertNever } from '@contember/utils'
import {
	ButtonGroup,
	TextInputOwnProps,
	IconProps,
	toEnumStateClass,
	toEnumViewClass,
	toViewClass,
} from '@contember/ui'
import cn from 'classnames'
import { isKeyHotkey } from 'is-hotkey'
import * as React from 'react'
import { Document, Editor as CoreEditor, Value } from 'slate'
import HtmlSerializer from 'slate-html-serializer'
import { SimpleRelativeSingleFieldProps } from '../bindingFacade/auxiliary'
import { BOLD, HEADING, ITALIC, LINK, PARAGRAPH, RichEditorPluginConfig, UNDERLINED } from './configs'
import { HEADING_H2, HEADING_H3 } from './configs/heading'
import { Editor, EventHook, getEventTransfer, Plugin } from 'slate-react'
import JsonSerializer from './JsonSerializer'
import { ActionButton, getSlateController, Toolbar } from './utils'
import { TEXT_HTML_RULE } from './configs/html'

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

export type RichEditorProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputOwnProps, 'onChange'> & {
		value: string
		onChange: (value: string) => void
		serializer: RichEditorSerializer
		lineBreakBehavior: LineBreakBehavior
		defaultBlock: Block
		blocks: { block: Block; marks?: Mark[] }[]
	}

export interface RichTextFieldState {
	value: Value
}

const CONFIGS: RichEditorPluginConfig[] = [BOLD, ITALIC, UNDERLINED, LINK, PARAGRAPH, HEADING, HEADING_H3]

export enum Block {
	HEADING = 'heading',
	HEADING_H2 = 'heading_h2',
	HEADING_H3 = 'heading_h3',
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
	[Block.HEADING_H2]: HEADING_H2,
	[Block.HEADING_H3]: HEADING_H3,
	[Block.PARAGRAPH]: PARAGRAPH,
}

const markConfigs: { [_ in Mark]: RichEditorPluginConfig } = {
	[Mark.BOLD]: BOLD,
	[Mark.ITALIC]: ITALIC,
	[Mark.UNDERLINED]: UNDERLINED,
	[Mark.LINK]: LINK,
}

/**
 * @deprecated Use RichEditorNG instead.
 */
export default class RichEditor extends React.Component<RichEditorProps, RichTextFieldState> {
	serializer: Serializer<Value, string>
	private readonly htmlSerializer: HtmlSerializer
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
		const configs = [
			...props.blocks.map(t => blockConfigs[t.block]),
			...props.blocks
				.flatMap(t => t.marks || [])
				.filter((v, i, self) => self.indexOf(v) === i)
				.map(t => markConfigs[t]),
		]
		this.htmlSerializer = new HtmlSerializer({
			rules: [...configs.map(c => c.htmlSerializer), TEXT_HTML_RULE],
		})
		this.serializer =
			props.serializer === RichEditorSerializer.HTML
				? this.htmlSerializer
				: props.serializer === RichEditorSerializer.JSON
				? new JsonSerializer(this.htmlSerializer)
				: assertNever(props.serializer)
		this.plugins = configs.map(c => c.plugin)
		this.state = { value: this.serializer.deserialize(props.value) }
	}

	private getIcon(node: Mark | Block): IconProps['blueprintIcon'] {
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
			case Block.HEADING_H2:
				return 'header-one'
			case Block.HEADING_H3:
				return 'header-two'
			case Block.PARAGRAPH:
				return 'paragraph'
			default:
				return assertNever(node)
		}
	}

	public render() {
		const { blocks } = this.props
		const allMarksNames = Array.from(
			new Set(blocks.map(block => block.marks || []).reduce<Mark[]>((acc, el) => [...acc, ...el], [])),
		).sort()
		const [firstBlockMarks, ...otherBlocksMarks] = blocks
			.filter(block => this.isBlockActive(block.block))
			.map(block => (block.marks || []).sort())
		const marksToShow = firstBlockMarks
			? firstBlockMarks.filter(mark => otherBlocksMarks.every(otherMarks => otherMarks.includes(mark)))
			: []

		return (
			<div className="editor">
				<Toolbar>
					{blocks.length > 1 && (
						<ButtonGroup isTopToolbar>
							{blocks.map(block => (
								<ActionButton
									key={block.block}
									icon={this.getIcon(block.block)}
									isActive={this.isBlockActive(block.block)}
									onClick={this.changeBlockMarkingTo(block.block)}
								/>
							))}
						</ButtonGroup>
					)}
					&nbsp;
					{/*{blocks.length > 1 && marksToShow.length > 0 && <Divider />}*/}
					<ButtonGroup isTopToolbar>
						{allMarksNames.map(mark => (
							<ActionButton
								key={mark}
								icon={this.getIcon(mark)}
								isActive={this.isMarkActive(mark)}
								onClick={this.changeMarkMarkingTo(mark)}
								disabled={!this.isMarkAvailable(mark)}
							/>
						))}
					</ButtonGroup>
				</Toolbar>
				<div className="inputGroup view-topFluent">
					<Editor
						ref={this.ref}
						className={cn(
							'input',
							toEnumViewClass(this.props.size),
							toEnumViewClass(this.props.distinction),
							toEnumStateClass(this.props.validationState),
							toViewClass('withTopToolbar', true),
						)}
						spellCheck
						plugins={this.plugins}
						value={this.state.value}
						onChange={this.onChange}
						onKeyDown={this.onKeyDown}
						onPaste={this.onPaste}
						readOnly={this.props.readOnly}
					/>
				</div>
			</div>
		)
	}

	private isMarkActive(mark: Mark): boolean {
		return this.state.value.activeMarks.some(node => node !== undefined && node.type === markConfigs[mark].type)
	}

	private isBlockActive(block: Block): boolean {
		return this.state.value.blocks.some(node => node !== undefined && node.type === blockConfigs[block].type)
	}

	private isMarkAvailable(mark: Mark): boolean {
		return this.state.value.blocks.every(block => {
			if (block === undefined) {
				return true
			}
			const definition = this.props.blocks.find(bd => bd.block == block.type)
			return definition !== undefined && (definition.marks || []).includes(mark)
		})
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
						editor.value.anchorBlock.nodes.size === 1 &&
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

	private onPaste: EventHook = (event: Event, editor: CoreEditor, next) => {
		const transfer = getEventTransfer(event)
		if (transfer.type !== 'html') return next()
		const { document } = this.htmlSerializer.deserialize(((transfer as unknown) as { html: string }).html)
		const nodes = document.nodes.filter(block => block !== undefined && block.text.length > 0).toList()
		editor.insertFragment(Document.create(nodes))
	}
}
