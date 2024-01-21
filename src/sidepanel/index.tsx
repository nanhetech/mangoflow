import { useCallback, useRef, useState } from "react"
import Chat from "~components/chat";
import { Button } from "~components/ui/button";
import { useStorage } from "@plasmohq/storage/hook";
import { toast } from "~components/ui/use-toast";
import "../style.css"

export default function RegisterIndex() {
  const [config] = useStorage("config");
  const chatListRef = useRef<HTMLDivElement>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [question, setQuestion] = useState<string>('');
  const handleSubmit = useCallback((q: typeof questions[number]) => {
    if (!config) {
      toast({
        title: "Profile not set",
        description: "Please set the profile first.",
      })
      chrome.runtime.openOptionsPage();

      return
    };

    if (!q) {
      toast({
        title: "Question is empty",
        description: "Please enter the question.",
      })

      return
    };
    setQuestions(o => [...o, q]);
    setQuestion('');
  }, [config])
  const scrollToBottom = () => {
    chatListRef.current?.scrollIntoView(false);
  }

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
        {questions.length ? questions.map((question, index) => (
          <Chat
            domain={config.domain}
            apikey={config.apikey}
            key={index}
            question={question}
            onMessageChange={scrollToBottom}
          />
        )) : (
          <div className="flex flex-col justify-center items-center h-full w-full space-y-1">
            <i className="inline-block icon-[fluent-emoji--grinning-squinting-face] text-5xl" />
            <p>Mango Chat</p>
          </div>
        )}
        <div
          ref={chatListRef}
          className="h-0 w-0"
        />
      </div>
      <div className="border-t relative">
        <div className="w-full p-4 md:p-6 flex items-center">
          <textarea
            className="block w-full focus:outline-none focus:ring-0 bg-transparent border-0 prose-sm"
            name="prompt"
            placeholder={chrome.i18n.getMessage("textareaPlaceholder")}
            autoFocus
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                handleSubmit(question);
              }
            }}
          />
          <button
            className="p-2 ml-1"
            onClick={() => handleSubmit(question)}
          >
            <i className="inline-block icon-[ri--send-plane-fill]" />
          </button>
        </div>
      </div>
    </div>
  )
}