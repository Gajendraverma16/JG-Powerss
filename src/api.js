// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,    // uses your .env values
});

// helper to set (or remove) the auth token
export function setAuthToken(token) {
  if (token) {
    console.log(token, 'token is here');
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export default api;
