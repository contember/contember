import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	Loader,
	Table,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	ToastContent,
	useShowToast,
} from '@contember/react-ui-lib-base'
import { BanIcon, RefreshCwIcon } from 'lucide-react'
import { useMySessionsQuery, usePersonSessionsQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { RevokeSessionTrigger } from '@contember/interface'
import { dict } from '../dict.js'
import { actionErrorMessage } from '../errors.js'

const formatDateTime = (value?: string | null): ReactNode => {
	if (!value) {
		return <span className="text-gray-400 italic">{dict.tenant.sessionList.never}</span>
	}
	return new Date(value).toLocaleString()
}

export interface SessionListController {
	refresh: () => void
}

export interface SessionListProps {
	personId?: string
	controller?: { current?: SessionListController }
}

export const SessionList = ({ personId, controller }: SessionListProps) => {
	const mySessionsQuery = useMySessionsQuery()
	const personSessionsQuery = usePersonSessionsQuery()
	const fetcher = useCallback((variables: { personId?: string }) => (
		variables.personId ? personSessionsQuery({ personId: variables.personId }) : mySessionsQuery({})
	), [mySessionsQuery, personSessionsQuery])

	const [query, { refresh }] = useTenantQueryLoader(fetcher, { personId })
	if (controller) {
		controller.current = { refresh }
	}
	const showToast = useShowToast()

	const onRevoked = () => {
		refresh()
		showToast(<ToastContent>{dict.tenant.sessionList.revokeSuccess}</ToastContent>, { type: 'success' })
	}
	const onRevokeError = ({ code }: { code: string }) => {
		showToast(<ToastContent>{actionErrorMessage(code, dict.tenant.sessionList.revokeFailed)}</ToastContent>, { type: 'error' })
	}

	// Revoking is self-service only: `revokeSession` refuses a session that is not the caller's own, so
	// in the admin view the button would be one that always fails. `ForceSignOutPersonAction` is the
	// admin equivalent, and `PersonDetail` already offers it.
	const canRevoke = personId === undefined

	if (query.state === 'error') {
		return <div className="text-destructive italic">{dict.tenant.sessionList.failedToLoadData}</div>
	}
	return (
		<div className="relative">
			{query.state !== 'success' && <Loader position="absolute" />}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{dict.tenant.sessionList.created}</TableHead>
						<TableHead>{dict.tenant.sessionList.lastUsed}</TableHead>
						<TableHead>{dict.tenant.sessionList.ip}</TableHead>
						<TableHead>{dict.tenant.sessionList.userAgent}</TableHead>
						<TableHead>{dict.tenant.sessionList.expires}</TableHead>
						<TableHead className="w-24">
							<div className="flex gap-2 items-center">
								{canRevoke && <span>{dict.tenant.sessionList.action}</span>}
								<Button variant="outline" onClick={refresh} className="ml-auto" size="sm">
									<RefreshCwIcon className="w-3 h-3" />
								</Button>
							</div>
						</TableHead>
					</TableRow>
				</TableHeader>
				{'data' in query && query.data.length === 0 && (
					<TableRow>
						<TableCell colSpan={6}>{dict.tenant.sessionList.noResults}</TableCell>
					</TableRow>
				)}
				{'data' in query && query.data.map(session => (
					<TableRow key={session.id}>
						<TableCell className="whitespace-nowrap">{formatDateTime(session.createdAt)}</TableCell>
						<TableCell className="whitespace-nowrap">{formatDateTime(session.lastUsedAt)}</TableCell>
						<TableCell className="whitespace-nowrap">{session.lastIp ?? session.createdIp}</TableCell>
						<TableCell className="max-w-xs truncate" title={session.lastUserAgent ?? session.createdUserAgent ?? ''}>
							{session.lastUserAgent ?? session.createdUserAgent}
						</TableCell>
						<TableCell className="whitespace-nowrap">{formatDateTime(session.expiresAt)}</TableCell>
						<TableCell className="whitespace-nowrap">
							{canRevoke && (session.isCurrent
								? <span className="text-gray-500 italic">{dict.tenant.sessionList.thisDevice}</span>
								: <RevokeSessionDialog sessionId={session.id} onSuccess={onRevoked} onError={onRevokeError} />)}
						</TableCell>
					</TableRow>
				))}
			</Table>
		</div>
	)
}

const RevokeSessionDialog = (
	{ sessionId, onSuccess, onError }: { sessionId: string; onSuccess: () => void; onError: (args: { code: string }) => void },
) => {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="destructive">
					<BanIcon className="w-3 h-3" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{dict.tenant.sessionList.revokeConfirmation}</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{dict.tenant.sessionList.cancel}</AlertDialogCancel>
					<RevokeSessionTrigger sessionId={sessionId} onSuccess={onSuccess} onError={onError}>
						<AlertDialogAction variant="destructive">{dict.tenant.sessionList.revoke}</AlertDialogAction>
					</RevokeSessionTrigger>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
