import * as React from 'react'
import { useMemo, useState } from 'react'
import {
	Button,
	Input,
	Label,
	Loader,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@contember/react-ui-lib-base'
import { ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon } from 'lucide-react'
import { AuthLogFilter } from '@contember/graphql-client-tenant'
import { isForbiddenError, useAuthLogQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { dict } from '../dict.js'

const perPage = 20

type SuccessFilter = 'all' | 'ok' | 'failed'

export interface AuthLogListController {
	refresh: () => void
}

export interface AuthLogListProps {
	controller?: { current?: AuthLogListController }
}

/**
 * `AuthLogList` renders the tenant authentication audit log with filtering and pagination.
 *
 * ## Example
 * ```tsx
 * <AuthLogList />
 * ```
 */
export const AuthLogList = ({ controller }: AuthLogListProps) => {
	const [page, setPage] = useState(0)
	const [types, setTypes] = useState('')
	const [success, setSuccess] = useState<SuccessFilter>('all')
	const [person, setPerson] = useState('')

	// `useTenantQueryLoader` compares its variables shallowly, so the nested filter has to keep its identity.
	const filter = useMemo((): AuthLogFilter => {
		// There is no enum of `auth_log_type` values in the API, so types are entered as a free-text, comma separated, OR-combined list.
		const typeList = types.split(',').map(it => it.trim()).filter(Boolean)
		return {
			types: typeList.length ? typeList : undefined,
			success: success === 'all' ? undefined : success === 'ok',
			personInputIdentifier: person.trim() || undefined,
		}
	}, [types, success, person])

	const [query, { refresh }] = useTenantQueryLoader(useAuthLogQuery(), {
		filter,
		offset: page * perPage,
		limit: perPage,
	})
	if (controller) {
		controller.current = { refresh }
	}

	return (
		<div className="relative flex flex-col gap-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end">
				<div className="flex flex-col gap-2 grow">
					<Label htmlFor="auth-log-types">{dict.tenant.authLog.filterTypes}</Label>
					<Input
						id="auth-log-types"
						type="text"
						value={types}
						placeholder={dict.tenant.authLog.filterTypesPlaceholder}
						onChange={e => {
							setPage(0)
							setTypes(e.target.value)
						}}
					/>
				</div>
				<div className="flex flex-col gap-2 grow">
					<Label htmlFor="auth-log-person">{dict.tenant.authLog.filterPerson}</Label>
					<Input
						id="auth-log-person"
						type="text"
						value={person}
						placeholder={dict.tenant.authLog.filterPersonPlaceholder}
						onChange={e => {
							setPage(0)
							setPerson(e.target.value)
						}}
					/>
				</div>
				<div className="flex flex-col gap-2 sm:w-48">
					<Label htmlFor="auth-log-success">{dict.tenant.authLog.filterSuccess}</Label>
					<Select
						value={success}
						onValueChange={value => {
							setPage(0)
							setSuccess(value === 'ok' || value === 'failed' ? value : 'all')
						}}
					>
						<SelectTrigger id="auth-log-success">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{dict.tenant.authLog.filterSuccessAll}</SelectItem>
							<SelectItem value="ok">{dict.tenant.authLog.filterSuccessOk}</SelectItem>
							<SelectItem value="failed">{dict.tenant.authLog.filterSuccessFailed}</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			{/* `authLog` rejects rather than answering an empty page, so "not yours to see" is an ordinary state here. */}
			{query.state === 'error'
				? isForbiddenError(query.error)
					? <div className="text-gray-500 italic">{dict.tenant.authLog.forbidden}</div>
					: <div className="text-destructive italic">{dict.tenant.authLog.failedToLoadData}</div>
				: (
					<div className="relative">
						{query.state !== 'success' && <Loader position="absolute" />}
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{dict.tenant.authLog.createdAt}</TableHead>
									<TableHead>{dict.tenant.authLog.type}</TableHead>
									<TableHead>{dict.tenant.authLog.success}</TableHead>
									<TableHead>{dict.tenant.authLog.person}</TableHead>
									<TableHead>{dict.tenant.authLog.ipAddress}</TableHead>
									<TableHead className="w-40">
										<div className="flex gap-2 items-center">
											<span>{dict.tenant.authLog.errorCode}</span>
											<Button variant="outline" onClick={refresh} className="ml-auto" size="sm">
												<RefreshCwIcon className="w-3 h-3" />
											</Button>
										</div>
									</TableHead>
								</TableRow>
							</TableHeader>
							{'data' in query && query.data.entries.length === 0 && (
								<TableRow>
									<TableCell colSpan={6}>{dict.tenant.authLog.noResults}</TableCell>
								</TableRow>
							)}
							{'data' in query && query.data.entries.map(entry => (
								<TableRow key={entry.id}>
									<TableCell className="whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</TableCell>
									<TableCell className="font-mono text-xs">{entry.type}</TableCell>
									<TableCell>
										{entry.success
											? dict.tenant.authLog.ok
											: <span className="text-destructive">{dict.tenant.authLog.failed}</span>}
									</TableCell>
									<TableCell>{entry.personInputIdentifier}</TableCell>
									<TableCell className="whitespace-nowrap">{entry.ipAddress}</TableCell>
									<TableCell className="font-mono text-xs" title={entry.errorMessage}>{entry.errorCode}</TableCell>
								</TableRow>
							))}
						</Table>
						<div className="flex gap-2 mt-4 justify-between">
							<Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
								<ChevronLeftIcon className="w-4 h-4" />
								<span className="sr-only">{dict.tenant.authLog.previous}</span>
							</Button>
							<Button variant="outline" disabled={'data' in query && !query.data.hasMore} onClick={() => setPage(page + 1)}>
								<ChevronRightIcon className="w-4 h-4" />
								<span className="sr-only">{dict.tenant.authLog.next}</span>
							</Button>
						</div>
					</div>
				)}
		</div>
	)
}
