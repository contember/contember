import {
	ArchiveIcon,
	BrushIcon,
	DatabaseIcon,
	FormInputIcon,
	GanttChartIcon,
	GripVertical,
	HomeIcon,
	KanbanIcon,
	KeyRoundIcon,
	LanguagesIcon, LoaderIcon,
	LockKeyholeIcon,
	PencilIcon, PlugIcon,
	TableIcon, TextCursorIcon,
	UploadIcon,
	UserIcon,
	UsersIcon,
} from 'lucide-react'
import { Menu, MenuItem } from '@app/lib/ui/menu'


export const Navigation = () => {
	const line = <span className={'h-full w-[1px] bg-gray-200'}>&nbsp;</span>
	return (
		<div>
			<Menu>
				<MenuItem icon={<HomeIcon size={16} />} label={'Home'} to={'index'} />
				<MenuItem icon={<UserIcon size={16} />} label={'Tenant'}>
					<MenuItem icon={<LockKeyholeIcon />} label={'Security'} to={'tenant/security'} />
					<MenuItem icon={<UsersIcon />} label={'Members'} to={'tenant/members'} />
					<MenuItem icon={<KeyRoundIcon />} label={'API keys'} to={'tenant/apiKeys'} />
				</MenuItem>
				<MenuItem icon={<BrushIcon size={16} />} label={'UI'}>
					<MenuItem icon={line} label={'Buttons'} to={'ui/button'} />
					<MenuItem icon={line} label={'Toasts'} to={'ui/toast'} />
					<MenuItem icon={line} label={'Dialog'} to={'ui/dialog'} />
					<MenuItem icon={line} label={'Property list'} to={'ui/propertyList'} />
				</MenuItem>
				<MenuItem icon={<GanttChartIcon size={16} />} label={'Gantt'} to={'gantt'}/>
				<MenuItem icon={<KanbanIcon size={16} />} label={'Kanban'} >
					<MenuItem icon={line} label={'Dynamic columns'} to={'board/assignee'} />
					<MenuItem icon={line} label={'Static columns'} to={'board/status'} />
				</MenuItem>
				<MenuItem icon={<GripVertical size={16} />} label={'Repeater'}>
					<MenuItem icon={line} label={'Sortable repeater'} to={'repeater'} />
					<MenuItem icon={line} label={'Non-sortable repeater'} to={'repeater/nonSortable'} />
					<MenuItem icon={line} label={'Repeater on relation'} to={'repeater/onRelation'} />
					<MenuItem icon={line} label={'Block repeater'} to={'blocks'} />
					<MenuItem icon={line} label={'Block repeater w/o dual render'} to={'blocks/withoutDualRender'} />
				</MenuItem>
				<MenuItem icon={<TableIcon size={16} />} label={'Grid'}>
					<MenuItem icon={line} label={'Complex grid'} to={'grid'} />
					<MenuItem icon={line} label={'Simple grid'} to={'grid/simpleGrid'} />
				</MenuItem>
				<MenuItem icon={<TextCursorIcon size={16} />} label={'Forms'}>
					<MenuItem icon={line} label={'Index'} to={'form'} />
					<MenuItem icon={line} label={'Create'} to={'form/articleCreate'} />
				</MenuItem>
				<MenuItem icon={<FormInputIcon size={16} />} label={'Inputs'}>
					<MenuItem icon={line} label={'Basic inputs'} to={'input/basic'} />
					<MenuItem icon={line} label={'Select or type'} to={'input/selectOrType'} />
					<MenuItem icon={line} label={'Textarea'} to={'input/textarea'} />
					<MenuItem icon={line} label={'Client validation'} to={'input/clientValidation'} />
					<MenuItem icon={line} label={'Checkbox'} to={'input/checkbox'} />
					<MenuItem icon={line} label={'Radio'} to={'input/enumRadio'} />
					<MenuItem icon={line} label={'Slug'} to={'input/slug'} />
					<MenuItem icon={line} label={'Cents field'} to={'input/cents'} />
					<MenuItem icon={line} label={'Server rules'} to={'input/serverRules'} />
				</MenuItem>
				<MenuItem icon={<ArchiveIcon size={16} />} label={'Select'}>
					<MenuItem icon={line} label={'Has one select'} to={'select/hasOne'} />
					<MenuItem icon={line} label={'Create new form'} to={'select/createNewForm'} />
					<MenuItem icon={line} label={'Has many select'} to={'select/hasMany'} />
					<MenuItem icon={line} label={'Has many sortable select'} to={'select/hasManySortable'} />
					<MenuItem icon={line} label={'Enum select'} to={'select/enumSelect'} />
				</MenuItem>
				<MenuItem icon={<UploadIcon size={16} />} label={'Upload'}>
					<MenuItem icon={line} label={'Image upload'} to={'upload/image'} />
					<MenuItem icon={line} label={'Image w/o meta'} to={'upload/imageTrivial'} />
					<MenuItem icon={line} label={'Audio upload'} to={'upload/audio'} />
					<MenuItem icon={line} label={'Video upload'} to={'upload/video'} />
					<MenuItem icon={line} label={'Generic file upload'} to={'upload/any'} />
					<MenuItem icon={line} label={'Image repeater'} to={'upload/imageList'} />
				</MenuItem>
				<MenuItem icon={<LanguagesIcon size={16} />} label={'Dimensions'} to={'dimensions'} />
				<MenuItem icon={<PencilIcon size={16} />} label={'Rich text'}>
					<MenuItem icon={line} label={'Rich text field'} to={'editor/richtext'} />
					<MenuItem icon={line} label={'Block editor'} to={'editor/blocks'} />
					<MenuItem icon={line} label={'Legacy block editor'} to={'legacyEditor/blocks'} />
				</MenuItem>
				<MenuItem icon={<PencilIcon size={16} />} label={'Custom components'}>
					<MenuItem icon={line} label={'Input'} to={'custom/input'} />
					<MenuItem icon={line} label={'Folder structure'} to={'folders'} />
					<MenuItem icon={line} label={'Folder dataview'} to={'folders/dataview'} />
					<MenuItem icon={line} label={'Folder combo'} to={'folders/combo'} />
				</MenuItem>
				<MenuItem icon={<DatabaseIcon size={16} />} label={'Auto CRUD'} to={'auto/index'} />
				<MenuItem icon={<LoaderIcon size={16} />} label={'Extend tree'}>
					<MenuItem icon={line} label={'Entity subtree'} to={'extendTree/single'} />
					<MenuItem icon={line} label={'Entity list subtree'} to={'extendTree/many'} />
				</MenuItem>
				<MenuItem icon={<PlugIcon size={16} />} label={'Hooks'}>
					<MenuItem icon={line} label={'Content API'} to={'hooks/contentApi'} />

				</MenuItem>
			</Menu>
		</div>
	)
}
