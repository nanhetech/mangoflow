import { useCallback, useRef, useState } from "react"
import "../style.css"
import Chat from "~components/chat";

export default function RegisterIndex() {
  const chatListRef = useRef<HTMLDivElement>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [question, setQuestion] = useState<string>('');
  const handleSubmit = useCallback((q: typeof questions[number]) => {
    if (!q) return;
    setQuestions(o => [...o, q]);
    setQuestion('');
  }, [])
  const scrollToBottom = () => {
    chatListRef.current?.scrollIntoView(false);
  }

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <div
        className={`flex-1 p-4 md:p-6 overflow-hidden overflow-y-auto${questions.length ? ' space-y-6' : ''}`}
      >
        {questions.length ? questions.map((question, index) => (
          <Chat
            key={index}
            question={question}
            onMessageChange={scrollToBottom}
          />
        )) : (
          <div className="flex flex-col justify-center items-center h-full w-full space-y-1">
            <i className="inline-block icon-[fluent-emoji--grinning-squinting-face] text-5xl" />
            <p>Ribbon AI</p>
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
            className="block w-full focus:outline-none focus:ring-0 bg-transparent border-0"
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