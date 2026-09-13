'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PropertyCard } from '@/components/search/PropertyCard';
import { submitAISearch } from '@/app/actions/ai-search';
import { trackClientActivity } from '@/lib/analytics/activity';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  results?: any[];
  recommendations?: any[];
  rawIntent?: any;
}

export function AISearchInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! I can help you find your ideal property. Describe what you are looking for, for example: "Find me a 3 BHK villa in Gachibowli under 1.5 crore."',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextState, setContextState] = useState<any>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput('');

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', content: query }]);
    setIsLoading(true);

    trackClientActivity({
      eventName: 'ai_query_submitted',
      metadata: { inputLength: query.length },
    });

    try {
      const response: any = await submitAISearch(query, contextState);

      if (response.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'system',
            content:
              'Sorry, I encountered an error or the AI service is currently unavailable. You can try again or use normal search.',
          },
        ]);
      } else if (response.status === 'CLARIFICATION') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: response.clarification || 'Could you please clarify?',
          },
        ]);
        setContextState({
          previousIntent: response.rawIntent,
        });
      } else if (response.status === 'RESULTS') {
        let content = '';
        if (response.total > 0) {
          content = `I found ${response.total} ${response.total === 1 ? 'property' : 'properties'} matching your criteria.`;
        } else {
          content =
            "I couldn't find any exact matches for your criteria, but here are some alternatives you might like.";
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content,
            results: response.results,
            recommendations: response.recommendations,
            rawIntent: response.rawIntent,
          },
        ]);

        setContextState({
          previousIntent: response.rawIntent,
          lastResultCount: response.total,
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'system',
          content: 'An unexpected error occurred.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col rounded-xl border border-border bg-white shadow-xl">
      {/* Header */}
      <div className="border-b border-border bg-surface-muted p-4">
        <h2 className="text-xl font-semibold text-brand-navy">AI Property Search</h2>
        <p className="text-sm text-text-muted">Describe your dream home in your own words.</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user'
                  ? 'bg-brand-navy text-white rounded-br-none'
                  : msg.role === 'system'
                    ? 'bg-red-50 text-red-600 rounded-bl-none border border-red-200'
                    : 'bg-surface-muted text-text-primary rounded-bl-none'
              }`}
            >
              <p>{msg.content}</p>

              {/* Render Properties if any */}
              {msg.results && msg.results.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {msg.results.slice(0, 4).map((prop) => (
                    <div key={prop.id} className="w-full max-w-[280px]">
                      <PropertyCard property={prop} />
                    </div>
                  ))}
                </div>
              )}

              {/* Render Recommendations if any */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 font-medium">Suggested Alternatives:</p>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {msg.recommendations[0].items.slice(0, 4).map((item: any) => (
                      <div key={item.property.id} className="w-full max-w-[280px]">
                        <PropertyCard property={item.property} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-muted text-text-muted rounded-2xl rounded-bl-none p-4 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-brand-orange"></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-brand-orange"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-brand-orange"
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your search (e.g. '3 BHK under 1.5Cr in Miyapur')"
            className="flex-1 rounded-lg border border-border p-3 focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
            disabled={isLoading}
          />
          <Button type="submit" variant="primary" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
