import { createRequiredContext } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { Slot } from '@radix-ui/react-slot'
import { cva, VariantProps } from 'class-variance-authority'
import { PanelLeft } from 'lucide-react'
import {
	ComponentProps,
	CSSProperties,
	ElementRef,
	forwardRef,
	PropsWithChildren,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react'
import { cn, uic } from '../utils'
import { useIsMobile } from '../utils/use-mobile'
import { Button } from './button'
import { Input } from './input'
import { Separator } from './separator'
import { Sheet, SheetContent } from './sheet'
import { Skeleton } from './skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

const SIDEBAR_COOKIE_NAME = 'sidebar:state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_LARGE = '20rem'
const SIDEBAR_WIDTH_MOBILE = '18rem'
const SIDEBAR_WIDTH_ICON = '3rem'
const SIDEBAR_WIDTH_ICON_LARGE = '4rem'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

type SidebarContext = {
	state: 'expanded' | 'collapsed'
	open: boolean
	setOpen: (open: boolean) => void
	openMobile: boolean
	setOpenMobile: (open: boolean) => void
	isMobile: boolean
	toggleSidebar: () => void
}

interface SidebarProviderProps extends PropsWithChildren {
	defaultOpen?: boolean
	open?: boolean
	onOpenChange?: (open: boolean) => void
}

const [ctx, useSidebar] = createRequiredContext<SidebarContext>('SidebarContext')

export const SidebarProvider = ({
	defaultOpen = true, open: openProp, onOpenChange, children,
}: SidebarProviderProps) => {
	const isMobile = useIsMobile()
	const [openMobile, setOpenMobile] = useState(false)
	const [_open, _setOpen] = useState(defaultOpen)

	const open = openProp ?? _open

	const setOpen = useCallback(
		(value: boolean | ((value: boolean) => boolean)) => {
			const openState = typeof value === 'function' ? value(open) : value

			if (onOpenChange) {
				onOpenChange(openState)
			} else {
				_setOpen(openState)
			}

			document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
		},
		[onOpenChange, open],
	)

	const toggleSidebar = useCallback(() => isMobile ? setOpenMobile(prev => !prev) : setOpen(prev => !prev), [isMobile, setOpen])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
				(event.metaKey || event.ctrlKey)
			) {
				event.preventDefault()
				toggleSidebar()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [toggleSidebar])

	const contextValue = useMemo(
		() => ({
			state: open ? 'expanded' : 'collapsed',
			open,
			setOpen,
			isMobile,
			openMobile,
			setOpenMobile,
			toggleSidebar,
		} satisfies SidebarContext),
		[open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
	)

	return (
		<ctx.Provider value={contextValue}>
			<TooltipProvider delayDuration={0}>
				{children}
			</TooltipProvider>
		</ctx.Provider>
	)
}
SidebarProvider.displayName = 'SidebarProvider'

export const SidebarLayout = uic('div', {
	baseClass: 'group/sidebar-wrapper grid min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar max-h-screen max-w-[100vw] overflow-y-auto md:grid-cols-[auto_1fr_auto]',
	// Add grid template columns
	style: {
		'--sidebar-width': SIDEBAR_WIDTH,
		'--sidebar-width-large': SIDEBAR_WIDTH_LARGE,
		'--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
		'--sidebar-width-icon-large': SIDEBAR_WIDTH_ICON_LARGE,
	} as React.CSSProperties,
	displayName: 'SidebarLayout',
})

export const SidebarInset = uic('main', {
	baseClass: [
		'relative min-h-svh grid',
		'grid-cols-1 grid-rows-[auto_1fr]', // Single column layout
		'bg-background',
		'peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow',
	],
	displayName: 'SidebarInset',
})

export const SidebarInsetHeader = uic('header', {
	baseClass: [
		'bg-background z-50 flex justify-between h-16 shrink-0 items-center gap-2 border-b border-gray-200',
		'transition-[width,height] ease-linear',
		'group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12',
	],
	displayName: 'SidebarInsetHeader',
})

export const SidebarInsetContent = uic('div', {
	baseClass: 'overflow-y-auto p-4',
	displayName: 'SidebarInsetContent',
})

export const SidebarInsetHeaderActions = uic('div', {
	baseClass: 'flex justify-end items-center gap-2 px-4',
	displayName: 'SidebarInsetHeaderAction',
})

const SidebarNone = uic('div', {
	baseClass: 'flex h-full w-(--sidebar-width) 2xl:w-(--sidebar-width-large) flex-col bg-sidebar text-sidebar-foreground',
	displayName: 'SidebarNone',
})

const SidebarDesktopGap = uic('div', {
	baseClass: [
		'duration-200 relative w-(--sidebar-width) 2xl:w-(--sidebar-width-large) bg-transparent transition-[width] ease-linear',
		'group-data-[collapsible=offcanvas]:w-0',
		'group-data-[side=right]:rotate-180',
	],
	variants: {
		variant: {
			floating: 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))] 2xl:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon-large)_+_theme(spacing.4))]',
			inset: 'group-data-[collapsible=icon]:w-5',
			sidebar: 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) 2xl:group-data-[collapsible=icon]:w-(--sidebar-width-icon-large)',
		},
	},
	displayName: 'SidebarDesktopGap',
})

