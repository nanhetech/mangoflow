import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~components/ui/button";
import { useStorage } from "@plasmohq/storage/hook";
import { toast } from "~components/ui/use-toast";
import { Toaster } from "~components/ui/toaster";
import { sendToContentScript } from "@plasmohq/messaging";
import { DEFAULT_MODEL_CONFIG, cn } from "~lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "~components/ui/select";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
import { useThrottleEffect } from "ahooks";
import { marked } from "marked";
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import "../style.css";

type RoleType = 'user' | 'system' | 'assistant';

type ChatType = {
  id: string;
  role: RoleType;
  content: string;
  done: boolean;
}

type ChatState = {
  list: ChatType[];
}

type ChatActions = {
  clear: () => void;
  add: (content: string, role?: RoleType) => void;
  // setCount: (countCallback: (count: State['count']) => State['count']) => void
}

const useChatStore = create<ChatState & ChatActions>((set) => ({
  list: [],
  // increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  // removeAllBears: () => set({ bears: 0 }),
  // updateBears: (newBears) => set({ bears: newBears }),
  update: (newList) => set({ list: newList }),
  add: (content, role = 'user') => set((state) => ({
    list: [...state.list, {
      id: nanoid(),
      role,
      content,
      done: false,
    }],
  })),
  clear: () => set({ list: [] }),
}))

export type QuestionType = {
  user: string;
  type: 'chat'
} | {
  user: string;
  type: 'summary';
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
  systemPrompt?: string;
  summatySystemPrompt?: string;
  onMessageChange?: () => void;
}

