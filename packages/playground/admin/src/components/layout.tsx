import { Identity2023 } from '@contember/brand'
import { LogOutIcon, MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, PanelRightCloseIcon, PanelRightOpenIcon } from 'lucide-react'
import { memo, PropsWithChildren, useState } from 'react'
import { Navigation } from './navigation'
import { Slots, SlotTargets } from './slots'
import { Link } from '@contember/interface'
import { IdentityLoader } from './binding/identity'
import { ComponentClassNameProps } from '@contember/utilities'
import { LogoutTrigger } from '@contember/react-identity'
import { useHasActiveSlotsFactory } from '@contember/react-slots'
import { Button } from './ui/button'

export const Layout = memo(({ children }: PropsWithChildren) => {
	return (
		<IdentityLoader>
			<LayoutComponent>
				<Slots.Logo>
					<Link to="index">
						<Identity2023.Edit scale={2} />
					</Link>
				</Slots.Logo>
				<Slots.Navigation>
					<Navigation />
				</Slots.Navigation>

				<Slots.Profile>
					<LogoutTrigger>
						<Button variant={'ghost'} size="sm" className="gap-2 hover:underline">
							<LogOutIcon className="w-3 h-3 text-gray-500" /> Logout
						</Button>
					</LogoutTrigger>
				</Slots.Profile>

				<Slots.Footer>
					<p><small>Created with <a className="content-link" href="https://www.contember.com/">AI-assisted Contember
						Studio</a></small></p>
				</Slots.Footer>

				{children}
			</LayoutComponent>
		</IdentityLoader>
	)
})
Layout.displayName = 'Layout'

const LayoutComponent = ({ children, ...rest }: PropsWithChildren<ComponentClassNameProps>) => {
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
						className={`${showLeftSidebar === false ? 'hidden' : (showLeftSidebar === true ? 'flex' : 'hidden lg:flex')} flex-col lg:border-r border-r-gray-300 lg:w-96 flex-auto gap-2 relative`}>
						<div
							className={'hidden lg:flex self-end absolute top-0 right-1 opacity-0 text-gray-400 hover:opacity-100 transition-opacity cursor-pointer'}>
							<a onClick={() => setShowLeftSidebar(false)}><PanelLeftCloseIcon /></a>
						</div>
						<div className="p-4">
							<SlotTargets.Navigation />
						</div>
						<div className={'mt-auto bg-gray-100 rounded-bl py-2 px-2 border-t'}>
							<SlotTargets.Profile />
						</div>
					</div>
					<div className={'flex flex-col flex-2 p-4 gap-2 w-full flex-auto overflow-hidden'}>
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
						<SlotTargets.Footer />
					</div>
				</div>
			</div>
		</div>
	)
}
LayoutComponent.displayName = 'Layout'
