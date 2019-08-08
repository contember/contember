import * as React from 'react'
import { RenderAttributes, RenderMarkProps } from 'slate-react'
import { Rule } from 'slate-html-serializer'

export interface WithHtmlSerializer {
	htmlSerializer?: Rule
}

export interface WithHoverMenu {
	menuButton?: () => React.ReactNode
}

interface BlockDefinition extends WithHtmlSerializer {
	label: React.ReactNode
}

interface CustomBlockDefinition extends BlockDefinition {
	render: React.ReactNode

	renderBlock?: undefined
}

interface SlateBlockRenderNodeProps {
	children: React.ReactNode
}

interface SlateBlockDefinitions extends BlockDefinition {
	renderBlock: (props: SlateBlockRenderNodeProps) => React.ReactNode
	valueField: string
	marks?: string[]
	inlines?: string[]
}

export interface BlocksDefinitions {
	[name: string]: CustomBlockDefinition | SlateBlockDefinitions
}

export interface MarkDefinition extends WithHtmlSerializer, WithHoverMenu {
	renderMark: (props: RenderMarkProps) => React.ReactNode
	keyboardShortcut?: string | string[]
}

export interface MarksDefinitions {
	[name: string]: MarkDefinition
}

export interface InlineProps<T = any> {
	children: React.ReactNode
	attributes: RenderAttributes
	data: T
	setData: (newData: T) => void
}

export interface InlineDefinition extends WithHtmlSerializer, WithHoverMenu {
	renderInline: (props: InlineProps) => React.ReactNode
	keyboardShortcut?: string | string[]
}

export interface InlinesDefinitions {
	[name: string]: InlineDefinition
}
