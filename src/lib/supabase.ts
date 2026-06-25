import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Warning: Supabase credentials are not fully configured in environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Uploads a photo file to the 'listing-photos' Supabase Storage bucket.
 * Returns the public URL of the uploaded file, or null on error.
 */
export async function uploadListingPhoto(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const path = `${userId}/${uniqueName}`

  const { error } = await supabase.storage
    .from('listing-photos')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) {
    console.error('Photo upload error:', error)
    return null
  }

  const { data } = supabase.storage
    .from('listing-photos')
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * Deletes a photo from Supabase Storage by its public URL.
 * Silently skips if the URL is not a Storage URL.
 */
export async function deleteListingPhoto(url: string): Promise<void> {
  if (!url || !url.includes('listing-photos')) return
  const parts = url.split('/listing-photos/')
  if (parts.length < 2) return
  const path = decodeURIComponent(parts[1].split('?')[0])
  const { error } = await supabase.storage
    .from('listing-photos')
    .remove([path])
  if (error) {
    console.error('Photo delete error:', error)
  }
}
