import type { ObjectId as OId } from "mongodb"

export type ObjectId = OId
export type StringObjectId = string

export type ProviderName = string

export type NativeId = ObjectId | StringObjectId | number

export type UserNativeId = NativeId
export type OrganizationNativeId = NativeId

export type SessionDeviceId = string
