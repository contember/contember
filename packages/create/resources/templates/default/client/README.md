# Contember GraphQL Client Documentation

## Table of Contents
1. [Getting Started](#getting-started)
2. [Basic Operations](#basic-operations)
3. [Working with Relations](#working-with-relations)
4. [Advanced Queries](#advanced-queries)

## Getting Started

### Client Setup
```typescript
import { ContentClient } from '@contember/client-content'
import { GraphQlClient } from '@contember/graphql-client'

const graphQlClient = new GraphQlClient({
    url: 'http://localhost:1481/content/app/live',
    apiToken: '0000000000000000000000000000000000000000'
})
const client = new ContentClient(graphQlClient)
```

## Basic Operations

### Reading Data

#### Get Single Entity
```typescript
// Get by ID
const entity = await client.query(
    queryBuilder.get('Entity',
        { by: { id: 'entity-id' } },
        it => it.$('field1').$('field2')
    )
)

// Get by unique field
const entity = await client.query(
    queryBuilder.get('Entity',
        { by: { unique: 'value' } },
        it => it.$('field1').$('field2')
    )
)
```

#### List Entities
```typescript
const entities = await client.query(
    queryBuilder.list('Entity', {
        filter: { publishedAt: { lte: 'now' } },
        limit: 50,
        offset: 0,
        orderBy: [{ publishedAt: 'desc' }]
    })
)
```

### Creating Data

#### Create Single Entity
```typescript
await client.mutate(
    queryBuilder.create('Entity', {
        data: {
            title: 'New Entity',
            description: 'Description'
        }
    })
)
```

### Updating Data

#### Update Entity
```typescript
await client.mutate(
    queryBuilder.update('Entity', {
        by: { id: 'entity-id' },
        data: {
            title: 'Updated Title'
        }
    })
)
```

```typescript
await client.mutate(
    queryBuilder.upsert('Entity', {
        by: { id: 'entity-id' },
		create: {
			title: 'New Entity'
		},
		update: {
			title: 'Updated Title'
		}
    })
)
```

### Deleting Data

#### Delete Entity
```typescript
await client.mutate(
    queryBuilder.delete('Entity', {
        by: { id: 'entity-id' }
    })
)
```

## Working with Relations

### HasOne Relations

#### Create with Relation
```typescript
await client.mutate(
    queryBuilder.create('Entity', {
        data: {
            title: 'Main Entity',
            relation: {
                create: {
                    title: 'Related Entity'
                }
            }
        }
    })
)
```

#### Connect Existing Entity
```typescript
await client.mutate(
    queryBuilder.update('Entity', {
        by: { id: 'entity-id' },
        data: {
            relation: {
                connect: { id: 'related-id' }
            }
        }
    })
)
```

#### Disconnect Relation
```typescript
await client.mutate(
	queryBuilder.update('Entity', {
		by: { id: 'entity-id' },
		data: {
			relation: {
				disconnect: true
			}
		}
	})
)
```

#### Delete Relation
```typescript
await client.mutate(
	queryBuilder.update('Entity', {
		by: { id: 'entity-id' },
		data: {
			relation: {
				delete: true
			}
		}
	})
)
```

### HasMany Relations

#### Add Multiple Relations
```typescript
await client.mutate(
    queryBuilder.create('Entity', {
        data: {
            title: 'Main Entity',
            relations: [
				{ create: { title: 'Related 1' } },
				{ connect: { id: 'related-id' } },
				{
					connectOrCreate: {
						connect: { id: 'related-id' },
						create: { title: 'New Related' },
					},
				},
			]
        }
    })
)
```

#### Update Multiple Relations
```typescript
await client.mutate(
	queryBuilder.update('Entity', {
		by: { id: 'entity-id' },
		data: {
			relations: [
				{ create: { title: 'New Related' } },
				{ connect: { id: 'related-id' } },
				{
					connectOrCreate: {
						connect: { id: 'related-id' },
						create: { title: 'New Related' },
					},
				},
				{
					upsert: {
						by: { id: 'related-id' },
						create: { title: 'New Related' },
						update: { title: 'Updated Related' },
					}
				},
				{ disconnect: { id: 'related-id-1' } },
				{ delete: { id: 'related-id' } },
			],
		},
	}),
)
```

## Advanced Queries

### Using Fragments
```typescript
// Define fragment
const entityFragment = queryBuilder.fragment('Entity',
    it => it.$('title').$('description')
)

// Use fragment in query
const entity = await client.query(
    queryBuilder.get('Entity',
        { by: { id: 'entity-id' } },
        entityFragment
    )
)
```

### Connecting or creating related entities
```typescript
await client.mutate(
	queryBuilder.update('Entity', {
		by: { id: 'entity-id' },
		data: {
			relation: {
				connectOrCreate: {
					connect: {
						id: 'related-id'
					},
					create: {
						title: 'Updated Related Entity'
					}
				}
			}
		}
	})
)
```

### Multiple Queries
```typescript
const { entity1, entity2List } = await client.query({
    entity1: queryBuilder.get('Entity1',
        { by: { id: 'id1' } },
        it => it.$$()
    ),
    entity2List: queryBuilder.list('Entity2',
        it => it.$$()
    )
})
```

### Counting Entities
```typescript
const count = await client.query(
    queryBuilder.count('Entity', {
        filter: { status: { eq: 'published' } }
    })
)
```
