import {
	AccessorTree,
	Component,
	DeferredSubTrees,
	EntityAccessor,
	EntityId,
	FieldValue,
	useAccessorTreeState,
} from '@contember/binding'
import {
	Button,
	DialogModal,
	DropdownContentContainerProvider,
	Heading,
	Stack,
	TabButton,
	useChildrenAsLabel,
	useDialog,
} from '@contember/ui'
import { ComponentType, MouseEventHandler, ReactNode, useCallback, useMemo, useState } from 'react'
import { MessageFormatter } from '../../../../i18n'
import { SelectEntityButtonProps } from '../../collections'
import type { UploadDictionary } from '../uploadDictionary'
import { ResolvedFileKinds } from '../ResolvedFileKinds'

export interface SelectFormProps {
	onToggleSelect: (entity: EntityAccessor) => void
	selectedEntityIds: EntityId[]
}

export interface SelectFileInputFormComponentProps<SFExtraProps extends {}> {
	selectFormComponent: ComponentType<SFExtraProps & SelectFormProps>
	selectFormProps?: SFExtraProps
}

export type SelectFileInputPublicProps<SFExtraProps extends {}> =
	& SelectEntityButtonProps
	& {
		insertSelectedText?: string
	}

export type SelectFileInputProps<SFExtraProps extends {}> =
	& Partial<SelectFileInputPublicProps<SFExtraProps>>
	& {
		formatMessage: MessageFormatter<UploadDictionary>
		onSelectConfirm: (selectedEntities: EntityAccessor[], discriminatedBy?: FieldValue) => void
		fileKinds: ResolvedFileKinds
		isMultiple: boolean
	}

export const SelectFileInput = Component(
	({
		 formatMessage,
		 insertSelectedText,
		 onSelectConfirm,
		 selectButtonComponent: SelectButton = Button,
		 selectButtonComponentExtraProps,
		 selectButtonProps,
		 selectButtonText: selectButtonTextProp,
		 isMultiple,
		 fileKinds,
	 }: SelectFileInputProps<any>) => {
		const { openDialog } = useDialog<[entities: EntityAccessor[], discriminatedBy?: FieldValue]>()
		const selectButtonText = formatMessage(selectButtonTextProp, 'upload.selectButton.text')

		const accessorTree = useAccessorTreeState()

		const onClick: MouseEventHandler<HTMLButtonElement> = useCallback(async event => {
			event.stopPropagation()

			const selectedEntities = await openDialog({
				type: 'captivating',
				bare: true,
				content: props => (
					<DropdownContentContainerProvider>
						<AccessorTree state={accessorTree}>
							<SelectFileDialog
								formatMessage={formatMessage}
								onCancel={() => props.resolve()}
								onSelect={props.resolve}
								insertSelectedText={insertSelectedText}
								selectButtonText={selectButtonText}
								isMultiple={isMultiple}
								fileKinds={fileKinds}
							/>
						</AccessorTree>
					</DropdownContentContainerProvider>
				),
			})
			if (selectedEntities !== undefined) {
				onSelectConfirm(...selectedEntities)
			}
		}, [accessorTree, fileKinds, formatMessage, insertSelectedText, isMultiple, onSelectConfirm, openDialog, selectButtonText])

		return (
			<SelectButton
				{...selectButtonComponentExtraProps}
				size="small"
				children={selectButtonText}
				onClick={onClick}
				{...selectButtonProps}
			/>
		)
	},
	() => {
		return null
	},
	'SelectFileInput',
)


type SelectFileDialogProps<P extends {}> =
	& {
		onSelect: (value: [entities: EntityAccessor[], discriminatedBy: FieldValue]) => void
		onCancel: () => void
		formatMessage: MessageFormatter<UploadDictionary>
		insertSelectedText?: string
		selectButtonText: ReactNode
		isMultiple: boolean
		fileKinds: ResolvedFileKinds
	}

type ResolvedSelectForm =
	& SelectFileInputFormComponentProps<any>
	& {
		label?: ReactNode
		discriminateBy: FieldValue | null
	}
const SelectFileDialog = (
	{
		onSelect,
		onCancel,
		formatMessage,
		insertSelectedText,
		selectButtonText,
		isMultiple,
		fileKinds,
	}: SelectFileDialogProps<{}>,
) => {
	const forms = useMemo((): ResolvedSelectForm[] => {
		if (fileKinds.isDiscriminated) {
			if ('selectFormComponent' in fileKinds) {
				return [{ selectFormComponent: fileKinds.selectFormComponent, selectFormProps: fileKinds.selectFormProps, discriminateBy: null }]
			}
			return Array.from(fileKinds.fileKinds.values()).flatMap((it): ResolvedSelectForm[] => {
				if ('selectFormComponent' in it.datum) {
					return [{
						selectFormComponent: it.datum.selectFormComponent,
						selectFormProps: it.datum.selectFormProps,
						discriminateBy: it.discriminateBy,
						label: it.datum.label,
					}]
				}
				return []
			})
		}
		if ('selectFormComponent' in fileKinds.fileKind) {
			return [{ selectFormComponent: fileKinds.fileKind.selectFormComponent, selectFormProps: fileKinds.fileKind.selectFormProps, discriminateBy: null }]
		}
		return []
	}, [fileKinds])
	const [form, setForm] = useState(forms[0])
	const changeForm = useCallback((kind: ResolvedSelectForm) => {
		setForm(kind)
		setEntities([])
	}, [])

	const heading = useChildrenAsLabel(selectButtonText)
	const [selectedEntities, setEntities] = useState<EntityAccessor[]>([])
	const onToggleSelect = useCallback((entity: EntityAccessor) => {
		setEntities(current => {
			const index = current.findIndex(it => it.id === entity.id)
			if (index >= 0) {
				const newValues = [...current]
				newValues.splice(index, 1)
				return newValues
			}
			if (isMultiple) {
				return [...current, entity]
			} else {
				return [entity]
			}
		})
	}, [isMultiple])
	let FormComponent = form.selectFormComponent
	let formComponentProps = form.selectFormProps

	const onConfirm = useCallback(() => {
		onSelect([selectedEntities, form.discriminateBy])
	}, [form.discriminateBy, onSelect, selectedEntities])
	const selectedEntityIds = useMemo(() => selectedEntities.map(it => it.id), [selectedEntities])

	return <>
		<DialogModal
			layout="wide"
			onClose={onCancel}
			header={<>
				<Heading>{heading}</Heading>
			</>}
			footer={<>
				<Button
					distinction="primary"
					onClick={onConfirm}
				>
					{formatMessage(insertSelectedText, 'upload.insertSelected.text')}
				</Button>
			</>}
		>
			<Stack direction={'horizontal'}>
				{forms.length > 1 && forms.map((it, index) => (
					<TabButton
						key={String(it.discriminateBy)}
						onClick={() => changeForm(it)}
						isSelected={it.discriminateBy === form.discriminateBy}
					>
						{it.label ?? `#${index}`}
					</TabButton>
				))}
			</Stack>
			<DeferredSubTrees fallback={<>Loading...</>}>
				<FormComponent
					{...formComponentProps}
					onToggleSelect={onToggleSelect}
					selectedEntityIds={selectedEntityIds}
				/>
			</DeferredSubTrees>
		</DialogModal>
	</>
}
