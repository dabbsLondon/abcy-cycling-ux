export const API_BASE = '/api';

export async function fetchJson(endpoint) {
  const url = `${API_BASE}${endpoint}`;
  console.log(`[API] GET ${url}`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error(`[API] ERROR ${url} - ${res.status}: ${text}`);
      throw new Error(`Request failed: ${res.status}`);
    }
    const data = await res.json();
    console.log(`[API] OK ${url}`, data);
    return data;
  } catch (err) {
    console.error(`[API] FETCH FAILED ${url}`, err);
    throw err;
  }
} 