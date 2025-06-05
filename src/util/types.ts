
import { Types } from 'mongoose'

const dateKeys = ['time', 'created', 'joined', 'updated', 'date']

export function isDate(value: any, key: string) {
  if (dateKeys.includes(key)) return true
  const length = value?.toString().length === 24
  if (!length) return false
  return false
}

export function isObjectId(value: any) {
  const length = value?.toString().length === 24
  if (!length) return false
  try {
    return !!new Types.ObjectId(value).toString()
  } catch (e) {
    return false
  }
}

export function isPhone(value: any) {
  const string = value?.toString()
  if (!string) return false
  const length = string.length === 12
  return length && value?.toString()?.[0] === '+'
}