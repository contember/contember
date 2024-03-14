import { ArchiveIcon, BrushIcon, FormInputIcon, GripVertical, HomeIcon, KanbanIcon, TableIcon, UploadIcon } from 'lucide-react'
import { MenuList } from '../../lib/components/ui/menu'


export const Navigation = () => {
	const line = <span className={'h-full w-[1px] bg-gray-200'}>&nbsp;</span>
	return (
		<div>
			<MenuList
				items={[
					{
						icon: <HomeIcon size={16} />,
						label: 'Home',
						to: 'index',
					},
					{
						icon: <BrushIcon size={16} />,
						label: 'UI',
						subItems: [
							{
								icon: line,
								label: 'Buttons',
								to: 'ui/button',
							},
							{
								icon: line,
								label: 'Toasts',
								to: 'ui/toast',
							},
						],
					},
					{
						icon: <KanbanIcon size={16} />,
						label: 'Kanban',
						subItems: [
							{
								icon: line,
								label: 'Dynamic columns',
								to: 'board/assignee',
							},
							{
								icon: line,
								label: 'Static columns',
								to: 'board/status',
							},
						],
					},
					{
						icon: <GripVertical size={16} />,
						label: 'Repeater',
						to: 'repeater',
					},
					{
						icon: <TableIcon size={16} />,
						label: 'Grid',
						to: 'grid',
					},
					{
						icon: <FormInputIcon size={16} />,
						label: 'Inputs',
						subItems: [
							{
								icon: line,
								label: 'Basic inputs',
								to: 'input/basic',
							},
							{
								icon: line,
								label: 'Select or type',
								to: 'input/selectOrType',
							},
							{
								icon: line,
								label: 'Textarea',
								to: 'input/textarea',
							},
							{
								icon: line,
								label: 'Client validation',
								to: 'input/clientValidation',
							},
							{
								icon: line,
								label: 'Checkbox',
								to: 'input/checkbox',
							},
							{
								icon: line,
								label: 'Radio',
								to: 'input/enumRadio',
							},
						],
					},
					{
						icon: <ArchiveIcon size={16} />,
						label: 'Select',
						subItems: [
							{
								icon: line,
								label: 'Has one select',
								to: 'select/hasOne',
							},
							{
								icon: line,
								label: 'Has many select',
								to: 'select/hasMany',
							},
							{
								icon: line,
								label: 'Has many sortable select',
								to: 'select/hasManySortable',
							},
						],
					},
					{
						icon: <UploadIcon size={16} />,
						label: 'Upload',
						subItems: [
							{
								icon: line,
								label: 'Image upload',
								to: 'upload/image',
							},
							{
								icon: line,
								label: 'Image w/o meta',
								to: 'upload/imageTrivial',
							},
							{
								icon: line,
								label: 'Audio upload',
								to: 'upload/audio',
							},
							{
								icon: line,
								label: 'Video upload',
								to: 'upload/video',
							},
							{
								icon: line,
								label: 'Generic file upload',
								to: 'upload/any',
							},
							{
								icon: line,
								label: 'Image repeater',
								to: 'upload/imageList',
							},
						],
					},
				]}
			/>
		</div>
	)
}
