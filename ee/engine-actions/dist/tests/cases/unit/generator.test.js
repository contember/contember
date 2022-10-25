"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const triggers_1 = require("../../../src/triggers");
const schema_definition_1 = require("@contember/schema-definition");
const vitest_1 = require("vitest");
const createTrigger = (watchNode) => ({
    type: 'watch',
    entity: 'Author',
    name: 'author_trigger',
    watch: watchNode,
    target: null,
});
const testBuilder = (watchNode) => {
    const generator = new triggers_1.TriggerListenerBuilder(schema);
    generator.add(createTrigger(watchNode));
    return generator.createStore().listeners;
};
(0, vitest_1.test)('watch column', () => {
    const node = ['name'];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners(['name'], trigger);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('first level many-has-many owning', () => {
    const node = [['topics', {}, ['name']]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners([], trigger);
    listeners.junctionListeners.set('Author', new Map([
        ['topics', [
                {
                    type: 'junction',
                    path: [],
                    rootEntity: schema.entities.Author,
                    context: {
                        type: 'owning',
                        entity: schema.entities.Author,
                        relation: schema.entities.Author.fields.topics,
                    },
                    trigger,
                },
            ]],
    ]));
    listeners.indirectListeners.set('AuthorTopic', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['topics'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('first level many-has-many inverse', () => {
    const node = [['followers', {}, ['name']]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners([], trigger);
    listeners.junctionListeners.set('User', new Map([
        ['following', [
                {
                    type: 'junction',
                    path: [],
                    rootEntity: schema.entities.Author,
                    context: {
                        type: 'inverse',
                        entity: schema.entities.Author,
                        relation: schema.entities.Author.fields.followers,
                    },
                    trigger,
                },
            ]],
    ]));
    listeners.indirectListeners.set('User', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['followers'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('first level one-has-one owning', () => {
    const node = [['avatar', {}, ['url']]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners(['avatar'], trigger);
    listeners.indirectListeners.set('Image', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['url']),
            relations: new Set(),
            path: ['avatar'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('first level one-has-one inverse', () => {
    const node = [['bio', {}, ['content']]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners([], trigger);
    listeners.indirectListeners.set('AuthorBio', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['content', 'author']),
            relations: new Set(['author']),
            path: ['bio'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('first level many-has-one', () => {
    const node = [['supervisor', {}, ['name']]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners(['supervisor'], trigger);
    listeners.indirectListeners.set('Author', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['supervisor'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('first level one-has-many', () => {
    const node = [['articles', {}, ['title']]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners([], trigger);
    listeners.indirectListeners.set('Article', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['title', 'author']),
            relations: new Set(['author']),
            path: ['articles'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('second level one-has-one owning', () => {
    const node = [['articles', {}, [['image', {}, ['url']]]]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners([], trigger);
    listeners.indirectListeners.set('Image', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['url']),
            relations: new Set(),
            path: ['articles', 'image'],
        }]);
    listeners.indirectListeners.set('Article', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['author', 'image']),
            relations: new Set(['author', 'image']),
            path: ['articles'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('second level one-has-one inverse', () => {
    const node = [['articles', {}, [['settings', {}, ['visible']]]]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners([], trigger);
    listeners.indirectListeners.set('ArticleSettings', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['visible', 'article']),
            relations: new Set(['article']),
            path: ['articles', 'settings'],
        }]);
    listeners.indirectListeners.set('Article', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['author']),
            relations: new Set(['author']),
            path: ['articles'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('second level one-has-many', () => {
    const node = [['articles', {}, [['comments', {}, ['content']]]]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners([], trigger);
    listeners.indirectListeners.set('Comment', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['article', 'content']),
            relations: new Set(['article']),
            path: ['articles', 'comments'],
        }]);
    listeners.indirectListeners.set('Article', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['author']),
            relations: new Set(['author']),
            path: ['articles'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('third level many-has-one', () => {
    const node = [['articles', {}, [['comments', {}, [['author', {}, ['name']]]]]]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners([], trigger);
    listeners.indirectListeners.set('User', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['articles', 'comments', 'author'],
        }]);
    listeners.indirectListeners.set('Comment', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['article', 'author']),
            relations: new Set(['article', 'author']),
            path: ['articles', 'comments'],
        }]);
    listeners.indirectListeners.set('Article', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['author']),
            relations: new Set(['author']),
            path: ['articles'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('second level many-has-one', () => {
    const node = [['articles', {}, [['category', {}, ['name']]]]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners([], trigger);
    listeners.indirectListeners.set('Category', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['articles', 'category'],
        }]);
    listeners.indirectListeners.set('Article', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['author', 'category']),
            relations: new Set(['author', 'category']),
            path: ['articles'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('second level many-has-many owning', () => {
    const node = [['articles', {}, [['tags', {}, ['name']]]]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners([], trigger);
    listeners.junctionListeners.set('Article', new Map([
        ['tags', [
                {
                    type: 'junction',
                    path: ['articles'],
                    rootEntity: schema.entities.Author,
                    context: {
                        entity: schema.entities.Article,
                        relation: schema.entities.Article.fields.tags,
                        type: 'owning',
                    },
                    trigger,
                },
            ]],
    ]));
    listeners.indirectListeners.set('Tag', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['articles', 'tags'],
        }]);
    listeners.indirectListeners.set('Article', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['author']),
            relations: new Set(['author']),
            path: ['articles'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('second level many-has-many inverse', () => {
    const node = [['articles', {}, [['likedBy', {}, ['name']]]]];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners([], trigger);
    listeners.junctionListeners.set('User', new Map([
        ['likes', [
                {
                    type: 'junction',
                    path: ['articles'],
                    rootEntity: schema.entities.Author,
                    context: {
                        type: 'inverse',
                        entity: schema.entities.Article,
                        relation: schema.entities.Article.fields.likedBy,
                    },
                    trigger,
                },
            ]],
    ]));
    listeners.indirectListeners.set('User', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['articles', 'likedBy'],
        }]);
    listeners.indirectListeners.set('Article', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['author']),
            relations: new Set(['author']),
            path: ['articles'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
(0, vitest_1.test)('all above', () => {
    const node = [
        'name',
        ['topics', {}, ['name']],
        ['followers', {}, ['name']],
        ['avatar', {}, ['url']],
        ['bio', {}, ['content']],
        ['supervisor', {}, ['name']],
        ['articles', {}, [
                'title',
                ['image', {}, ['url']],
                ['settings', {}, ['visible']],
                ['comments', {}, ['content', ['author', {}, ['name']]]],
                ['category', {}, ['name']],
                ['tags', {}, ['name']],
                ['likedBy', {}, ['name']],
            ]],
    ];
    const trigger = createTrigger(node);
    const listeners = createEmptyListeners(['name', 'avatar', 'supervisor'], trigger);
    listeners.junctionListeners.set('Author', new Map([
        ['topics', [
                {
                    type: 'junction',
                    path: [],
                    rootEntity: schema.entities.Author,
                    context: {
                        type: 'owning',
                        entity: schema.entities.Author,
                        relation: schema.entities.Author.fields.topics,
                    },
                    trigger,
                },
            ]],
    ]));
    listeners.junctionListeners.set('User', new Map([
        ['following', [
                {
                    type: 'junction',
                    path: [],
                    rootEntity: schema.entities.Author,
                    context: {
                        type: 'inverse',
                        entity: schema.entities.Author,
                        relation: schema.entities.Author.fields.followers,
                    },
                    trigger,
                },
            ]],
        ['likes', [
                {
                    type: 'junction',
                    path: ['articles'],
                    rootEntity: schema.entities.Author,
                    context: {
                        type: 'inverse',
                        entity: schema.entities.Article,
                        relation: schema.entities.Article.fields.likedBy,
                    },
                    trigger,
                },
            ]],
    ]));
    listeners.junctionListeners.set('Article', new Map([
        ['tags', [
                {
                    type: 'junction',
                    path: ['articles'],
                    rootEntity: schema.entities.Author,
                    context: {
                        type: 'owning',
                        entity: schema.entities.Article,
                        relation: schema.entities.Article.fields.tags,
                    },
                    trigger,
                },
            ]],
    ]));
    listeners.indirectListeners.set('AuthorTopic', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['topics'],
        }]);
    listeners.indirectListeners.set('User', [
        {
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['followers'],
        },
        {
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['articles', 'comments', 'author'],
        },
        {
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['articles', 'likedBy'],
        },
    ]);
    listeners.indirectListeners.set('Image', [
        {
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['url']),
            relations: new Set(),
            path: ['avatar'],
        },
        {
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['url']),
            relations: new Set(),
            path: ['articles', 'image'],
        },
    ]);
    listeners.indirectListeners.set('AuthorBio', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['content', 'author']),
            relations: new Set(['author']),
            path: ['bio'],
        }]);
    listeners.indirectListeners.set('Author', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['supervisor'],
        }]);
    listeners.indirectListeners.set('ArticleSettings', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['visible', 'article']),
            relations: new Set(['article']),
            path: ['articles', 'settings'],
        }]);
    listeners.indirectListeners.set('Comment', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['article', 'content', 'author']),
            relations: new Set(['author', 'article']),
            path: ['articles', 'comments'],
        }]);
    listeners.indirectListeners.set('Category', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['articles', 'category'],
        }]);
    listeners.indirectListeners.set('Tag', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['articles', 'tags'],
        }]);
    listeners.indirectListeners.set('Article', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['title', 'image', 'category', 'author']),
            relations: new Set(['image', 'category', 'author']),
            path: ['articles'],
        }]);
    listeners.indirectListeners.set('AuthorTopic', [{
            type: 'indirect',
            rootEntity: schema.entities.Author,
            trigger,
            fields: new Set(['name']),
            relations: new Set(),
            path: ['topics'],
        }]);
    vitest_1.assert.deepStrictEqual(testBuilder(node), listeners);
});
var WatchModel;
(function (WatchModel) {
    class Author {
        constructor() {
            this.name = schema_definition_1.SchemaDefinition.stringColumn();
            this.topics = schema_definition_1.SchemaDefinition.manyHasMany(AuthorTopic);
            this.followers = schema_definition_1.SchemaDefinition.manyHasManyInverse(User, 'following');
            this.avatar = schema_definition_1.SchemaDefinition.oneHasOne(Image);
            this.bio = schema_definition_1.SchemaDefinition.oneHasOneInverse(AuthorBio, 'author');
            this.supervisor = schema_definition_1.SchemaDefinition.manyHasOne(Author);
            this.articles = schema_definition_1.SchemaDefinition.oneHasMany(Article, 'author');
        }
    }
    WatchModel.Author = Author;
    class AuthorBio {
        constructor() {
            this.content = schema_definition_1.SchemaDefinition.stringColumn();
            this.author = schema_definition_1.SchemaDefinition.oneHasOne(Author, 'bio');
        }
    }
    WatchModel.AuthorBio = AuthorBio;
    class AuthorTopic {
        constructor() {
            this.name = schema_definition_1.SchemaDefinition.stringColumn();
        }
    }
    WatchModel.AuthorTopic = AuthorTopic;
    class Image {
        constructor() {
            this.url = schema_definition_1.SchemaDefinition.stringColumn();
        }
    }
    WatchModel.Image = Image;
    class User {
        constructor() {
            this.name = schema_definition_1.SchemaDefinition.stringColumn();
            this.following = schema_definition_1.SchemaDefinition.manyHasMany(Author, 'followers');
            this.likes = schema_definition_1.SchemaDefinition.manyHasOne(Article, 'likedBy');
        }
    }
    WatchModel.User = User;
    class Article {
        constructor() {
            this.author = schema_definition_1.SchemaDefinition.manyHasOne(Author, 'articles');
            this.title = schema_definition_1.SchemaDefinition.stringColumn();
            this.image = schema_definition_1.SchemaDefinition.oneHasOne(Image);
            this.settings = schema_definition_1.SchemaDefinition.oneHasOneInverse(ArticleSettings, 'article');
            this.comments = schema_definition_1.SchemaDefinition.oneHasMany(Comment, 'article');
            this.category = schema_definition_1.SchemaDefinition.manyHasOne(Category);
            this.tags = schema_definition_1.SchemaDefinition.manyHasMany(Tag);
            this.likedBy = schema_definition_1.SchemaDefinition.manyHasManyInverse(User, 'likes');
        }
    }
    WatchModel.Article = Article;
    class ArticleSettings {
        constructor() {
            this.article = schema_definition_1.SchemaDefinition.oneHasOne(Article, 'settings');
            this.visible = schema_definition_1.SchemaDefinition.boolColumn();
        }
    }
    WatchModel.ArticleSettings = ArticleSettings;
    class Comment {
        constructor() {
            this.article = schema_definition_1.SchemaDefinition.manyHasOne(Article, 'comments');
            this.content = schema_definition_1.SchemaDefinition.stringColumn();
            this.author = schema_definition_1.SchemaDefinition.manyHasOne(User);
        }
    }
    WatchModel.Comment = Comment;
    class Category {
        constructor() {
            this.name = schema_definition_1.SchemaDefinition.stringColumn();
        }
    }
    WatchModel.Category = Category;
    class Tag {
        constructor() {
            this.name = schema_definition_1.SchemaDefinition.stringColumn();
        }
    }
    WatchModel.Tag = Tag;
})(WatchModel || (WatchModel = {}));
const schema = schema_definition_1.SchemaDefinition.createModel(WatchModel);
const createEmptyListeners = (rootFields, trigger) => {
    const listeners = {
        createListeners: new Map(),
        updateListeners: new Map(),
        deleteListeners: new Map(),
        indirectListeners: new Map(),
        junctionListeners: new Map(),
    };
    listeners.createListeners.set('Author', [{ type: 'create', entity: schema.entities.Author, trigger }]);
    listeners.deleteListeners.set('Author', [{ type: 'delete', entity: schema.entities.Author, trigger }]);
    listeners.updateListeners.set('Author', [{
            type: 'update',
            entity: schema.entities.Author,
            trigger,
            fields: new Set(rootFields),
        }]);
    return listeners;
};
//# sourceMappingURL=generator.test.js.map