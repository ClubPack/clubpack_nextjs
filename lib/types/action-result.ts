export type ActionResult<T = void> =
  | ({ ok: true } & (T extends void ? {} : { data: T }))
  | { ok: false; error: string }

export type SimpleActionResult =
  | { ok: true }
  | { ok: false; error: string }
