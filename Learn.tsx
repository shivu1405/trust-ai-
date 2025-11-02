import React from 'react';
import { ShieldCheckIcon, EyeIcon, ChatBubbleLeftRightIcon } from './icons/Icons';

// FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
// FIX: Broaden icon prop type to React.ReactElement<any> to allow passing className via cloneElement.
const InfoCard: React.FC<{ icon: React.ReactElement<any>; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
    <div className="flex items-center gap-4 mb-3">
      <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-full">
        {React.cloneElement(icon, { className: "w-6 h-6 text-primary-600 dark:text-primary-300" })}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
    </div>
    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
      {children}
    </p>
  </div>
);

export const Learn: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-4">Understanding Misinformation</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Empower yourself with knowledge to navigate the digital world safely and critically.
        </p>
      </div>

      <div className="space-y-8">
        <InfoCard icon={<ShieldCheckIcon />} title="What is Misinformation?">
          Misinformation is false or inaccurate information that is spread, regardless of intent to deceive. It differs from disinformation, which is deliberately misleading. Both can harm public discourse and trust.
        </InfoCard>

        <InfoCard icon={<EyeIcon />} title="Common Red Flags">
          Be skeptical of emotionally charged language, sensational headlines, and claims that seem too good (or bad) to be true. Always check for sources, and be wary of content from anonymous or unverified accounts. Look for professional design and grammar; sloppy presentation can be a warning sign.
        </InfoCard>
        
        <InfoCard icon={<ChatBubbleLeftRightIcon />} title="How to Fact-Check">
            Before sharing, take a moment to verify. A simple search can often reveal if a claim has been debunked. Use reputable fact-checking websites like Snopes, PolitiFact, or the Associated Press. A reverse image search can also help verify the origin of a photo.
        </InfoCard>
      </div>
    </div>
  );
};