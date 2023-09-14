# Internal: I18n in Contember Admin

## How to translate a `@contember/admin` component?

First, write a dictionary of messages that need to be translated:

```typescript
export const myDictionary = {
	myComponent: {
		key1: '…',
		key2: {
			nestedKey: '…',
			// …
		},
	},
}
export type MyDictionary = typeof myDictionary
```
Note the top-level `myComponent` property under which all is scoped.
That is crucial so that we can easily compose dictionaries. Include one just like it and make its name unique.
You can nest objects and strings arbitrarily. The structure, however, will be public API so try to make it future-proof.
In your messages, you can make use of whatever syntax [`intl-messageformat`](https://formatjs.io/docs/intl-messageformat/#message-syntax) supports.

From your `index.ts` file, don't export the dictionary! Use `export type` to only expose its type:
```typescript
export type { MyDictionary } from './myDictionary'
```

Then from your component, obtain a message formatter:
```typescript
const formatMessage = useMessageFormatter(myDictionary)
```
That gives you a function that returns translations. There are two main ways of using it:
1. You have a message that **isn't configurable** from outside the component:
	Just use a dot-syntax to reach your message, e.g. `formatMessage('myComponent.key2.nestedKey')` or `formatMessage('myComponent.key1', { variable: 123 })`.
1. You have a message that **is configurable** from outside the component:
	Start with the user-specified data and provide a fallback, e.g. `formatMessage(userSpecified, 'myComponent.key2.nestedKey')` or `formatMessage(userSpecified, 'myComponent.key1', { variable: 123 })`.

In both cases, the final parameter with variables is optional. In this case, the type of `formatMessage` is `MessageFormatter<MyDictionary>`. You can use this to pass it down as a prop.

⚠️ Lastly, add your newly created dictionary to `adminDictionary.ts`. After you do that, you will likely
get TypeScript errors in `@contember/admin-i18n`. Add any translations there as well.

For more inspiration, look up any existing dictionaries mentioned in `adminDictionary.ts` and the way they are used.
