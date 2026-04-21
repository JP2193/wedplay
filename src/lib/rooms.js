import { supabase } from './supabase'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode() {
  return Array.from({ length: 6 }, () =>
    ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  ).join('')
}

const ALL_MODULE_KEYS = ['bingo', 'quiz', 'adivina', 'deseos', 'timeline', 'lightning', 'playlist']

export async function getOrCreateRoom(userId) {
  // Try to fetch existing room with modules
  const { data: existing } = await supabase
    .from('rooms')
    .select('*, room_modules(*)')
    .eq('admin_id', userId)
    .maybeSingle()

  if (existing) {
    // Ensure all module rows exist (in case new modules were added)
    const existingKeys = existing.room_modules.map(m => m.module_key)
    const missing = ALL_MODULE_KEYS.filter(k => !existingKeys.includes(k))
    if (missing.length > 0) {
      await supabase.from('room_modules').insert(
        missing.map(key => ({ room_id: existing.id, module_key: key }))
      )
      // Re-fetch with all modules
      const { data: refreshed } = await supabase
        .from('rooms')
        .select('*, room_modules(*)')
        .eq('admin_id', userId)
        .maybeSingle()
      return refreshed
    }
    return existing
  }

  // Create new room with a unique code
  let room = null
  while (!room) {
    const code = generateCode()
    const { data, error } = await supabase
      .from('rooms')
      .insert({ admin_id: userId, code })
      .select()
      .single()

    if (!error) {
      room = data
    } else if (!error.message.includes('unique')) {
      throw error
    }
    // If unique constraint error on code, retry with new code
  }

  // Initialize all module rows
  await supabase.from('room_modules').insert(
    ALL_MODULE_KEYS.map(key => ({ room_id: room.id, module_key: key }))
  )

  // Return with modules
  const { data: full } = await supabase
    .from('rooms')
    .select('*, room_modules(*)')
    .eq('id', room.id)
    .single()

  return full
}

export async function getRoomByCode(code) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*, room_modules(*)')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateRoomInfo(roomId, changes) {
  const { error } = await supabase
    .from('rooms')
    .update(changes)
    .eq('id', roomId)
  if (error) throw error
}

export async function updateModule(roomId, moduleKey, changes) {
  const { error } = await supabase
    .from('room_modules')
    .update(changes)
    .eq('room_id', roomId)
    .eq('module_key', moduleKey)
  if (error) throw error
}

// Guest name persisted per room code in localStorage
export function getGuestName(roomCode) {
  return localStorage.getItem(`wedplay-guest-${roomCode}`) || null
}

export function setGuestName(roomCode, name) {
  localStorage.setItem(`wedplay-guest-${roomCode}`, name)
}
