import * as React from 'react'
import { FormEvent, ReactNode, useRef, useState } from 'react'
import { Button, Label, Loader, Textarea } from '@contember/react-ui-lib-base'
import { CheckWorkloadIdentityTokenQueryResult, isForbiddenError, useCheckWorkloadIdentityTokenQuery } from '@contember/react-client-tenant'
import { dict } from '../dict.js'
import { formatWorkloadConditions } from './workload-identity-conditions.js'

type CheckState =
	| { state: 'idle' }
	| { state: 'checking' }
	| { state: 'done'; result: CheckWorkloadIdentityTokenQueryResult }
	| { state: 'error'; forbidden: boolean }

const ResultRow = ({ label, children }: { label: string; children: ReactNode }) => (
	<>
		<dt className="font-medium text-gray-700">{label}</dt>
		<dd className="min-w-0">{children}</dd>
	</>
)

const CheckResult = ({ result }: { result: CheckWorkloadIdentityTokenQueryResult }) => {
	const labels = dict.tenant.workloadIdentityTokenCheck
	const trust = result.trust ?? undefined
	const failure = result.failure ?? undefined
	const conditionIndex = failure?.conditionIndex ?? undefined

	return (
		<div className="flex flex-col gap-3">
			{result.ok
				? <p className="font-medium">{labels.accepted}</p>
				: <p className="font-medium text-destructive">{labels.rejected}</p>}
			<dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[max-content_minmax(0,1fr)]">
				<ResultRow label={labels.matchedTrust}>
					{trust === undefined ? <span className="text-gray-500 italic">{labels.noTrustMatched}</span> : trust.slug}
				</ResultRow>
				{failure !== undefined && (
					<>
						<ResultRow label={labels.failedStep}>{labels.steps[failure.step]}</ResultRow>
						<ResultRow label={labels.message}>{failure.message}</ResultRow>
						{conditionIndex !== undefined && (
							<ResultRow label={labels.condition}>
								<span className="font-mono text-xs">
									[{conditionIndex}]
									{trust !== undefined && ` ${formatWorkloadConditions(trust.conditions)[conditionIndex] ?? ''}`}
								</span>
							</ResultRow>
						)}
						{failure.step === 'condition' && (
							<ResultRow label={labels.actualValue}>
								{failure.actualValue === undefined || failure.actualValue === null
									? <span className="text-gray-500 italic">{labels.claimMissing}</span>
									: <span className="font-mono text-xs break-all">{JSON.stringify(failure.actualValue)}</span>}
							</ResultRow>
						)}
					</>
				)}
				{result.ok && <ResultRow label={labels.dpop}>{result.requiresDpop ? labels.dpopRequired : labels.dpopNotRequired}</ResultRow>}
			</dl>
			{result.ok && result.claims !== undefined && result.claims !== null && (
				<div className="flex flex-col gap-1">
					<span className="text-sm font-medium text-gray-700">{labels.claims}</span>
					<pre className="overflow-x-auto text-xs bg-gray-50 p-3 rounded">{JSON.stringify(result.claims, null, 2)}</pre>
				</div>
			)}
		</div>
	)
}

/**
 * `WorkloadIdentityTokenCheck` runs `checkWorkloadIdentityToken` on a pasted token and shows the
 * matched trust and the first failing step — the detail the uniform external 401 withholds.
 *
 * The token is a live credential, so it lives in component state only: the textarea has no `name`,
 * nothing is written to the URL or storage, and a failed request is not logged (the client error
 * carries the request variables).
 *
 * ## Example
 * ```tsx
 * <WorkloadIdentityTokenCheck />
 * ```
 */
export const WorkloadIdentityTokenCheck = () => {
	const check = useCheckWorkloadIdentityTokenQuery()
	const [token, setToken] = useState('')
	const [checkState, setCheckState] = useState<CheckState>({ state: 'idle' })
	const requestId = useRef(0)
	const labels = dict.tenant.workloadIdentityTokenCheck

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const trimmed = token.trim()
		if (trimmed === '') {
			return
		}
		const currentRequestId = ++requestId.current
		setCheckState({ state: 'checking' })
		try {
			const result = await check({ token: trimmed })
			if (requestId.current === currentRequestId) {
				setCheckState({ state: 'done', result })
			}
		} catch (e) {
			if (requestId.current === currentRequestId) {
				setCheckState({ state: 'error', forbidden: isForbiddenError(e) })
			}
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<form className="flex flex-col gap-3" onSubmit={onSubmit}>
				<div className="flex flex-col gap-2">
					<Label htmlFor="workload-identity-token">{labels.token}</Label>
					<Textarea
						id="workload-identity-token"
						value={token}
						placeholder={labels.tokenPlaceholder}
						autoComplete="off"
						spellCheck={false}
						rows={4}
						className="font-mono text-xs"
						onChange={e => setToken(e.target.value)}
					/>
					<p className="text-sm text-gray-500">{labels.tokenNote}</p>
				</div>
				<div>
					<Button type="submit" disabled={token.trim() === '' || checkState.state === 'checking'}>
						{labels.submit}
					</Button>
				</div>
			</form>
			{checkState.state === 'checking' && (
				<div className="relative min-h-24">
					<Loader position="absolute" />
				</div>
			)}
			{checkState.state === 'error' && (
				checkState.forbidden
					? <div className="text-gray-500 italic">{labels.forbidden}</div>
					: <div className="text-destructive italic">{labels.failed}</div>
			)}
			{checkState.state === 'done' && <CheckResult result={checkState.result} />}
		</div>
	)
}
