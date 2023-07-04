export * from './Slots'
export * from './Types'
export * from './createLayoutBarComponent'
export * from './createLayoutContentPanelComponent'
export * from './createLayoutSidebarComponent'
import { Frame } from './Frame'
import { ToggleMenuButton } from './ToggleMenuButton'
import { ToggleSidebarButton } from './ToggleSidebarButton'
import { createLayoutBarComponent } from './createLayoutBarComponent'
import { createLayoutContentPanelComponent } from './createLayoutContentPanelComponent'
import { createLayoutSidebarComponent } from './createLayoutSidebarComponent'

export const LayoutKit = {
	ContentPanelMain: createLayoutContentPanelComponent({
		name: 'main-content',
		defaultComponentClassName: ['layout-content-panel', 'layout-content-panel-main'],
		displayName: 'ContentPanelMain',
	}),
	Footer: createLayoutBarComponent({
		name: 'footer',
		defaultAs: 'footer',
		displayName: 'Footer',
	}),
	Frame,
	Header: createLayoutBarComponent({
		name: 'header',
		defaultAs: 'header',
		displayName: 'Header',
	}),
	SidebarLeft: createLayoutSidebarComponent({
		name: 'sidebar-left',
		defaultAs: 'aside',
		displayName: 'SidebarLeft',
	}),
	SidebarRight: createLayoutSidebarComponent({
		name: 'sidebar-right',
		defaultAs: 'aside',
		displayName: 'SidebarRight',
	}),
	SidebarResponsive: createLayoutSidebarComponent({
		name: 'sidebar-responsive',
		defaultAs: 'aside',
		displayName: 'SidebarResponsive',
	}),
	ToggleMenuButton,
	ToggleSidebarButton,
}
