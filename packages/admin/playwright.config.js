// @ts-check
import { devices } from '@playwright/test'

/** @type  { import("@playwright/test").PlaywrightTestConfig } **/
const config = {
	timeout: 60000,
	workers: process.env.CI ? 1 : undefined,

	expect: {
		toMatchSnapshot: {
			threshold: process.env.CI ? 0.03 : 0,
			maxDiffPixelRatio: process.env.CI ? 0.0005 : 0,
		},
	},

	reporter: [
		[process.env.CI ? 'github' : 'list'],
		['html', { open: 'never', outputFolder: 'tests/playwright/report' }],
	],

	testDir: 'tests/playwright/cases',
	outputDir: 'tests/playwright/output',
	snapshotDir: 'tests/playwright/snapshots',

	use: {
		screenshot: 'on',
		trace: 'on',
		video: 'on',
	},

	projects: [
		{
			name: 'iPhone 11',
			use: { ...devices['iPhone 11'] },
		},
		{
			name: 'iPad landscape',
			use: { ...devices['iPad (gen 7) landscape'] },
		},
		{
			name: 'Desktop Chrome',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1903, height: 1009 } },
		},
		{
			name: 'Desktop Firefox Dark',
			use: { ...devices['Desktop Firefox'], viewport: { width: 1903, height: 1009 }, colorScheme: 'dark' },
		},
	],

	webServer: {
		command: 'npm run pw:preview',
		port: 3333,
		reuseExistingServer: true,
	},
}

export default config
