import { Component, EntityAccessor, EntityId, EntityListSubTree } from '@contember/binding'
import { Button, DialogModal, DropdownContentContainerProvider, Heading, useChildrenAsLabel, useDialog } from '@contember/ui'
import { MouseEventHandler, useCallback } from 'react'
import { MessageFormatter } from '../../../../i18n'
import { Toaster, ToasterProvider } from '../../../Toaster'
import { SelectEntityButtonProps } from '../../collections'
import { ResolvedFileKinds } from '../ResolvedFileKinds'
import { SelectedEntitiesContext } from '../SelectedEntities'
import type { UploadDictionary } from '../uploadDictionary'

export interface SelectFormArguments {
	baseEntity?: never // TODO: remove
	entityListAccessor?: never // TODO: remove
	onToggleSelect: (entity: EntityAccessor) => void
	selectedEntityKeys: EntityId[]
	selectEntity: string
}

export interface SelectFileInputPublicProps extends SelectEntityButtonProps {
	baseEntity?: never
	fileKinds: ResolvedFileKinds
	insertSelectedText?: string
	onSelectConfirm: (selectedEntities: EntityAccessor[]) => void
	renderSelectForm: (args: SelectFormArguments) => JSX.Element
	selectEntity: string
}

export interface SelectFileInputProps extends SelectFileInputPublicProps {
	formatMessage: MessageFormatter<UploadDictionary>
	disabled?: boolean
}

export const SelectFileInput = Component<SelectFileInputProps>(
	({
		disabled,
		formatMessage,
		insertSelectedText,
		onSelectConfirm,
		renderSelectForm,
		selectButtonComponent: SelectButton = Button,
		selectButtonComponentExtraProps,
		selectButtonProps,
		selectButtonText: selectButtonTextProp,
		selectEntity,
	}) => {
		const { openDialog } = useDialog()
		const selectButtonText = formatMessage(selectButtonTextProp, 'upload.selectButton.text')
		const heading = useChildrenAsLabel(selectButtonText)

		const onClick: MouseEventHandler<HTMLButtonElement> = useCallback(async event => {
			event.stopPropagation()

			try {
				const selectedEntities = await openDialog<EntityAccessor[]>({
					type: 'captivating',
					bare: true,
					content: props => (
						<ToasterProvider>
							<DropdownContentContainerProvider>
								<SelectedEntitiesContext.Consumer>
									{({ onToggleSelect, onFlush, selectedEntityKeys }) => <>
										<DialogModal
											layout="wide"
											onClose={props.reject}
											header={<>
												<Heading>{heading}</Heading>
											</>}
											footer={<>
												<Button
													distinction="primary"
													onClick={() => {
														props.resolve(onFlush())
													}}
												>
													{formatMessage(insertSelectedText, 'upload.insertSelected.text')}
												</Button>
											</>}
										>
											{renderSelectForm({
												onToggleSelect,
												selectEntity,
												selectedEntityKeys,
											})}
										</DialogModal>
									</>}
								</SelectedEntitiesContext.Consumer>
							</DropdownContentContainerProvider>
							<Toaster />
						</ToasterProvider>
					),
				})

				onSelectConfirm(selectedEntities)
			} catch (error) {
				if (error) {
					throw error
				}
			}
		}, [formatMessage, heading, insertSelectedText, onSelectConfirm, openDialog, renderSelectForm, selectEntity])

		return (
			<SelectButton
				{...selectButtonComponentExtraProps}
				size="small"
				disabled={disabled}
				children={selectButtonText}
				onClick={onClick}
				{...selectButtonProps}
			/>
		)
	},
	(props, environment) => {
		// if (props.fileKinds.isDiscriminated) {
		// 	const children = (
		// 		<>
		// 			<SugaredField field={props.fileKinds.discriminationField} isNonbearing />
		// 			{Array.from(props.fileKinds.fileKinds.values(), (fileKind, i) => (
		// 				<Fragment key={i}>{staticRenderFileKind(fileKind.datum, environment)}</Fragment>
		// 			))}
		// 		</>
		// 	)
		// 	return props.fileKinds.baseEntity === undefined ? (
		// 		children
		// 	) : (
		// 		<HasOne field={props.fileKinds.baseEntity}>{children}</HasOne>
		// 	)
		// }
		// return staticRenderFileKind(props.fileKinds.fileKind, environment)

		// const entities = QueryLanguage.desugarQualifiedEntityList({ entities: props.baseEntity }, environment)

		return <EntityListSubTree
			entities={props.selectEntity}
		/>
	},
	'SelectFileInput',
)
SelectFileInput.displayName = 'SelectFileInput'
