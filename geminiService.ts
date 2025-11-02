import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisInput, ReportData, ChatMessage, NavAction } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        credibility: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER, description: "A credibility score from 0 to 100." },
                confidence: { type: Type.NUMBER, description: "The AI's confidence in its score, from 0 to 100." },
                status: { type: Type.STRING, enum: ['Credible', 'Mostly Credible', 'Uncertain', 'Potentially Misleading', 'Not Credible'] },
            },
            required: ["score", "confidence", "status"],
        },
        summary: {
            type: Type.OBJECT,
            properties: {
                overview: { type: Type.STRING, description: "A concise, one-paragraph overview of the analysis." },
                explanation: { type: Type.STRING, description: "A detailed explanation of why the content was flagged, citing specific examples like unverified sources, exaggerated claims, or emotional tone." },
            },
            required: ["overview", "explanation"],
        },
        sentiment_analysis: {
            type: Type.OBJECT,
            properties: {
                tone: { type: Type.STRING, enum: ['Neutral', 'Positive', 'Negative', 'Objective', 'Biased', 'Emotionally Charged', 'Sensationalist'] },
                bias: { type: Type.STRING, description: "Describe any detected political, corporate, or other bias. E.g., 'Left-leaning', 'No significant bias detected'." },
            },
            required: ["tone", "bias"],
        },
        fact_checks: {
            type: Type.ARRAY,
            description: "A list of verifiable claims from the text and their fact-check results. Simulate this using general knowledge if external tools aren't available.",
            items: {
                type: Type.OBJECT,
                properties: {
                    claim: { type: Type.STRING, description: "The specific claim being checked." },
                    finding: { type: Type.STRING, enum: ['True', 'Mostly True', 'Mixture', 'Mostly False', 'False', 'Unproven', 'Misleading'] },
                    source: { type: Type.STRING, description: "The reputable source for the fact-check (e.g., 'Reuters', 'Associated Press')." },
                    url: { type: Type.STRING, description: "A URL to the fact-check article." },
                },
                required: ["claim", "finding", "source", "url"],
            },
        },
        rewritten_text: {
            type: Type.STRING,
            description: "If the original text is biased or misleading, provide a rewritten, neutral, and fact-based version. If not applicable, return null."
        },
        source_analysis: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['Domain', 'Image', 'Text'] },
                reputation: { type: Type.STRING, enum: ['High', 'Medium', 'Low', 'Unknown', 'N/A'] },
                details: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "For URLs, list details like domain reputation, age, and past reliability. For images, mention reverse search results or signs of manipulation. For text, simply state 'User-provided text'."
                },
            },
            required: ["type", "reputation", "details"],
        },
        referenced_sources: {
            type: Type.ARRAY,
            description: "A list of key sources consulted to make this credibility assessment, with a trust score and status for each.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the source website or organization." },
                    url: { type: Type.STRING, description: "The direct URL to the source." },
                    status: { type: Type.STRING, enum: ['Verified', 'Unverified', 'Potentially Biased'], description: "The verification status of this source."},
                    trust_score: { type: Type.NUMBER, description: "A score from 0-100 representing the trustworthiness of this specific source."},
                    last_updated: { type: Type.STRING, description: "The last updated date of the source, if available (YYYY-MM-DD). Null otherwise."}
                },
                required: ["name", "url", "status", "trust_score"],
            }
        }
    },
    required: ["credibility", "summary", "sentiment_analysis", "fact_checks", "rewritten_text", "source_analysis", "referenced_sources"],
};

const systemInstruction = `You are "Trust AI," a world-class misinformation and credibility analyst. Your task is to perform a deep analysis of the provided content and return a comprehensive credibility assessment in JSON format.
- Evaluate content for factual accuracy, logical fallacies, emotional manipulation, and source reliability.
- For URLs, analyze domain reputation, registration age, and past reliability signals.
- For images, perform contextual analysis and look for signs of digital manipulation.
- Identify specific claims and fact-check them against reliable, neutral sources.
- **CRITICAL**: In the 'referenced_sources' field, you MUST list the top 2-4 primary, authoritative sources (like major news outlets, fact-checking sites, or scientific bodies) you used to verify the information. For each source, you must provide a verification 'status', a 'trust_score' (0-100), and its 'last_updated' date if available.
- Detect sentiment, tone, and any underlying biases (political, commercial, etc.).
- If the text is problematic, provide a rewritten, neutral version.
- Adhere STRICTLY to the provided JSON schema. Your entire response must be a single, valid JSON object with no markdown, backticks, or other text.`;

