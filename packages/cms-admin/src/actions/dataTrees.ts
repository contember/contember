import { createAction } from 'redux-actions'
import { MutationRequestResult, QueryRequestResult } from '../binding'
import GraphqlClient from '../model/GraphqlClient'
import {
	DATA_TREE_REQUEST_CREATE,
	DATA_TREE_REQUEST_END,
	DATA_TREE_REQUEST_ERROR,
	DATA_TREE_REQUEST_INITIALIZE,
	DATA_TREE_SET_DIRTINESS
} from '../reducer/dataTrees'
import { DataTreeDirtinessState, DataTreeId, DataTreeRequestErrorData, DataTreeRequestType } from '../state/dataTrees'
import { loginRequest } from '../state/request'
import { pushRequest } from './request'
import { ActionCreator } from './types'

export interface DataTreeDirtinessDelta {
	dataTreeId: DataTreeId
	isDirty: DataTreeDirtinessState
}

export const setDataTreeDirtiness = (dataTreeId: DataTreeId, isDirty: DataTreeDirtinessState) =>
	createAction<DataTreeDirtinessDelta>(DATA_TREE_SET_DIRTINESS, () => {
		return {
			dataTreeId,
			isDirty
		}
	})()

export interface DataTreeCreateRequest {
	dataTreeId: DataTreeId
	type: DataTreeRequestType
}

export const createDataTreeRequest = (dataTreeId: DataTreeId, type: DataTreeRequestType) =>
	createAction<DataTreeCreateRequest>(DATA_TREE_REQUEST_CREATE, () => {
		return {
			dataTreeId,
			type
		}
	})()

export interface DataTreeInitializeRequest {
	dataTreeId: DataTreeId
	type: DataTreeRequestType
}

export const initializeDataTreeRequest = (dataTreeId: DataTreeId, type: DataTreeRequestType) =>
	createAction<DataTreeInitializeRequest>(DATA_TREE_REQUEST_INITIALIZE, () => {
		return {
			dataTreeId,
			type
		}
	})()

export type DataTreeSetRequestEnd =
	| {
			dataTreeId: DataTreeId
			type: DataTreeRequestType.Mutation
			data: MutationRequestResult | null
	  }
	| {
			dataTreeId: DataTreeId
			type: DataTreeRequestType.Query
			data: QueryRequestResult | null
	  }

export const handleDataTreeRequestEnd = (dataTreeId: DataTreeId, type: DataTreeRequestType, data: any) =>
	createAction<DataTreeSetRequestEnd>(DATA_TREE_REQUEST_END, () => {
		return {
			dataTreeId,
			type,
			data
		}
	})()

export interface DataTreeSetRequestError<ErrorData extends DataTreeRequestErrorData> {
	dataTreeId: DataTreeId
	type: DataTreeRequestType
	data: ErrorData
}

export const setDataTreeRequestError = <ErrorData extends DataTreeRequestErrorData>(
	dataTreeId: DataTreeId,
	type: DataTreeRequestType,
	data: ErrorData
) =>
	createAction<DataTreeSetRequestError<ErrorData>>(DATA_TREE_REQUEST_ERROR, () => {
		return {
			dataTreeId,
			type,
			data
		}
	})()

export interface DataTreeQuery {
	dataTreeId: DataTreeId
	type: DataTreeRequestType
	query: string
}

export const sendDataTreeRequest = (
	dataTreeId: DataTreeId,
	type: DataTreeRequestType,
	request: string
): ActionCreator => async (dispatch, getState, services) => {
	const state = getState()
	if (!('stage' in state.request) || !('project' in state.request)) {
		return
	}
	const { stage, project } = state.request
	const apiToken = state.auth.identity ? state.auth.identity.token : undefined

	dispatch(initializeDataTreeRequest(dataTreeId, type))
	try {
		const response = await services.contentClientFactory
			.create(project, stage)
			.request(request, {}, apiToken || undefined)
		dispatch(handleDataTreeRequestEnd(dataTreeId, type, response))
	} catch (error) {
		dispatch(setDataTreeRequestError<undefined>(dataTreeId, type, undefined))
		if (error instanceof GraphqlClient.GraphqlAuthenticationError) {
			dispatch(pushRequest(loginRequest()))
			return
		}
		throw error
	}
}
