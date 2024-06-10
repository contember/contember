import { useHasActiveSlotsFactory } from '@contember/react-slots'
import { SlotTargets } from './slots'

export const Layout = ({ children }: React.PropsWithChildren) => {
	const isActive = useHasActiveSlotsFactory()

	return (
		<div className="layout">
			{isActive('Back', 'Title') && (
				<>
					<SlotTargets.Back />
					<SlotTargets.Title as="h1" />
				</>
			)}


			{isActive('Actions') && (
				<div className="layout__actions">
					<SlotTargets.Actions />
				</div>
			)}

			{children}
		</div>
	)
}
