import React, { FormEvent } from 'react';
import { useConnection } from '../state/useConnection';

export const Chat: React.FC = () => {
  const { messages, sendChat, chatInput, setChatInput } = useConnection();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendChat();
  };

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 border border-neutral-800 rounded p-3 bg-neutral-950">
        {messages.map((m, i) => (
          <div key={i} className="text-sm">
            <span className="text-neutral-500">[{m.chatId || 'lobby'}]</span>{' '}
            <span>{JSON.stringify(m.payload)}</span>
          </div>
        ))}
        {messages.length === 0 && <div className="text-neutral-600 text-sm">No messages yet.</div>}
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded bg-neutral-800 px-3 py-2 outline-none focus:ring focus:ring-indigo-600"
          placeholder="Type message..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500">Send</button>
      </form>
    </div>
  );
};