export const analyzeContent = async (input: AnalysisInput): Promise<ReportData> => {
    try {
        let contents: any;
        let model: string;

        if (input.type === 'image') {
            model = 'gemini-2.5-flash-image';
            contents = {
                parts: [
                    { inlineData: { data: input.content, mimeType: input.mimeType } },
                    { text: "Analyze the credibility and context of this image. Look for signs of manipulation, check for its origin, and assess the context in which it's presented. Provide a full credibility report." },
                ],
            };
        } else {
            model = 'gemini-2.5-flash';
            let promptText = '';
            if (input.type === 'url') {
                promptText = `Analyze the credibility of the content at this URL: ${input.content}`;
            } else if (input.type === 'file') {
                promptText = 'Analyze the credibility of the following file content:\n\n' + input.content;
            } else {
                promptText = 'Analyze the credibility of the following text:\n\n' + input.content;
            }
            contents = promptText;
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const text = response.text.trim();
        const result = JSON.parse(text);
        
        if (result && result.credibility && result.summary) {
            if (result.rewritten_text === "") {
                result.rewritten_text = null;
            }
            // Ensure referenced_sources is always an array
            if (!result.referenced_sources) {
                result.referenced_sources = [];
            }
            return result as ReportData;
        } else {
            throw new Error("Invalid response format from AI model.");
        }
    } catch (error) {
        console.error("Error analyzing content with Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get analysis from AI: ${error.message}`);
        }
        throw new Error("An unknown error occurred during AI analysis.");
    }
};


export const getChatResponse = async (history: ChatMessage[], report: ReportData): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are a helpful AI assistant for the "Trust AI" platform. The user has just received the following analysis report. Your job is to answer their follow-up questions about this specific report. Be concise and helpful. Do not mention that you are an AI.
            
            REPORT CONTEXT:
            ${JSON.stringify(report, null, 2)}`,
        },
    });

    const lastMessage = history[history.length - 1];
    
    try {
        const response = await chat.sendMessage({ message: lastMessage.text });
        return response.text;
    } catch (error) {
        console.error("Error in follow-up chat:", error);
        return "Sorry, I encountered an error. Please try again.";
    }
};

const navSchema = {
    type: Type.OBJECT,
    properties: {
        action: { type: Type.STRING, enum: ['navigate', 'toggle_theme', 'set_input_type', 'answer', 'unknown'] },
        value: { 
            type: Type.OBJECT,
            properties: {
                target: { type: Type.STRING, description: "For 'navigate', one of ['analyzer', 'learn', 'transparency', 'history']. For 'set_input_type', one of ['text', 'url', 'image', 'file']. Otherwise, null." },
                response: { type: Type.STRING, description: "For 'answer', the generated text response to the user's question. Otherwise, null."}
            }
        }
    },
    required: ['action', 'value']
};

export const interpretNavCommand = async (command: string): Promise<NavAction> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Interpret the user's command: "${command}" and map it to a specific action or answer the question.`,
            config: {
                systemInstruction: `You are a helpful assistant for the "Trust AI" app. Your job is to interpret user requests. You have two modes: command interpretation and direct answering. Your response MUST be a JSON object adhering to the schema.

1.  **Command Interpretation:** If the user's request is a command to control the app, map it to the correct action and target.
    - "toggle dark mode" -> { "action": "toggle_theme", "value": {} }
    - "go to the learn page" -> { "action": "navigate", "value": { "target": "learn" } }
    - "show my history" -> { "action": "navigate", "value": { "target": "history" } }
    - "analyze a url" -> { "action": "set_input_type", "value": { "target": "url" } }

2.  **Direct Answering:** If the user asks a question about the app itself, set the action to "answer" and provide a concise, helpful response in the "response" field.
    - "how does this work?" -> { "action": "answer", "value": { "response": "I analyze text, URLs, images, or files using an AI model to assess credibility, detect bias, and check for misinformation." } }
    - "what is this app?" -> { "action": "answer", "value": { "response": "I'm Trust AI, a platform to help you detect misinformation and analyze the credibility of content." } }
    - "who made you?" -> { "action": "answer", "value": { "response": "I am an AI-powered application designed to promote media literacy and critical thinking." } }

3.  **Unknown:** If the command is unclear or unrelated to the app's function, use action "unknown".`,
                responseMimeType: "application/json",
                responseSchema: navSchema,
            },
        });
        
        const text = response.text.trim();
        return JSON.parse(text) as NavAction;
    } catch (error) {
        console.error("Error interpreting nav command:", error);
        return { action: 'unknown', value: {} };
    }
};