import { DimensionsSwitcher, Link, Logo } from '@contember/admin'
import { CMSLayout, ContemberEditLogo2023 } from '@contember/cms-layout'
import { Navigation } from '../Navigation'

import { useMemo } from 'react'
import '../../../../../ee/cms-layout/src/index.css'
import { BREAKPOINT } from '../Layout'
import { useMetaDirectives } from '../MetaDirectives'

export const Layout = () => {
	const directives = useMetaDirectives()

	return (
		<CMSLayout.Root
			breakpoint={BREAKPOINT}
			contentProps={useMemo(() => ({
				maxWidth: directives['layouts.cms.contentProps.maxWidth'],
			}), [directives])}
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
				<Link to="index"><Logo image={<ContemberEditLogo2023 size={56} />} /></Link>
			</CMSLayout.Slots.Logo>
		</CMSLayout.Root>
	)
}
