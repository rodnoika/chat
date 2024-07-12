import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChatBot.css';

const ChatBot = () => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:8000/history/');
        setHistory(response.data);
      } catch (error) {
        console.error('Error fetching conversation history:', error);
      }
    };

    fetchHistory();
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append('message', message);
    if (file) {
      formData.append('file', file);
    }

    try {
      const response = await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.error || `HTTP error! status: ${response.status}`);
      }
      const res = await response.json();

      setHistory((prevHistory) => [
        ...prevHistory,
        { sender: 'User', message },
        { sender: 'Rodnoi', message: res.answer },
      ]);

    } catch (error) {
      console.error('Error:', error);
      setHistory((prevHistory) => [
        ...prevHistory,
        { sender: 'User', message },
        { sender: 'Rodnoi', message: error.message },
      ]);
    } finally {
      setLoading(false);
      setMessage(''); 
    }
  };

  const handleRestart = async () => {
    try {
      await axios.post('http://localhost:8000/clear_history/');
      setHistory([]);
    } catch (error) {
      console.error('Error clearing conversation history:', error);
    }
  };

  return (
    <div className="chatbot-container">
      <div className='chatbot-header'>
        <button onClick={handleRestart} className="chatbot-restart">
          Restart
        </button>
        <h1>RodnoiChat</h1>
      </div>
      <div className="chatbot-history">
        {history.map((entry, index) => (
          <div key={index}>
            <strong>{entry.sender}:</strong> {entry.message}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="chatbot-form">
        <div>
          <label>Message:</label>
          <input 
            type="text" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatBot;
