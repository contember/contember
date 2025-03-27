import { Link, LogoutTrigger, useIdentity } from '@contember/interface'
import { BadgeCheckIcon, BellIcon, ChevronsUpDown, LogOutIcon } from 'lucide-react'
import { dict } from '~/lib/dict'
import { Avatar, AvatarFallback } from '~/lib/ui/avatar'
import { AnchorButton, Button } from '~/lib/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '~/lib/ui/dropdown'
import { SidebarMenuButton } from '~/lib/ui/sidebar'
import { useIsMobile } from '~/lib/utils/use-mobile'

export const Navigation = () => (<div>Navigation</div>)

export const UserNavigation = () => {
	const isMobile = useIsMobile()
	const identity = useIdentity()

	const userEmail = identity?.person?.email
	const userInitial = userEmail?.substring(0, 1).toLocaleUpperCase()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton
					size="lg"
					className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<Avatar className="icon h-6 w-6 rounded-lg">
						<AvatarFallback avatarFallbackColorString={userEmail} className="rounded-lg">
							{userInitial}
						</AvatarFallback>
					</Avatar>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-semibold">{userEmail}</span>
					</div>
					<ChevronsUpDown className="ml-auto size-4" />
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
				side={isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenuLabel className="p-0 font-normal">
					<div className="flex items-center gap-2 pl-3 pr-1 py-1.5 text-left text-sm">
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarFallback avatarFallbackColorString={userEmail} className="rounded-lg">
								{userInitial}
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">{userEmail}</span>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<Link to="tenant/security">
							<AnchorButton variant="ghost" size="xs" className="flex gap-2">
								<BadgeCheckIcon size={16} />
								Security
							</AnchorButton>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<Link to="tenant/apiKeys">
							<AnchorButton variant="ghost" size="xs" className="flex gap-2">
								<BellIcon size={16} />
								API keys
							</AnchorButton>
						</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					<LogoutTrigger>
						<Button variant="ghost" size="xs" className="flex gap-2">
							<LogOutIcon size={16} /> {dict.logout}
						</Button>
					</LogoutTrigger>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
