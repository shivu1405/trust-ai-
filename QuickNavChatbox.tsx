import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, ChevronDownIcon } from './icons/Icons';
import { interpretNavCommand } from '../services/geminiService';
import { NavAction, ChatMessage } from '../types';

interface QuickNavChatboxProps {
    onNavAction: (action: NavAction) => void;
}

export const QuickNavChatbox: React.FC<QuickNavChatboxProps> = ({ onNavAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setMessages([{ id: 'init', role: 'assistant', text: 'How can I help? (e.g., "go to learn page" or "how does this work?")' }]);
        }
    }, [isOpen]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const action = await interpretNavCommand(userMessage.text);
        
        let responseText = '';
        if (action.action === 'answer') {
            responseText = action.value.response || "I'm not sure how to answer that.";
        } else if (action.action !== 'unknown') {
            onNavAction(action);
            responseText = `Sure, I've handled that for you.`;
        } else {
            responseText = "Sorry, I didn't understand that. You can ask me to navigate to a page, toggle the theme, or ask questions about how I work.";
        }

        const assistantMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', text: responseText };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-5 right-5 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
                aria-label="Open Quick Navigation"
            >
                <ChatBubbleLeftRightIcon className="w-8 h-8" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-5 right-5 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col h-96 z-50">
            <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white">Quick Assistant</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-500 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                    <ChevronDownIcon className="w-5 h-5"/>
                </button>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-3">
                 {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-2 rounded-lg ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                           <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                 {isLoading && <div className="flex justify-start"><div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700"><span className="italic text-sm">...</span></div></div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me..." 
                    className="w-full text-sm p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:border-primary-500" 
                    disabled={isLoading}
                />
                <button type="submit" className="bg-primary-600 text-white p-2 rounded-md hover:bg-primary-700 disabled:bg-slate-400" disabled={isLoading}>
                    <PaperAirplaneIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};