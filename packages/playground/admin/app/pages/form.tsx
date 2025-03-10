import { SlugField } from '~/lib-extra/slug-field/field'
import { Binding, PersistButton } from '~/lib/binding'
import { DataGridTextColumn, DefaultDataGrid } from '~/lib/datagrid'
import { SideDimensions } from '~/lib/dimensions'
import { CheckboxField, InputField, MultiSelectField, SelectField, TextareaField } from '~/lib/form'
import { Slots } from '~/lib/layout'
import { DefaultRepeater } from '~/lib/repeater'
import { AnchorButton } from '~/lib/ui/button'
import { Component, EntitySubTree, EnvironmentMiddleware, Field, Link, Variable } from '@contember/interface'
import slugify from '@sindresorhus/slugify'

export default () => (
	<Binding>
		<Slots.Title>Articles</Slots.Title>
		<Slots.Actions>
			<Link to="form/articleCreate">
				<AnchorButton>Create article</AnchorButton>
			</Link>
			<Link to="form/tagCreate">
				<AnchorButton>Create tag</AnchorButton>
			</Link>
			<Link to="form/authorCreate">
				<AnchorButton>Create author</AnchorButton>
			</Link>

		</Slots.Actions>

		<DefaultDataGrid entities="FormArticle">
			<DataGridTextColumn header="Internal name" field="internalName">
				<Link to="form/articleEdit(id: $entity.id)">
					<AnchorButton variant="link"><Field field="internalName" /></AnchorButton>
				</Link>
			</DataGridTextColumn>
		</DefaultDataGrid>

		<h2 className="text-2xl">Tags</h2>
		<DefaultDataGrid entities="FormTag">
			<DataGridTextColumn header="Name" field="name">
				<Link to="form/tagEdit(id: $entity.id)">
					<AnchorButton variant="link"><Field field="name" /></AnchorButton>
				</Link>
			</DataGridTextColumn>
		</DefaultDataGrid>

		<h2 className="text-2xl">Authors</h2>
		<DefaultDataGrid entities="FormAuthor">
			<DataGridTextColumn header="Name" field="name">
				<Link to="form/authorEdit(id: $entity.id)">
					<AnchorButton variant="link"><Field field="name" /></AnchorButton>
				</Link>
			</DataGridTextColumn>
		</DefaultDataGrid>
	</Binding>
)

export const ArticleCreate = () => (
	<Binding>
		<Slots.Title>Create article</Slots.Title>
		<Slots.Actions>
			<PersistButton />
			<Link to="form">
				<AnchorButton>Back to list</AnchorButton>
			</Link>
		</Slots.Actions>
		<EntitySubTree entity="FormArticle" isCreating>
			<ArticleForm />
		</EntitySubTree>
	</Binding>
)

export const ArticleEdit = () => (
	<Binding>
		<Slots.Title>Edit article</Slots.Title>
		<Slots.Actions>
			<PersistButton />
			<Link to="form">
				<AnchorButton>Back to list</AnchorButton>
			</Link>
		</Slots.Actions>
		<EntitySubTree entity="FormArticle(id = $id)">
			<ArticleForm />
		</EntitySubTree>
	</Binding>
)

export const TagCreate = () => (
	<Binding>
		<Slots.Title>Create tag</Slots.Title>
		<Slots.Actions>
			<PersistButton />
			<Link to="form">
				<AnchorButton>Back to list</AnchorButton>
			</Link>
		</Slots.Actions>
		<EntitySubTree entity="FormTag" isCreating>
			<ArticleTagForm />
		</EntitySubTree>
	</Binding>
)

export const TagEdit = () => (
	<Binding>
		<Slots.Title>Edit tag</Slots.Title>
		<Slots.Actions>
			<PersistButton />
			<Link to="form">
				<AnchorButton>Back to list</AnchorButton>
			</Link>
		</Slots.Actions>
		<EntitySubTree entity="FormTag(id = $id)">
			<ArticleTagForm />
		</EntitySubTree>
	</Binding>
)

export const AuthorCreate = () => (
	<Binding>
		<Slots.Title>Create author</Slots.Title>
		<Slots.Actions>
			<PersistButton />
			<Link to="form">
				<AnchorButton>Back to list</AnchorButton>
			</Link>
		</Slots.Actions>
		<EntitySubTree entity="FormAuthor" isCreating>
			<ArticleAuthorForm />
		</EntitySubTree>
	</Binding>
)

export const AuthorEdit = () => (
	<Binding>
		<Slots.Title>Edit author</Slots.Title>
		<Slots.Actions>
			<PersistButton />
			<Link to="form">
				<AnchorButton>Back to list</AnchorButton>
			</Link>
		</Slots.Actions>
		<EntitySubTree entity="FormAuthor(id = $id)">
			<ArticleAuthorForm />
		</EntitySubTree>
	</Binding>
)

export const ArticleForm = Component(() => (
	<>
		<EnvironmentMiddleware create={it => it.withDimensions({ locale: ['cs', 'en'] })}>
			<SideDimensions dimension="locale" field="locales(locale = $currentLocale)" as="currentLocale">
				<h2 className="text-2xl"><Variable name="currentLocale" /></h2>
				<ArticleLocaleForm />
			</SideDimensions>
		</EnvironmentMiddleware>
		<DefaultRepeater field="notes" orderBy="createdAt" initialEntityCount={1}>
			<ArticleNoteForm />
		</DefaultRepeater>
		<Slots.Sidebar>
			<InputField field="internalName" required />
			<CheckboxField field="locked" />
			<InputField field="publishedAt" />
			<MultiSelectField field="tags" createNewForm={<ArticleTagForm />}>
				<Field field="name" />
			</MultiSelectField>
			<SelectField field="author" createNewForm={<ArticleAuthorForm />}>
				<Field field="name" />
			</SelectField>

		</Slots.Sidebar>
	</>
))

export const ArticleLocaleForm = Component(() => (
	<>
		<SelectField field="article" createNewForm={<ArticleForm />}>
			<Field field="internalName" />
		</SelectField>
		<InputField field="title" required />
		<SlugField field="slug" derivedFrom="title" slugify={slugify} />
		<TextareaField field="content" />
	</>
))

export const ArticleNoteForm = Component(() => (
	<>
		<SelectField field="article" createNewForm={<ArticleForm />}>
			<Field field="internalName" />
		</SelectField>
		<TextareaField field="text" />
	</>
))

export const ArticleTagForm = Component(() => (
	<>
		<MultiSelectField field="articles" createNewForm={<ArticleForm />}>
			<Field field="internalName" />
		</MultiSelectField>
		<InputField field="name" required />
		<SlugField field="slug" derivedFrom="name" slugify={slugify} />
	</>
))

export const ArticleAuthorForm = Component(() => (
	<>
		<MultiSelectField field="articles" createNewForm={<ArticleForm />}>
			<Field field="internalName" />
		</MultiSelectField>
		<InputField field="name" required />
		<SlugField field="slug" derivedFrom="name" slugify={slugify} />
	</>
))
