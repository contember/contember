import { Classes, FormGroup, IFormGroupProps } from '@blueprintjs/core'
import cn from 'classnames'
import { isKeyHotkey } from 'is-hotkey'
import * as React from 'react'
import { Editor as CoreEditor, Value, Block, Mark } from 'slate'
import HtmlSerializer from 'slate-html-serializer'
import { Editor, EditorProps, Plugin, EventHook } from 'slate-react'
import { BOLD, ITALIC, LINK, RichEditorPluginConfig, UNDERLINED } from './configs'
import { PARAGRAPH_RULE } from './rules'
import { ActionButton, Toolbar, getSlateController } from './utils'
import { assertNever } from 'cms-common'
import JsonSerializer from './JsonSerializer'
import { List } from 'immutable'

const DEFAULT_NODE = 'paragraph'

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

export interface RichEditorProps {
	inlineLabel?: boolean
	value: string
	allowLineBreaks?: boolean
	onChange: (value: string) => void
	label?: IFormGroupProps['label']
	serializer: RichEditorSerializer
}

export interface RichTextFieldState {
	value: Value
}

const CONFIGS: RichEditorPluginConfig[] = [BOLD, ITALIC, UNDERLINED, LINK]

export default class RichEditor extends React.Component<RichEditorProps, RichTextFieldState> {
	serializer: Serializer<Value, string>
	plugins: Plugin[]
	editor?: Editor
	get coreEditor(): CoreEditor | undefined {
		return this.editor && getSlateController(this.editor.controller)
	}
	ref = (editor: Editor) => (this.editor = editor)

	static defaultProps: Partial<RichEditorProps> = {
		serializer: RichEditorSerializer.JSON
	}

	constructor(props: RichEditorProps) {
		super(props)
		this.serializer =
			props.serializer == RichEditorSerializer.HTML
				? new HtmlSerializer({
						rules: [...CONFIGS.map(c => c.htmlSerializer), PARAGRAPH_RULE]
				  })
				: props.serializer == RichEditorSerializer.JSON
					? new JsonSerializer(
							new HtmlSerializer({
								rules: [...CONFIGS.map(c => c.htmlSerializer), PARAGRAPH_RULE]
							})
					  )
					: assertNever(props.serializer)
		this.plugins = CONFIGS.map(c => c.plugin)
		this.state = { value: this.serializer.deserialize(props.value) }
	}

	public render() {
		return (
			<div className="editor">
				<FormGroup label={this.props.label}>
					<Toolbar>
						<ActionButton icon="bold" isActive={this.isActive(BOLD)} onClick={this.onMarkClick(BOLD)} />
						<ActionButton icon="italic" isActive={this.isActive(ITALIC)} onClick={this.onMarkClick(ITALIC)} />
						<ActionButton
							icon="underline"
							isActive={this.isActive(UNDERLINED)}
							onClick={this.onMarkClick(UNDERLINED)}
						/>
						<ActionButton icon="link" isActive={this.isActive(LINK)} onClick={this.onMarkClick(LINK)} />
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

	private isActive(config: RichEditorPluginConfig) {
		const value = this.state.value
		const nodes: List<Block | Mark> = config.node === 'mark' ? value.activeMarks.toList() : value.blocks
		return nodes.some(node => node !== undefined && node.type === config.type)
	}

	private onMarkClickCache = new Map<RichEditorPluginConfig, () => unknown>()
	private onMarkClick(config: RichEditorPluginConfig): (() => unknown) {
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
		console.log('CHANGING')
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
			if (this.props.allowLineBreaks) {
				editor.insertText('\n')
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
