import React from 'react';
import { useConnection } from './state/useConnection';
import { Chat } from './components/Chat';

export const App: React.FC = () => {
  const { status, id, connect, lastPong } = useConnection();

  return (
    <div className="h-full flex flex-col">
      <header className="p-3 border-b border-neutral-700 flex items-center justify-between">
        <h1 className="font-semibold">CipherChat</h1>
        <div className="text-sm space-x-3">
          <span>Status: <span className={status === 'open' ? 'text-green-400' : status === 'connecting' ? 'text-yellow-400' : 'text-red-400'}>{status}</span></span>
          {id && <span className="text-neutral-400">id {id}</span>}
          <button onClick={connect} className="px-2 py-1 bg-neutral-700 rounded hover:bg-neutral-600">Reconnect</button>
        </div>
      </header>
      <main className="flex-1"><Chat /></main>
      <footer className="p-2 text-xs text-neutral-500 border-t border-neutral-700">Proto build – encryption placeholder – do not use for secrets.</footer>
      {lastPong && <div className="fixed bottom-2 right-2 text-xs text-neutral-500">Last pong {new Date(lastPong).toLocaleTimeString()}</div>}
    </div>
  );
};