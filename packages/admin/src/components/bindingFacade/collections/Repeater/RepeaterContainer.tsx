import { EntityAccessor, EntityListAccessor } from '@contember/binding'
import { Box, BoxSection, ErrorList } from '@contember/ui'
import {
	ReactNode,
	ComponentType,
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	FC,
	FunctionComponent,
	Fragment,
	PureComponent,
	useEffect,
} from 'react'
import { CreateNewEntityButton, CreateNewEntityButtonProps, EmptyMessage, EmptyMessageProps } from '../helpers'

export interface RepeaterContainerPrivateProps {
	accessor: EntityListAccessor
	entities: EntityAccessor[]
	isEmpty: boolean
	label: ReactNode
	createNewEntity: EntityListAccessor.CreateNewEntity
	children: ReactNode
}
export interface RepeaterContainerPublicProps {
	enableAddingNew?: boolean

	emptyMessage?: ReactNode
	emptyMessageComponent?: ComponentType<EmptyMessageProps & any> // This can override 'emptyMessage'
	emptyMessageComponentExtraProps?: {}

	addButtonText?: ReactNode
	addButtonProps?: CreateNewEntityButtonProps // Children here override 'addButtonText'
	addButtonComponent?: ComponentType<CreateNewEntityButtonProps & any> // This can override 'addButtonText' and 'addButtonProps'
	addButtonComponentExtraProps?: {}
}

export interface RepeaterContainerProps extends RepeaterContainerPublicProps, RepeaterContainerPrivateProps {}

export const RepeaterContainer = memo(
	({
		accessor,
		children,
		createNewEntity,
		addButtonComponent: AddButton = CreateNewEntityButton,
		addButtonComponentExtraProps,
		addButtonProps,
		addButtonText = 'Add',
		emptyMessage = 'There is nothing here. Try adding a new item.',
		emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
		emptyMessageComponentExtraProps,
		enableAddingNew = true,
		isEmpty,
		label,
	}: RepeaterContainerProps) => {
		return (
			<Box heading={label}>
				<ErrorList errors={accessor.errors} />
				{isEmpty && <EmptyMessageComponent {...emptyMessageComponentExtraProps}>{emptyMessage}</EmptyMessageComponent>}
				{isEmpty || children}
				{enableAddingNew && (
					<BoxSection heading={undefined}>
						<AddButton
							{...addButtonComponentExtraProps}
							children={addButtonText}
							{...addButtonProps}
							createNewEntity={createNewEntity}
						/>
					</BoxSection>
				)}
			</Box>
		)
	},
)
RepeaterContainer.displayName = 'RepeaterContainer'
