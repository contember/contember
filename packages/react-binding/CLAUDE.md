# react-binding

React data binding layer for Contember. Connects React components to the Content API by statically analyzing JSX to generate GraphQL queries, maintaining normalized state, and collecting mutations for persistence.

## Core Concept

React components declare what data they need via `<Field>`, `<HasOne>`, `<HasMany>` components. The binding layer:
1. **Statically walks** the JSX tree to extract field/relation markers
2. **Generates GraphQL queries** from the marker tree
3. **Fetches data** and stores it in a normalized `TreeStore`
4. **Provides accessors** (EntityAccessor, FieldAccessor, EntityListAccessor) via React hooks
5. **Collects mutations** when values change, then **persists** them as GraphQL mutations

## Key Hooks

| Hook | Purpose |
|------|---------|
| `useField(field)` | Get FieldAccessor (value, updateValue, hasUnpersistedChanges) |
| `useEntity(field?)` | Get EntityAccessor (getField, getEntity, getEntityList, deleteEntity) |
| `useEntityList(field?)` | Get EntityListAccessor (iterable, createNewEntity, connectEntity) |
| `usePersist()` | Get persist function to save all mutations |
| `useDirtinessState()` | Has unpersisted changes? |
| `useMutationState()` | Currently persisting? |
| `useEnvironment()` | Access schema, variables, dimensions |
| `useEntityEvent(type, listener)` | Subscribe to entity lifecycle events |

## Accessor Types

- **FieldAccessor<Value>**: `value`, `valueOnServer`, `updateValue(newValue)`, `isTouched`, `hasUnpersistedChanges`
- **EntityAccessor**: `id`, `idOnServer`, `existsOnServer`, `getField()`, `getEntity()`, `getEntityList()`, `deleteEntity()`, event listeners
- **EntityListAccessor**: iterable, `length`, `createNewEntity()`, `connectEntity()`, `disconnectEntity()`

## Entry Point

```tsx
<DataBindingProvider stateComponent={MyRenderer}>
  <Entity accessor={...}>
    <Field field="title" />
    <HasOne field="author"><Field field="name" /></HasOne>
    <HasMany field="tags"><Field field="label" /></HasMany>
  </Entity>
</DataBindingProvider>
```

## Architecture (across binding-common + binding-legacy)

- **binding-common**: Schema types, Environment (immutable context with schema/variables/dimensions), marker types, accessor interfaces, QueryLanguage parser
- **binding-legacy**: `DataBinding` orchestrator, `TreeStore` (normalized state), `MutationGenerator`, `QueryGenerator`, `EventManager`, `DirtinessTracker`
- **react-binding**: React hooks, context providers, core components, marker tree generator

## Persist Flow

1. `MutationGenerator.getPersistMutation()` traverses dirty state
2. Creates `create`/`update`/`delete` mutations batched by entity
3. Executes via ContentClient
4. Merges response into `TreeStore.persistedData`
5. Fires `persistSuccess` events, clears dirtiness
