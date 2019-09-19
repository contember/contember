import { Icon, IconName } from '@blueprintjs/core'
import * as React from 'react'
import { Editor } from 'slate'
import { Editor as ReactEditor } from 'slate-react'
import { Button } from '@contember/ui'

interface ToolbarProps {
	children: React.ReactNode
}

export const Toolbar: React.SFC<ToolbarProps> = ({ children }) => <div className="toolbar">{children}</div>

interface ActionButtonProps {
	icon: IconName
	onClick: () => unknown | void
	isActive: boolean
	disabled?: boolean
}

export const ActionButton: React.SFC<ActionButtonProps> = ({ icon, onClick, isActive, disabled }) => (
	<Button onClick={() => onClick()} distinction="seamless" isActive={isActive} disabled={disabled} flow="squarish">
		<Icon icon={icon} color="currentColor" />
	</Button>
)

// This is a bad thing, but slate or slate's typings are bad
export function getSlateController(editor: Editor | ReactEditor, rec: number = 0): Editor {
	if (typeof (editor as any).controller !== 'undefined' && rec < 5)
		return getSlateController((editor as ReactEditor).controller, rec + 1)
	else return editor as Editor
}

export function generateUuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = (Math.random() * 16) | 0
		const v = c === 'x' ? r : (r & 0x3) | 0x8
		return v.toString(16)
	})
}
