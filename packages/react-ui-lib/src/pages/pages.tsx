import { EntityProps, EntitySubTree, EntitySubTreeProps, RedirectOnPersist, RoutingLinkTarget } from '@contember/interface'
import { ReactNode } from 'react'
import { Binding, PersistButton } from '../binding'
import { Slots, Title } from '../layout/slots'
import { BackButton } from '../buttons'
import { DefaultRepeater, DefaultRepeaterProps, RepeaterItemActions, RepeaterRemoveItemButton } from '../repeater'
import { RepeaterQualifiedProps } from '@contember/react-repeater'
import { SidebarContent, SidebarGroup, SidebarGroupContent } from '../ui/sidebar'
type BasePageProps = {
	title?: ReactNode
	redirectOnPersist?: RoutingLinkTarget
	sidebar?: ReactNode
	actions?: ReactNode
}

type BasePagePropsWithEntity = BasePageProps & EntitySubTreeProps<EntityProps>
const BasePage = ({ children, title, redirectOnPersist, sidebar, actions, ...rest }: BasePagePropsWithEntity) => (
	<Binding>
		<EntitySubTree {...rest}>
			{redirectOnPersist && <RedirectOnPersist to={redirectOnPersist} />}
			<Slots.Back>
				<BackButton />
			</Slots.Back>
			<Slots.Actions>{actions ? actions : <PersistButton />}</Slots.Actions>
			<Title>{title}</Title>
			{sidebar && <Slots.Sidebar>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							{sidebar}
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Slots.Sidebar>}
			<div className="py-4">
				{children}
			</div>
		</EntitySubTree>
	</Binding>
)

export type CreatePageProps = Omit<BasePagePropsWithEntity, 'isCreating'>

export const CreatePage = (props: CreatePageProps) => <BasePage {...props} isCreating />

export type EditPageProps = BasePagePropsWithEntity

export const EditPage = (props: EditPageProps) => <BasePage {...props} />

export type DetailPageProps = BasePagePropsWithEntity

export const DetailPage = (props: DetailPageProps) => <BasePage {...props} />

export type GenericPageProps = BasePageProps & { children: ReactNode }

export const GenericPage = ({ children, redirectOnPersist, title, sidebar, actions }: GenericPageProps) => (
	<Binding>
		<Title>{title}</Title>
		{actions && <Slots.Actions>{actions}</Slots.Actions>}
		{redirectOnPersist && <RedirectOnPersist to={redirectOnPersist} />}
		{sidebar && <Slots.Sidebar>{sidebar}</Slots.Sidebar>}
		{children}
	</Binding>
)

export type MultiEditPageProps = BasePageProps & RepeaterQualifiedProps & DefaultRepeaterProps & {
	disableRemoving?: boolean
}

export const MultiEditPage = ({ redirectOnPersist, title, sidebar, actions, children, disableRemoving, ...repeaterProps }: MultiEditPageProps) => (
	<Binding>
		<Title>{title}</Title>
		<Slots.Actions>{actions ? actions : <PersistButton />}</Slots.Actions>
		{redirectOnPersist && <RedirectOnPersist to={redirectOnPersist} />}
		{sidebar && <Slots.Sidebar>{sidebar}</Slots.Sidebar>}
		<DefaultRepeater {...repeaterProps}>
			{!disableRemoving && (
				<RepeaterItemActions>
					<RepeaterRemoveItemButton />
				</RepeaterItemActions>
			)}
			{children}
		</DefaultRepeater>
	</Binding>
)
