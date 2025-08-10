"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm here to help explain your genetic analysis results. You can ask me about:\n\n• Protein structures and functions\n• Genetic variants and their effects\n• Polygenic risk scores\n• Any technical terms you see",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Try to call the LLM API
      const response = await fetch('http://localhost:8001/explain-concept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          concept: message,
          expertise_level: 'beginner'
        })
      });

      let aiResponse;
      if (response.ok) {
        const data = await response.json();
        aiResponse = data.explanation;
      } else {
        throw new Error('API not available');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      // Fallback responses when API is not available
      const fallbackResponses: Record<string, string> = {
        'protein': 'Proteins are large molecules made of amino acids that perform specific functions in your body. The 3D structure you see determines how the protein works.',
        'variant': 'A genetic variant is a difference in your DNA compared to the reference genome. Most variants are harmless, but some can affect protein function.',
        'alphafold': 'AlphaFold is an AI system that predicts protein structures with remarkable accuracy. The structures shown here are AI predictions.',
        'molstar': 'Mol* is a 3D molecular viewer that lets you explore protein structures interactively. You can rotate, zoom, and highlight different parts.',
        'amino acid': 'Amino acids are the building blocks of proteins. There are 20 different types, each with unique properties that affect protein function.',
        'pgs': 'Polygenic Risk Scores (PGS) estimate your genetic predisposition to traits by combining effects from many genetic variants.',
        'helix': 'Alpha helices are spiral protein structures that provide stability and function. They are one of the most common protein secondary structures.',
        'sheet': 'Beta sheets are extended protein structures formed by hydrogen bonds between protein strands. They provide structural strength.',
        'snp': 'Single Nucleotide Polymorphisms (SNPs) are the most common type of genetic variation. They occur when a single DNA base is different.',
        'chromosome': 'Chromosomes contain your DNA organized into genes. Humans have 23 pairs of chromosomes inherited from both parents.'
      };

      let aiResponse = `I'd be happy to help explain that! Based on your question about "${message}", here are some key points:

• This relates to your genetic analysis results
• The data shown comes from your uploaded genetic file
• You can explore different aspects using the cards and visualizations
• Feel free to ask more specific questions about any terms or results you see

Is there a particular aspect you'd like me to explain in more detail?`;

      const lowerMessage = message.toLowerCase();
      for (const [key, response] of Object.entries(fallbackResponses)) {
        if (lowerMessage.includes(key)) {
          aiResponse = response;
          break;
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen 
            ? 'bg-slate-600 hover:bg-slate-700' 
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-indigo-50 rounded-t-lg">
            <h3 className="font-semibold text-slate-900">AI Assistant</h3>
            <p className="text-sm text-slate-600">Ask about your genetic analysis</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div className={`text-xs mt-1 opacity-70 ${
                    message.isUser ? 'text-indigo-100' : 'text-slate-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    AI is typing...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
