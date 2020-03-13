import cn from 'classnames'
import * as React from 'react'
import { useComponentClassName } from '../../auxiliary'
import { HoveringToolbarScope } from '../../types'
import { toEnumViewClass, toStateClass } from '../../utils'
import { ToolbarButton, EditorToolbarButton } from './EditorToolbarButton'

interface ToolbarGroup {
	buttons: ToolbarButton[]
}

export interface EditorToolbarProps {
	isActive?: boolean
	showLabels?: boolean
	scope?: HoveringToolbarScope
	groups: ToolbarGroup[]
	restGroups?: ToolbarGroup[]
}

export const EditorToolbar = React.memo(
	React.forwardRef<HTMLDivElement, EditorToolbarProps>(
		({ isActive, scope, groups, showLabels, restGroups }: EditorToolbarProps, ref) => (
			<div
				className={cn(useComponentClassName('editorToolbar'), toStateClass('active', isActive), toEnumViewClass(scope))}
				ref={ref}
			>
				<div className={cn(useComponentClassName('editorToolbar-groups'))}>
					{groups.map((g, i) => (
						<div key={i} className={cn(useComponentClassName('editorToolbar-group'))}>
							{g.buttons.map((b, i) => (
								<div key={i} className={cn(useComponentClassName('editorToolbar-button'))}>
									<EditorToolbarButton showLabel={showLabels} {...b} />
								</div>
							))}
						</div>
					))}
					{restGroups && !!restGroups.length && (
						<div className={cn(useComponentClassName('editorToolbar-group'), 'view-rest')}>
							<div className={cn(useComponentClassName('editorToolbar-button'))}>
								<EditorToolbarButton label="More…" showLabel={showLabels} contemberIcon="ellipsis" />
							</div>
						</div>
					)}
				</div>
			</div>
		),
	),
)
EditorToolbar.displayName = 'EditorToolbar'
