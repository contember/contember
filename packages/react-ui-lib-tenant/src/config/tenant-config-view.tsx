import * as React from 'react'
import { ReactNode } from 'react'
import { Loader, Table, TableCell, TableHead, TableHeader, TableRow } from '@contember/react-ui-lib-base'
import { useConfigurationQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { dict } from '../dict.js'
import { ConfigSection, formatConfigValue, ManagedByCliNote, renderConfigQueryState } from './common.js'

export interface TenantConfigViewController {
	refresh: () => void
}

export interface TenantConfigViewProps {
	controller?: { current?: TenantConfigViewController }
}

// Listed explicitly rather than via Object.entries so the order is stable and a
// non-window field added to ConfigRateLimits cannot leak into the table.
const rateLimitKeys = [
	'signUpPerIp',
	'loginPerIp',
	'passwordResetPerIp',
	'passwordlessInitPerIp',
	'emailOtpPerPerson',
	'emailVerificationPerIp',
] as const

const SettingsTable = ({ rows }: { rows: readonly (readonly [string, ReactNode])[] }) => (
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead className="w-1/2">{dict.tenant.configView.setting}</TableHead>
				<TableHead>{dict.tenant.configView.value}</TableHead>
			</TableRow>
		</TableHeader>
		{rows.map(([label, value]) => (
			<TableRow key={label}>
				<TableCell className="font-medium">{label}</TableCell>
				<TableCell>{value}</TableCell>
			</TableRow>
		))}
	</Table>
)

/**
 * `TenantConfigView` shows the tenant-wide configuration read-only. There is no
 * editing counterpart on purpose — the write path is `contember tenant:apply`.
 *
 * Requires `system:viewConfig` (the read counterpart of `system:configure`). A
 * caller without it gets a "no permission" message rather than an error, because
 * the resolver rejects instead of returning defaults.
 *
 * ## Example
 * ```tsx
 * <TenantConfigView />
 * ```
 */
export const TenantConfigView = ({ controller }: TenantConfigViewProps) => {
	const [query, { refresh }] = useTenantQueryLoader(useConfigurationQuery(), {})
	if (controller) {
		controller.current = { refresh }
	}

	const nonData = renderConfigQueryState({
		query,
		forbiddenMessage: dict.tenant.configView.forbidden,
		failedMessage: dict.tenant.configView.failedToLoadData,
	})
	if (nonData !== null) {
		return nonData
	}
	if (!('data' in query)) {
		return null
	}
	const config = query.data

	return (
		<div className="relative flex flex-col gap-6">
			{query.state !== 'success' && <Loader position="absolute" />}
			<ManagedByCliNote />

			<ConfigSection title={dict.tenant.configView.signup}>
				<SettingsTable rows={[['requireEmailVerification', formatConfigValue(config.signup.requireEmailVerification)]]} />
			</ConfigSection>

			<ConfigSection title={dict.tenant.configView.emailChange}>
				<SettingsTable rows={[['requireVerification', formatConfigValue(config.emailChange.requireVerification)]]} />
			</ConfigSection>

			<ConfigSection title={dict.tenant.configView.password}>
				<SettingsTable
					rows={[
						['minLength', formatConfigValue(config.password.minLength)],
						['requireUppercase', formatConfigValue(config.password.requireUppercase)],
						['requireLowercase', formatConfigValue(config.password.requireLowercase)],
						['requireDigit', formatConfigValue(config.password.requireDigit)],
						['requireSpecial', formatConfigValue(config.password.requireSpecial)],
						['pattern', formatConfigValue(config.password.pattern)],
						['checkBlacklist', formatConfigValue(config.password.checkBlacklist)],
						['checkHibp', formatConfigValue(config.password.checkHibp)],
					]}
				/>
			</ConfigSection>

			<ConfigSection title={dict.tenant.configView.passwordless}>
				<SettingsTable
					rows={[
						['enabled', formatConfigValue(config.passwordless.enabled)],
						['url', formatConfigValue(config.passwordless.url)],
						['expiration', formatConfigValue(config.passwordless.expiration)],
					]}
				/>
			</ConfigSection>

			<ConfigSection title={dict.tenant.configView.login}>
				<SettingsTable
					rows={[
						['baseBackoff', formatConfigValue(config.login.baseBackoff)],
						['maxBackoff', formatConfigValue(config.login.maxBackoff)],
						['attemptWindow', formatConfigValue(config.login.attemptWindow)],
						['revealUserExists', formatConfigValue(config.login.revealUserExists)],
						['revealLoginMethod', formatConfigValue(config.login.revealLoginMethod)],
						['defaultTokenExpiration', formatConfigValue(config.login.defaultTokenExpiration)],
						['maxTokenExpiration', formatConfigValue(config.login.maxTokenExpiration)],
						['mfaGraceDuration', formatConfigValue(config.login.mfaGraceDuration)],
					]}
				/>
			</ConfigSection>

			<ConfigSection title={dict.tenant.configView.anomalyDetection}>
				<SettingsTable
					rows={[
						['enabled', formatConfigValue(config.login.anomalyDetection.enabled)],
						['historySize', formatConfigValue(config.login.anomalyDetection.historySize)],
						['emailThreshold', formatConfigValue(config.login.anomalyDetection.emailThreshold)],
						['stepUpThreshold', formatConfigValue(config.login.anomalyDetection.stepUpThreshold)],
					]}
				/>
			</ConfigSection>

			<ConfigSection title={dict.tenant.configView.captcha}>
				<SettingsTable
					rows={[
						['provider', formatConfigValue(config.captcha.provider)],
						['threshold', formatConfigValue(config.captcha.threshold)],
						['protect.signUp', formatConfigValue(config.captcha.protect.signUp)],
						['protect.passwordReset', formatConfigValue(config.captcha.protect.passwordReset)],
						['protect.passwordlessInit', formatConfigValue(config.captcha.protect.passwordlessInit)],
						['protect.emailVerification', formatConfigValue(config.captcha.protect.emailVerification)],
					]}
				/>
			</ConfigSection>

			<ConfigSection title={dict.tenant.configView.rateLimits}>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-1/2">{dict.tenant.configView.setting}</TableHead>
							<TableHead>{dict.tenant.configView.limit}</TableHead>
							<TableHead>{dict.tenant.configView.window}</TableHead>
						</TableRow>
					</TableHeader>
					{rateLimitKeys.map(key => (
						<TableRow key={key}>
							<TableCell className="font-medium">{key}</TableCell>
							<TableCell>{formatConfigValue(config.rateLimits[key].limit)}</TableCell>
							<TableCell>{formatConfigValue(config.rateLimits[key].window)}</TableCell>
						</TableRow>
					))}
				</Table>
			</ConfigSection>
		</div>
	)
}
