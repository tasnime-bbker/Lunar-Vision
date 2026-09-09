export function ChatSection({ messages, loading }) {
  return (
    <section className="chat-panel glass-panel">
      <div className="section-heading">
        <span className="section-tag">Conversation</span>
        <h2>Assistant thread</h2>
      </div>
      <div className="message-list">
        {messages.length === 0 ? (
          <p className="empty-state">
            Start by uploading a file or asking for content, analysis, automation, or support.
          </p>
        ) : (
          messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`message message--${message.role}`}>
              <strong>{message.role === 'user' ? 'You' : 'Agent'}</strong>
              <p>{message.content}</p>
            </article>
          ))
        )}
        {loading ? <p className="empty-state">Processing request...</p> : null}
      </div>
    </section>
  );
}
