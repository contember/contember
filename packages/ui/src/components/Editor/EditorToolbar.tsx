import { useClassName, useClassNameFactory } from '@contember/react-utils'
import { MoreHorizontalIcon } from 'lucide-react'
import { forwardRef, memo, useCallback } from 'react'
import type { HoveringToolbarScope } from '../../types'
import { toEnumViewClass, toStateClass, toViewClass } from '../../utils'
import { Dropdown, DropdownProps } from '../Dropdown/Dropdown'
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
	const className = useClassName('editorToolbar-button')
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
		<div className={className}>
			<EditorToolbarButton {...props} />
		</div>
	)
}

export const EditorToolbar = memo(forwardRef<HTMLDivElement, EditorToolbarProps>(({
	groups,
	isActive,
	layout,
	restGroups,
	scope,
	showLabels,
}, ref) => {
	layout = layout ?? 'bar'
	const buttonLayout = layout === 'list' ? 'list' : 'grid'
	const componentClassName = useClassNameFactory('editorToolbar')

	if (restGroups) {
		switch (layout) {
			case 'grid':
			case 'list':
				groups = [...groups, ...restGroups]
				restGroups = undefined
		}
	}

	return (
		<div
			className={componentClassName(null, [
				toStateClass('active', isActive),
				toEnumViewClass(scope),
				toViewClass(`layout-${layout}`, true),
			])}
			ref={ref}
		>
			<div className={componentClassName('groups')}>
				{groups.map((g, i) => (
					<div key={i} className={componentClassName('group')}>
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
					<div className={componentClassName('group', 'view-rest')}>
						<ButtonOrDropdown
							label="More…"
							customIcon={<MoreHorizontalIcon />}
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
