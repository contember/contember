import { LogOutIcon, MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, PanelRightCloseIcon, PanelRightOpenIcon } from 'lucide-react'
import { PropsWithChildren, useEffect, useState } from 'react'
import { ComponentClassNameProps } from '@contember/utilities'
import { useHasActiveSlotsFactory } from '@contember/react-slots'
import { uic } from '../../lib/utils/uic'
import { SlotTargets } from './slots'
import { Button } from './ui/button'
import { LogoutTrigger } from '@contember/react-identity'
import { dict } from '../dict'
import { useCurrentRequest } from '@contember/interface'


const TitleEl = uic('h1', { baseClass: 'text-2xl font-bold' })

export const LayoutComponent = ({ children, ...rest }: PropsWithChildren<ComponentClassNameProps>) => {
	const isActive = useHasActiveSlotsFactory()

	const [showLeftSidebar, setShowLeftSidebar] = useState<boolean | null>(null)

	const request = useCurrentRequest()
	useEffect(() => {
			setShowLeftSidebar(it => it === true ? null : it)
	}, [request])

	const [showRightSidebar, setShowRightSidebar] = useState<boolean>(true)

	const hasRightSidebar = isActive('SidebarRightHeader', 'SidebarRightBody', 'SidebarRightFooter', 'Sidebar')
	return (
		<div className={'bg-gray-50 h-full min-h-screen relative py-4'}>
			<div className={'max-w-[100rem] mx-auto'}>
				<div className={'rounded-xl shadow-lg border bg-white gap-1 flex flex-col lg:flex-row mt-4 relative min-h-[calc(100vh-10rem)]'}>
					{showLeftSidebar === false && <div className={'hidden lg:block absolute top-1 left-1'}>
						<a onClick={() => setShowLeftSidebar(null)}><PanelLeftOpenIcon /></a>
					</div>}
					{hasRightSidebar && !showRightSidebar ? <div className={'absolute top-1 right-1'}>
						<a onClick={() => setShowRightSidebar(true)}><PanelRightOpenIcon /></a>
					</div> : null}
					<div
						className={`${showLeftSidebar === false ? 'hidden' : (showLeftSidebar === true ? 'flex' : 'hidden lg:flex')} flex-col lg:border-r bg-neutral-50 border-r-gray-300 lg:w-96 flex-auto gap-2 relative rounded-l-xl`}
					>
						<div
							className={'hidden lg:flex self-end absolute top-0 right-1 opacity-0 text-gray-400 hover:opacity-100 transition-opacity cursor-pointer'}
						>
							<a onClick={() => setShowLeftSidebar(false)}><PanelLeftCloseIcon/></a>
						</div>
						<div className={'p-4 flex gap-2'}>
							<SlotTargets.Logo/>
						</div>
						<div className="px-4">
							<SlotTargets.Navigation/>
						</div>
						<div className={'mt-auto rounded-bl py-2 px-2 border-t'}>
							<LogoutTrigger>
								<Button variant={'ghost'} size="sm" className="gap-2 hover:underline">
									<LogOutIcon className="w-3 h-3 text-gray-500"/> {dict.logout}
								</Button>
							</LogoutTrigger>
						</div>
					</div>
					<div className={'flex flex-col flex-2 p-4 gap-2 w-full flex-auto overflow-hidden'}>
						<div className={'flex justify-between pb-4 mb-4 border-b'}>
							<div className={'flex gap-2'}>
								<SlotTargets.Back/>
								<SlotTargets.Title as={TitleEl}/>
							</div>
							<SlotTargets.ContentHeader/>
							<div className={'flex gap-2'}>
								<SlotTargets.Actions/>
								<div className={'flex flex-col lg:hidden p-4 gap-2 w-full flex-auto'}>
									<a onClick={() => setShowLeftSidebar(!showLeftSidebar ? true : null)}><MenuIcon/></a>
								</div>
							</div>
						</div>
						<div>
							{children}
						</div>
					</div>
					{hasRightSidebar ?
						<div
							className={`${showRightSidebar === false ? 'hidden' : 'flex'} flex-col p-4 pt-6 gap-2 lg:border-l border-l-gray-300 lg:w-96 flex-auto relative`}
						>
							<div className={'hidden lg:flex self-end absolute top-1 right-1'}>
								<a onClick={() => setShowRightSidebar(false)}><PanelRightCloseIcon /></a>
							</div>
							<div>
								<SlotTargets.Sidebar />
							</div>
						</div>
						: null}

				</div>

				<div className={'flex justify-end mt-2 mx-4'}>
					<div>
						<SlotTargets.Footer />
					</div>
				</div>
			</div>
		</div>
	)
}
LayoutComponent.displayName = 'Layout'
