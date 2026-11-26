/** Public URL for an object in a public bucket (org-media, avatars). */
export function publicMediaUrl(path: string | null | undefined, bucket: "org-media" | "avatars" = "org-media") {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}
