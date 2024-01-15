import { sendToBackground } from "@plasmohq/messaging"
import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useReducer } from "react"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const config: PlasmoCSConfig = {
  matches: ["https://sketchfab.com/models/*"]
}

const PlasmoOverlay = () => {
  const [count, increase] = useReducer((c) => c + 1, 0)

  return (
    <button
      onClick={async() => {
        const resp = await sendToBackground({
          name: "ping",
          body: {
            url: "https://zhanghe.dev"
          },
          extensionId: chrome.runtime.id
        })
        console.log(resp.message)
      }}
      type="button"
      className="fixed top-1 right-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
      Download all files
    </button>
  )
}

export default PlasmoOverlay