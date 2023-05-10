import { Intent, Select } from '@contember/ui'
import { useState } from 'react'
import { Directive } from './Directives'

export const ThemeSwitcher = () => {
	const [theme, setTheme] = useState<Intent | null | undefined>(undefined)

	return (
		<div style={{ minWidth: '12rem' }}>
			<Directive name="layout.theme" content={theme} />
			<Select<Intent>
				placeholder="Change theme..."
				value={theme}
				options={[
					{ label: 'Default', value: 'default' },
					{ label: 'Primary', value: 'primary' },
					{ label: 'Secondary', value: 'secondary' },
					{ label: 'Tertiary', value: 'tertiary' },
					{ label: 'Positive', value: 'positive' },
					{ label: 'Success', value: 'success' },
					{ label: 'Warning', value: 'warn' },
					{ label: 'Danger', value: 'danger' },
				]}
				onChange={value => setTheme(value)}
			/>
		</div>
	)
}
