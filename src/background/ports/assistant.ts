import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PlasmoMessaging } from "@plasmohq/messaging"
import Groq from "groq-sdk";
import OpenAI from "openai";

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  const { id, type, domain, apikey, model, user, systemPrompt, msgs } = req.body || {};
  try {
    if (['ollama', 'openai'].includes(type)) {
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
          { "role": "user", "content": user }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        stream: true
      });

      for await (const chunk of stream) {
        res.send({
          id,
          assistant: (chunk.choices[0]?.delta?.content || ""),
          done: false,
        })
      }
    }

    if (type === 'gemini') {
      const genAI = new GoogleGenerativeAI(apikey);
      const stream = genAI.getGenerativeModel({
        model
      })
      const prompt = `${systemPrompt}\n${user}`;
      const result = await stream.generateContentStream(prompt);
      for await (const chunk of result.stream) {
        res.send({
          id,
          assistant: (chunk.text() || ""),
          done: false,
        })
      }
    }

    if (type === 'groq') {
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
        // console.info("chunk is: ", chunk);
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