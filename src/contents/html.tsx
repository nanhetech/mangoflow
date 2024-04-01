import { useMessage } from "@plasmohq/messaging/hook";
import TurndownService from 'turndown';
import { Readability, isProbablyReaderable } from '@mozilla/readability';

const GetHtml = () => {
  useMessage(async ({ name }, { send }) => {
    if (name === "getDefaultHtml") {
      if (isProbablyReaderable(document)) {
        let documentClone = document.cloneNode(true);
        let article = new Readability(documentClone as Document).parse();
        console.info("article: ", article);
        const turndownService = new TurndownService();
        turndownService.remove('style')
        turndownService.remove('script')
        turndownService.remove('noscript')
        turndownService.remove('link')
        const content = turndownService.turndown(article.content);
        console.info("content: ", content);
        send({
          content,
          // url,
          // title,
          // description,
          // keywords,
          // icon: icon ? (icon.indexOf('http') === 0 ? icon : `${origin}${icon}`) : `${origin}/favicon.ico`,
        })
      } else {
        send({
          error: "还没准备好呢"
          // content,
          // url,
          // title,
          // description,
          // keywords,
          // icon: icon ? (icon.indexOf('http') === 0 ? icon : `${origin}${icon}`) : `${origin}/favicon.ico`,
        })
      }
    }
  })
}

export default GetHtml