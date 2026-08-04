import { Card, CardContent, CardDescription, CardHeader, CardTitle, Loader } from '@contember/react-ui-lib-base'
import type { ReactNode } from 'react'

export const CenteredScreen = ({ children }: { children: ReactNode }) => (
	<div className="flex min-h-screen items-center justify-center p-4">{children}</div>
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
export const PageStack = ({ children }: { children: ReactNode }) => <div className="flex flex-col gap-4">{children}</div>

/** The title is optional: a page whose whole content is one section already has it in the header. */
export const PanelSection = ({ title, description, children }: { title?: string; description?: string; children: ReactNode }) => (
	<Card>
		{title !== undefined && (
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description !== undefined && <CardDescription>{description}</CardDescription>}
			</CardHeader>
		)}
		<CardContent>{children}</CardContent>
	</Card>
)

/** Width the input columns of a form are readable at; the sections themselves are full width. */
export const formClassName = 'grid max-w-xl gap-4'
