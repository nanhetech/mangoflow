import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PlasmoMessaging } from "@plasmohq/messaging";
import Groq from "groq-sdk";
import OpenAI from "openai";
// import ollama from 'ollama';
import { Storage } from "@plasmohq/storage"
import type { Model, Prompt } from "~options";
import type { ChatType } from "~sidepanel";

type ReqBodyType = {
  chats: ChatType[],
}
const storage = new Storage();
const handler: PlasmoMessaging.PortHandler<ReqBodyType, any> = async (req, res) => {
  const { chats } = req.body || {};
  const activeModel = await storage.get<Model>("activeModel");
  const activePrompt = await storage.get<Prompt>("activePrompt");
  const { system = '' } = activePrompt || {};
  const { id, user } = chats.find(({ assistant }) => !assistant);

  if (!activeModel?.id) {
    res.send({
      id,
      error: "未设置模型，请设置模型",
      message: chrome.i18n.getMessage("chatErrorMessage")
    })
    return;
  }
  const { type, url, apikey, name } = activeModel;

  try {
    if (['ollama', 'openai'].includes(type)) {
      const msgs = chats.map(chat => ([
        {
          role: 'user', content: chat.user,
        },
        ...(chat.assistant ? [{
          role: 'assistant',
          content: chat.assistant,
        }] : []),
      ])).flat();
      const openai = new OpenAI({
        baseURL: type === 'ollama' ? 'http://localhost:11434/v1' : url,
        apiKey: type === 'ollama' ? 'ollama' : (apikey || ''),
        dangerouslyAllowBrowser: true,
      });
      const stream = await openai.chat.completions.create({
        model: name,
        messages: [
          {
            "role": "system", "content": system
          },
          ...msgs as any,
        ],
        temperature: 0.7,
        max_tokens: 10240,
        stream: true
      });

      for await (const chunk of stream) {
        const { choices = [] } = chunk;
        const { finish_reason = '', delta: { content = '' } = {} } = choices[0] || {};

        res.send({
          id,
          assistant: content,
          done: finish_reason === 'stop',
        })
      }
    }

    if (type === 'gemini') {
      const msgs = chats.filter(({ assistant }) => assistant).map(chat => ([
        {
          role: 'user', parts: [{ text: chat.user }],
        },
        ...(chat.assistant ? [{
          role: 'model',
          parts: [{ text: chat.assistant }],
        }] : []),
      ])).flat();
      const genAI = new GoogleGenerativeAI(apikey);
      const genModel = genAI.getGenerativeModel({
        model: name
      })
      const chat = genModel.startChat({
        history: msgs,
        generationConfig: {
          maxOutputTokens: 10000,
        },
      });
      const prompt = system ? `${system}\n${user}` : user;
      const result = await chat.sendMessageStream(prompt);
      for await (const chunk of result.stream) {
        const { candidates = [] } = chunk;
        const { finishReason = '', content: { parts = [] } = {} } = candidates[0] || {};
        res.send({
          id,
          assistant: (chunk.text() || ""),
          done: finishReason === 'STOP',
        })
      }
    }

    if (type === 'groq') {
      const msgs = chats.map(chat => ([
        {
          role: 'user', content: chat.user,
        },
        ...(chat.assistant ? [{
          role: 'assistant',
          content: chat.assistant,
        }] : []),
      ])).flat();
      const groq = new Groq({ apiKey: apikey, dangerouslyAllowBrowser: true });
      const stream = await groq.chat.completions.create({
        messages: [
          {
            "role": "system", "content": system
          },
          ...msgs
        ],
        model: name,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: true
      });
      for await (const chunk of stream) {
        const { choices = [] } = chunk;
        const { finish_reason = '', delta: { content = '' } = {} } = choices[0] || {};
        res.send({
          id,
          assistant: content,
          done: finish_reason === 'stop',
        })
      }
    }

    if (type === 'claude') {
      const msgs = chats.map(chat => ([
        {
          role: 'user', content: chat.user,
        },
        ...(chat.assistant ? [{
          role: 'assistant',
          content: chat.assistant,
        }] : []),
      ])).flat();
      const anthropic = new Anthropic({
        apiKey: apikey,
      });

      await anthropic.messages.stream({
        model: name,
        max_tokens: 1024,
        system,
        messages: msgs as any,
      }).on('text', (text = "") => {
        res.send({
          id,
          assistant: text,
          done: false,
        })
      }).on('finalMessage', () => {
        res.send({
          id,
          assistant: '',
          done: true,
        })
      });
    }
  } catch (error) {
    res.send({
      id,
      error,
      message: chrome.i18n.getMessage("chatErrorMessage")
    })
  }

}

export default handler