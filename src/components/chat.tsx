import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useThrottleEffect } from "ahooks";
import { marked } from "marked";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from "openai";

export type QuestionType = {
  user: string;
  type: 'chat'
} | {
  user: string;
  type: 'summary';
  system: string;
  title?: string;
  description?: string;
  icon?: string;
}
type MessageType = {
  role: 'user' | 'system';
  content: string;
}
type ChatProps = {
  message: QuestionType;
  domain?: string;
  type?: string;
  apikey?: string;
  model?: string;
  onMessageChange?: () => void;
}

const Chat = ({
  message,
  domain,
  apikey,
  type,
  model = '',
  onMessageChange = () => { }
}: ChatProps) => {
  const Ref = useRef(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [html, setHtml] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  // const handleSpeechSynthesis = useCallback(() => {
  //   if (!message || !Ref.current) return;

  //   if (loading) return;
  //   const utterance = new SpeechSynthesisUtterance(message);
  //   utterance.lang = 'zh-CN';
  //   utterance.rate = 1;
  //   utterance.pitch = 1;
  //   utterance.volume = 1;
  //   speechSynthesis.speak(utterance);
  // }, [message, loading])
  const handleFetchData = useCallback(async () => {
    if (!message || Ref.current) return;
    Ref.current = true;
    setLoading(true);

    try {
      if (type === 'openai') {
        const controller = new AbortController();
        const signal = controller.signal;
        const stream = await fetch(domain, {
          headers: {
            'Content-Type': 'application/json',
            ...(!!apikey && {
              'Authorization': `Bearer ${apikey}`,
            }),
          },
          method: 'POST',
          body: JSON.stringify({
            model,
            messages: message.type === 'summary' ? [
              {
                "role": "system", "content": message.system
              },
              { "role": "user", "content": message.user }
            ] : [
              {
                "role": "system", "content": `You are a helpful, respectful and honest AI Assistant named Mango. You are talking to a human User.
            Always answer as helpfully and logically as possible, while being safe. Your answers should not include any harmful, political, religious, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.
            If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.` },
              { "role": "user", "content": message.user }
            ],
            "temperature": 0.7,
            "max_tokens": 1024,
            "stream": true
          }),
          signal,
        });

        const reader = stream.body?.getReader();

        if (!reader) throw new Error("No reader available");
        const decoder = new TextDecoder('utf-8');

        masterLoop: while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setLoading(false);
            controller.abort();
            break;
          }

          const chunkValue = decoder.decode(value);
          const lines = chunkValue.split(/(?<=})(?:\n\n|\n\ndata: )?(?={|\[)/g);
          // console.info("value: ", value);
          // console.info("chunkValue: ", chunkValue);
          // console.info("lines: ", lines);
          const parsedLines = lines
            .map((line) => line.replace(/^data: /, "").trim())
            .filter((line) => line !== "" && line !== "[DONE]")
            .map((line) => JSON.parse(line));
          // console.info("parsedLines: ", parsedLines);

          for (const line of parsedLines) {
            const { delta, finish_reason } = line?.choices?.[0] || {};

            if (finish_reason === 'stop') {
              setLoading(false);
              controller.abort();
              break masterLoop;
            }

            if (delta?.content) {
              setHtml((o) => o + delta.content);
            }
          }
        }
      }

      if (type === 'ollama') {
        const openai = new OpenAI({
          baseURL: 'http://localhost:11434/v1',
          apiKey: 'ollama',
          dangerouslyAllowBrowser: true,
        });

        const stream = await openai.chat.completions.create({
          model,
          messages: message.type === 'summary' ? [
            {
              "role": "system", "content": message.system
            },
            { "role": "user", "content": message.user }
          ] : [
            {
              "role": "system", "content": `You are a helpful, respectful and honest AI Assistant named Mango. You are talking to a human User.
            Always answer as helpfully and logically as possible, while being safe. Your answers should not include any harmful, political, religious, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.
            If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.` },
            { "role": "user", "content": message.user }
          ],
          // temperature: 0.7,
          // max_tokens: 1024,
          stream: true
        });

        for await (const chunk of stream) {
          console.info("chunk: ", chunk);
          setHtml((o) => o + (chunk.choices[0]?.delta?.content || ""));
        }
      }

      if (type === 'gemini') {
        const genAI = new GoogleGenerativeAI(apikey);
        const stream = genAI.getGenerativeModel({
          model
        })
        const prompt = message.type === 'summary' ? `Perform text summarization. The summary should be clear and professional, without any associations. Text: ${message.user}` : message.user;
        const result = await stream.generateContentStream(prompt);
        for await (const chunk of result.stream) {
          setHtml(o => o + chunk.text());
        }
      }

      if (type === 'groq') {
        const groq = new Groq({ apiKey: apikey, dangerouslyAllowBrowser: true });
        const stream = await groq.chat.completions.create({
          //
          // Required parameters
          //
          messages: message.type === 'summary' ? [
            {
              "role": "system", "content": message.system
            },
            { "role": "user", "content": message.user }
          ] : [
            {
              "role": "system", "content": `You are a helpful, respectful and honest AI Assistant named Mango. You are talking to a human User.
            Always answer as helpfully and logically as possible, while being safe. Your answers should not include any harmful, political, religious, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.
            If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.` },
            { "role": "user", "content": message.user }
          ],
          // The language model which will generate the completion.
          model,
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
          // A stop sequence is a predefined or user-specified text string that
          // signals an AI to stop generating content, ensuring its responses
          // remain focused and concise. Examples include punctuation marks and
          // markers like "[end]".
          //
          // For this example, we will use ", 6" so that the llm stops counting at 5.
          // If multiple stop values are needed, an array of string may be passed,
          stream: true
        });
        for await (const chunk of stream) {
          setHtml(o => o + (chunk.choices[0]?.delta?.content || ""));
        }
      }

      if (type === 'claude') {
        const anthropic = new Anthropic({
          apiKey: apikey,
        });

        const stream = await anthropic.messages.stream({
          model,
          max_tokens: 1024,
          system: message.type === 'summary' ? message.system : `You are a helpful, respectful and honest AI Assistant named Mango. You are talking to a human User.
            Always answer as helpfully and logically as possible, while being safe. Your answers should not include any harmful, political, religious, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.
            If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.`,
          // messages: [{ role: "user", content: "Hello, Claude" }],
          messages: message.type === 'summary' ? [
            { "role": "user", "content": message.user }
          ] : [
            { "role": "user", "content": message.user }
          ],
        }).on('text', (text) => {
          setHtml(o => o + text);
        });
        // for await (const chunk of stream) {
        //   console.info("chunk: ", chunk);
        //   // setHtml(o => o + (chunk.choices[0]?.delta?.content || ""));
        // }
      }
    } catch (error) {
      console.error("error: ", error);
      setLoading(false);
      setErrorMessage("服务器出错了，请稍后重试");
    }
  }, [domain, apikey, Ref, message, model])
  useEffect(() => {
    handleFetchData()
  }, [handleFetchData])
  // useEffect(() => {
  //   handleSpeechSynthesis()
  // }, [handleSpeechSynthesis])
  useThrottleEffect(() => {
    onMessageChange();
  }, [
    html,
    errorMessage,
    onMessageChange
  ], {
    wait: 300
  });
  const htmlflow = useMemo(() => ({ __html: marked(html) }), [html])

  return (
    <div className="space-y-2">
      <div className="flex flex-col items-end md:flex-row-reverse md:items-start space-y-2 md:space-y-0">
        <div className="md:ml-2 rounded-md bg-muted p-2 flex justify-center items-center">
          {/* <i className="inline-block icon-[ri--bear-smile-line] text-2xl" /> */}
          <i className="inline-block icon-[fluent-emoji--beaming-face-with-smiling-eyes] text-2xl" />
        </div>
        <div className="bg-muted rounded-md py-2 px-4 md:!ml-12 overflow-hidden max-w-full">
          {message.type === 'summary' ? <>
            <div
              className="select-none py-1.5 relative flex items-center space-x-2 w-full overflow-hidden max-w-[570px]"
              onClick={() => {
                // chrome.tabs.create({
                //   url,
                //   active: false,
                // }, () => {
                //   setUnreadList((o = []) => {
                //     o.splice(index, 1);
                //     return o;
                //   });
                // });
              }}
            >
              <span className="w-10 h-10 flex items-center justify-center rounded-md bg-background">
                <img
                  src={message.icon}
                  alt={message.title}
                  className="w-6 h-6 rounded-full block"
                />
              </span>
              <span className="flex-1 overflow-hidden">
                <p className="font-bold text-base truncate">{chrome.i18n.getMessage("summary")}{': '}{message.title}</p>
                <p className="text-xs opacity-60 font-light truncate">{message.description}</p>
              </span>
            </div>
          </> : <p className="prose-sm max-w-[570px]">
            {message.user}
          </p>}
        </div>
      </div>
      <div className="flex space-x-0 md:space-x-2 items-start flex-col md:flex-row space-y-2 md:space-y-0">
        <div className="rounded-md bg-muted p-2 flex justify-center items-center">
          <i className="inline-block icon-[fluent-emoji--robot] text-2xl" />
        </div>
        <div className="bg-muted max-w-full rounded-md py-2 px-4 md:!mr-12">
          {html ? <article dangerouslySetInnerHTML={htmlflow} className="markdown prose prose-sm w-full break-words dark:prose-invert dark" /> : errorMessage}
          {loading && !(html || errorMessage) ? <i className="inline-block icon-[fluent-emoji--cat-with-tears-of-joy] align-text-bottom animate-pulse text-lg" /> : null}
        </div>
      </div>
    </div>
  )
}

export default Chat;