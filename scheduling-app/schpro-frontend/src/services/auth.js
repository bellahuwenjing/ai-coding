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

    // Fetch person record with company info
    const { data: person, error: personError } = await supabase
      .from('people')
      .select(`
        *,
        companies (
          id,
          name,
          slug,
          settings
        )
      `)
      .eq('user_id', data.user.id)
      .single()

    if (personError) throw personError

    return {
      user: data.user,
      session: data.session,
      person,
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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) throw sessionError
    if (!session) return null

    // Fetch person record with company info
    const { data: person, error: personError } = await supabase
      .from('people')
      .select(`
        *,
        companies (
          id,
          name,
          slug,
          settings
        )
      `)
      .eq('user_id', session.user.id)
      .single()

    if (personError) throw personError

    return {
      session,
      person,
    }
  } catch (error) {
    console.error('Get session error:', error)
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
        // Fetch person profile
        const { data: person } = await supabase
          .from('people')
          .select(`
            *,
            companies (*)
          `)
          .eq('user_id', session.user.id)
          .single()

        callback(event, { session, person })
      } else if (event === 'SIGNED_OUT') {
        callback(event, null)
      }
    }
  )

  // Return unsubscribe function
  return () => subscription.unsubscribe()
}