const SidebarInner = uic('div', {
	baseClass: 'duration-200 fixed inset-y-0 z-10 hidden h-svh transition-[left,right,width] ease-linear md:block',
	variants: {
		side: {
			left: 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] 2xl:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width-large)*-1)]',
			right: 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] 2xl:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width-large)*-1)]',
		},
		variant: {
			floating: 'p-2 w-(--sidebar-width) 2xl:w-(--sidebar-width-large) group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)] 2xl:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon-large)_+_theme(spacing.4)_+2px)]',
			inset: 'p-2 w-(--sidebar-width) 2xl:w-(--sidebar-width-large) group-data-[collapsible=icon]:w-5',
			sidebar: 'w-(--sidebar-width) 2xl:w-(--sidebar-width-large) group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=left]:border-gray-200 group-data-[side=right]:border-l 2xl:group-data-[collapsible=icon]:w-(--sidebar-width-icon-large)',
		},
	},
	variantsAsDataAttrs: ['variant', 'side'],
	wrapInner: ({ children }) =>
		<div data-sidebar="sidebar" className="grid h-full w-full grid-rows-[auto_1fr_auto]">
			{children}
		</div>,
	displayName: 'SidebarInner',
})

interface SidebarProps extends ComponentProps<'div'> {
	side?: 'left' | 'right'
	variant?: 'sidebar' | 'floating' | 'inset'
	collapsible?: 'offcanvas' | 'icon' | 'none'
}

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
	({ side = 'left', variant = 'sidebar', collapsible = 'offcanvas', className, children, ...props }, ref) => {
		const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

		if (collapsible === 'none') {
			return (
				<SidebarNone ref={ref} className={className} {...props}>
					{children}
				</SidebarNone>
			)
		}

		if (isMobile) {
			return (
				<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
					<SheetContent
						data-sidebar="sidebar"
						data-mobile={dataAttribute(true)}
						className="w-(--sidebar-width) 2xl:w-(--sidebar-width-large) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
						style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as CSSProperties}
						side={side}
					>
						<div className="flex h-full w-full flex-col">{children}</div>
					</SheetContent>
				</Sheet>
			)
		}

		return (
			<div
				ref={ref}
				className="group peer hidden md:block text-sidebar-foreground bg-sidebar"
				data-state={state}
				data-collapsible={state === 'collapsed' ? collapsible : ''}
				data-variant={variant}
				data-side={side}
			>
				<SidebarDesktopGap variant={variant} />
				<SidebarInner side={side} variant={variant} className={className} {...props}>
					{children}
				</SidebarInner>
			</div>
		)
	},
)
Sidebar.displayName = 'Sidebar'


