import { DimensionsSwitcher, DropdownContentContainerProvider, Link, Logo, toThemeClass } from '@contember/admin'
import { Identity2023 } from '@contember/brand'
import '@contember/brand/index.css'
import { CMSLayout } from '@contember/cms-layout'
import '@contember/cms-layout/index.css'
import { useMemo } from 'react'
import { useDirectives } from '../Directives'
import { BREAKPOINT } from '../Layout'
import { Navigation } from '../Navigation'

export const Layout = () => {
	const directives = useDirectives()

	return (
		<CMSLayout.Root
			breakpoint={BREAKPOINT}
			contentProps={useMemo(() => ({
				maxWidth: directives['layouts.cms.contentProps.maxWidth'],
			}), [directives])}
			className={toThemeClass(directives['layout.theme'], directives['layout.theme'])}
		>
			<CMSLayout.Slots.SidebarLeftHeader>
				<DimensionsSwitcher
					optionEntities="Locale"
					orderBy="code asc"
					dimension="locale"
					labelField="code"
					slugField="code"
					maxItems={1}
				/>
			</CMSLayout.Slots.SidebarLeftHeader>
			<CMSLayout.Slots.Navigation>
				<Navigation />
			</CMSLayout.Slots.Navigation>

			<CMSLayout.Slots.Logo>
				<Link to="index"><Identity2023.Edit /></Link>
			</CMSLayout.Slots.Logo>

			<DropdownContentContainerProvider />
			<div id="portal-root" />
		</CMSLayout.Root>
	)
}
