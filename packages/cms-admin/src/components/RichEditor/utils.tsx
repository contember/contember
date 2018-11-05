import { Button, ButtonGroup, IconName } from '@blueprintjs/core'
import { List } from 'immutable'
import * as React from 'react'
import { Block, Change, Mark, Value } from 'slate'
import { RichEditorPluginConfig } from './configs'

export const has = (value: Value, config: RichEditorPluginConfig): boolean => {
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
	config: RichEditorPluginConfig
	onChange: OnChange
}

export const ActionButton: React.SFC<ActionButtonProps> = ({ icon, value, config, onChange }) => {
	const isActive = has(value, config)

	return <Button active={isActive} icon={icon} onClick={() => onChange(config.onToggle(value))} />
}
