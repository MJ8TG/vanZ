"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import JsonLd from "./JsonLd";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  title: string;
  items: FaqItem[];
}

export default function FaqSection({ title, items }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Generate FAQPage JSON-LD schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-12 px-4">
      <JsonLd data={faqSchema} />
      
      <h2 className="text-3xl font-black text-center mb-8 text-vanz-navy dark:text-white">
        {title}
      </h2>
      
      <div className="space-y-4">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          
          return (
            <div 
              key={index} 
              className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-white/5 transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                aria-expanded={isOpen ? "true" : "false"}
              >
                <span className="font-bold text-lg text-vanz-navy dark:text-white">
                  {item.question}
                </span>
                <span className="flex-shrink-0 ml-4 text-vanz-teal">
                  {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </span>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-5 pt-0 text-gray-600 dark:text-white/70 leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
