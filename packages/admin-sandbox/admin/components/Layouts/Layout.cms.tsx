// CMS Layout requires Contember Enterprise Edition (EE) license
// See https://github.com/contember/interface/blob/main/ee/LICENSE for more information.
import { DimensionsRenderer, DimensionsSwitcher, DropdownContentContainerProvider, toThemeClass } from '@contember/admin'
import '@contember/brand/index.css'
import { CMSLayout } from '@contember/cms-layout'
import { useMemo } from 'react'
import { useDirectives } from '../Directives'
import { Slots } from '../Slots'
import { LAYOUT_BREAKPOINT } from '../Constants'

export const Layout = () => {
	const directives = useDirectives()
	const maxWidth = directives['content-max-width']

	return (
		<>
			<Slots.Switchers>
				<DimensionsSwitcher
					optionEntities="Locale"
					orderBy="code asc"
					dimension="locale"
					labelField="code"
					slugField="code"
					maxItems={1}
				/>
			</Slots.Switchers>

			<CMSLayout.Root
				breakpoint={LAYOUT_BREAKPOINT}
				contentProps={useMemo(() => ({ maxWidth }), [maxWidth])}
				className={toThemeClass(directives['layout.theme-content'], directives['layout.theme-controls'])}
			>
				<DropdownContentContainerProvider />
				<div id="portal-root" />
			</CMSLayout.Root>
		</>
	)
}