export const SidebarTrigger = forwardRef<ElementRef<typeof Button>, ComponentProps<typeof Button>>(({
	className,
	onClick,
	...props
}, ref) => {
	const { toggleSidebar } = useSidebar()

	return (
		<Button ref={ref} data-sidebar="trigger" variant="ghost" size="icon" className={cn('h-7 w-7', className)} onClick={event => {
			onClick?.(event)
			toggleSidebar()
		}} {...props}>
			<PanelLeft size={16} />
			<span className="sr-only">Toggle Sidebar</span>
		</Button>
	)
})
SidebarTrigger.displayName = 'SidebarTrigger'

export const SidebarRail = forwardRef<HTMLButtonElement, ComponentProps<'button'>>(({ className, ...props }, ref) => {
	const { toggleSidebar } = useSidebar()

	return (
		<button
			ref={ref}
			data-sidebar="rail"
			aria-label="Toggle Sidebar"
			tabIndex={-1}
			onClick={toggleSidebar}
			title="Toggle Sidebar"
			className={cn(
				'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear hover:after:bg-sidebar-border sm:flex',
				'after:absolute after:inset-y-0 after:left-1/2 after:w-[2px]',
				'group-data-[side=left]:-right-4 group-data-[side=right]:left-0',
				'[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize [[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
				'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar',
				'[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
				'[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
				className,
			)}
			{...props}
		/>
	)
})
SidebarRail.displayName = 'SidebarRail'

export const SidebarInput = uic(Input, {
	baseClass: 'h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
	defaultProps: {
		'data-sidebar': 'input',
	},
	displayName: 'SidebarInput',
})

export const SidebarHeader = uic('header', {
	baseClass: 'flex flex-col gap-2 p-1 2xl:p-3',
	defaultProps: {
		'data-sidebar': 'header',
	},
	displayName: 'SidebarHeader',
})

export const SidebarFooter = uic('footer', {
	baseClass: 'flex flex-col gap-2 p-1 2xl:p-3',
	defaultProps: {
		'data-sidebar': 'footer',
	},
	displayName: 'SidebarFooter',
})

export const SidebarSeparator = uic(Separator, {
	baseClass: 'mx-2 w-auto bg-sidebar-border',
	defaultProps: {
		'data-sidebar': 'separator',
	},
	displayName: 'SidebarSeparator',
})

export const SidebarContent = uic('div', {
	baseClass: 'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
	defaultProps: {
		'data-sidebar': 'content',
	},
	displayName: 'SidebarContent',
})

export const SidebarGroup = uic('div', {
	baseClass: 'relative flex w-full min-w-0 flex-col p-2 2xl:p-4',
	defaultProps: {
		'data-sidebar': 'group',
	},
	displayName: 'SidebarGroup',
})

export const SidebarGroupLabel = uic('div', {
	baseClass: [
		'duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-hidden ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
		'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
	],
	defaultProps: {
		'data-sidebar': 'group-label',
	},
	displayName: 'SidebarGroupLabel',
})

export const SidebarGroupAction = uic('button', {
	baseClass: [
		'absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
		// Increases the hit area of the button on mobile.
		'after:absolute after:-inset-2 after:md:hidden',
		'group-data-[collapsible=icon]:hidden',
	],
	defaultProps: {
		'data-sidebar': 'group-action',
	},
	displayName: 'SidebarGroupAction',
})

export const SidebarGroupContent = uic('div', {
	baseClass: 'w-full text-sm',
	defaultProps: {
		'data-sidebar': 'group-content',
	},
	displayName: 'SidebarGroupContent',
})

export const SidebarMenu = uic('ul', {
	baseClass: 'flex w-full min-w-0 flex-col gap-1',
	defaultProps: {
		'data-sidebar': 'menu',
	},
	displayName: 'SidebarMenu',
})

export const SidebarMenuItem = uic('li', {
	baseClass: 'group/menu-item relative',
	defaultProps: {
		'data-sidebar': 'menu-item',
	},
	displayName: 'SidebarMenuItem',
})

