import './App.css';

import React, { useState, useEffect, useRef, useMemo } from 'react';

let socket;

function App() {
  const messageInputEl = useRef(null);

  const [messages, _setMessages] = useState([]);
  const messagesRef = useRef(messages);
  const setMessages = data => {
    messagesRef.current = data;
    _setMessages(data);
  };

  useEffect(() => {
    socket = new WebSocket('ws://localhost:9001');

    socket.onopen = () => {
      console.log("[socket.onopen]");
    };

    socket.onmessage = (e) => {
      console.log("[socket.onmessage]", e.data);
      setMessages([...messagesRef.current, e.data]);
    };

    socket.onclose = () => {
      console.log("[socket.onclose]");
    }
  }, []);

  const listItems = useMemo(() => {
    return messages.map((d) => <li key={d}>{d}</li>);
  }, [messages]);

  const sendMessage = (event) => {
    event.preventDefault();

    // socket.send(JSON.stringify({}));
    const text = messageInputEl.current.value.trim();
    if (text.length > 0) {
      socket.send(text);

      messageInputEl.current.value = '';
    }
  }

  console.log("[socket.onmessage]", {messages, listItems});

  return (
    <div className="App">
      <ul id="messages">
        {listItems}
      </ul>
      <form id="form" action="">
        <input id="inputMessage" ref={messageInputEl} autoComplete="off" />
        <button onClick={sendMessage}>Send</button>
      </form>
    </div>
  );
}

export default App;
