import { ComponentClassNameProps } from '@contember/utilities'
import { PropsWithChildren, useState } from 'react'
import { SlotTargets } from './Slots'
import { useHasActiveSlotsFactory } from '@contember/react-slots'
import { MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, PanelRightCloseIcon, PanelRightOpenIcon } from 'lucide-react'

export const LayoutComponent = ({ children, ...rest }: PropsWithChildren<ComponentClassNameProps>) => {
	const isActive = useHasActiveSlotsFactory()

	const [showLeftSidebar, setShowLeftSidebar] = useState<boolean | null>(null)
	const [showRightSidebar, setShowRightSidebar] = useState<boolean>(true)

	const hasRightSidebar = isActive('SidebarRightHeader', 'SidebarRightBody', 'SidebarRightFooter', 'Sidebar')
	return (
		<div className={'bg-gray-50 h-full min-h-screen relative py-4'}>
			<div className={'max-w-[100rem] mx-auto'}>
				<div className={'flex justify-between'}>
					<div className={'flex gap-2'}>
						<SlotTargets.Logo />
					</div>
					<div className={'flex gap-2'}>
						<SlotTargets.Actions />
						<div className={'flex flex-col lg:hidden p-4 gap-2 w-full flex-auto'}>
							<a onClick={() => setShowLeftSidebar(!showLeftSidebar ? true : null)}><MenuIcon /></a>
						</div>
					</div>
				</div>
				<div className={'rounded shadow bg-white gap-1 flex flex-col lg:flex-row mt-4 relative'}>
					{showLeftSidebar === false && <div className={'hidden lg:block absolute top-1 left-1'}>
						<a onClick={() => setShowLeftSidebar(null)}><PanelLeftOpenIcon /></a>
					</div>}
					{hasRightSidebar && !showRightSidebar ? <div className={'absolute top-1 right-1'}>
						<a onClick={() => setShowRightSidebar(true)}><PanelRightOpenIcon /></a>
					</div> : null}
					<div
						className={`${showLeftSidebar === false ? 'hidden' : (showLeftSidebar === true ? 'flex' : 'hidden lg:flex')} flex-col p-4 pt-6 lg:border-r border-r-gray-300 lg:w-96 flex-auto gap-2 relative`}>
						<div className={'hidden lg:flex self-end absolute top-0 right-1 opacity-0 text-gray-400 hover:opacity-100 transition-opacity cursor-pointer'}>
							<a onClick={() => setShowLeftSidebar(false)}><PanelLeftCloseIcon /></a>
						</div>
						<div>
							<SlotTargets.Navigation />
						</div>
						<div className={'mt-auto'}>
							<SlotTargets.Profile />
						</div>
					</div>
					<div className={'flex flex-col flex-2 p-4 gap-2 w-full flex-auto'}>
						<div className={'flex'}>
							<div className={'flex gap-2'}>
								<SlotTargets.Back />
								<SlotTargets.Title as="h1" />
							</div>
							<SlotTargets.ContentHeader />
						</div>
						<div>
							{children}
						</div>
					</div>
					{hasRightSidebar ?
						<div
							className={`${showRightSidebar === false ? 'hidden' : 'flex'} flex-col p-4 pt-6 gap-2 lg:border-l border-l-gray-300 lg:w-96 flex-auto relative`}>
							<div className={'hidden lg:flex self-end absolute top-1 right-1'}>
								<a onClick={() => setShowRightSidebar(false)}><PanelRightCloseIcon /></a>
							</div>
							<div>
								<SlotTargets.Sidebar />
							</div>
						</div>
						: null}

				</div>

				<div className={'flex justify-between'}>
					<div>
						<SlotTargets.Footer/>
					</div>
				</div>
			</div>
		</div>
	)
}
LayoutComponent.displayName = 'Layout'
