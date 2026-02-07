import { supabase } from '../config/supabase'

/**
 * Register new user and create company
 * Creates:
 * 1. Supabase Auth user
 * 2. Company record
 * 3. Person record linked to both
 */
export async function register({ companyName, name, email, password }) {
  try {
    console.log('Starting registration...')

    // 1. Sign up with Supabase Auth
    console.log('Calling signUp...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    console.log('SignUp response:', { authData, authError })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // Debug: Check if session exists
    console.log('SignUp successful, session:', authData.session ? 'EXISTS' : 'NULL')
    console.log('User ID:', authData.user.id)

    // Verify session is set on client
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Current session after signUp:', session ? 'EXISTS' : 'NULL')

    if (!session) {
      throw new Error('No session available after signup')
    }

    // 2. Create company record
    const slug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        slug: slug,
        settings: {}
      })
      .select()
      .single()

    if (companyError) throw companyError

    // 3. Create person record linked to auth user and company
    const { data: person, error: personError } = await supabase
      .from('people')
      .insert({
        user_id: authData.user.id,
        company_id: company.id,
        name,
        email,
        skills: [],
        certifications: [],
        is_deleted: false,
      })
      .select()
      .single()

    if (personError) throw personError

    return {
      user: authData.user,
      session: authData.session,
      person,
      company,
    }
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

/**
 * Login with email and password
 * Returns session and person profile
 */
export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.session) throw new Error('Login failed')

    // Don't fetch person here - let auth state change handler do it
    return {
      user: data.user,
      session: data.session,
    }
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

/**
 * Logout current user
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

/**
 * Get current session and person profile
 * Returns null if not authenticated
 */
export async function getCurrentSession() {
  try {
    console.log('[getCurrentSession] Starting...')

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    console.log('[getCurrentSession] Session result:', { hasSession: !!session, error: sessionError?.message })

    if (sessionError) {
      console.warn('Session error:', sessionError.message)
      return null
    }

    if (!session) {
      console.log('[getCurrentSession] No session found')
      return null
    }

    console.log('[getCurrentSession] Session found, user ID:', session.user.id)
    console.log('[getCurrentSession] Starting person fetch...')

    const startTime = Date.now()

    const { data: person, error: personError } = await supabase
      .from('people')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    const elapsed = Date.now() - startTime
    console.log(`[getCurrentSession] Person fetch completed in ${elapsed}ms`, { hasPerson: !!person, error: personError?.message })

    if (personError) {
      console.warn('Error fetching person:', personError)
      return {
        session,
        person: null,
      }
    }

    console.log('[getCurrentSession] Success! Returning session + person')
    return {
      session,
      person,
    }
  } catch (error) {
    console.error('[getCurrentSession] Error:', error)
    return null
  }
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/**
 * Get current user ID from session
 */
export async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id || null
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('[onAuthStateChange] SIGNED_IN event, user ID:', session.user.id)

        // Try fetch WITHOUT .single() to see if that's the issue
        const startTime = Date.now()

        try {
          console.log('[onAuthStateChange] Starting fetch...')
          const response = await supabase
            .from('people')
            .select('*')
            .eq('user_id', session.user.id)

          console.log('[onAuthStateChange] Fetch returned:', response)

          const elapsed = Date.now() - startTime
          console.log(`[onAuthStateChange] Completed in ${elapsed}ms`)

          const person = response.data?.[0] || null

          if (response.error) {
            console.error('Error fetching person:', response.error)
          }

          callback(event, { session, person })
        } catch (error) {
          console.error('Auth state change handler error:', error)
          callback(event, { session, person: null })
        }
      } else if (event === 'SIGNED_OUT') {
        callback(event, null)
      }
    }
  )

  // Return unsubscribe function
  return () => subscription.unsubscribe()
}
