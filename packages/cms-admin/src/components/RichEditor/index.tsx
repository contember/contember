import * as React from 'react'
import { Editor, Plugin, EditorProps } from 'slate-react'
import { isKeyHotkey } from 'is-hotkey'
import HtmlSerializer from 'slate-html-serializer'
import { Value, Change } from 'slate'
import { ActionButton, Toolbar } from './utils'
import { PARAGRAPH_RULE } from './rules'
import { Config, BOLD, ITALIC, UNDERLINED, LINK } from './configs'
import { FormGroup, Classes } from '@blueprintjs/core'
import cn from 'classnames'

const DEFAULT_NODE = 'paragraph'

const isBoldHotkey = isKeyHotkey('mod+b')
const isItalicHotkey = isKeyHotkey('mod+i')
const isUnderlinedHotkey = isKeyHotkey('mod+u')

export interface RichEditorProps {
	inlineLabel?: boolean
	value: string
	allowLineBreaks?: boolean
	onChange: (value: string) => void
}

export interface RichTextFieldState {
	value: Value
}

const CONFIGS: Config[] = [BOLD, ITALIC, UNDERLINED, LINK]

export default class RichEditor extends React.Component<RichEditorProps, RichTextFieldState> {
	serializer: HtmlSerializer
	plugins: Plugin[]

	constructor(props: RichEditorProps) {
		super(props)
		this.serializer = new HtmlSerializer({
			rules: [...CONFIGS.map(c => c.htmlSerializer), PARAGRAPH_RULE]
		})
		this.plugins = CONFIGS.map(c => c.plugin)
		this.state = { value: this.serializer.deserialize(props.value) }
	}

	public render() {
		return (
			<div className="editor">
				<FormGroup label="Content">
					<Toolbar>
						<ActionButton config={BOLD} icon="bold" value={this.state.value} onChange={this.onChange} />
						<ActionButton config={ITALIC} icon="italic" value={this.state.value} onChange={this.onChange} />
						<ActionButton config={UNDERLINED} icon="underline" value={this.state.value} onChange={this.onChange} />
						<ActionButton config={LINK} icon="link" value={this.state.value} onChange={this.onChange} />
					</Toolbar>
					<Editor
						className={cn(Classes.INPUT, 'input-autoHeight')}
						spellCheck
						plugins={this.plugins}
						value={this.state.value}
						onChange={this.onChange}
						onKeyDown={this.onKeyDown as EditorProps['onKeyDown']}
					/>
				</FormGroup>
			</div>
		)
	}

	/**
	 * On change, save the new `value`.
	 */
	lastChanged: string | null = null
	onChange = ({ value }: Change) => {
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
	private onKeyDown = (event_: Event, change: Change): void | boolean => {
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
				change.insertText('\n')
			}
			return true

			const { value } = change
			const { selection } = value
			const { start, end, isExpanded } = selection
			if (isExpanded) {
				return
			}

			const { startBlock } = value
			if (start.offset == 0 && startBlock.text.length == 0) {
				if (startBlock.type == DEFAULT_NODE) {
					return
				}

				event.preventDefault()
				change.setBlocks(DEFAULT_NODE)

				return
			}
			if (end.offset != startBlock.text.length) return

			if (startBlock.type != 'heading') {
				return
			}

			event.preventDefault()
			change.splitBlock(1).setBlocks(DEFAULT_NODE)
			return
		} else {
			return
		}

		event.preventDefault()
		change.toggleMark(mark)
		return
	}
}
