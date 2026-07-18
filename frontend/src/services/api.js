import axios from "axios";

const api = axios.create({
  baseURL: "https://proyectolenguajeprogramacion.onrender.com/api",
});

export default api;
