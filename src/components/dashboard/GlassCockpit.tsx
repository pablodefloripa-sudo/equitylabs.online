import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Send, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useAIChat } from '@/hooks/useAIChat';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GlassCockpitProps {
  onClose: () => void;
}

export const GlassCockpit = ({ onClose }: GlassCockpitProps) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { isListening, toggleListening, transcript, isSupported: voiceSupported } = useVoiceCommands({
    onCommand: (command) => {
      setInputValue(command);
    }
  });
  
  const { sendMessage, isLoading: aiLoading } = useAIChat();
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  // Handle ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSend = async () => {
    if (!inputValue.trim() || aiLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');

    try {
      // Build conversation history for context
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const result = await sendMessage(currentInput, history);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-[45] flex items-center justify-center p-4"
    >
      {/* Main Glass Container - 95% coverage */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="relative w-[95%] h-[95%] rounded-3xl overflow-hidden glass-titanium border-glow-orange"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Orange glow border at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF4500] to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#FF4500]/20 to-transparent pointer-events-none" />

        {/* Chat content area */}
        <div className="absolute inset-0 flex flex-col pt-16 pb-20 px-6">
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="max-w-md"
                >
                  <h2 className="text-2xl font-display font-light text-foreground/80 mb-2">
                    Focus Mission Mode
                  </h2>
                  <p className="text-muted-foreground/60 text-sm">
                    Sistema de comunicación inmersivo activado
                  </p>
                </motion.div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl text-sm backdrop-blur-sm ${
                      msg.role === 'user'
                        ? 'bg-[#FF4500]/20 text-white/90 border border-[#FF4500]/30'
                        : 'bg-white/5 text-white/80 border border-white/10'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="chat-markdown prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed input area at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            {/* Input field */}
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              disabled={aiLoading}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white/90 text-sm font-display placeholder:text-white/30 h-10"
            />

            {/* Voice button */}
            {voiceSupported && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                className={`relative h-10 w-10 rounded-xl transition-all ${
                  isListening 
                    ? 'bg-[#FF4500]/20 text-[#FF4500] shadow-[0_0_15px_rgba(255,69,0,0.3)]' 
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-[#FF4500]"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
            )}

            {/* File upload */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            {/* Send button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim() || aiLoading}
              className="h-10 w-10 rounded-xl bg-[#FF4500]/20 text-[#FF4500] hover:bg-[#FF4500]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {aiLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
