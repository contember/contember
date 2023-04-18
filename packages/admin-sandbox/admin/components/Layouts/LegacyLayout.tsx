import { ContemberLogoImage, DimensionsSwitcher, LayoutPage, Layout as LegacyLayout, Link, Logo } from '@contember/admin'
import { CommonSlotTargets, commonSlotTargets, useLayoutSlotRegistryContext } from '@contember/cms-layout'
import { PropsWithChildren } from 'react'
import { Navigation } from '../Navigation'

export const Layout = (props: PropsWithChildren) => {
	const { activeSlots } = useLayoutSlotRegistryContext()

	return (
		<LegacyLayout
			sidebarHeader={<Link to="index"><Logo image={<ContemberLogoImage withLabel />} /></Link>}
			switchers={<>
				<DimensionsSwitcher
					optionEntities="Locale"
					orderBy="code asc"
					dimension="locale"
					labelField="code"
					slugField="code"
					maxItems={1}
				/>
				{/*<DimensionsSwitcher*/}
				{/*	optionEntities="LocaleDialect[locale.code = $locale]"*/}
				{/*	orderBy="label asc"*/}
				{/*	dimension="dialect"*/}
				{/*	labelField="label"*/}
				{/*	slugField="label"*/}
				{/*	maxItems={1}*/}
				{/*/>*/}
			</>}
			navigation={<Navigation />}
			children={(
				<LayoutPage
					navigation={activeSlots.has(commonSlotTargets.Back) ? <CommonSlotTargets.Back /> : null}
					actions={activeSlots.has(commonSlotTargets.Actions) ? <CommonSlotTargets.Actions /> : null}
					side={activeSlots.has(commonSlotTargets.Sidebar) ? <CommonSlotTargets.Sidebar /> : null}
					title={activeSlots.has(commonSlotTargets.Title) ? <CommonSlotTargets.Title /> : null}
				>
					<CommonSlotTargets.Content />
				</LayoutPage>
			)}
		/>
	)
}
