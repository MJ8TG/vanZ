interface Props {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalPageWrapper({ title, lastUpdated, children }: Props) {
  return (
    <div className="min-h-screen bg-vanz-ice pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-vanz-navy text-white px-8 py-10 md:py-16 text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-4">{title}</h1>
          <p className="text-vanz-teal/80 font-medium">Dernière mise à jour : {lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="px-8 py-10 md:p-12 prose prose-slate max-w-none 
          prose-headings:text-vanz-navy prose-h2:text-2xl prose-h2:font-bold prose-h2:border-b prose-h2:pb-2 prose-h2:mt-10
          prose-h3:text-xl prose-h3:font-bold prose-h3:mt-8
          prose-p:text-gray-600 prose-p:leading-relaxed
          prose-a:text-vanz-teal hover:prose-a:text-vanz-navy prose-a:transition-colors
          prose-li:text-gray-600 prose-li:marker:text-vanz-teal"
        >
          {children}
        </div>

      </div>
    </div>
  );
}
