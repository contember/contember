"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const schema_definition_1 = require("@contember/schema-definition");
const vitest_1 = require("vitest");
const engine_api_tester_1 = require("@contember/engine-api-tester");
const gql_1 = require("../../src/gql");
const src_1 = require("../../../src");
const engine_content_api_1 = require("@contember/engine-content-api");
const migrations_1 = require("../../../src/migrations");
var ActionsModel;
(function (ActionsModel) {
    let Article = class Article {
        constructor() {
            this.title = schema_definition_1.SchemaDefinition.stringColumn().unique();
            this.tags = schema_definition_1.SchemaDefinition.manyHasMany(Tag);
            this.category = schema_definition_1.SchemaDefinition.manyHasOne(Category);
        }
    };
    Article = __decorate([
        schema_definition_1.ActionsDefinition.watch({
            name: 'article_watch',
            watch: `
			title
			tags {
				name
			}
			category {
				name
			}
		`,
            webhook: 'http://foobar',
            selection: `
			title
			tags {
				name
			}
			category {
				name
			}
		`,
        })
    ], Article);
    ActionsModel.Article = Article;
    class Category {
        constructor() {
            this.name = schema_definition_1.SchemaDefinition.stringColumn().unique();
        }
    }
    ActionsModel.Category = Category;
    class Tag {
        constructor() {
            this.name = schema_definition_1.SchemaDefinition.stringColumn().unique();
        }
    }
    ActionsModel.Tag = Tag;
})(ActionsModel || (ActionsModel = {}));
(0, vitest_1.test)('triggers', async () => {
    const schema = (0, schema_definition_1.createSchema)(ActionsModel);
    await (0, engine_api_tester_1.executeDbTest)({
        schema: schema,
        seed: [
            {
                query: (0, gql_1.gql) `
					mutation {
						createArticle(data: {title: "Hello world", tags: [{create: {name: "graphql"}}], category: {create: {name: "Tutorials"}}}) {
							ok
						}
					}
				`,
            },
        ],
        query: (0, gql_1.gql) `
			mutation {
				updateTag(by: {name: "graphql"}, data: {name: "GraphQL"}) {
					ok
				}
			}
		`,
        return: {
            updateTag: {
                ok: true,
            },
        },
        executionContainerFactoryFactory: providers => {
            const factory = new engine_content_api_1.ExecutionContainerFactory(providers);
            factory.hooks.push(new src_1.ActionsExecutionContainerHookFactory(new src_1.ListenerStoreProvider()).create());
            return factory;
        },
        migrationGroups: { 'contember/actions': migrations_1.migrationsGroup },
        expectSystemDatabase: {
            actions_event: [
                {
                    payload: {
                        id: '123e4567-e89b-12d3-1111-000000000003',
                        entity: 'Article',
                        trigger: 'article_watch',
                        events: [
                            {
                                id: '123e4567-e89b-12d3-1111-000000000003',
                                entity: 'Article',
                                values: {
                                    id: '123e4567-e89b-12d3-1111-000000000003',
                                    title: 'Hello world',
                                    category: '123e4567-e89b-12d3-1111-000000000004',
                                },
                                operation: 'create',
                            },
                            {
                                id: '123e4567-e89b-12d3-1111-000000000003',
                                path: [],
                                entity: 'Article',
                                relation: 'tags',
                                inverseId: '123e4567-e89b-12d3-1111-000000000005',
                                operation: 'junction-connect',
                            },
                        ],
                        operation: 'watch',
                        selection: {
                            id: '123e4567-e89b-12d3-1111-000000000003',
                            tags: [{ id: '123e4567-e89b-12d3-1111-000000000005', name: 'graphql' }],
                            title: 'Hello world',
                            category: { id: '123e4567-e89b-12d3-1111-000000000004', name: 'Tutorials' },
                        },
                    },
                },
                {
                    payload: {
                        id: '123e4567-e89b-12d3-1111-000000000003',
                        entity: 'Article',
                        trigger: 'article_watch',
                        events: [{
                                id: '123e4567-e89b-12d3-1111-000000000005',
                                old: { name: 'graphql' },
                                path: ['tags'],
                                entity: 'Tag',
                                values: { name: 'GraphQL' },
                                operation: 'update',
                            }],
                        operation: 'watch',
                        selection: {
                            id: '123e4567-e89b-12d3-1111-000000000003',
                            tags: [{ id: '123e4567-e89b-12d3-1111-000000000005', name: 'GraphQL' }],
                            title: 'Hello world',
                            category: { id: '123e4567-e89b-12d3-1111-000000000004', name: 'Tutorials' },
                        },
                    },
                },
            ],
        },
    });
});
//# sourceMappingURL=triggers.test.js.map