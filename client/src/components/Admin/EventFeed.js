import React from 'react';

const EventFeed = ({ events }) => {
  const getIconForMessage = (message) => {
    if (message.startsWith('🎁')) return '🎁';
    if (message.startsWith('⚡')) return '⚡';
    if (message.startsWith('👍')) return '👍';
    return '💬';
  };

  return (
    <div className="admin-section-v2 event-feed">
      <h3 className="section-title">📣 Feed de Eventos en Vivo</h3>
      <div className="event-list-container">
        {!events || events.length === 0 ? (
          <p className="text-gray-400 italic p-3">Esperando eventos...</p>
        ) : (
          <ul className="event-list">
            {events.map(event => (
              <li key={event.id} className="event-item">
                <span className="event-icon">{getIconForMessage(event.message)}</span>
                <span className="event-timestamp">{event.timestamp}</span>
                <span className="event-message">{event.message.substring(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EventFeed;