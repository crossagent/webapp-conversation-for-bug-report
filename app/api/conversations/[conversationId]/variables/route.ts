import { NextRequest, NextResponse } from 'next/server';
import { client, getInfo } from '@/app/api/utils/common';
import { API_URL, API_KEY } from '@/config'; // Import API_URL and API_KEY for direct use

// Define the structure of the parameters for the new method
interface ConversationVariablesParams {
  user: string;
  limit?: number;
  last_id?: string;
}

// Extend the ChatClient type definition locally if necessary, or use 'any' for simplicity here
interface ExtendedChatClient extends import('dify-client').ChatClient {
  getConversationVariables?: (conversationId: string, params: ConversationVariablesParams) => Promise<any>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const { conversationId } = params;
  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');
  const last_id = searchParams.get('last_id'); // Optional
  let limit = parseInt(searchParams.get('limit') || '20', 10);

  // Validate limit
  if (isNaN(limit) || limit < 1) {
    limit = 1;
  } else if (limit > 100) {
    limit = 100;
  }

  if (!user) {
    return NextResponse.json({ error: 'Missing user parameter' }, { status: 400 });
  }

  if (!conversationId) {
    return NextResponse.json({ error: 'Missing conversationId parameter' }, { status: 400 });
  }

  try {
    const { sessionId } = getInfo(request); // Get session ID for potential cookie setting

    const extendedClient = client as ExtendedChatClient;

    // Dynamically add getConversationVariables to the client instance if it doesn't exist
    if (typeof extendedClient.getConversationVariables !== 'function') {
      extendedClient.getConversationVariables = async function (
        convId: string,
        queryParams: ConversationVariablesParams
      ): Promise<any> {
        // 'this' should refer to the ChatClient instance (extendedClient)
        // Access baseUrl and apiKey from the instance itself.
        // The ChatClient from 'dify-client' stores these as public properties.
        const baseUrl = (this as any).baseUrl || API_URL;
        const apiKey = (this as any).apiKey || API_KEY;

        if (!baseUrl) {
          throw new Error('API base URL is not configured on the client instance.');
        }
        if (!apiKey) {
          throw new Error('API key is not configured on the client instance.');
        }

        const apiPath = `/conversations/${convId}/variables`;
        const requestUrl = new URL(`${baseUrl}${apiPath}`);
        
        requestUrl.searchParams.append('user', queryParams.user);
        if (queryParams.limit !== undefined) {
          requestUrl.searchParams.append('limit', queryParams.limit.toString());
        }
        if (queryParams.last_id) {
          requestUrl.searchParams.append('last_id', queryParams.last_id);
        }

        const response = await fetch(requestUrl.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          console.error('Dify API error inside dynamically added method:', errorData);
          // Rethrow to be caught by the outer try-catch block
          throw new Error(`Dify API Error: ${response.status} ${errorData.message || response.statusText}`);
        }
        return await response.json();
      };
    }

    const data = await extendedClient.getConversationVariables(conversationId, {
      user,
      limit,
      last_id: last_id || undefined, // Ensure last_id is undefined if null/empty
    });

    const nextResponse = NextResponse.json(data);

    // Set session cookie using sessionId from getInfo
    // This follows the spirit of "ensure using setSession to handle session"
    // common.ts's setSession returns a header object, not directly usable here.
    // Instead, we use NextResponse.cookies.set for modern Next.js route handlers.
    if (sessionId) {
      nextResponse.cookies.set('session_id', sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        // secure: process.env.NODE_ENV === 'production', // Recommended for production
      });
    }
    
    return nextResponse;

  } catch (error: any) {
    console.error('Error in GET /api/conversations/[conversationId]/variables:', error);
    // If the error is from our dynamically added method, it might already be formatted.
    // Otherwise, provide a generic message.
    const message = error.message || 'Failed to fetch conversation variables';
    const status = error.message && error.message.includes("Dify API Error") 
                   ? (parseInt(error.message.split(' ')[3]) || 500) 
                   : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
