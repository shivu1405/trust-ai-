export type InputType = 'text' | 'url' | 'image' | 'file';

export interface Credibility {
    score: number; // 0-100
    confidence: number; // 0-100, how confident the AI is in its score
    status: 'Credible' | 'Mostly Credible' | 'Uncertain' | 'Potentially Misleading' | 'Not Credible';
}

export interface SentimentAnalysis {
    tone: 'Neutral' | 'Positive' | 'Negative' | 'Objective' | 'Biased' | 'Emotionally Charged' | 'Sensationalist';
    bias: 'No significant bias detected' | 'Left-leaning' | 'Right-leaning' | 'Centrist' | 'Pro-corporate' | 'Anti-corporate' | string;
}

export interface FactCheck {
    claim: string;
    finding: 'True' | 'Mostly True' | 'Mixture' | 'Mostly False' | 'False' | 'Unproven' | 'Misleading';
    source: string; // e.g., "Snopes", "Associated Press", "Reuters"
    url: string;
}

export interface SourceAnalysis {
    type: 'Domain' | 'Image' | 'Text';
    reputation: 'High' | 'Medium' | 'Low' | 'Unknown' | 'N/A';
    details: string[]; // e.g., "Domain registered recently", "No clear authorship", "Image appears authentic"
}

export interface ReferencedSource {
    name: string;
    url: string;
    status: 'Verified' | 'Unverified' | 'Potentially Biased';
    trust_score: number; // A score from 0 to 100
    last_updated?: string; // e.g., "2023-10-27"
}

export interface ReportData {
    credibility: Credibility;
    summary: {
        overview: string;
        explanation: string; // Detailed reasoning for the flags/score
    };
    sentiment_analysis: SentimentAnalysis;
    fact_checks: FactCheck[];
    rewritten_text: string | null; // A rewritten, neutral version of the text
    source_analysis: SourceAnalysis;
    referenced_sources: ReferencedSource[];
}


export type AnalysisInput = {
  type: 'text' | 'url' | 'file';
  content: string;
} | {
  type: 'image';
  content: string; // base64
  mimeType: string;
};

export type AnalysisResult = {
  report: ReportData | null;
  error: string | null;
};

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

export interface NavAction {
    action: 'navigate' | 'toggle_theme' | 'set_input_type' | 'answer' | 'unknown';
    value: {
        target?: string; // For navigate, set_input_type
        response?: string; // For answer
    };
}

export interface HistoryItem {
    id: number; // timestamp
    inputSummary: string; // e.g., "Text: 'The sky is...'", "URL: example.com"
    report: ReportData;
}