const Chat = ({
  message,
  domain,
  apikey,
  type,
  model = '',
  summatySystemPrompt = '',
  systemPrompt = '',
  onMessageChange = () => { }
}: ChatProps) => {
  const Ref = useRef(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [html, setHtml] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
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
    setHtml('');
    setErrorMessage('');

    try {
      if (['ollama', 'openai'].includes(type)) {
        const openai = new OpenAI({
          baseURL: type === 'ollama' ? 'http://localhost:11434/v1' : domain,
          apiKey: type === 'ollama' ? 'ollama' : (apikey || ''),
          dangerouslyAllowBrowser: true,
        });

        const stream = await openai.chat.completions.create({
          model,
          messages: message.type === 'summary' ? [
            {
              "role": "system", "content": summatySystemPrompt
            },
            { "role": "user", "content": message.user }
          ] : [
            {
              "role": "system", "content": systemPrompt
            },
            { "role": "user", "content": message.user }
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: true
        });

        for await (const chunk of stream) {
          setHtml((o) => o + (chunk.choices[0]?.delta?.content || ""));
        }
      }

      if (type === 'gemini') {
        const genAI = new GoogleGenerativeAI(apikey);
        const stream = genAI.getGenerativeModel({
          model
        })
        const prompt = message.type === 'summary' ? `${summatySystemPrompt} Text: ${message.user}` : message.user;
        const result = await stream.generateContentStream(prompt);
        for await (const chunk of result.stream) {
          setHtml(o => o + chunk.text());
        }
      }

      if (type === 'groq') {
        const groq = new Groq({ apiKey: apikey, dangerouslyAllowBrowser: true });
        const stream = await groq.chat.completions.create({
          messages: message.type === 'summary' ? [
            {
              "role": "system", "content": summatySystemPrompt
            },
            { "role": "user", "content": message.user }
          ] : [
            {
              "role": "system", "content": systemPrompt
            },
            { "role": "user", "content": message.user }
          ],
          model,
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
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
          system: message.type === 'summary' ? summatySystemPrompt : systemPrompt,
          messages: message.type === 'summary' ? [
            { "role": "user", "content": message.user }
          ] : [
            { "role": "user", "content": message.user }
          ],
        }).on('text', (text) => {
          setHtml(o => o + text);
        });
      }
    } catch (error) {
      console.error("error: ", error);
      setLoading(false);
      setErrorMessage(chrome.i18n.getMessage("chatErrorMessage"));
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
              className="select-none py-0.5 relative flex items-center space-x-2 w-full overflow-hidden max-w-[570px]"
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
        <div className="bg-muted max-w-full rounded-md py-2.5 px-4 md:!mr-12 relative group">
          {html ? <article dangerouslySetInnerHTML={htmlflow} className="markdown prose prose-sm w-full break-words dark:prose-invert dark" /> : (!loading && <p>{errorMessage}<Button
            className="px-1 leading-tight h-auto align-text-bottom"
            size="sm"
            variant="link"
            title={chrome.i18n.getMessage("settingsTitle")}
            onClick={() => {
              chrome.runtime.openOptionsPage();
            }}
          >
            <i className="inline-block icon-[ri--settings-fill]" />
          </Button></p>)}
          {(loading && !(html || errorMessage)) ? <i className="inline-block icon-[fluent-emoji--cat-with-tears-of-joy] align-text-bottom animate-pulse text-lg" /> : null}
          {/* 添加复制和重新生成按钮 */}
          {/* <div className="hidden group-hover:block absolute left-0 bottom-0 bg-muted rounded-md rounded-tl-none translate-y-3/4 px-1">
            <Button
              size="sm"
              variant="ghost"
              title="copy"
              onClick={() => {
                navigator.clipboard.writeText(html);
              }}
            >
              <i className="inline-block icon-[ri--file-copy-line]" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title="regenerate"
              onClick={handleFetchData}
            >
              <i className="inline-block icon-[material-symbols--replay]" />
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  )
}

type HeaderToolsProps = {
  className?: string,
}

const HeaderTools = ({
  className = ''
}: HeaderToolsProps) => {
  const [models] = useStorage('models', []);
  const [activeModel, setActiveModel] = useStorage('activeModel', null);

  return (
    <div className={cn('flex justify-between items-center space-x-2 p-4 pb-2 bg-opacity-95 backdrop-blur backdrop-filter', className)}>
      <Select onValueChange={console.info} >
        <SelectTrigger className="max-w-full w-auto space-x-1">
          <span>Model:</span><SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Model</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="blueberry">Blueberry</SelectItem>
            <SelectItem value="grapes">Grapes</SelectItem>
            <SelectItem value="pineapple">Pineapple</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button
        size="icon"
        variant="ghost"
        title={chrome.i18n.getMessage("settingsTitle")}
        onClick={() => {
          chrome.runtime.openOptionsPage();
        }}
      >
        <i className="inline-block icon-[ri--settings-fill]" />
      </Button>
    </div>
  )
}

type InputBoxProps = {
  className?: string,
}

const InputBox = ({
  className = '',
}: InputBoxProps) => {
  const { list: chats, clear } = useChatStore(state => state);
  const [prompts] = useStorage('prompts', []);
  const [activePrompt, setActivePrompt] = useStorage('activePrompt', null);
  const [question, setQuestion] = useState<string>('');

  return (
    <div className="border-t relative p-4 space-y-2">
      <div className="w-full flex items-center">
        <textarea
          className="block w-full focus:outline-none focus:ring-0 bg-transparent prose-sm"
          name="prompt"
          placeholder={chrome.i18n.getMessage("textareaPlaceholder")}
          autoFocus
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.stopPropagation();
              // handleSubmit({
              //   type: 'chat',
              //   user: question,
              // });
            }
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <Select>
          <SelectTrigger className="w-auto max-w-full space-x-1">
            <span>Prompt:</span><SelectValue placeholder="Select a prompt" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Prompt template</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="blueberry">Blueberry</SelectItem>
              <SelectItem value="grapes">Grapes</SelectItem>
              <SelectItem value="pineapple">Pineapple</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {!!chats.length && <Button
          size="icon"
          variant="outline"
          title={chrome.i18n.getMessage("newChat")}
          onClick={() => clear()}
        >
          <i className="inline-block icon-[ri--chat-new-fill]" />
        </Button>}
        {/* <Button
          className="ml-auto"
          size="icon"
          variant="outline"
          title={chrome.i18n.getMessage("summaryDescription")}
          onClick={handleSummary}
        >
          <i className="inline-block icon-[material-symbols--allergy]" />
        </Button> */}
        {/* <Button
            className=""
            size="sm"
            onClick={() => handleSubmit({
              type: 'chat',
              user: question,
            })}
          >
            <i className="inline-block icon-[ri--send-plane-fill]" />
          </Button> */}
      </div>
    </div>
  )
}

export default function RegisterIndex() {
  const [config] = useStorage("modelConfig", DEFAULT_MODEL_CONFIG);
  const chatListRef = useRef<HTMLDivElement>(null);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [question, setQuestion] = useState<string>('');
  const handleSubmit = useCallback((q: typeof questions[number]) => {
    if (!config) {
      toast({
        title: chrome.i18n.getMessage("sidepanelDomainErrorTitle"),
        description: chrome.i18n.getMessage("sidepanelDomainErrorDescription"),
        variant: "destructive"
      })
      chrome.runtime.openOptionsPage();

      return
    };

    if (!q) {
      toast({
        title: "Question is empty",
        description: "Please enter the question.",
        variant: "destructive"
      })

      return
    };
    setQuestions(o => [...o, q]);
    setQuestion('');
  }, [config])
  const scrollToBottom = () => {
    chatListRef.current?.scrollIntoView(false);
  }
  const handleSummary = useCallback(async () => {
    const {
      content,
      title,
      description,
      icon,
    } = await sendToContentScript({
      name: 'getDefaultHtml',
    });
    setQuestions(o => [...o, {
      user: content,
      type: 'summary',
      title,
      description,
      icon,
    }]);
  }, [])

  return (
    <div className="flex flex-col overflow-hidden h-full relative">
      <HeaderTools className="absolute z-10 top-0 left-0 w-full" />
      <div
        className={`flex-1 p-4 overflow-hidden pt-16 overflow-y-auto${questions.length ? ' space-y-6' : ''}`}
      >
        {questions.length ? questions.map((message, index) => (
          <Chat
            domain={config.domain}
            apikey={config.apikey}
            model={config.model}
            type={config.type}
            systemPrompt={config.systemPrompt}
            summatySystemPrompt={config.summatySystemPrompt}
            key={index}
            message={message}
            onMessageChange={scrollToBottom}
          />
        )) : (
          <div className="flex flex-col justify-center items-center h-full w-full space-y-1">
            <i className="inline-block icon-[fluent-emoji--man-bowing] text-5xl" />
            <p>MangoFlow</p>
          </div>
        )}
        <div
          ref={chatListRef}
          className="h-0 w-0"
        />
      </div>
      <div className="border-t relative p-4 space-y-2">
        <div className="w-full flex items-center">
          <textarea
            className="block w-full focus:outline-none focus:ring-0 bg-transparent prose-sm"
            name="prompt"
            placeholder={chrome.i18n.getMessage("textareaPlaceholder")}
            autoFocus
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                handleSubmit({
                  type: 'chat',
                  user: question,
                });
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select>
            <SelectTrigger className="w-auto max-w-full space-x-1">
              <span>Prompt:</span><SelectValue placeholder="Select a prompt" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Prompt template</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="blueberry">Blueberry</SelectItem>
                <SelectItem value="grapes">Grapes</SelectItem>
                <SelectItem value="pineapple">Pineapple</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {!!questions.length && <Button
            size="icon"
            variant="outline"
            title={chrome.i18n.getMessage("newChat")}
            onClick={() => setQuestions([])}
          >
            <i className="inline-block icon-[ri--chat-new-fill]" />
          </Button>}
          <Button
            className="ml-auto"
            size="icon"
            variant="outline"
            title={chrome.i18n.getMessage("summaryDescription")}
            onClick={handleSummary}
          >
            <i className="inline-block icon-[material-symbols--allergy]" />
          </Button>
          {/* <Button
            className=""
            size="sm"
            onClick={() => handleSubmit({
              type: 'chat',
              user: question,
            })}
          >
            <i className="inline-block icon-[ri--send-plane-fill]" />
          </Button> */}
        </div>
      </div>
      <Toaster />
    </div>
  )
}