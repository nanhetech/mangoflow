import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PlasmoMessaging } from "@plasmohq/messaging"
import Groq from "groq-sdk";
import OpenAI from "openai";

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  const { id, type, domain, apikey, model, user, systemPrompt, chats } = req.body || {};

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
        baseURL: type === 'ollama' ? 'http://localhost:11434/v1' : domain,
        apiKey: type === 'ollama' ? 'ollama' : (apikey || ''),
        dangerouslyAllowBrowser: true,
      });
      const stream = await openai.chat.completions.create({
        model,
        messages: [
          {
            "role": "system", "content": systemPrompt
          },
          ...msgs,
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
        model
      })
      const chat = genModel.startChat({
        history: msgs,
        generationConfig: {
          maxOutputTokens: 10000,
        },
      });
      const prompt = systemPrompt ? `${systemPrompt}:\n${user}` : user;
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
            "role": "system", "content": systemPrompt
          },
          ...msgs
        ],
        model,
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
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: msgs,
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
    // console.error("error: ", typeof error);
    // setLoading(false);
    // setErrorMessage(chrome.i18n.getMessage("chatErrorMessage"));
    res.send({
      error,
      message: chrome.i18n.getMessage("chatErrorMessage")
    })
  }

}

export default handler