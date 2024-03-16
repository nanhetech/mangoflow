import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const GET_API_KEY_URL = {
  "gemini": "https://aistudio.google.com/app/apikey",
  "groq": "https://console.groq.com/keys",
  "claude": "https://console.anthropic.com/settings/keys",
}

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful, respectful and honest AI Assistant named Mango. You are talking to a human User.Always answer as helpfully and logically as possible, while being safe. Your answers should not include any harmful, political, religious, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.`

export const DEFAULT_SUMMATY_SYSTEM_PROMPT = `Summarizes content for the average person.`

export const DEFAULT_MODEL_CONFIG = {
  type: "openai",
  domain: "http://localhost:1234/v1",
  apikey: "",
  model: "",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  summatySystemPrompt: DEFAULT_SUMMATY_SYSTEM_PROMPT,
}
