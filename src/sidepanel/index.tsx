import { useCallback, useRef, useState } from "react"
import Chat, { type QuestionType } from "~components/chat";
import { Button } from "~components/ui/button";
import { useStorage } from "@plasmohq/storage/hook";
import { toast } from "~components/ui/use-toast";
import { Toaster } from "~components/ui/toaster";
import { sendToContentScript } from "@plasmohq/messaging";
import "../style.css"

export default function RegisterIndex() {
  const [config] = useStorage("config");
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
      content
    } = await sendToContentScript({
      name: 'getDefaultHtml',
    });
    setQuestions(o => [...o, {
      user: content,
      system: 'Summarizes content for the average person.',
      type: 'summary',
    }]);
  }, [])

  return (
    <div className="flex flex-col overflow-hidden h-full relative">
      <Button
        className="absolute left-4 top-4 z-20"
        size="icon"
        variant="ghost"
        title={chrome.i18n.getMessage("settingsTitle")}
        onClick={() => {
          chrome.runtime.openOptionsPage();
        }}
      >
        <i className="inline-block icon-[ri--settings-fill]" />
      </Button>
      <div
        className={`flex-1 p-4 md:p-6 overflow-hidden overflow-y-auto${questions.length ? ' space-y-6' : ''}`}
      >
        {questions.length ? questions.map((message, index) => (
          <Chat
            domain={config.domain}
            apikey={config.apikey}
            key={index}
            message={message}
            onMessageChange={scrollToBottom}
          />
        )) : (
          <div className="flex flex-col justify-center items-center h-full w-full space-y-1">
            <i className="inline-block icon-[fluent-emoji--grinning-squinting-face] text-5xl" />
            <p>MangoFlow</p>
          </div>
        )}
        <div
          ref={chatListRef}
          className="h-0 w-0"
        />
      </div>
      <div className="border-t relative px-4 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            className=""
            size="sm"
            variant="outline"
            title={chrome.i18n.getMessage("summaryDescription")}
            onClick={handleSummary}
          >
            {chrome.i18n.getMessage("summary")}
          </Button>
        </div>
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
                  user: question,
                });
              }
            }}
          />
          <button
            className="p-2 ml-1"
            onClick={() => handleSubmit({
              user: question,
            })}
          >
            <i className="inline-block icon-[ri--send-plane-fill]" />
          </button>
        </div>
      </div>
      <Toaster />
    </div>
  )
}