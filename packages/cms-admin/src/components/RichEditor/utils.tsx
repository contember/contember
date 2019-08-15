import { ButtonGroup, IconName } from '@blueprintjs/core'
import { Button } from '@contember/ui'
import * as React from 'react'
import { Editor } from 'slate'
import { Editor as ReactEditor } from 'slate-react'
import { Intent } from '../ui'
import { Icon } from '@blueprintjs/core'

interface ToolbarProps {
	children: React.ReactNode
}

export const Toolbar: React.SFC<ToolbarProps> = ({ children }) => <ButtonGroup minimal={true}>{children}</ButtonGroup>

interface ActionButtonProps {
	icon: IconName
	onClick: () => unknown | void
	isActive: boolean
}

export const ActionButton: React.SFC<ActionButtonProps> = ({ icon, onClick, isActive }) => (
	<Button intent={isActive ? 'primary' : undefined} size="small" flow="squarish" onClick={() => onClick()}>
		<Icon icon={icon} />
	</Button>
	// <Button active={isActive} icon={icon} onClick={() => onClick()} />
)

// This is a bad thing, but slate or slate's typings are bad
export function getSlateController(editor: Editor | ReactEditor, rec: number = 0): Editor {
	if (typeof (editor as any).controller !== 'undefined' && rec < 5)
		return getSlateController((editor as ReactEditor).controller, rec + 1)
	else return editor as Editor
}
