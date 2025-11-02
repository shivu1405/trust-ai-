import React from 'react';
import { LightBulbIcon, ExclamationTriangleIcon, UserGroupIcon } from './icons/Icons';

// FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
// FIX: Broaden icon prop type to React.ReactElement<any> to allow passing className via cloneElement.
const TransparencySection: React.FC<{ icon: React.ReactElement<any>; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
    <div className="flex items-center gap-4 mb-3">
      <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-full">
         {React.cloneElement(icon, { className: "w-6 h-6 text-primary-600 dark:text-primary-300" })}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
    </div>
    <div className="text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
      {children}
    </div>
  </div>
);


export const Transparency: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-4">Our Commitment to Transparency</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Trust AI is a tool to assist, not replace, critical thinking. Here's how it works and what its limitations are.
        </p>
      </div>

      <div className="space-y-8">
        <TransparencySection icon={<LightBulbIcon />} title="How Trust AI Works">
          <p>
            Trust AI utilizes advanced large language models (LLMs) from Google's Gemini family. When you submit content, the AI analyzes patterns, language, and context against a vast dataset of information.
          </p>
          <p>
            For URLs, it simulates checking domain reputation signals. For images, it uses multimodal analysis to understand context and search for similar content online. The result is a synthesized report based on these AI-driven insights.
          </p>
        </TransparencySection>

        <TransparencySection icon={<ExclamationTriangleIcon />} title="AI Limitations & Bias">
          <p>
            <strong>No AI is perfect.</strong> The analysis provided is a prediction based on patterns, not a declaration of absolute truth. It can make mistakes, misinterpret nuance, or lack context on very recent events.
          </p>
          <p>
            AI models can also reflect biases present in their training data. We are committed to minimizing these biases, but users should be aware that they can exist. Always use the analysis as one of several tools in your verification process.
          </p>
        </TransparencySection>

        <TransparencySection icon={<UserGroupIcon />} title="Data Privacy & Feedback">
            <p>
                We do not store the content you analyze. Your inputs are sent to the Gemini API for processing and are governed by Google's privacy policies. 
            </p>
            <p>
                Your feedback on the accuracy of reports is valuable. It helps us understand the model's performance and work towards improving the tool's helpfulness and reliability over time.
            </p>
        </TransparencySection>
      </div>
    </div>
  );
};