export const sidebarMenuButtonVariants = cva(
	[
		'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring',
		'transition-[width,height,padding]',
		'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
		'focus-visible:ring-2',
		'active:bg-sidebar-accent active:text-sidebar-accent-foreground',
		'disabled:pointer-events-none disabled:opacity-50',
		'group-has-[[data-sidebar=menu-action]]/menu-item:pr-8',
		'aria-disabled:pointer-events-none aria-disabled:opacity-50',
		'data-[active]:bg-sidebar-accent data-[active]:font-medium data-[active]:text-sidebar-accent-foreground',
		'data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground',
		'group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2',
		'[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
	],
	{
		variants: {
			variant: {
				default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
				outline:
					'bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]',
			},
			size: {
				default: 'h-8 text-sm',
				sm: 'h-7 text-xs',
				lg: 'h-12 text-base',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
)

type SidebarMenuButtonProps = ComponentProps<'a'> & {
	asChild?: boolean
	isActive?: boolean
	tooltip?: ReactNode
} & VariantProps<typeof sidebarMenuButtonVariants>

export const SidebarMenuButton = forwardRef<HTMLAnchorElement, SidebarMenuButtonProps>(
	(
		{
			asChild = false,
			isActive = false,
			variant = 'default',
			size = 'default',
			tooltip,
			className,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : 'a'
		const { isMobile, state } = useSidebar()

		const button = (
			<Comp
				ref={ref}
				data-sidebar="menu-button"
				data-size={size}
				data-active={dataAttribute(isActive)}
				className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
				{...props}
			/>
		)

		if (!tooltip) {
			return button
		}

		return (
			<Tooltip>
				<TooltipTrigger asChild>{button}</TooltipTrigger>
				<TooltipContent
					side="right"
					align="center"
					hidden={state !== 'collapsed' || isMobile}
				>{tooltip}</TooltipContent>
			</Tooltip>
		)
	},
)
SidebarMenuButton.displayName = 'SidebarMenuButton'

export const SidebarMenuAction = uic('button', {
	baseClass: [
		'absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2',
		'peer-hover/menu-button:text-sidebar-accent-foreground',
		'[&>svg]:size-4 [&>svg]:shrink-0',
		// Increases the hit area of the button on mobile.
		'after:absolute after:-inset-2 after:md:hidden',
		'peer-data-[size=sm]/menu-button:top-1',
		'peer-data-[size=default]/menu-button:top-1.5',
		'peer-data-[size=lg]/menu-button:top-2.5',
		'group-data-[collapsible=icon]:hidden',
	],
	defaultProps: {
		'data-sidebar': 'menu-action',
	},
	variants: {
		showInHover: {
			true: 'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0',
		},
	},
	displayName: '',
})

export const SidebarMenuBadge = uic('div', {
	baseClass: [
		'absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none',
		'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
		'peer-data-[size=sm]/menu-button:top-1',
		'peer-data-[size=default]/menu-button:top-1.5',
		'peer-data-[size=lg]/menu-button:top-2.5',
		'group-data-[collapsible=icon]:hidden',
	],
	defaultProps: {
		'data-sidebar': 'menu-badge',
	},
	displayName: 'SidebarMenuBadge',
})

interface SidebarMenuSkeletonProps extends ComponentProps<'div'> {
	showIcon?: boolean
}

export const SidebarMenuSkeleton = forwardRef<HTMLDivElement, SidebarMenuSkeletonProps>(({
	className,
	showIcon = false,
	...props
}, ref) => {
	// Random width between 50 to 90%.
	const width = useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, [])

	return (
		<div
			ref={ref}
			data-sidebar="menu-skeleton"
			className={cn('rounded-md h-8 flex gap-2 px-2 items-center', className)}
			{...props}
		>
			{showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
			<Skeleton
				style={{ '--skeleton-width': width } as CSSProperties}
				className="h-4 flex-1 max-w-(--skeleton-width)"
				data-sidebar="menu-skeleton-text"
			/>
		</div>
	)
})
SidebarMenuSkeleton.displayName = 'SidebarMenuSkeleton'

export const SidebarMenuSub = uic('ul', {
	baseClass: 'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden',
	defaultProps: {
		'data-sidebar': 'menu-sub',
	},
	displayName: 'SidebarMenuSub',
})

export { useSidebar }
