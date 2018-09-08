import * as React from 'react'
import { Value, Change, Block, Mark } from 'slate'
import { Config } from './configs'
import { List } from 'immutable'
import { Icon, IconName, Button, ButtonGroup } from '@blueprintjs/core'

export const has = (value: Value, config: Config): boolean => {
	const nodes: List<Block | Mark> = config.node === 'mark' ? value.activeMarks.toList() : value.blocks
	return nodes.some(node => node !== undefined && node.type === config.type)
}

interface ToolbarProps {
	children: React.ReactNode
}

export const Toolbar: React.SFC<ToolbarProps> = ({ children }) => <ButtonGroup minimal={true}>{children}</ButtonGroup>

type OnChange = (change: Change) => void

interface ActionButtonProps {
	value: Value
	icon: IconName
	config: Config
	onChange: OnChange
}

export const ActionButton: React.SFC<ActionButtonProps> = ({ icon, value, config, onChange }) => {
	const isActive = has(value, config)

	return (
		<Button
			active={isActive}
			icon={icon}
			onClick={() => {
				// e.preventDefault()
				onChange(config.onToggle(value))
			}}
		/>
	)
}

const onClickMark = (value: Value, type: string, onChange: OnChange) => (event: React.MouseEvent) => {
	event.preventDefault()
	const change = value.change().toggleMark(type)
	onChange(change)
}

const hasBlock = (value: Value, type: string) => value.blocks.some(node => node !== undefined && node.type == type)

const DEFAULT_NODE = 'paragraph'

const onClickBlock = (value: Value, type: string, onChange: OnChange) => (event: React.MouseEvent) => {
	event.preventDefault()
	const change = value.change()
	const isActive = hasBlock(value, type)
	change.setBlocks(isActive ? DEFAULT_NODE : type)
	onChange(change)
}
