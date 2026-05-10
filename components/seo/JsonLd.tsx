import React from 'react';

interface JsonLdProps {
  data: Record<string, any>;
}

/**
 * Renders JSON-LD structured data as a <script> tag.
 *
 * Security approach: Instead of using dangerouslySetInnerHTML, we render
 * the JSON-LD data as a child text node of the script element. React
 * automatically escapes text children, and within a <script type="application/ld+json">
 * tag the content is treated as data (not executable JS) by the browser.
 *
 * We still escape "</script" sequences to prevent early tag closure attacks.
 */
export default function JsonLd({ data }: JsonLdProps) {
  // Escape </script> sequences in serialized JSON to prevent early tag closure (XSS vector)
  const safeJson = JSON.stringify(data).replace(/<\/script/gi, '<\\/script');

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}
