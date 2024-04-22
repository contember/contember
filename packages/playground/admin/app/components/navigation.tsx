import { ArchiveIcon, BrushIcon, FormInputIcon, GripVertical, HomeIcon, KanbanIcon, LanguagesIcon, TableIcon, UploadIcon } from 'lucide-react'
import { Menu, MenuItem, MenuList } from '../../lib/components/ui/menu'


export const Navigation = () => {
	const line = <span className={'h-full w-[1px] bg-gray-200'}>&nbsp;</span>
	return (
		<div>
			<Menu>
				<MenuItem icon={<HomeIcon size={16} />} label={'Home'} to={'index'} />
				<MenuItem icon={<BrushIcon size={16} />} label={'UI'}>
					<MenuItem icon={line} label={'Buttons'} to={'ui/button'} />
					<MenuItem icon={line} label={'Toasts'} to={'ui/toast'} />
				</MenuItem>
				<MenuItem icon={<KanbanIcon size={16} />} label={'Kanban'}>
					<MenuItem icon={line} label={'Dynamic columns'} to={'board/assignee'} />
					<MenuItem icon={line} label={'Static columns'} to={'board/status'} />
				</MenuItem>
				<MenuItem icon={<GripVertical size={16} />} label={'Repeater'} to={'repeater'} />
				<MenuItem icon={<TableIcon size={16} />} label={'Grid'}>
					<MenuItem icon={line} label={'Complex grid'} to={'grid'} />
					<MenuItem icon={line} label={'Simple grid'} to={'grid/simpleGrid'} />
				</MenuItem>
				<MenuItem icon={<FormInputIcon size={16} />} label={'Inputs'}>
					<MenuItem icon={line} label={'Basic inputs'} to={'input/basic'} />
					<MenuItem icon={line} label={'Select or type'} to={'input/selectOrType'} />
					<MenuItem icon={line} label={'Textarea'} to={'input/textarea'} />
					<MenuItem icon={line} label={'Client validation'} to={'input/clientValidation'} />
					<MenuItem icon={line} label={'Checkbox'} to={'input/checkbox'} />
					<MenuItem icon={line} label={'Radio'} to={'input/enumRadio'} />
				</MenuItem>
				<MenuItem icon={<ArchiveIcon size={16} />} label={'Select'}>
					<MenuItem icon={line} label={'Has one select'} to={'select/hasOne'} />
					<MenuItem icon={line} label={'Create new form'} to={'select/createNewForm'} />
					<MenuItem icon={line} label={'Has many select'} to={'select/hasMany'} />
					<MenuItem icon={line} label={'Has many sortable select'} to={'select/hasManySortable'} />
				</MenuItem>
				<MenuItem icon={<LanguagesIcon size={16} />} label={'Dimensions'} to={'dimensions'} />
			</Menu>
		</div>
	)
}
