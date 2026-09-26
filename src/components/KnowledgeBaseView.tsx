import React, { useState } from 'react';
import type { KnowledgeArticle } from '../types';
import { BookOpen, Copy, Check, Terminal } from 'lucide-react';

interface KnowledgeBaseViewProps {
  articles: KnowledgeArticle[];
  searchQuery: string;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  articles,
  searchQuery
}) => {
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle>(articles[0]);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div style={{ padding: '0 20px 30px' }} className="animate-fade-in">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 1fr) 2fr',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Left Column: Article List */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              Standard Operating Procedures (SOP)
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Verified troubleshooting procedures for Desktop Support technicians.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredArticles.map(article => {
              const isSelected = selectedArticle.id === article.id;
              return (
                <div
                  key={article.id}
                  id={`kb-article-item-${article.id}`}
                  onClick={() => setSelectedArticle(article)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${isSelected ? '#38bdf8' : 'var(--border-glass)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      color: '#38bdf8',
                      fontWeight: 600,
                      background: 'rgba(56, 189, 248, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {article.category}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{article.readTime}</span>
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>
                    {article.title}
                  </h4>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Article Detail Reader */}
        {selectedArticle && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  padding: '3px 10px',
                  borderRadius: '6px'
                }}>
                  {selectedArticle.category}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• {selectedArticle.readTime}</span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                {selectedArticle.title}
              </h2>
            </div>

            {/* Summary */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderLeft: '4px solid #38bdf8',
              padding: '14px 18px',
              borderRadius: '0 8px 8px 0',
              fontSize: '0.9rem',
              color: '#cbd5e1',
              lineHeight: 1.5
            }}>
              {selectedArticle.summary}
            </div>

            {/* Recommended CLI Commands */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={16} color="#38bdf8" /> Quick Diagnostic Commands
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedArticle.recommendedCommands.map((cmd, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#040711',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ color: '#38bdf8' }}>{cmd}</span>
                    <button
                      id={`copy-kb-cmd-${idx}`}
                      onClick={() => handleCopy(cmd)}
                      title="Copy command"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#cbd5e1',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedCmd === cmd ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      <span>{copiedCmd === cmd ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Steps */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
                Resolution Procedure
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedArticle.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {idx + 1}
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
