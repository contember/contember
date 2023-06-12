// @ts-check
import React, { useState } from 'react'
import { Select } from '../stories/ui/Select'
import './index.css'

/** @type { import('@storybook/react').Preview } */
export default {
	parameters: {
		actions: { argTypesRegex: '^on[A-Z].*' },
		controls: {
			sort: 'requiredFirst',
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
		docs: {
			source: {
				type: 'dynamic',
				excludeDecorators: true,
			},
		},
	},
}

export const decorators = [
	Story => {
		const [scheme, setScheme] = useState('system')
		const [position, setPosition] = useState('default')
		const [themeContent, setThemeContent] = useState('default')
		const [themeControls, setThemeControls] = useState('primary')

		return <div
			className={`cui-layout scheme-${scheme}${position !== 'default' ? `-${position}` : ''} theme-${themeContent}-content theme-${themeControls}-controls`}
			style={{
				display: 'flex',
				flexDirection: 'column',
				flexGrow: 1,
				padding: '2em',
				backgroundColor: 'var(--cui-background-color)',
				color: 'var(--cui-color)',
				gap: '2em',
			}}
		>
			<div style={{
				display: 'flex',
				flexDirection: 'column',
				flexGrow: 1,
				overflow: 'auto',
				marginLeft: '-2em',
				marginRight: '-2em',
				marginTop: '-2em',
				paddingLeft: '2em',
				paddingRight: '2em',
				paddingTop: '2em',
				paddingBottom: '2em',
			}}>
				<div style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'row', gap: '1em' }}>
					<Story />
				</div>
			</div>

			<div style={{
				display: 'flex',
				columnGap: '2em',
				rowGap: '1em',
				overflow: 'hidden',
				flexWrap: 'wrap',
				alignItems: 'stretch',
			}}>
				<Select
					label="Scheme"
					name="scheme"
					value={scheme}
					options={[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]}
					onChange={setScheme}
				/>

				<Select
					label="Position"
					name="position"
					value={position}
					options={[['default', 'Default'], ['above', 'Above'], ['below', 'Below']]}
					onChange={setPosition}
				/>

				<Select
					label="Content Theme"
					name="themeContent"
					value={themeContent}
					options={[
						['default'], ['primary'], ['secondary'], ['tertiary'], ['positive'], ['success'], ['warn'], ['danger'],
					]}
					onChange={setThemeContent}
				/>
				<Select
					label="Controls Theme"
					name="themeControls"
					value={themeControls}
					options={[
						['default'], ['primary'], ['secondary'], ['tertiary'], ['positive'], ['success'], ['warn'], ['danger'],
					]}
					onChange={setThemeControls}
				/>
			</div>
		</div>
	},
]
