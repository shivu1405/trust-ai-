import React, { useState, useRef } from 'react';
import { ReportData, ChatMessage, ReferencedSource } from '../types';
import { getChatResponse } from '../services/geminiService';
import { 
    ShieldCheckIcon, LightBulbIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, LinkIcon,
    ArrowPathIcon, ArrowDownTrayIcon, HandThumbUpIcon, HandThumbDownIcon, PaperAirplaneIcon,
    CheckCircleIcon, XCircleIcon, InformationCircleIcon
} from './icons/Icons';

interface ReportProps {
    report: ReportData;
    onReset: () => void;
}

const getStatusStyles = (status: ReportData['credibility']['status']) => {
    switch (status) {
        case 'Credible':
        case 'Mostly Credible':
            return { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-300', border: 'border-green-500', score: 'text-green-500' };
        case 'Uncertain':
            return { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-600 dark:text-yellow-300', border: 'border-yellow-500', score: 'text-yellow-500' };
        case 'Potentially Misleading':
        case 'Not Credible':
            return { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-300', border: 'border-red-500', score: 'text-red-500' };
        default:
            return { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-500', score: 'text-slate-500' };
    }
};

const Card: React.FC<{ icon: React.ReactElement<any>, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg h-full">
        <div className="flex items-center gap-3 mb-4">
            {React.cloneElement(icon, { className: "w-6 h-6 text-primary-500"})}
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
        <div className="space-y-3 text-slate-600 dark:text-slate-300">{children}</div>
    </div>
);

const SourceEvaluationCard: React.FC<{sources: ReferencedSource[]}> = ({ sources }) => {
    const getStatusInfo = (status: ReferencedSource['status']) => {
        switch (status) {
            case 'Verified':
                return { Icon: CheckCircleIcon, color: 'text-green-500' };
            case 'Unverified':
                return { Icon: XCircleIcon, color: 'text-red-500' };
            case 'Potentially Biased':
                return { Icon: InformationCircleIcon, color: 'text-yellow-500' };
            default:
                return { Icon: InformationCircleIcon, color: 'text-slate-500' };
        }
    };
    
    const getScoreColor = (score: number) => {
        if (score >= 75) return 'bg-green-500';
        if (score >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    }

    return (
        <Card icon={<LinkIcon />} title="Source Evaluation">
            <div className="space-y-4">
                {sources.map((source, i) => {
                    const { Icon, color } = getStatusInfo(source.status);
                    return (
                        <div key={i} className="border-b border-slate-200 dark:border-slate-700/50 pb-3 last:border-b-0 last:pb-0">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline break-words">
                                        {source.name}
                                    </a>
                                     <div className="flex items-center gap-2 mt-1">
                                        <Icon className={`w-4 h-4 ${color}`} />
                                        <span className={`text-xs font-medium ${color}`}>{source.status}</span>
                                    </div>
                                </div>
                                <div className="ml-4 text-right">
                                     <span className="font-bold text-slate-700 dark:text-slate-200">{source.trust_score}</span>
                                     <span className="text-xs text-slate-500">/100</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                                <div className={`${getScoreColor(source.trust_score)} h-1.5 rounded-full`} style={{ width: `${source.trust_score}%` }}></div>
                            </div>
                             {source.last_updated && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">Updated: {source.last_updated}</p>}
                        </div>
                    );
                })}
            </div>
        </Card>
    )
}

const FollowUpAssistant: React.FC<{ report: ReportData }> = ({ report }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    React.useEffect(scrollToBottom, [messages]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const assistantResponse = await getChatResponse(newMessages, report);
            const assistantMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', text: assistantResponse };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', text: "Sorry, I couldn't get a response. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-8 bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-lg">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 text-center">Follow-up Assistant</h3>
            <div className="h-64 overflow-y-auto pr-2 space-y-4">
                {messages.length === 0 && <p className="text-center text-slate-500">Ask a question about the report...</p>}
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-700'}`}>
                           <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && <div className="flex justify-start"><div className="p-3 rounded-lg bg-white dark:bg-slate-700"><span className="italic">Assistant is thinking...</span></div></div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="e.g., Explain the bias in more detail"
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500"
                    disabled={isLoading}
                />
                <button type="submit" className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:bg-slate-400" disabled={isLoading}>
                    <PaperAirplaneIcon className="w-5 h-5"/>
                </button>
            </form>
        </div>
    );
};

export const Report: React.FC<ReportProps> = ({ report, onReset }) => {
    const styles = getStatusStyles(report.credibility.status);

    const downloadReport = () => {
        let content = `TRUST AI CREDIBILITY REPORT\n=========================\n\n`;
        content += `STATUS: ${report.credibility.status} (Score: ${report.credibility.score}/100, Confidence: ${report.credibility.confidence}%)\n\n`;
        content += `SUMMARY\n-------\n${report.summary.overview}\n\nEXPLANATION\n-----------\n${report.summary.explanation}\n\n`;
        content += `SENTIMENT & BIAS\n----------------\nTone: ${report.sentiment_analysis.tone}\nBias: ${report.sentiment_analysis.bias}\n\n`;
        content += `FACT CHECKS (${report.fact_checks.length})\n-------------\n`;
        report.fact_checks.forEach(fc => {
            content += `- Claim: ${fc.claim}\n  Finding: ${fc.finding} (Source: ${fc.source})\n  Link: ${fc.url}\n\n`;
        });
        if (report.rewritten_text) {
            content += `SUGGESTED NEUTRAL REWRITE\n--------------------------\n${report.rewritten_text}\n\n`;
        }
        content += `SOURCE ANALYSIS\n---------------\nType: ${report.source_analysis.type}\nReputation: ${report.source_analysis.reputation}\nDetails: ${report.source_analysis.details.join(', ')}\n\n`;
        content += `SOURCE EVALUATION\n------------------\n`;
        report.referenced_sources.forEach(src => {
            content += `- ${src.name} | Status: ${src.status}, Score: ${src.trust_score}/100\n  Link: ${src.url}\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'TrustAI_Report.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className={`text-center p-6 rounded-t-lg ${styles.bg}`}>
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${styles.bg} ${styles.text} border ${styles.border}`}>
                    {report.credibility.status}
                </span>
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-4">Credibility Report</h1>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-b-lg shadow-lg border-x border-b border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Left Column */}
                    <div className="lg:col-span-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg">
                        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4">Credibility Score</h2>
                        <div className="relative w-40 h-40">
                             <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path className="text-slate-200 dark:text-slate-700"
                                    d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="currentColor" strokeWidth="3" />
                                <path className={styles.score}
                                    strokeDasharray={`${report.credibility.score}, 100`}
                                    d="M18 2.0845
                                    a 15.9155 15.9155 0 0 1 0 31.831
                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" transform="rotate(-90 18 18)" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className={`text-5xl font-black ${styles.score}`}>{report.credibility.score}</p>
                                <p className="text-slate-500 dark:text-slate-400">out of 100</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Confidence: {report.credibility.confidence}%</p>
                    </div>
                    {/* Right Column */}
                    <div className="lg:col-span-2">
                        <Card icon={<LightBulbIcon />} title="Summary">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">{report.summary.overview}</p>
                            <p className="text-sm">{report.summary.explanation}</p>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <Card icon={<ExclamationTriangleIcon />} title="Sentiment & Bias">
                        <p><strong>Tone:</strong> <span className={`${styles.text} font-semibold`}>{report.sentiment_analysis.tone}</span></p>
                        <p><strong>Detected Bias:</strong> {report.sentiment_analysis.bias}</p>
                    </Card>
                     <Card icon={<MagnifyingGlassIcon />} title="Source Analysis">
                        <p><strong>Type:</strong> {report.source_analysis.type}</p>
                        <p><strong>Reputation:</strong> {report.source_analysis.reputation}</p>
                        <ul className="list-disc list-inside text-sm">
                            {report.source_analysis.details.map((detail, i) => <li key={i}>{detail}</li>)}
                        </ul>
                    </Card>
                </div>

                {report.fact_checks.length > 0 && (
                     <div className="mb-8">
                        <Card icon={<ShieldCheckIcon />} title="Fact-Check Results">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 dark:bg-slate-900 text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-2">Claim</th>
                                            <th className="px-4 py-2">Finding</th>
                                            <th className="px-4 py-2">Source</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.fact_checks.map((fc, i) => (
                                            <tr key={i} className="border-b dark:border-slate-700/50">
                                                <td className="px-4 py-2 italic">"{fc.claim}"</td>
                                                <td className="px-4 py-2 font-semibold">{fc.finding}</td>
                                                <td className="px-4 py-2"><a href={fc.url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">{fc.source}</a></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}
                
                {report.rewritten_text && (
                    <div className="mb-8">
                         <Card icon={<ShieldCheckIcon />} title="Suggested Neutral Rewrite">
                            <p className="italic">{report.rewritten_text}</p>
                        </Card>
                    </div>
                )}

                {report.referenced_sources.length > 0 && (
                    <div className="mb-8">
                        <SourceEvaluationCard sources={report.referenced_sources} />
                    </div>
                )}
                
                <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-8 space-y-6">
                    <div>
                         <p className="text-sm text-slate-500 mb-2">Was this analysis helpful?</p>
                         <div className="flex justify-center gap-3">
                            <button className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors">
                                <HandThumbUpIcon className="w-4 h-4" /> Accurate
                            </button>
                            <button className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors">
                                <HandThumbDownIcon className="w-4 h-4" /> Inaccurate
                            </button>
                         </div>
                    </div>
                     <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={onReset}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-transform hover:scale-105"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                            Analyze Another
                        </button>
                        <button
                            onClick={downloadReport}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-bold py-2.5 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 transition-colors"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                           Download Report
                        </button>
                    </div>
                </div>

                <FollowUpAssistant report={report} />
            </div>
        </div>
    );
};