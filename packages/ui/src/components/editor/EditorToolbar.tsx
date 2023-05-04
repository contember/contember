import cn from 'classnames'
import { useCallback, memo, forwardRef } from 'react'
import { useComponentClassName } from '../../auxiliary'
import type { HoveringToolbarScope } from '../../types'
import { toEnumViewClass, toStateClass, toViewClass } from '../../utils'
import { Dropdown, DropdownProps } from '../Dropdown'
import { EditorToolbarButton, ToolbarButton } from './EditorToolbarButton'

export type EditorToolbarLayout = 'bar' | 'list' | 'grid'

export interface ToolbarButtonOrDropdown extends ToolbarButton {
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
	const renderToggle = useCallback<Exclude<DropdownProps['renderToggle'], undefined>>(
		({ ref, onClick }) => {
			return (
				<EditorToolbarButton
					layout={props.layout}
					label={props.label}
					showLabel={props.showLabel}
					contemberIcon={props.contemberIcon}
					blueprintIcon={props.blueprintIcon}
					customIcon={props.customIcon}
					onClick={onClick}
					ref={ref}
				/>
			)
		},
		[props.blueprintIcon, props.contemberIcon, props.customIcon, props.label, props.layout, props.showLabel],
	)
	if (props.groups) {
		return (
			<Dropdown renderToggle={renderToggle} alignment="center" styledContent={false}>
				<EditorToolbar
					isActive
					groups={props.groups}
					scope={props.popup.scope}
					layout={props.popup.layout}
					showLabels={props.popup.showLabels}
				/>
			</Dropdown>
		)
	}
	return (
		<div className={cn(className)}>
			<EditorToolbarButton {...props} />
		</div>
	)
}

export const EditorToolbar = memo(forwardRef<HTMLDivElement, EditorToolbarProps>(({
	isActive,
	scope, groups,
	showLabels,
	restGroups,
	layout,
}, ref) => {
	layout = layout ?? 'bar'
	const buttonLayout = layout === 'list' ? 'list' : 'grid'
	if (restGroups) {
		switch (layout) {
			case 'grid':
			case 'list':
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
									layout: 'list',
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
								layout: 'grid',
								showLabels: true,
								scope: scope,
							}}
						/>
					</div>
				)}
			</div>
		</div>
	)
}))
EditorToolbar.displayName = 'EditorToolbar'
