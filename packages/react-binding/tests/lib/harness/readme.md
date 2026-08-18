# Binding test harness

`createBindingHarness` mounts a real `DataBinding` on a fake content API and renders a tree through it, so a test
can drive the whole thing: the read query goes out, accessors carry server data, `persist` generates a real
mutation and the response really lands back in the tree — including the id swap that turns a freshly created
entity into a persisted one.

```tsx
const harness = await createBindingHarness({
	schema: convertModelToAdminSchema(createSchema(Model).model),
	data: { article: { id: articleId, title: 'Hello', blocks: [{ id: blockId, order: 0 }] } },
	node: <EntitySubTree entity={`Article(id = '${articleId}')`} alias="article">…</EntitySubTree>,
})

await harness.update(() => harness.getEntity('article').getField('title').updateValue('Goodbye'))
await harness.persist()
```

Read fixtures are keyed by sub-tree alias and address fields by name — the harness translates them to placeholders
through the marker tree.

Everything a test does to the tree belongs in `harness.update`, which wraps it in a single `act`. Several steps in
one call stay in the same window, which is how you reach the races that only happen before React re-renders.

## What it does not do

The fake API does not read the mutation it is sent. It answers by echoing the binding's own tree back with fresh
ids, so it cannot tell you that a mutation was wrong — assert on `harness.server.requests` for that. It also
answers reads from fixtures rather than from a store, so filters and ordering are whatever the fixture says.
