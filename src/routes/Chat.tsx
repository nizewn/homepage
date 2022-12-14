import type { Component } from 'solid-js';
import { createSignal, For, onMount } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';

import Input from '../components/Input/Input';
import handleCommand from '../components/Input/command';

import io from 'socket.io-client';
const socket = io('https://chat-server-production-1aed.up.railway.app');

type Message = {
  author: string;
  message: string;
};

const gMessages: Message[] = [];

const Chat: Component = () => {
  const [connected, setConnected] = createSignal(socket.connected);
  const [messages, setMessages] = createStore<Message[]>(gMessages);
  const navigate = useNavigate();

  onMount(() => {
    socket.off('connect');
    socket.off('disconnect');
    socket.off('chat');

    socket.on('connect', () => {
      setConnected(true);
      addMessage({ author: 'connect', message: 'connected to server.' });
    });

    socket.on('disconnect', () => {
      setConnected(false);
      addMessage({ author: 'disconnect', message: 'disconnected from server.' });
    });

    socket.on('chat', (message) => {
      addMessage({ author: 'nize', message });
    });
  });

  function addMessage(m: Message) {
    setMessages(
      produce((messages) => {
        messages.push(m);
      })
    );
  }

  function handleInput(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const input: string = (e.target as HTMLInputElement).value;

      if (input.length === 0) return;

      if (connected() && (input === 'disconnect' || input === 'exit')) {
        socket.disconnect();
        setConnected(false);
      } else if (!connected()) {
        if (input === 'connect' || input == 'reconnect') {
          (e.target as HTMLInputElement).value = '';
          socket.connect();
        } else {
          handleCommand(input, navigate);
        }
        return;
      } else {
        socket.emit('chat', input);
        addMessage({ author: 'me', message: input });
      }

      (e.target as HTMLInputElement).value = '';
    }
  }

  return (
    <div>
      <p>
        $ Status:{' '}
        {connected() ? (
          <span class="connect">Connected</span>
        ) : (
          <span class="disconnect">Disconnected</span>
        )}
      </p>
      <p>
        {connected()
          ? 'These messages will be sent to me anonymously, but I may not always be able to respond.'
          : 'Type "connect" to start chatting.'}
      </p>
      <For each={messages}>
        {(m) =>
          m.author.match(/disconnect|connect/) ? (
            <p class={m.author}>socket: {m.message}</p>
          ) : (
            <p>
              <span class="author">{m.author}</span>: {m.message}
            </p>
          )
        }
      </For>
      <Input onKeyUp={handleInput} />
    </div>
  );
};

export default Chat;
