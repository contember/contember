import { ListToolbarButton } from './list-toolbar-button'
import { TurnIntoDropdownMenu } from './turn-into-dropdown-menu'
import { MARK_BOLD, MARK_ITALIC, MARK_STRIKETHROUGH, MARK_UNDERLINE } from '@udecode/plate-basic-marks'
import { useEditorReadOnly } from '@udecode/plate-common'
import { BoldIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon } from 'lucide-react'
import { LinkToolbarButton } from './link-toolbar-button'
import { MarkToolbarButton } from './mark-toolbar-button'
import { ToolbarGroup } from './toolbar'
import { InsertDropdownMenu } from './insert-dropdown-menu'

export function FixedToolbarButtons() {
	const readOnly = useEditorReadOnly()

	return (
		<div className="w-full overflow-hidden">
			<div
				className="flex flex-wrap"
				style={{
					transform: 'translateX(calc(-1px))',
				}}
			>
				{!readOnly && (
					<>
						<ToolbarGroup noSeparator>
							<InsertDropdownMenu/>
							<TurnIntoDropdownMenu/>
						</ToolbarGroup>

						<ToolbarGroup>
							<MarkToolbarButton tooltip="Bold (⌘+B)" nodeType={MARK_BOLD}>
								<BoldIcon/>
							</MarkToolbarButton>
							<MarkToolbarButton tooltip="Italic (⌘+I)" nodeType={MARK_ITALIC}>
								<ItalicIcon/>
							</MarkToolbarButton>
							<MarkToolbarButton
								tooltip="Underline (⌘+U)"
								nodeType={MARK_UNDERLINE}
							>
								<UnderlineIcon/>
							</MarkToolbarButton>

							<MarkToolbarButton
								tooltip="Strikethrough (⌘+⇧+M)"
								nodeType={MARK_STRIKETHROUGH}
							>
								<StrikethroughIcon/>
							</MarkToolbarButton>
						</ToolbarGroup>

						<ToolbarGroup>
							<ListToolbarButton nodeType="ul"/>
							<ListToolbarButton nodeType="ol"/>
							<LinkToolbarButton/>
						</ToolbarGroup>
					</>
				)}
			</div>
		</div>
	)
}
