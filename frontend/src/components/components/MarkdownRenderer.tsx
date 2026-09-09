import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom heading rendering with better spacing for dark theme
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 border-b pb-2" style={{ color: '#f9f9f9', borderColor: '#374151' }} {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-semibold mb-3 mt-5" style={{ color: '#f9f9f9' }} {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-semibold mb-2 mt-4" style={{ color: '#f9f9f9' }} {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-base font-semibold mb-2 mt-3" style={{ color: '#f9f9f9' }} {...props}>
              {children}
            </h4>
          ),
          
          // Enhanced paragraph rendering for dark theme
          p: ({ children, ...props }) => (
            <p className="leading-7 mb-4" style={{ color: '#D1D5DB' }} {...props}>
              {children}
            </p>
          ),
          
          // Enhanced list rendering for dark theme
          ul: ({ children, ...props }) => (
            <ul
              className="list-disc list-outside ml-6 my-4 space-y-1"
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol
              className="list-decimal list-outside ml-6 my-4 space-y-1"
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li style={{ color: '#D1D5DB' }} {...props}>
              {children}
            </li>
          ),
          
          // Enhanced code rendering for dark theme
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code 
                  className="px-1.5 py-0.5 rounded text-sm font-mono" 
                  style={{ backgroundColor: '#374151', color: '#FACC15' }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },

          pre: ({ children, ...props }) => (
            <pre className="p-4 rounded-lg overflow-x-auto my-4" style={{ backgroundColor: '#111827', color: '#D1D5DB' }} {...props}>
              {children}
            </pre>
          ),
          
          // Enhanced blockquote rendering for dark theme
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="border-l-4 pl-4 py-2 my-4 italic" 
              style={{ borderColor: '#60A5FA', color: '#9CA3AF', backgroundColor: '#1F2937' }}
              {...props}
            >
              {children}
            </blockquote>
          ),
          
          // Enhanced table rendering for dark theme
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border" style={{ borderColor: '#374151' }} {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th 
              className="border px-4 py-2 text-left font-semibold" 
              style={{ borderColor: '#374151', backgroundColor: '#1F2937', color: '#f9f9f9' }}
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td 
              className="border px-4 py-2" 
              style={{ borderColor: '#374151', color: '#D1D5DB' }}
              {...props}
            >
              {children}
            </td>
          ),
          
          // Enhanced link rendering for dark theme
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className="underline transition-colors"
              style={{ color: '#60A5FA' }}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              {...props}
            >
              {children}
            </a>
          ),
          
          // Enhanced strong/bold rendering for dark theme
          strong: ({ children, ...props }) => (
            <strong className="font-semibold" style={{ color: '#f9f9f9' }} {...props}>
              {children}
            </strong>
          ),
          
          // Enhanced emphasis/italic rendering for dark theme
          em: ({ children, ...props }) => (
            <em className="italic" style={{ color: '#E5E7EB' }} {...props}>
              {children}
            </em>
          ),
          
          // HR rendering for dark theme
          hr: ({ ...props }) => (
            <hr className="border-0 border-t my-8" style={{ borderColor: '#374151' }} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}