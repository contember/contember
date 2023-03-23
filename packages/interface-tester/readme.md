# `@contember/interface-tester`

The `@contember/interface-tester` is a plug-n-play testing tool designed specifically for applications based on @contember/admin (Contember Interface). It is optimized for use with `vitest`.

## Usage

To use `@contember/interface-tester`, follow these steps:

1. If `vitest` is not already installed in your project, add it.
2. Install `@contember/interface-tester`.
3. Create `interfacePages.test.ts` file in either `tests` or `admin/tests`, depending on your preferences and setup. The file should have the following content:

```typescript
import { testInterface } from '@contember/interface-tester'

import schema from '../api'

testInterface({
	schema,
	// pagesDir: './admin/pages', 
	exclude: [
		'tenant**',
		// other excluded pages
	],
	pages: {
		'**/{edit.tsx,edit}': {
			parameters: {
				id: '00000000-0000-0000-0000-000000000000',
			},
		},
	},
})
```

4. Run tests using `npm run vitest`.

> Please note that this tester is designed for simple pages that do not utilize hooks or other complex features. You may need to exclude pages that use such features from testing.
