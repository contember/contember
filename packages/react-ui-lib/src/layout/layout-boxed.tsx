import { useCurrentRequest } from '@contember/interface'
import { LogoutTrigger } from '@contember/react-identity'
import { useHasActiveSlotsFactory } from '@contember/react-slots'
import { useStoredState } from '@contember/react-utils'
import {
	LogOutIcon,
	Maximize2Icon,
	MenuIcon,
	Minimize2Icon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
	PanelRightCloseIcon,
	PanelRightOpenIcon,
} from 'lucide-react'
import { PropsWithChildren, useEffect, useState } from 'react'
import { dict } from '../dict'
import { Button } from '../ui/button'
import { SidebarProvider } from '../ui/sidebar'
import { uic } from '../utils'
import { SlotTargets } from './slots'

const LayoutBodyUI = uic('div', { baseClass: 'bg-gray-50 h-full min-h-screen relative py-4 pl-[calc(100vw-100%)]' })
const LayoutMaxWidthUI = uic('div', {
	baseClass: 'mx-auto transition-all',
	variants: {
		layout: {
			stretch: 'max-w-[calc(100vw-5rem)]',
			default: 'max-w-[100rem]',
		},
	},
	defaultVariants: {
		layout: 'default',
	},
})
const LayoutBoxUI = uic('div', { baseClass: 'rounded-xl shadow-lg border bg-white gap-1 flex flex-col lg:flex-row mt-4 relative min-h-[calc(100vh-10rem)]' })

const LayoutCenterPanelUI = uic('div', { baseClass: 'flex flex-col flex-2 p-4 gap-2 w-full flex-auto overflow-hidden' })
const LayoutCenterTopUI = uic('div', { baseClass: 'flex justify-between pb-4 mb-4 border-b' })

const LayoutLeftSidebarUI = uic('div', {
	baseClass: 'flex-col lg:border-r bg-neutral-50 border-r-gray-300 lg:w-96 flex-auto gap-2 relative rounded-l-xl',
	variants: {
		visibility: {
			show: 'flex',
			hidden: 'hidden',
			auto: 'hidden lg:flex',
		},
	},
	defaultVariants: {
		visibility: 'auto',
	},
})
const LayoutRightSidebarUI = uic('div', {
	baseClass: ' flex-col p-4 pt-6 gap-2 lg:border-l border-l-gray-300 lg:w-96 flex-auto relative',
	variants: {
		visibility: {
			show: 'flex',
			hidden: 'hidden',
		},
	},
	defaultVariants: {
		visibility: 'show',
	},
})

const LayoutTitleUI = uic('h1', { baseClass: 'text-2xl font-bold' })

const LayoutFooterUI = uic('div', { baseClass: 'flex justify-end mt-2 mx-4' })

const LayoutLeftPanelCloserUI = uic('a', { baseClass: 'hidden lg:flex self-end absolute top-1 right-1 opacity-0 text-gray-400 hover:opacity-100 transition-opacity cursor-pointer' })
const LayoutLeftPanelOpenerUI = uic('a', { baseClass: 'hidden lg:block absolute top-1 left-1' })
const LayoutRightPanelCloserUI = uic('a', { baseClass: 'hidden lg:flex self-end absolute top-1 right-1 opacity-0 text-gray-400 hover:opacity-100 transition-opacity cursor-pointer' })
const LayoutRightPanelOpenerUI = uic('a', { baseClass: 'absolute top-1 right-1' })
const LayoutSwitcherUI = uic('a', { baseClass: 'hidden lg:flex self-end absolute top-1 right-1 opacity-20 text-gray-400 hover:opacity-100 transition-opacity cursor-pointer' })
const LayoutContentWrapperUI = uic('div', { baseClass: 'flex flex-col gap-12' })

