import { Link, LogoutTrigger, useIdentity } from '@contember/interface'
import {
	ArchiveIcon,
	BadgeCheckIcon,
	BellIcon,
	BrushIcon,
	ChevronsUpDown,
	DatabaseIcon,
	FormInputIcon,
	GripVertical,
	HomeIcon,
	KanbanIcon,
	KeyRoundIcon,
	LanguagesIcon,
	LoaderIcon,
	LockKeyholeIcon,
	LogOutIcon,
	PencilIcon,
	PencilOffIcon,
	PlugIcon,
	TableIcon,
	TextCursorIcon,
	UploadIcon,
	UserIcon,
	UsersIcon,
} from 'lucide-react'
import { dict } from '~/lib/dict'
import { Avatar, AvatarFallback } from '~/lib/ui/avatar'
import { AnchorButton, Button } from '~/lib/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/lib/ui/dropdown'
import { Menu, MenuItem } from '~/lib/ui/menu'
import { SidebarMenuButton } from '~/lib/ui/sidebar'
import { useIsMobile } from '~/lib/utils/use-mobile'


const menuItemSize = 'lg'
const menuSubItemSize = 'default'

export const Navigation = () => (
	<Menu>
		<MenuItem icon={<HomeIcon size={16} />} label="Home" to="index" size={menuItemSize} />
		<MenuItem icon={<UserIcon size={16} />} expandedByDefault label="Tenant" size={menuItemSize}>
			<MenuItem icon={<LockKeyholeIcon />} label="Security" to="tenant/security" size={menuSubItemSize} />
			<MenuItem icon={<UsersIcon />} label="Members" to="tenant/members" size={menuSubItemSize} />
			<MenuItem icon={<KeyRoundIcon />} label="API keys" to="tenant/apiKeys" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<BrushIcon size={16} />} label="UI" size={menuItemSize}>
			<MenuItem label="Buttons" to="ui/button" size={menuSubItemSize} />
			<MenuItem label="Toasts" to="ui/toast" size={menuSubItemSize} />
			<MenuItem label="Dialog" to="ui/dialog" size={menuSubItemSize} />
			<MenuItem label="Property list" to="ui/propertyList" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<KanbanIcon size={16} />} label="Kanban" size={menuItemSize}>
			<MenuItem label="Dynamic columns" to="board/assignee" size={menuSubItemSize} />
			<MenuItem label="Static columns" to="board/status" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<GripVertical size={16} />} label="Repeater" size={menuItemSize}>
			<MenuItem label="Sortable repeater" to="repeater" size={menuSubItemSize} />
			<MenuItem label="Non-sortable repeater" to="repeater/nonSortable" size={menuSubItemSize} />
			<MenuItem label="Repeater on relation" to="repeater/onRelation" size={menuSubItemSize} />
			<MenuItem label="Block repeater" to="blocks" size={menuSubItemSize} />
			<MenuItem label="Block repeater w/o dual render" to="blocks/withoutDualRender" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<TableIcon size={16} />} label="Grid" size={menuItemSize}>
			<MenuItem label="Complex grid" to="grid" size={menuSubItemSize} />
			<MenuItem label="Simple grid" to="grid/simpleGrid" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<TextCursorIcon size={16} />} label="Forms" size={menuItemSize}>
			<MenuItem label="Index" to="form" size={menuSubItemSize} />
			<MenuItem label="Create" to="form/articleCreate" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<FormInputIcon size={16} />} label="Inputs" size={menuItemSize}>
			<MenuItem label="Basic inputs" to="input/basic" size={menuSubItemSize} />
			<MenuItem label="Select or type" to="input/selectOrType" size={menuSubItemSize} />
			<MenuItem label="Textarea" to="input/textarea" size={menuSubItemSize} />
			<MenuItem label="Client validation" to="input/clientValidation" size={menuSubItemSize} />
			<MenuItem label="Checkbox" to="input/checkbox" size={menuSubItemSize} />
			<MenuItem label="Radio" to="input/enumRadio" size={menuSubItemSize} />
			<MenuItem label="Checkbox list" to="input/checkboxList" size={menuSubItemSize} />
			<MenuItem label="Slug" to="input/slug" size={menuSubItemSize} />
			<MenuItem label="Cents field" to="input/cents" size={menuSubItemSize} />
			<MenuItem label="Server rules" to="input/serverRules" size={menuSubItemSize} />
			<MenuItem label="Custom error" to="input/customError" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<ArchiveIcon size={16} />} label="Select" size={menuItemSize}>
			<MenuItem label="Has one select" to="select/hasOne" size={menuSubItemSize} />
			<MenuItem label="Create new form" to="select/createNewForm" size={menuSubItemSize} />
			<MenuItem label="Has many select" to="select/hasMany" size={menuSubItemSize} />
			<MenuItem label="Has many sortable select" to="select/hasManySortable" size={menuSubItemSize} />
			<MenuItem label="Enum select" to="select/enumSelect" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<UploadIcon size={16} />} label="Upload" size={menuItemSize}>
			<MenuItem label="Image upload" to="upload/image" size={menuSubItemSize} />
			<MenuItem label="Image w/o meta upload" to="upload/imageTrivial" size={menuSubItemSize} />
			<MenuItem label="Audio upload" to="upload/audio" size={menuSubItemSize} />
			<MenuItem label="Video upload" to="upload/video" size={menuSubItemSize} />
			<MenuItem label="Generic file upload" to="upload/any" size={menuSubItemSize} />
			<MenuItem label="Image repeate uploadr" to="upload/imageList" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<LanguagesIcon size={16} />} label="Dimensions" to="dimensions" size={menuItemSize} />
		<MenuItem icon={<PencilIcon size={16} />} label="Rich text" size={menuItemSize}>
			<MenuItem label="Rich text field" to="editor/richtext" size={menuSubItemSize} />
			<MenuItem label="Block editor" to="editor/blocks" size={menuSubItemSize} />
			<MenuItem label="Legacy block editor" to="legacyEditor/blocks" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<PencilIcon size={16} />} label="Custom components" size={menuItemSize}>
			<MenuItem label="Custom Input" to="custom/input" size={menuSubItemSize} />
			<MenuItem label="Folder structure" to="folders" size={menuSubItemSize} />
			<MenuItem label="Folder dataview" to="folders/dataview" size={menuSubItemSize} />
			<MenuItem label="Folder combo" to="folders/dialogGrid" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<DatabaseIcon size={16} />} label="Auto CRUD" to="auto/index" size={menuItemSize} />
		<MenuItem icon={<LoaderIcon size={16} />} label="Extend tree" size={menuItemSize}>
			<MenuItem label="Entity subtree" to="extendTreeSingle" size={menuSubItemSize} />
			<MenuItem label="Entity list subtree" to="extendTreeMany" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<PlugIcon size={16} />} label="Hooks" size={menuItemSize}>
			<MenuItem label="Content API" to="hooks/contentApi" size={menuSubItemSize} />
		</MenuItem>
		<MenuItem icon={<PencilOffIcon size={16} />} label="Headless" size={menuItemSize}>
			<MenuItem label="Dataview" to="dataview" size={menuSubItemSize} />
		</MenuItem>
	</Menu>
)

export const UserNavigation = () => {
	const isMobile = useIsMobile()
	const identity = useIdentity()

	const userEmail = identity?.person?.email
	const userInitial = userEmail?.substr(0, 1).toLocaleUpperCase()

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
				className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
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
