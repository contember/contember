import { ContemberLogoImage, Layout as DefaultLayout, DimensionsSwitcher, LayoutPage, Link, Logo } from '@contember/admin'
import { useLayoutSlotRegistryContext } from '@contember/layout'
import { Navigation } from '../Navigation'
import { SlotTargets, slotTargets } from '../Slots'

export const Layout = () => {
	const { activeSlots } = useLayoutSlotRegistryContext()

	return (
		<DefaultLayout
			sidebarHeader={<Link to="index"><Logo image={<ContemberLogoImage withLabel />} /></Link>}
			switchers={(
				<DimensionsSwitcher
					optionEntities="Locale"
					orderBy="code asc"
					dimension="locale"
					labelField="code"
					slugField="code"
					maxItems={1}
				/>
			)}
			navigation={<Navigation />}
			children={(
				<LayoutPage
					navigation={activeSlots.has(slotTargets.Back) ? <SlotTargets.Back /> : null}
					actions={activeSlots.has(slotTargets.Actions) ? <SlotTargets.Actions /> : null}
					side={activeSlots.has(slotTargets.Sidebar) ? <SlotTargets.Sidebar /> : null}
					title={activeSlots.has(slotTargets.Title) ? <SlotTargets.Title /> : null}
				>
					<SlotTargets.Content />
				</LayoutPage>
			)}
		/>
	)
}
