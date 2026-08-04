import { Card, CardContent, CardDescription, CardHeader, CardTitle, Loader } from '@contember/react-ui-lib-base'
import type { ReactNode } from 'react'

export const CenteredScreen = ({ children }: { children: ReactNode }) => (
	<div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">{children}</div>
)

export const InlineLoader = () => <Loader position="static" size="md" />

export const FullScreenLoader = () => (
	<CenteredScreen>
		<Loader position="static" size="md" />
	</CenteredScreen>
)

export const MessageCard = ({ title, description, children }: { title: string; description?: string; children?: ReactNode }) => (
	<Card className="w-96 max-w-full">
		<CardHeader>
			<CardTitle className="text-2xl">{title}</CardTitle>
			{description !== undefined && <CardDescription>{description}</CardDescription>}
		</CardHeader>
		{children !== undefined && <CardContent>{children}</CardContent>}
	</Card>
)

export const NotFound = () => <MessageCard title="Page not found" description="This address does not match anything in the management panel." />

/**
 * A page is a stack of these. Lives with the rest of the shared chrome rather than next to the
 * modules, because this file is already in the eager chunk — a helper imported only by the lazy
 * module chunks would earn a shared chunk of its own.
 */
export const PageStack = ({ children }: { children: ReactNode }) => <div className="flex flex-col gap-6">{children}</div>

/**
 * Every page opens with one. The chrome header repeats the title as a breadcrumb, so this is where
 * the page gets to explain itself and to hold whatever action creates its main resource.
 */
export const PageHeader = ({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) => (
	<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
		<div className="flex flex-col gap-1">
			<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
			{description !== undefined && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
		</div>
		{actions !== undefined && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
	</div>
)

export interface PanelSectionProps {
	title?: string
	description?: string
	/** Sits opposite the title — the section's own verb, e.g. the dialog that adds a row to its list. */
	actions?: ReactNode
	children: ReactNode
}

/** A titled surface. Without a title it is a plain card, which is what a page holding one table wants. */
export const PanelSection = ({ title, description, actions, children }: PanelSectionProps) => {
	const hasHeader = title !== undefined || actions !== undefined

	return (
		<Card>
			{hasHeader && (
				<CardHeader className="flex-row items-start justify-between gap-4 space-y-0 border-b border-gray-100 py-4">
					<div className="flex flex-col gap-1">
						{title !== undefined && <CardTitle>{title}</CardTitle>}
						{description !== undefined && <CardDescription>{description}</CardDescription>}
					</div>
					{actions !== undefined && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
				</CardHeader>
			)}
			<CardContent className={hasHeader ? 'pt-6' : undefined}>{children}</CardContent>
		</Card>
	)
}

/** Settings pages are a stack of {@link SettingsRow}s rather than a stack of equal-weight cards. */
export const SettingsStack = ({ children }: { children: ReactNode }) => <div className="flex flex-col gap-8">{children}</div>

/**
 * One setting: what it is on the left, the control on the right. Keeps a narrow form from floating
 * in a full-width card, and gives the explanation room to be as long as it needs to be.
 */
export const SettingsRow = ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => (
	<div className="grid gap-4 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-10">
		<div className="flex flex-col gap-1 lg:pt-1">
			<h2 className="font-medium">{title}</h2>
			{description !== undefined && <p className="text-sm text-muted-foreground">{description}</p>}
		</div>
		<Card>
			<CardContent className="py-6">{children}</CardContent>
		</Card>
	</div>
)

/** For a page whose whole point is missing — not for a list that merely came back empty. */
export const EmptyState = ({ icon, title, description, children }: {
	icon: ReactNode
	title: string
	description?: string
	children?: ReactNode
}) => (
	<div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-200 px-6 py-16 text-center">
		<div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
		<div className="flex flex-col gap-1">
			<p className="font-medium">{title}</p>
			{description !== undefined && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
		</div>
		{children}
	</div>
)

/** Forms now always sit inside something that constrains them — a dialog or a settings row. */
export const formClassName = 'grid gap-4'
