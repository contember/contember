import cn from 'classnames'
import * as React from 'react'
import { useComponentClassName } from '../../auxiliary'
import { HoveringToolbarScope } from '../../types'
import { toEnumViewClass, toStateClass, toViewClass } from '../../utils'
import { Dropdown } from '../Dropdown'
import { EditorToolbarButton, ToolbarButton, ToolbarButtonLayout } from './EditorToolbarButton'

export enum EditorToolbarLayout {
	BAR = 'bar',
	LIST = 'list',
	GRID = 'grid',
}

interface ToolbarButtonOrDropdown extends ToolbarButton {
	groups?: ToolbarGroup[]
}

interface WithPopupProps {
	popup: {
		showLabels?: boolean
		scope?: EditorToolbarProps['scope']
		layout?: EditorToolbarLayout
	}
}

export interface ToolbarGroup {
	buttons: ToolbarButtonOrDropdown[]
}

export interface EditorToolbarProps {
	isActive?: boolean
	showLabels?: boolean
	scope?: HoveringToolbarScope
	groups: ToolbarGroup[]
	restGroups?: ToolbarGroup[]
	layout?: EditorToolbarLayout
}

function ButtonOrDropdown(props: ToolbarButtonOrDropdown & WithPopupProps) {
	const className = useComponentClassName('editorToolbar-button')
	if (props.groups) {
		return (
			<Dropdown
				renderToggle={({ ref, onClick }) => (
					<span ref={ref}>
						<EditorToolbarButton
							layout={props.layout}
							label={props.label}
							showLabel={props.showLabel}
							contemberIcon={props.contemberIcon}
							blueprintIcon={props.blueprintIcon}
							customIcon={props.customIcon}
							onClick={onClick}
						/>
					</span>
				)}
				renderContent={({ ref }) => (
					<span ref={ref}>
						{props.groups && (
							<EditorToolbar
								isActive
								groups={props.groups}
								scope={props.popup.scope}
								layout={props.popup.layout}
								showLabels={props.popup.showLabels}
							/>
						)}
					</span>
				)}
				alignment="center"
			></Dropdown>
		)
	}
	const { onClick, ...rest } = props
	return (
		<div className={cn(className)}>
			<EditorToolbarButton onMouseDown={onClick} {...rest} />
		</div>
	)
}

export const EditorToolbar = React.memo(
	React.forwardRef<HTMLDivElement, EditorToolbarProps>(
		({ isActive, scope, groups, showLabels, restGroups, layout }: EditorToolbarProps, ref) => {
			layout = layout ?? EditorToolbarLayout.BAR
			const buttonLayout = layout === EditorToolbarLayout.LIST ? ToolbarButtonLayout.LIST : ToolbarButtonLayout.GRID
			if (restGroups) {
				switch (layout) {
					case EditorToolbarLayout.GRID:
					case EditorToolbarLayout.LIST:
						groups = [...groups, ...restGroups]
						restGroups = undefined
				}
			}
			const groupClassName = useComponentClassName('editorToolbar-group')
			return (
				<div
					className={cn(
						useComponentClassName('editorToolbar'),
						toStateClass('active', isActive),
						toEnumViewClass(scope),
						toViewClass(`layout-${layout}`, true),
					)}
					ref={ref}
				>
					<div className={cn(useComponentClassName('editorToolbar-groups'))}>
						{groups.map((g, i) => (
							<div key={i} className={cn(groupClassName)}>
								{g.buttons.map((b, i) => (
									<ButtonOrDropdown
										key={i}
										layout={buttonLayout}
										showLabel={showLabels}
										popup={{
											layout: EditorToolbarLayout.LIST,
											showLabels: true,
											scope: scope,
										}}
										{...b}
									/>
								))}
							</div>
						))}
						{restGroups && !!restGroups.length && (
							<div className={cn(groupClassName, 'view-rest')}>
								<ButtonOrDropdown
									label="More…"
									contemberIcon="ellipsis"
									groups={restGroups}
									showLabel={showLabels}
									popup={{
										layout: EditorToolbarLayout.GRID,
										showLabels: true,
										scope: scope,
									}}
								/>
							</div>
						)}
					</div>
				</div>
			)
		},
	),
)
EditorToolbar.displayName = 'EditorToolbar'
