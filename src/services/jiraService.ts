import { supabase } from '../supabaseClient'

export interface JiraTicket {
  id: string
  key: string
  summary: string
  link?: string
}

export interface JiraCredentials {
  domain: string
  email: string
  token: string
}

export const fetchJiraTickets = async (
  credentials: JiraCredentials,
  jql: string = 'order by created DESC'
): Promise<JiraTicket[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('jira-proxy', {
      body: { jql },
      headers: {
        'x-jira-domain': credentials.domain,
        'x-jira-email': credentials.email,
        'x-jira-token': credentials.token,
      },
    })

    if (error) {
      console.error('Error fetching Jira tickets:', error)
      throw error
    }

    if (!data || !data.issues) {
      console.error('Invalid response from Jira API:', data)
      return []
    }

    // Transform Jira issues to our ticket format
    const tickets: JiraTicket[] = data.issues.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields?.summary || 'No summary',
      link: `https://${credentials.domain}/browse/${issue.key}`,
    }))

    return tickets
  } catch (error) {
    console.error('Failed to fetch Jira tickets:', error)
    throw error
  }
}

