import { useCallback, useRef, useState } from "react"
import Chat, { type QuestionType } from "~components/chat";
import { Button } from "~components/ui/button";
import { useStorage } from "@plasmohq/storage/hook";
import { toast } from "~components/ui/use-toast";
import { Toaster } from "~components/ui/toaster";
import { sendToContentScript } from "@plasmohq/messaging";
import { DEFAULT_MODEL_CONFIG, cn } from "~lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "~components/ui/select";
import "../style.css";

type HeaderToolsProps = {
  className?: string,
}
const HeaderTools = ({
  className = ''
}: HeaderToolsProps) => {

  return (
    <div className={cn('flex justify-between items-center space-x-2 p-4 pb-2', className)}>
      <Select>
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
      <HeaderTools />
      <div
        className={`flex-1 p-4 overflow-hidden overflow-y-auto${questions.length ? ' space-y-6' : ''}`}
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