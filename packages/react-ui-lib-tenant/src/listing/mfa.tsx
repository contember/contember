import * as React from 'react'
import { dict } from '../dict.js'

export interface MfaBadgesProps {
	otpEnabled?: boolean | null
	emailOtpEnabled?: boolean | null
}

export const MfaBadges = ({ otpEnabled, emailOtpEnabled }: MfaBadgesProps) => {
	const methods: string[] = []
	if (otpEnabled) {
		methods.push(dict.tenant.mfa.totp)
	}
	if (emailOtpEnabled) {
		methods.push(dict.tenant.mfa.email)
	}
	if (methods.length === 0) {
		return <span className="text-gray-400 italic">{dict.tenant.mfa.none}</span>
	}
	return (
		<span className="flex gap-1 flex-wrap">
			{methods.map(method => (
				<span key={method} className="inline-flex items-center border border-gray-200 rounded-sm px-1.5 py-0.5 text-xs">
					{method}
				</span>
			))}
		</span>
	)
}
