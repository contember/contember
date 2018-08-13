import * as React from 'react'
import { TextField } from './binding/facade'
import { configureStore } from './store'
import { Provider } from 'react-redux'
import { populateRequest } from './actions/request'
import { emptyState } from './state'
import { GraphQlBuilder } from 'cms-client'
import { Entity, Field, DataProvider, OneToMany, OneToOne } from './binding'
import Router from './containers/router'

const store = configureStore(emptyState)
store.dispatch(populateRequest(document.location))
window.onpopstate = e => {
	e.preventDefault()
	store.dispatch(populateRequest(document.location))
}

export const root = (
	<div>
		<Provider store={store}>
			<>
				<Router />
				<DataProvider>
					{persist => {
						return (
							<Entity name="Post" where={{ id: '387ffd96-4a35-412b-922b-fe49480fd1f1' }}>
								<TextField name="publishedAt" />
								<OneToOne field="author">
									<Entity name="Author">
										<TextField name="name" />
									</Entity>
								</OneToOne>
								<OneToOne field="author">
									{unlink => {
										return (
											<Entity name="Author">
												<TextField name="name" />
												<button type="button" onClick={unlink}>
													×
												</button>
											</Entity>
										)
									}}
								</OneToOne>
								<OneToMany field="categories">
									{unlink => {
										return (
											<Entity name="Category">
												<OneToMany field="locales">
													{unlink => {
														return (
															<Entity
																name="CategoryLocale"
																where={{ locale: { eq: new GraphQlBuilder.Literal('cs') } }}
															>
																<TextField name="name" />
																<button type="button" onClick={unlink}>
																	×
																</button>
															</Entity>
														)
													}}
												</OneToMany>
												<button type="button" onClick={unlink}>
													×
												</button>
											</Entity>
										)
									}}
								</OneToMany>
								<OneToMany field="locales">
									{unlink => {
										return (
											<Entity name="PostLocale">
												<TextField name="title" />
												<button type="button" onClick={unlink}>
													×
												</button>
											</Entity>
										)
									}}
								</OneToMany>
								<button type="button" onClick={persist}>Save!</button>
							</Entity>
						)
					}}
				</DataProvider>
			</>
		</Provider>
	</div>
)
