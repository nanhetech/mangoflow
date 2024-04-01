import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~components/ui/button";
import { useStorage } from "@plasmohq/storage/hook";
import { toast } from "sonner"
import { Toaster } from "~components/ui/sonner";
import { usePort } from "@plasmohq/messaging/hook";
import { DEFAULT_MODEL_CONFIG, cn } from "~lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "~components/ui/select";
import { marked } from "marked";
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Model, ProfileFormValuesType, Prompt } from "~options";
import { ScrollArea } from "~components/ui/scroll-area";
import { sendToContentScript } from "@plasmohq/messaging";
import "../style.css";
import 'animate.css';

export type ChatType = {
  id: string;
  user: string;
  assistant?: string;
  done?: boolean;
}

type UpdataChatType = {
  id: string;
  user?: string;
  assistant?: string;
  done?: boolean;
}

type ChatState = {
  list: ChatType[];
  done: boolean;
}

type ChatActions = {
  clear: () => void;
  add: (content: string) => void;
  remove: (id: string) => void;
  updateChatAssistantById: (item: UpdataChatType) => void;
}

const useChatStore = create<ChatState & ChatActions>((set) => ({
  list: [],
  done: false,
  updateChatAssistantById: (item) => set(({ list, done }) => {
    const result = [...list];
    const index = result.findIndex(({ id }) => item.id === id);
    if (index < 0) {
      return {};
    }
    const { assistant } = result[index];
    result[index].assistant = assistant + item?.assistant || '';
    result[index].done = item?.done || false;

    return {
      list: result,
      done: result[index]?.done || done,
    }
  }),
  add: (content) => set((state) => ({
    list: [...state.list, {
      id: nanoid(),
      user: content,
      assistant: "",
      done: false,
    }],
    done: false,
  })),
  remove: (id) => set(({ list }) => {
    const result = [...list];
    return {
      list: result.filter((item) => item.id !== id),
      done: false,
    }
  }),
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


type ChatProps = {
  data: ChatType;
  config: ProfileFormValuesType;
}

const Chat = ({
  data,
  config,
}: ChatProps) => {
  const assistantPort = usePort("assistant");
  const [copyState, setCopyState] = useState<boolean>(false);
  const { updateChatAssistantById: updataChat, list: chats } = useChatStore(state => state);
  const { assistant, done = false } = data;
  const Ref = useRef(false);
  // const [loading, setLoading] = useState<boolean>(true);
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
    const { systemPrompt } = config;
    const { id, user } = data;
    if (!user || Ref.current) return;
    Ref.current = true;
    // setLoading(true);
    updataChat({
      id,
      assistant: '',
      done: false,
    })
    setErrorMessage('');

    assistantPort.send({
      systemPrompt,
      chats
    })
  }, [Ref, config, data, chats])
  useEffect(() => {
    handleFetchData()
  }, [handleFetchData])
  // useEffect(() => {
  //   handleSpeechSynthesis()
  // }, [handleSpeechSynthesis])
  const htmlflow = useMemo(() => ({ __html: marked.parse(assistant) }), [assistant]);

  return (
    <div className="space-y-2">
      <div className="flex flex-col items-end md:flex-row-reverse md:items-start space-y-2 md:space-y-0">
        <div className="md:ml-2 rounded-md bg-muted/40 p-2 flex justify-center items-center">
          {/* <i className="inline-block icon-[ri--bear-smile-line] text-2xl" /> */}
          <i className="inline-block icon-[fluent-emoji--beaming-face-with-smiling-eyes] text-2xl" />
        </div>
        <div className="bg-muted/40 border rounded-md py-2 px-4 md:!ml-12 overflow-hidden max-w-full">
          <p className="prose-sm max-w-[570px]">
            {data.user}
          </p>
        </div>
      </div>
      <div className="flex space-x-0 md:space-x-2 items-start flex-col md:flex-row space-y-2 md:space-y-0">
        <div className="rounded-md bg-muted/40 p-2 flex justify-center items-center">
          <i className="inline-block icon-[fluent-emoji--robot] text-2xl" />
        </div>
        <div className={cn("bg-muted/40 border max-w-full rounded-md py-2.5 px-4 md:!mr-12 relative group", {
          'animate-pulse': !done
        })}>
          <article className="markdown prose prose-sm w-full break-words dark:prose-invert dark" dangerouslySetInnerHTML={htmlflow} />
          {!done && <i className="inline-block icon-[ri--brush-fill] align-text-bottom mt-1" />}
          {/* 添加复制和重新生成按钮 */}
          {done && <div className="hidden group-hover:block absolute right-2 bottom-2 bg-muted/40 rounded-md backdrop-blur-md">
            <Button
              size="icon"
              variant="ghost"
              title="copy"
              onClick={() => {
                navigator.clipboard.writeText(assistant).then(() => {
                  setCopyState(true);

                  setTimeout(() => {
                    setCopyState(false);
                  }, 1500);
                });
              }}
            >
              {copyState ? <i className="inline-block icon-[ri--check-fill]" /> : <i className="inline-block icon-[ri--file-copy-line]" />}
            </Button>
            {/* <Button
              size="icon"
              variant="ghost"
              title="regenerate"
              onClick={handleFetchData}
            >
              <i className="inline-block icon-[material-symbols--replay]" />
            </Button> */}
          </div>}
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
  const [models] = useStorage<Model[]>('models', []);
  const [activeModel, setActiveModel] = useStorage<Model>('activeModel', null);
  const handleSetActiveModel = useCallback((id: string) => {
    const model = models.find(model => model.id === id);
    setActiveModel(model)
  }, [models])

  return (
    <div className={cn('flex justify-between items-center space-x-2 p-4 pb-2 bg-opacity-95 backdrop-blur backdrop-filter', className)}>
      <Select value={activeModel?.id} onValueChange={handleSetActiveModel} >
        <SelectTrigger className="max-w-full w-auto space-x-1">
          {/* <span>Model:</span> */}
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Model</SelectLabel>
            {models?.map(({ id, title, description, type, url, apikey, name }) => (
              <SelectItem key={id} value={id}>{title}</SelectItem>
            ))}
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

const InputBox = () => {
  const { list: chats, clear, add: addChat } = useChatStore(state => state);
  const [prompts] = useStorage<Prompt[]>('prompts', []);
  const [activePrompt, setActivePrompt] = useStorage<Prompt>('activePrompt', null);
  const [activeSuperButton] = useStorage('activeSuperButton', null);
  const [question, setQuestion] = useState<string>('');
  const handleSubmit = useCallback(() => {
    // if (!config) {
    //   toast({
    //     title: chrome.i18n.getMessage("sidepanelDomainErrorTitle"),
    //     description: chrome.i18n.getMessage("sidepanelDomainErrorDescription"),
    //     variant: "destructive"
    //   })
    //   chrome.runtime.openOptionsPage();

    //   return
    // };

    if (!question) {
      toast.warning("Please enter the content.")

      return
    };
    addChat(question);
    setQuestion('');
  }, [question, setQuestion])
  const handleSuperButton = useCallback(async () => {
    if (!activeSuperButton) {
      toast("No super button is active", {
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo')
        },
      })
    }
    const {
      content,
      title,
    } = await sendToContentScript({
      name: 'getDefaultHtml',
    });
  }, []);
  const handleSetActivePrompt = useCallback((id: string) => {
    const pmt = prompts.find(prompt => prompt.id === id);
    setActivePrompt(pmt)
  }, [prompts])

  return (
    <div className="bg-muted/40 border-t relative p-4 space-y-2">
      <div className="w-full flex items-center">
        <textarea
          className={cn("block w-full focus:outline-none focus:ring-0 bg-transparent prose-sm", {
            "animate__animated animate__headShake": false,
          })}
          name="prompt"
          placeholder={chrome.i18n.getMessage("textareaPlaceholder")}
          autoFocus
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.stopPropagation();
              handleSubmit();
            }
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <Select value={activePrompt?.id} onValueChange={handleSetActivePrompt}>
          <SelectTrigger className="w-auto max-w-full space-x-1">
            <span>Prompt:</span><SelectValue placeholder="Select a prompt" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Prompt template</SelectLabel>
              {prompts?.map(({ id, title }) => (
                <SelectItem value={id} key={id}>{title}</SelectItem>
              ))}
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
          className="ml-auto relative z-50"
          size="icon"
          variant="outline"
          title={chrome.i18n.getMessage("summaryDescription")}
          onClick={handleSuperButton}
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
  const assistantPort = usePort("assistant")
  const [config] = useStorage("modelConfig", DEFAULT_MODEL_CONFIG);
  const { updateChatAssistantById: updataChat, list: chats, remove } = useChatStore(state => state);
  const chatListRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    chatListRef.current?.scrollIntoView(false);
  }
  useEffect(() => {
    assistantPort.listen(data => {
      if (data?.error) {
        toast(data?.error || "无法访问服务器", {
          description: "可能是配置不正确或者网络被阻止",
          action: {
            label: '设置模型信息',
            onClick: () => chrome.runtime.openOptionsPage()
          },
        })
        remove(data.id)
      } else {
        updataChat(data)
        scrollToBottom()
      }
    })
  }, [])

  return (
    <div className="flex flex-col overflow-hidden h-full relative">
      <HeaderTools className="absolute z-10 top-0 left-0 w-full" />
      <ScrollArea className="flex-1">
        <div
          className="p-4 overflow-hidden pt-16 overflow-y-auto space-y-6"
        >
          {!!chats.length && chats.map((data) => (
            <Chat
              key={data.id}
              data={data}
              config={config}
            />
          ))}
          <div
            ref={chatListRef}
            className="h-0 w-0"
          />
        </div>
      </ScrollArea>
      {!chats.length && (
        <div className="flex flex-col justify-center items-center h-full w-full space-y-1 pointer-events-none select-none">
          <i className="inline-block icon-[fluent-emoji--man-bowing] text-5xl" />
          <p>MangoFlow</p>
        </div>
      )}
      <InputBox />
      <Toaster position="top-center" />
    </div>
  )
}