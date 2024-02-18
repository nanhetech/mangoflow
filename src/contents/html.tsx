import { useMessage } from "@plasmohq/messaging/hook";
import TurndownService from 'turndown';

const GetHtml = () => {
  useMessage(async ({ name }, { send }) => {
    if (name === "getDefaultHtml") {
      const body = document.body.innerHTML;
      const url = window.location.href;
      const origin = new URL(url).origin;
      const title = document.title;
      const description = document.querySelector("meta[name='description']")?.getAttribute("content");
      const keywords = document.querySelector("meta[name='keywords']")?.getAttribute("content");
      const icon = document.querySelector("link[rel*='icon']")?.getAttribute("href");
      const turndownService = new TurndownService();
      turndownService.remove('style')
      turndownService.remove('script')
      turndownService.remove('noscript')
      turndownService.remove('link')
      const content = turndownService.turndown(body);
      send({
        content,
        url,
        title,
        description,
        keywords,
        icon: icon ? (icon.indexOf('http') === 0 ? icon : `${origin}${icon}`) : `${origin}/favicon.ico`,
      })
    }
  })
}

export default GetHtml