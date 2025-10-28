import { deserialize as v8Deserialize, serialize as v8Serialize } from 'node:v8'

export function clone<T>(value: T): T {
  const maybeStructuredClone = (
    globalThis as typeof globalThis & {
      structuredClone?: <U>(input: U) => U
    }
  ).structuredClone

  if (typeof maybeStructuredClone === 'function') {
    return maybeStructuredClone(value)
  }

  return v8Deserialize(v8Serialize(value))
}
