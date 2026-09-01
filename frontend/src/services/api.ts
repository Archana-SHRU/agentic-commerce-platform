import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8000/api'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
