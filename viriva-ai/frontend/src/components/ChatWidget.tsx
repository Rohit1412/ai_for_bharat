import React, { useState } from 'react';
import { Send, Loader, X } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'viriva';
  timestamp: Date;
}

interface ChatWidgetProps {
  onClose?: () => void;
}

const SAMPLE_QUERIES = [
  'Cheapest way to reduce methane by 20% in Raichur?',
  'What is the ROI on solar agri-pumps?',
  'How do I adopt Direct Seeded Rice?',
  'Best intervention for water stress?',
];

export function ChatWidget({ onClose }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am Viriva AI, your climate action coordinator. I can help you understand interventions, calculate impacts, and create action plans in English and Kannada. What would you like to know?',
      sender: 'viriva',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      const virivaMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I understand you are asking: "${text}". In the full deployment, this would connect to AWS Bedrock Claude 3.5 Sonnet for multi-language responses and scenario analysis. For now, I can help you navigate the dashboard and explore recommendations.`,
        sender: 'viriva',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, virivaMessage]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-gradient-to-br from-[#1e2937] to-[#0f172a] border border-[#22c55e]/30 rounded-2xl overflow-hidden shadow-2xl shadow-[#22c55e]/20 flex flex-col z-40 md:w-96 sm:w-80">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#22c55e] to-[#86efac] text-[#0f172a] p-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Ask Viriva</h3>
          <p className="text-xs opacity-75">AI Climate Coordinator</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-lg transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-lg p-3 ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-[#22c55e] to-[#86efac] text-[#0f172a] font-medium'
                  : 'bg-[#1a2540] border border-[#22c55e]/30 text-[#cbd5e1]'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1a2540] border border-[#22c55e]/30 rounded-lg p-3">
              <Loader className="w-5 h-5 text-[#22c55e] animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sample Queries */}
      {messages.length === 1 && (
        <div className="px-4 py-3 border-t border-[#22c55e]/20 bg-[#0f172a]/50 space-y-2">
          <p className="text-[#94a3b8] text-xs font-semibold">Try asking:</p>
          <div className="space-y-1">
            {SAMPLE_QUERIES.map((query, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(query)}
                className="w-full text-left text-xs text-[#cbd5e1] hover:text-[#22c55e] p-2 hover:bg-[#1e2937] rounded transition-all"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-[#0f172a] border-t border-[#22c55e]/20 p-3 flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about climate actions..."
          className="flex-1 bg-[#1e2937] border border-[#22c55e]/30 rounded-lg px-3 py-2 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-[#22c55e] transition-all"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputText.trim()}
          className="p-2 bg-gradient-to-r from-[#22c55e] to-[#86efac] text-[#0f172a] rounded-lg hover:shadow-lg hover:shadow-[#22c55e]/50 disabled:opacity-50 transition-all"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
