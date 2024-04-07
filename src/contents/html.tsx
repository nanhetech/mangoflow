import { useMessage } from "@plasmohq/messaging/hook";
import TurndownService from 'turndown';
import { Readability, isProbablyReaderable } from '@mozilla/readability';
// import "cheerio";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
// import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
// import { MemoryVectorStore } from "langchain/vectorstores/memory";
// import { ChatOllama } from "@langchain/community/chat_models/ollama";

const GetHtml = () => {
  console.info("im contentscript.")
  // if (isProbablyReaderable(document)) {
  //   let documentClone = document.cloneNode(true);
  //   let article = new Readability(documentClone as Document).parse();
  //   console.info("article outter: ", article);
  // const turndownService = new TurndownService();
  // turndownService.remove('style')
  // turndownService.remove('script')
  // turndownService.remove('noscript')
  // turndownService.remove('link')
  // const content = turndownService.turndown(article.content);
  // console.info("content: ", content);
  // const textSplitter = new RecursiveCharacterTextSplitter({
  //   chunkSize: 500,
  //   chunkOverlap: 0,
  // });
  // const allSplits = await textSplitter.splitDocuments(content);
  // console.log(allSplits.length);
  // }
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
        // console.info("content: ", content);
        // const textSplitter = new RecursiveCharacterTextSplitter({
        //   chunkSize: 500,
        //   chunkOverlap: 0,
        // });
        // const allSplits = await textSplitter.splitText(content);
        // console.log(allSplits);

        // const embeddings = new OllamaEmbeddings();
        // const vectorStore = await MemoryVectorStore.fromDocuments(
        //   allSplits,
        //   embeddings
        // );
        // const question = "What are the approaches to Task Decomposition?";
        // const docs = await vectorStore.similaritySearch(question);
        // console.log(docs.length);
        // const ollamaLlm = new ChatOllama({
        //   baseUrl: "http://localhost:11434", // Default value
        //   model: "gemma:2b-instruct", // Default value
        // });
        // const response = await ollamaLlm.invoke(
        //   "Simulate a rap battle between Stephen Colbert and John Oliver"
        // );
        // console.log(response.content);
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