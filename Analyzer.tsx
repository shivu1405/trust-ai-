import React, { useState, useEffect, useRef } from 'react';
import { analyzeContent } from '../services/geminiService';
import { AnalysisResult, InputType } from '../types';
import { DocumentTextIcon, LinkIcon, PhotoIcon, DocumentDuplicateIcon, MicrophoneIcon, StopCircleIcon } from './icons/Icons';

interface AnalyzerProps {
    onAnalysisStart: () => void;
    onAnalysisComplete: (result: AnalysisResult, inputSummary: string) => void;
    initialError: string | null;
}

export const Analyzer: React.FC<AnalyzerProps> = ({ onAnalysisStart, onAnalysisComplete, initialError }) => {
    const [inputType, setInputType] = useState<InputType>('text');
    const [inputValue, setInputValue] = useState('');
    const [fileContent, setFileContent] = useState<{name: string, content: string} | null>(null);
    const [imageFile, setImageFile] = useState<{file: File, base64: string, mimeType: string} | null>(null);
    const [error, setError] = useState<string | null>(initialError);

    // Voice typing state
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    // A ref to store the text content that existed *before* listening started.
    const textPrefixRef = useRef(''); 
    // A ref to track if the user intentionally stopped listening.
    const userStoppedRef = useRef(false);

    useEffect(() => {
        if (initialError) {
            setError(initialError);
        }
    }, [initialError]);

    // Setup Speech Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported by this browser.");
            setIsSpeechSupported(false);
            return;
        };

        setIsSpeechSupported(true);

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
            // If the user didn't manually stop it, it might be a browser timeout. Restart it.
            if (!userStoppedRef.current && recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch(e) {
                    console.error("Recognition restart failed", e);
                }
            }
        };

        recognition.onerror = (event: any) => {
            console.error(`Speech recognition error: ${event.error}`);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setError("Voice recognition permission denied. Please allow microphone access in your browser settings.");
            }
            userStoppedRef.current = true; // Stop trying to restart on error.
            setIsListening(false);
        };
        
        recognition.onresult = (event: any) => {
            // Combine all results from the current session into one string.
            const sessionTranscript = Array.from(event.results)
              .map((result: any) => result[0])
              .map((result: any) => result.transcript)
              .join('');
            
            // Update the input field with the prefix plus the new transcript.
            setInputValue(textPrefixRef.current + sessionTranscript);
        };
        
        return () => {
            if (recognitionRef.current) {
                userStoppedRef.current = true;
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, []);

    const toggleListening = () => {
        if (!isSpeechSupported || !recognitionRef.current) {
            setError("Voice recognition is not supported by your browser.");
            return;
        }

        if (isListening) {
            userStoppedRef.current = true;
            recognitionRef.current.stop();
        } else {
            userStoppedRef.current = false;
            // Before starting, save the current text as a prefix.
            // Add a space if there's already text.
            const existingText = inputValue.trim();
            textPrefixRef.current = existingText ? existingText + ' ' : '';
            try {
               recognitionRef.current.start();
            } catch (e) {
               console.error("Could not start recognition:", e);
               setError("Could not start voice recognition.");
            }
        }
    };
    
    const resetState = () => {
        setInputValue('');
        setImageFile(null);
        setFileContent(null);
        setError(null);
    };
    
    const handleTabChange = (type: InputType) => {
        setInputType(type);
        resetState();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                setError("Image file size should not exceed 4MB.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = (event.target?.result as string).split(',')[1];
                setImageFile({ file, base64, mimeType: file.type });
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                setFileContent({ name: file.name, content });
                setError(null);
            };
            reader.readAsText(file);
        } else {
            setError("Please upload a valid .txt file.");
        }
    };
    
    const getInputSummary = (): string => {
        switch(inputType) {
            case 'text':
                return `Text: "${inputValue.substring(0, 50)}..."`;
            case 'url':
                return `URL: ${inputValue}`;
            case 'image':
                return `Image: ${imageFile?.file.name || 'uploaded image'}`;
            case 'file':
                return `File: ${fileContent?.name || 'uploaded file'}`;
            default:
                return 'New Analysis';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let hasContent = false;
        if (inputType === 'image' && imageFile) hasContent = true;
        if (inputType === 'file' && fileContent) hasContent = true;
        if (['text', 'url'].includes(inputType) && inputValue.trim()) hasContent = true;

        if (!hasContent) {
            setError("Please provide content to analyze.");
            return;
        }

        onAnalysisStart();
        const summary = getInputSummary();
        
        try {
            let reportData;
            if (inputType === 'image' && imageFile) {
                reportData = await analyzeContent({ type: 'image', content: imageFile.base64, mimeType: imageFile.mimeType });
            } else if (inputType === 'file' && fileContent) {
                reportData = await analyzeContent({ type: 'file', content: fileContent.content });
            } else {
                reportData = await analyzeContent({ type: inputType as 'text' | 'url', content: inputValue });
            }
            onAnalysisComplete({ report: reportData, error: null }, summary);
        } catch (err) {
            const error = err as Error;
            onAnalysisComplete({ report: null, error: error.message || "An unexpected error occurred." }, summary);
        }
    };
    
    const renderInput = () => {
        switch (inputType) {
            case 'image':
            case 'file':
                 const isImage = inputType === 'image';
                 const acceptType = isImage ? "image/*" : ".txt";
                 const Icon = isImage ? PhotoIcon : DocumentDuplicateIcon;
                 const handler = isImage ? handleImageUpload : handleFileUpload;
                 const fileInfo = isImage ? imageFile?.file.name : fileContent?.name;

                return (
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <Icon className="mx-auto h-12 w-12 text-slate-400" />
                            <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 dark:ring-offset-slate-800 focus-within:ring-primary-500">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handler} accept={acceptType} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                             <p className="text-xs text-slate-500 dark:text-slate-500">{isImage ? "PNG, JPG up to 4MB" : "Plain text (.txt) files only"}</p>
                            {fileInfo && <p className="text-sm text-slate-700 dark:text-slate-200 pt-2">{fileInfo}</p>}
                        </div>
                    </div>
                );
            case 'url':
                return <input
                    type="url"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />;
            case 'text':
            default:
                return (
                    <div>
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Paste text, an article, or a social media post here..."
                            className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[200px]"
                        />
                        {isSpeechSupported && (
                             <div className="mt-4 flex justify-end">
                                <button 
                                    type="button" 
                                    onClick={toggleListening}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                        isListening 
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200'
                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                    aria-label={isListening ? 'Stop voice typing' : 'Start voice typing'}
                                >
                                    {isListening ? <StopCircleIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                                    <span>{isListening ? 'Stop Listening' : 'Use Voice'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                );
        }
    };
    
    const TabButton: React.FC<{type: InputType, label: string, icon: React.ReactElement<any>}> = ({type, label, icon}) => (
        <button
            onClick={() => handleTabChange(type)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                inputType === type
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
        >
            {React.cloneElement(icon, { className: 'w-5 h-5'})}
            {label}
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2">AI-Powered Misinformation Detector</h1>
                <p className="text-lg text-slate-600 dark:text-slate-300">
                    Analyze text, URLs, images, and files to assess their credibility in real-time.
                </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-center flex-wrap gap-2 mb-6">
                    <TabButton type="text" label="Text" icon={<DocumentTextIcon />} />
                    <TabButton type="url" label="URL" icon={<LinkIcon />} />
                    <TabButton type="image" label="Image" icon={<PhotoIcon />} />
                    <TabButton type="file" label="File" icon={<DocumentDuplicateIcon />} />
                </div>
                <form onSubmit={handleSubmit}>
                    {renderInput()}
                    {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
                    <div className="mt-6 text-center">
                        <button
                            type="submit"
                            className="bg-primary-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-opacity-50 transition-transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            Analyze
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};