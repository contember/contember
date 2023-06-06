import { ContemberLogoImage, Layout as DefaultLayout, DimensionsSwitcher, LayoutPage, Link, Logo } from '@contember/admin'
import { useLayoutSlotRegistryContext } from '@contember/layout'
import { Navigation } from '../Navigation'
import { SlotTargets, slotTargets } from '../Slots'

export const Layout = () => {
	const { activeSlots } = useLayoutSlotRegistryContext()

	return (
		<div className="test-layout">
			<div className="test-layout-home">
				<Link to="index"><Logo image={<ContemberLogoImage withLabel />} /></Link>
			</div>

			<div className="test-layout-switchers">
				<DimensionsSwitcher
					optionEntities="Locale"
					orderBy="code asc"
					dimension="locale"
					labelField="code"
					slugField="code"
					maxItems={1}
				/>
			</div>

			{activeSlots.has(slotTargets.Title) && (
				<div className="test-layout-title">
					<SlotTargets.Title />
				</div>
			)}

			{activeSlots.has(slotTargets.Switchers) && (
				<div className="test-layout-switchers">
					<SlotTargets.Switchers />
				</div>
			)}

			<div className="test-layout-navigation">
				<Navigation />
			</div>

			{activeSlots.has(slotTargets.Back) && (
				<div className="test-layout-back-navigation">
					<SlotTargets.Back />
				</div>
			)}

			{activeSlots.has(slotTargets.Profile) && (
				<div className="test-layout-profile">
					<SlotTargets.Profile />
				</div>
			)}

			<div className="test-layout-content">
				<SlotTargets.Content />
			</div>

			{activeSlots.has(slotTargets.Actions) && (
				<div className="test-layout-actions">
					<SlotTargets.Actions />
				</div>
			)}

			{activeSlots.has(slotTargets.Sidebar) && (
				<div className="test-layout-sidebar">
					<SlotTargets.Sidebar />
				</div>
			)}

			{activeSlots.has(slotTargets.Profile) && (
				<div className="test-layout-profile">
					<SlotTargets.Profile />
				</div>
			)}
		</div>
	)
}
