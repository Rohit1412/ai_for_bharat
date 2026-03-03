import { useState, useRef, useEffect } from "react";
import { Brain, Send, Loader2, X, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiChat, getActiveAIService } from "@/lib/aiService";

type QAMessage = { role: "user" | "assistant"; content: string };

interface AIChatPanelProps {
  context: string;
}

const AIChatPanel = ({ context }: AIChatPanelProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const provider = getActiveAIService();

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: QAMessage = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const answer = await aiChat(
        input,
        context,
        newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
      );
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            provider === "none"
              ? "AI not configured. Add VITE_GEMINI_API_KEY or VITE_AWS_API_URL to your .env file."
              : `Error: ${e.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Brain className="w-6 h-6" />
        </button>
      )}

      {/* Side Panel */}
      {open && (
        <div className="fixed top-0 right-0 z-50 h-full w-full sm:w-[400px] bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">AI Data Analyst</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary">Live</span>
              {provider === "gemini" && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-400 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> Gemini
                </span>
              )}
              {provider === "bedrock" && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/15 text-orange-400 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> AWS Bedrock
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">Ask anything about your data</p>
                <p className="text-xs text-muted-foreground/70">Try: "Which region has the highest emissions?"</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Analyzing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Ask about emissions, trends..."
                className="flex-1 bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon" className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatPanel;
