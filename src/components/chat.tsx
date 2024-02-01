import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useThrottleEffect } from "ahooks";
import { marked } from "marked";

export type QuestionType = {
  user: string;
  system?: string;
  type?: 'chat' | 'summary';
}
type MessageType = {
  role: 'user' | 'system';
  content: string;
}
type ChatProps = {
  message: QuestionType;
  domain: string;
  apikey?: string;
  onMessageChange?: () => void;
}

const Chat = ({
  message,
  domain,
  apikey,
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
      // const dd = await chatModel.invoke("what is LangSmith?");
      // console.info("dd: ", dd);
      const stream = await fetch(`${domain}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apikey ? `Bearer ${apikey}` : '',
        },
        method: 'POST',
        body: JSON.stringify({
          "model": "deepseek-chat",
          messages: [
            {
              "role": "system", "content": message.system || `You are a helpful, respectful and honest AI Assistant named Mango. You are talking to a human User.
            Always answer as helpfully and logically as possible, while being safe. Your answers should not include any harmful, political, religious, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.
            If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.` },
            { "role": "user", "content": message.user }
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
          setHtml(o => o + jsonData?.choices?.[0]?.delta?.content)
        }
      }
    } catch (error) {
      setLoading(false);
      setErrorMessage("服务器出错了，请稍后重试");
    }
  }, [domain, apikey, Ref, message])
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
          {message.type === 'summary' ? <p className="prose-sm truncate max-w-[570px]">
            <i className="inline-block mr-1 icon-[fluent-emoji--balloon] text-base" />{chrome.i18n.getMessage("summary")}{' '}{message.user}
          </p> : <p className="prose-sm max-w-[570px]">
            {message.user}
          </p>}
        </div>
      </div>
      <div className="flex space-x-0 md:space-x-2 items-start flex-col md:flex-row space-y-2 md:space-y-0">
        <div className="rounded-md bg-muted p-2 flex justify-center items-center">
          <i className="inline-block icon-[fluent-emoji--grinning-squinting-face] text-2xl" />
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