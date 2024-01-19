import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useThrottleEffect } from "ahooks";
import { marked } from "marked";
import { useStorage } from "@plasmohq/storage/hook"
// import { ChatOllama } from "@langchain/community/chat_models/ollama";

type ChatProps = {
  question: string;
  onMessageChange?: () => void;
}

const Chat = ({
  question,
  onMessageChange = () => { }
}: ChatProps) => {
  // const chatModel = new ChatOllama({
  //   baseUrl: 'http://localhost:1234/v1/chat/completions',
  //   model: 'mistral',
  // });
  const Ref = useRef(false);
  const [config] = useStorage("config");
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
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
    if (!question || Ref.current) return;
    Ref.current = true;

    try {
      // const dd = await chatModel.invoke("what is LangSmith?");
      // console.info("dd: ", dd);
      const stream = await fetch(`${config.domain}/v1/chat/completions`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          "messages": [
            // {
            //   "role": "system", "content": `You are a helpful, respectful and honest AI Assistant named Mango. You are talking to a human User.
            // Always answer as helpfully and logically as possible, while being safe. Your answers should not include any harmful, political, religious, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.
            // If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.`},
            // { "role": "system", "content": "你是一位乐于助人、尊重他人并且诚实的 AI 助手，名字叫 Ribbon AI。你正在与一位人类用户交流。" },
            { "role": "user", "content": question }
          ],
          "temperature": 0.7,
          "stream": true
        })
      });

      const reader = stream.body?.getReader();
      if (!reader) throw new Error("No reader available");

      masterLoop: while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setLoading(false);
          break
        }
        const decoder = new TextDecoder();
        const result = decoder.decode(value);
        const regex = /data: (.*?)(?=\n\n|$)/gs;
        let match;
        while ((match = regex.exec(result)) !== null) {
          const jsonData = JSON.parse(match[1]);
          const { delta, finish_reason } = jsonData?.choices?.[0] || {};

          if (finish_reason === 'stop') {
            setLoading(false);
            break masterLoop;
          }

          if (!delta?.content) {
            continue;
          }
          setMessage(o => o + jsonData?.choices?.[0]?.delta?.content)
        }
      }
    } catch (error) {
      setLoading(false);
      setErrorMessage("服务器出错了，请稍后重试");
    }
  }, [question])
  useEffect(() => {
    handleFetchData()
  }, [handleFetchData])
  // useEffect(() => {
  //   handleSpeechSynthesis()
  // }, [handleSpeechSynthesis])
  useThrottleEffect(() => {
    onMessageChange();
  }, [
    message,
    errorMessage,
    onMessageChange
  ], {
    wait: 300
  });
  const html = useMemo(() => ({ __html: marked(message) }), [message])

  return (
    <div className="space-y-2">
      <div className="flex flex-col items-end md:flex-row-reverse md:items-start space-y-2 md:space-y-0">
        <div className="md:ml-2 rounded-md bg-muted p-2 flex justify-center items-center">
          {/* <i className="inline-block icon-[ri--bear-smile-line] text-2xl" /> */}
          <i className="inline-block icon-[fluent-emoji--beaming-face-with-smiling-eyes] text-2xl" />
        </div>
        <div className="bg-muted rounded-md py-2 px-4 md:!ml-12">
          <p className="prose-sm">
            {question}
          </p>
        </div>
      </div>
      <div className="flex space-x-0 md:space-x-2 items-start flex-col md:flex-row space-y-2 md:space-y-0">
        <div className="rounded-md bg-muted p-2 flex justify-center items-center">
          <i className="inline-block icon-[fluent-emoji--grinning-squinting-face] text-2xl" />
        </div>
        <div className="bg-muted max-w-full rounded-md py-2 px-4 md:!mr-12">
          {message ? <article dangerouslySetInnerHTML={html} className="markdown prose prose-sm w-full break-words dark:prose-invert dark" /> : errorMessage}
          {loading && !(message || errorMessage) ? <i className="inline-block icon-[fluent-emoji--grinning-squinting-face] align-text-bottom animate-pulse text-lg" /> : null}
        </div>
      </div>
    </div>
  )
}

export default Chat;