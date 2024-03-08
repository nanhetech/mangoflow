import { useCallback, useEffect, useMemo, useState } from "react"
import { Separator } from "~components/ui/separator"
import { SidebarNav } from "~components/sidebar-nav"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~components/ui/form"
import { Input } from "~components/ui/input"
import { Button } from "~components/ui/button"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "~components/ui/use-toast"
import { Toaster } from "~components/ui/toaster"
import { useStorage } from "@plasmohq/storage/hook"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~components/ui/select"
import "./style.css"

type OllamaModeelType = {
  name: string,
  digest: string,
}
const profileFormSchema = z.object({
  domain: z
    .string()
    .url({ message: chrome.i18n.getMessage("settingsDomainError") })
    .optional(),
  apikey: z
    .string()
    .optional(),
  model: z
    .string()
    .optional(),
  type: z
    .string()
    .optional(),
})

const GET_API_KEY_URL = {
  "gemini": "https://aistudio.google.com/app/apikey",
  "groq": "https://console.groq.com/keys",
  "claude": "https://console.anthropic.com/settings/keys",
}

type ProfileFormValues = z.infer<typeof profileFormSchema>

function SettingsModelPage() {
  const [config, setConfig] = useStorage("modelConfig", {
    type: "openai",
    domain: "http://localhost:1234/v1/chat/completions",
    apikey: "",
    model: "",
  });
  const [ollamaTags, setOllamaTags] = useState<OllamaModeelType[]>([])
  const defaultValues: Partial<ProfileFormValues> = config
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })
  const type = form.getValues("type")

  function onSubmit(data: ProfileFormValues) {
    setConfig({
      type: data.type || "",
      domain: data.domain || "",
      apikey: data.apikey || "",
      model: data.model || "",
    });
    toast({
      title: "Profile updated",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 overflow-hidden">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  useEffect(() => {
    form.reset(defaultValues)
  }, [config])

  const handleGetOllamaTags = useCallback(async () => {
    if (type === 'ollama') {
      const response = await fetch('http://localhost:11434/api/tags')
      const { models } = await response.json()
      setOllamaTags(models)
    }
  }, [type])

  useEffect(() => {
    handleGetOllamaTags()
  }, [type])

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{chrome.i18n.getMessage("settingsModelType")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="claude">Anthropic Claude 3</SelectItem>
                    <SelectItem value="groq">Groq Cloud</SelectItem>
                    <SelectItem value="ollama">Ollama</SelectItem>
                    <SelectItem value="openai">{chrome.i18n.getMessage("settingsModelOpenai")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {chrome.i18n.getMessage("settingsModelTypeDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {['openai'].includes(type) && <FormField
            control={form.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{chrome.i18n.getMessage("settingsDomain")}</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormDescription>
                  {chrome.i18n.getMessage("settingsDomainDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />}
          {['openai', 'gemini', 'groq', 'claude'].includes(type) && <FormField
            control={form.control}
            name="apikey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{chrome.i18n.getMessage("settingsApikey")}</FormLabel>
                <FormControl>
                  <Input placeholder="" type="password" {...field} />
                </FormControl>
                <FormDescription>
                  {['gemini', 'groq', 'claude'].includes(type) ? <div>
                    <a href={GET_API_KEY_URL[form.getValues('type')]} className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs" target="_blank" rel="noreferrer">
                      {chrome.i18n.getMessage("settingsGetApikey")}
                    </a>
                  </div> : chrome.i18n.getMessage("settingsApikeyDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />}
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{chrome.i18n.getMessage("settingsModel")}</FormLabel>
                {['ollama'].includes(type) ? <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {!!ollamaTags.length && ollamaTags.map(({
                      name,
                      digest
                    }) => <SelectItem key={digest} value={name}>{name}</SelectItem>)}
                  </SelectContent>
                </Select> : <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>}
                <FormDescription>
                  {chrome.i18n.getMessage("settingsModelDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">{chrome.i18n.getMessage("settingsUpdateBtn")}</Button>
        </form>
      </Form>
    </div>
  )
}

const sidebarNavItems = [
  {
    title: chrome.i18n.getMessage("settingsSidebarModel"),
    key: "model"
  },
  // {
  //   title: "Account",
  //   key: "account"
  // },
  // {
  //   title: "Appearance",
  //   key: "appearance"
  // },
  // {
  //   title: "Notifications",
  //   key: "notifications"
  // },
  // {
  //   title: "Display",
  //   key: "display"
  // },
]
function IndexOptions() {
  const [key, setKey] = useState("model")

  return (
    <div className="space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">
          {chrome.i18n.getMessage("extensionName")}
        </h2>
        <p className="text-muted-foreground">
          {chrome.i18n.getMessage("settingsDescription")}
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav value={key} onChangeValue={setKey} items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-2xl">
          {key === "model" && <SettingsModelPage />}
        </div>
      </div>
      <Toaster />
    </div>
  )
}

export default IndexOptions
