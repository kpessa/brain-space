import { supabase } from '../lib/supabase'

declare global {
  interface Window {
    gapi: any
    google: any
  }
}

interface GoogleCalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  recurrence?: string[]
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: string
      minutes: number
    }>
  }
}

interface Calendar {
  id: string
  summary: string
  description?: string
  primary?: boolean
  backgroundColor?: string
  foregroundColor?: string
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService
  private tokenClient: any
  private accessToken: string | null = null
  private tokenExpiresAt: Date | null = null
  private isInitialized = false

  private constructor() {}

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService()
    }
    return GoogleCalendarService.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Load Google Identity Services library
      await this.loadGoogleIdentityServices()

      // Load Google API client library
      await this.loadGoogleApiClient()

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize Google Calendar service:', error)
      throw error
    }
  }

  private loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = () => {
        this.initializeTokenClient()
        resolve()
      }
      script.onerror = reject
      document.body.appendChild(script)
    })
  }

  private loadGoogleApiClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
              discoveryDocs: [import.meta.env.VITE_GOOGLE_CALENDAR_DISCOVERY_DOC],
            })

            // Load the calendar library
            await window.gapi.client.load('calendar', 'v3')
            resolve()
          } catch (error) {
            reject(error)
          }
        })
      }
      script.onerror = reject
      document.body.appendChild(script)
    })
  }

  private authResolve: ((value: void) => void) | null = null
  private authReject: ((reason?: any) => void) | null = null

  private initializeTokenClient(): void {
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: import.meta.env.VITE_GOOGLE_CALENDAR_SCOPES,
      callback: (response: any) => {
        if (response.access_token) {
          // OAuth authentication successful
          this.accessToken = response.access_token
          // Google OAuth tokens typically expire in 1 hour
          this.tokenExpiresAt = new Date(Date.now() + (response.expires_in || 3600) * 1000)

          // Set the token in GAPI client
          window.gapi.client.setToken({
            access_token: response.access_token,
          })

          // Set authorization header for all requests
          window.gapi.client.request = (originalRequest => {
            return (args: any) => {
              if (!args.headers) args.headers = {}
              args.headers['Authorization'] = `Bearer ${response.access_token}`
              return originalRequest(args)
            }
          })(window.gapi.client.request)

          this.storeTokenInSupabase(response.access_token)

          // Resolve the authentication promise
          if (this.authResolve) {
            this.authResolve()
            this.authResolve = null
            this.authReject = null
          }
        } else if (response.error) {
          console.error('OAuth error:', response.error)
          if (this.authReject) {
            this.authReject(new Error(response.error))
            this.authResolve = null
            this.authReject = null
          }
        }
      },
    })
  }

  private async storeTokenInSupabase(token: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.auth.updateUser({
          data: { google_calendar_token: token },
        })
      }
    } catch (error) {
      console.error('Failed to store token in Supabase:', error)
    }
  }

  async authenticate(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    // If we already have a valid token, return
    if (this.accessToken && this.isTokenValid()) {
      return Promise.resolve()
    }

    // Clear invalid token
    if (this.accessToken && !this.isTokenValid()) {
      this.accessToken = null
      this.tokenExpiresAt = null
    }

    // Check for stored token first
    const hasStoredToken = await this.checkStoredToken()
    if (hasStoredToken && this.accessToken && this.isTokenValid()) {
      return Promise.resolve()
    }

    // Need to request a new token
    return new Promise((resolve, reject) => {
      this.authResolve = resolve
      this.authReject = reject

      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'))
        return
      }
      
      this.tokenClient.requestAccessToken()

      // Add timeout
      setTimeout(() => {
        if (this.authReject) {
          this.authReject(new Error('Authentication timeout'))
          this.authResolve = null
          this.authReject = null
        }
      }, 30000)
    })
  }

  private async checkStoredToken(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.user_metadata?.google_calendar_token) {
        this.accessToken = user.user_metadata.google_calendar_token
        // For stored tokens, we don't have expiration info, so set to null to assume valid
        this.tokenExpiresAt = null
        window.gapi.client.setToken({ access_token: this.accessToken })
        return true
      }
    } catch (error) {
      console.error('Failed to check stored token:', error)
    }
    return false
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null && this.isTokenValid()
  }

  private isTokenValid(): boolean {
    if (!this.tokenExpiresAt) {
      return true // Assume valid if we don't have expiration info
    }
    return new Date() < this.tokenExpiresAt
  }

  async disconnect(): Promise<void> {
    const token = this.accessToken
    this.accessToken = null
    this.tokenExpiresAt = null

    // Clear stored token from Supabase
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.auth.updateUser({
          data: { google_calendar_token: null },
        })
        console.log('Cleared stored Google Calendar token')
      }
    } catch (error) {
      console.error('Failed to clear stored token:', error)
    }

    if (token && window.google?.accounts?.oauth2) {
      try {
        // Revoke the token
        window.google.accounts.oauth2.revoke(token, () => {
          console.log('Google Calendar token revoked')
        })
      } catch (error) {
        console.error('Error revoking token:', error)
      }
    }

    // Clear the GAPI client token
    if (window.gapi?.client) {
      window.gapi.client.setToken(null)
    }
  }

  async listCalendars(): Promise<Calendar[]> {
    await this.authenticate()

    // Fetching calendar list

    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      // Use direct fetch with proper authorization header
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/users/me/calendarList?key=${import.meta.env.VITE_GOOGLE_API_KEY}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        console.error('Calendar API error:', error)

        // If unauthorized, try to re-authenticate
        if (response.status === 401) {
          // Token expired, re-authenticating...
          this.accessToken = null
          this.tokenExpiresAt = null
          await this.authenticate()

          // Retry with new token
          const retryResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/users/me/calendarList?key=${import.meta.env.VITE_GOOGLE_API_KEY}`,
            {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          )

          if (!retryResponse.ok) {
            throw new Error('Failed to list calendars after re-authentication')
          }

          const retryData = await retryResponse.json()
          return retryData.items || []
        }

        throw new Error(error.error?.message || 'Failed to list calendars')
      }

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('Failed to list calendars:', error)
      throw error
    }
  }

  async listEvents(
    calendarId: string,
    timeMin?: Date,
    timeMax?: Date
  ): Promise<GoogleCalendarEvent[]> {
    await this.authenticate()

    try {
      const params: any = {
        calendarId: calendarId || 'primary',
        singleEvents: true,
        orderBy: 'startTime',
      }

      if (timeMin) {
        params.timeMin = timeMin.toISOString()
      }
      if (timeMax) {
        params.timeMax = timeMax.toISOString()
      }

      const response = await window.gapi.client.calendar.events.list(params)
      return response.result.items || []
    } catch (error) {
      console.error('Failed to list events:', error)
      throw error
    }
  }

  async createEvent(calendarId: string, event: GoogleCalendarEvent): Promise<GoogleCalendarEvent> {
    await this.authenticate()

    try {
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: calendarId || 'primary',
        resource: event,
      })
      return response.result
    } catch (error) {
      console.error('Failed to create event:', error)
      throw error
    }
  }

  async updateEvent(
    calendarId: string,
    eventId: string,
    event: GoogleCalendarEvent
  ): Promise<GoogleCalendarEvent> {
    await this.authenticate()

    try {
      const response = await window.gapi.client.calendar.events.update({
        calendarId: calendarId || 'primary',
        eventId,
        resource: event,
      })
      return response.result
    } catch (error) {
      console.error('Failed to update event:', error)
      throw error
    }
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await this.authenticate()

    try {
      await window.gapi.client.calendar.events.delete({
        calendarId: calendarId || 'primary',
        eventId,
      })
    } catch (error) {
      console.error('Failed to delete event:', error)
      throw error
    }
  }

  async quickAddEvent(calendarId: string, text: string): Promise<GoogleCalendarEvent> {
    await this.authenticate()

    try {
      const response = await window.gapi.client.calendar.events.quickAdd({
        calendarId: calendarId || 'primary',
        text,
      })
      return response.result
    } catch (error) {
      console.error('Failed to quick add event:', error)
      throw error
    }
  }

  revokeAccess(): void {
    if (this.accessToken) {
      window.google.accounts.oauth2.revoke(this.accessToken, () => {
        this.accessToken = null
        // Access revoked
      })
    }
  }
}

export const googleCalendarService = GoogleCalendarService.getInstance()