export const LayoutBoxedComponent = ({ children, ...rest }: PropsWithChildren<{}>) => {
	const isActive = useHasActiveSlotsFactory()

	const [leftSidebarVisibility, setLeftSidebarVisibility] = useState<'show' | 'hidden' | 'auto'>('auto')
	const [layout, setLayout] = useStoredState<'default' | 'stretch'>('local', ['', 'layout'], it => it ?? 'default')

	const request = useCurrentRequest()
	useEffect(() => {
		setLeftSidebarVisibility(it => it === 'show' ? 'auto' : it)
	}, [request])

	useEffect(() => {
		window.scrollTo({ top: 0 })
	}, [request?.pageName])

	const [rightSidebarVisibility, setRightSidebarVisibility] = useState<'show' | 'hidden'>('show')

	const hasRightSidebar = isActive('SidebarRightHeader', 'SidebarRightBody', 'SidebarRightFooter', 'Sidebar')
	return (
		<SidebarProvider>
			<LayoutBodyUI>
				<LayoutSwitcherUI className="absolute top-0.5 right-0.5" onClick={() => setLayout(it => it === 'default' ? 'stretch' : 'default')}>
					{layout === 'default' ? <Maximize2Icon /> : <Minimize2Icon />}
				</LayoutSwitcherUI>


				<LayoutMaxWidthUI layout={layout}>
					<LayoutBoxUI>
						{leftSidebarVisibility === 'hidden' && (
							<LayoutLeftPanelOpenerUI onClick={() => setLeftSidebarVisibility('auto')}>
								<PanelLeftOpenIcon className="w-4 h-4" />
							</LayoutLeftPanelOpenerUI>
						)}
						{hasRightSidebar && rightSidebarVisibility === 'hidden' ? (
							<LayoutRightPanelOpenerUI onClick={() => setRightSidebarVisibility('show')}>
								<PanelRightOpenIcon className="w-4 h-4" />
							</LayoutRightPanelOpenerUI>
						) : null}

						<LayoutLeftSidebarUI visibility={leftSidebarVisibility}>

							<LayoutLeftPanelCloserUI onClick={() => setLeftSidebarVisibility('hidden')}>
								<PanelLeftCloseIcon className="w-4 h-4" />
							</LayoutLeftPanelCloserUI>

							<div className={'p-4 flex gap-2'}>
								<SlotTargets.Logo />
							</div>

							<div className="px-4">
								<SlotTargets.Navigation />
							</div>

							<div className={'mt-auto rounded-bl py-2 px-2 border-t'}>
								<LogoutTrigger>
									<Button variant={'ghost'} size="sm" className="gap-2 hover:underline">
										<LogOutIcon className="w-3 h-3 text-gray-500" /> {dict.logout}
									</Button>
								</LogoutTrigger>
							</div>

						</LayoutLeftSidebarUI>


						<LayoutCenterPanelUI>
							<LayoutCenterTopUI>
								<div className={'flex gap-2'}>
									<SlotTargets.Back />
									<SlotTargets.Title as={LayoutTitleUI} />
								</div>
								<SlotTargets.ContentHeader />
								<div className={'flex gap-2'}>
									<SlotTargets.Actions />
									<div className={'flex flex-col lg:hidden p-4 gap-2 w-full flex-auto'}>
										<a onClick={() => setLeftSidebarVisibility(it => it !== 'show' ? 'show' : 'auto')}><MenuIcon /></a>
									</div>
								</div>
							</LayoutCenterTopUI>

							<LayoutContentWrapperUI>
								{children}
							</LayoutContentWrapperUI>
						</LayoutCenterPanelUI>
						{hasRightSidebar ?
							<LayoutRightSidebarUI visibility={rightSidebarVisibility ? 'show' : 'hidden'}>
								<LayoutRightPanelCloserUI onClick={() => setRightSidebarVisibility('hidden')}>
									<PanelRightCloseIcon />
								</LayoutRightPanelCloserUI>
								<div>
									<SlotTargets.Sidebar />
								</div>
							</LayoutRightSidebarUI>
							: null
						}

					</LayoutBoxUI>

					<LayoutFooterUI>
						<div>
							<SlotTargets.Footer />
						</div>
					</LayoutFooterUI>
				</LayoutMaxWidthUI>
			</LayoutBodyUI>
		</SidebarProvider>
	)
}
LayoutBoxedComponent.displayName = 'LayoutBoxed'
