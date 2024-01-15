import { useState } from "react"
import "./style.css"

function IndexNewTab() {
  const [data, setData] = useState("")

  return (
    <div className="min-h-screen md:p-4">
      <h2 className="text-2xl">
        {chrome.i18n.getMessage("extensionName")}
      </h2>
      <input onChange={(e) => setData(e.target.value)} value={data} />
      <a href="https://docs.plasmo.com" target="_blank">
        View Docs
      </a>
    </div>
  )
}

export default IndexNewTab
