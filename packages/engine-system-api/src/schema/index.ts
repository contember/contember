export * from './types.js'
import * as Schema from './types.js'
export { Schema }
// biome-ignore lint/correctness/useImportExtensions: .graphql files are resolved by the bundler loader, not as JS modules
export { default as devTypeDefs } from './dev.graphql'
// biome-ignore lint/correctness/useImportExtensions: .graphql files are resolved by the bundler loader, not as JS modules
export { default as typeDefs } from './system.graphql'
