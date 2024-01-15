import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const message = await fetch(req.body.url).then(res => res.text()).catch(err => console.warn(err))

  res.send({
    message
  })
}

export default handler