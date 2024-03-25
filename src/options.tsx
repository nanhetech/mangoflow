import { useCallback, useEffect, useMemo, useState } from "react"
import { Separator } from "~components/ui/separator"
import { SidebarNav } from "~components/sidebar-nav"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~components/ui/form"
import { Input } from "~components/ui/input"
import { Button } from "~components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "~components/ui/use-toast"
import { Toaster } from "~components/ui/toaster"
import { useStorage } from "@plasmohq/storage/hook"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~components/ui/select"
import { Textarea } from "~components/ui/textarea"
import { DEFAULT_MODEL_CONFIG, DEFAULT_SUMMATY_SYSTEM_PROMPT, DEFAULT_SYSTEM_PROMPT, GET_API_KEY_URL, cn } from "~lib/utils"
import * as z from "zod"
import "./style.css"
import { Badge } from "~components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "~components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~components/ui/dropdown-menu"
import logoUrl from "raw:/assets/icon.png"
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { Storage } from "@plasmohq/storage"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~components/ui/dialog"
import { ScrollArea } from "~components/ui/scroll-area"

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
  systemPrompt: z
    .string()
    .optional(),
  summatySystemPrompt: z
    .string()
    .optional(),
})

export type ProfileFormValuesType = z.infer<typeof profileFormSchema>

function SettingsModelPage() {
  const [config, setConfig] = useStorage("modelConfig", DEFAULT_MODEL_CONFIG);
  const [ollamaTags, setOllamaTags] = useState<OllamaModeelType[]>([])
  const defaultValues: Partial<ProfileFormValuesType> = config
  const form = useForm<ProfileFormValuesType>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })
  const type = form.getValues("type")

  function onSubmit(data: ProfileFormValuesType) {
    setConfig({
      type: data.type || "",
      domain: data.domain || "",
      apikey: data.apikey || "",
      model: data.model || "",
      systemPrompt: data.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      summatySystemPrompt: data.summatySystemPrompt || DEFAULT_SUMMATY_SYSTEM_PROMPT,
    });
    toast({
      title: chrome.i18n.getMessage("settingsSubmitSuccess"),
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
                  {chrome.i18n.getMessage(type === 'ollama' ? "settingsOllamaModelTypeDescription" : "settingsModelTypeDescription")}
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
                  {chrome.i18n.getMessage(type === 'ollama' ? "settingsModelNameOllamaDescription" : "settingsModelDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="systemPrompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{chrome.i18n.getMessage("settingsSystemPrompt")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={chrome.i18n.getMessage("settingsSystemPromptDescription")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {chrome.i18n.getMessage("settingsSystemPromptDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="summatySystemPrompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{chrome.i18n.getMessage("settingsSummatyPrompt")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={chrome.i18n.getMessage("settingsSummatyPromptDescription")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {chrome.i18n.getMessage("settingsSummatyPromptDescription")}
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

const storage = new Storage();
type Model = {
  id?: string,
  title?: string,
  description?: string,
  type?: string,
  url?: string,
  apikey?: string,
  name?: string,
}
type ModelState = {
  activeModel: Model | null;
}
type ModelActions = {
  update: (model: Model) => void;
  close: () => void;
  open: (model?: Model) => void;
}
const useActiveModelStore = create<ModelState & ModelActions>((set) => ({
  activeModel: null,
  update: (model) => set(state => ({
    activeModel: model,
  })),
  close: () => set({
    activeModel: null
  }),
  open: (model) => set({
    activeModel: model || {}
  })
}))

const modelFormSchema = z.object({
  title: z
    .string({
      required_error: "请填写模型简称",
      invalid_type_error: "模型简称必须是字符串"
    })
    .min(2, {
      message: "最少两个字符"
    })
    .max(16, {
      message: "最大长度为 16 个字符"
    }),
  type: z
    .string({
      required_error: "请选择模型类型",
      invalid_type_error: "模型简称必须是字符串"
    }),
  url: z
    .string({
      invalid_type_error: "模型请求地址必须是字符串"
    })
    .url({ message: "模型请求地址格式不正确" })
    .optional(),
  apikey: z
    .string({
      invalid_type_error: "apikey 必须是字符串"
    })
    .optional(),
  name: z
    .string({
      required_error: "请填写模型名称",
      invalid_type_error: "模型名称必须是字符串"
    }),
})

type ModelFormValuesType = z.infer<typeof modelFormSchema>

const EditModelDialog = () => {
  const { activeModel, open, update, close } = useActiveModelStore(state => state);
  const [ollamaTags, setOllamaTags] = useState<OllamaModeelType[]>([])
  const defaultValues: Partial<ModelFormValuesType> = activeModel
  const form = useForm<ModelFormValuesType>({
    resolver: zodResolver(modelFormSchema),
    defaultValues,
    mode: "onChange",
  })
  const type = form.getValues("type")

  const onSubmit = async ({
    title,
    type,
    url,
    apikey,
    name
  }: ModelFormValuesType) => {
    const data = {
      id: nanoid(),
      title,
      type,
      url,
      apikey,
      name,
    }
    const list = await storage.get("models");
    await storage.set("models", [...(list || []), data])
    toast({
      title: chrome.i18n.getMessage("settingsSubmitSuccess"),
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 overflow-hidden">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
    close()
  }

  useEffect(() => {
    form.reset(defaultValues)
  }, [activeModel])

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
    <Dialog open={!!activeModel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{activeModel?.id ? "Modifying model information" : "Add a model"}</DialogTitle>
          <DialogDescription>
            Please fill in the model information below
          </DialogDescription>
        </DialogHeader>
        <div className="">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>模型简称</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormDescription>
                      {chrome.i18n.getMessage("settingsSystemPromptDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{chrome.i18n.getMessage("settingsModelType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
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
                      {chrome.i18n.getMessage(type === 'ollama' ? "settingsOllamaModelTypeDescription" : "settingsModelTypeDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {['openai'].includes(type) && <FormField
                control={form.control}
                name="url"
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
                      <Input placeholder="" {...field} />
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
                name="name"
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
                      {chrome.i18n.getMessage(type === 'ollama' ? "settingsModelNameOllamaDescription" : "settingsModelDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                {/* <Button onClick={close} variant="outline" className="mr-auto">Test</Button> */}
                <Button onClick={close} variant="secondary">Cancel</Button>
                <Button variant="default" type="submit">{activeModel?.id ? "Save" : "Add"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const ModelCard = ({ data }: {
  data: Model,
}) => {
  const { id, title, type, apikey, name } = data;

  return (
    <div className="flex gap-2 p-4">
      <p>{title}</p>
      <p>{type}</p>
      <p>{apikey}</p>
      <p>{name}</p>
    </div>
  )
}

const SettingsModelsPage = () => {
  const [models, setModels] = useStorage<Model[]>('models', []);
  const [activeModel, setActiveModel] = useStorage('activeModel', null);
  const { activeModel: activeModelDialog, open, update, close } = useActiveModelStore(state => state);
  console.info("models: ", models)

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Models</h1>
      </div> */}
      {!!models.length ? <ScrollArea className="flex flex-1 flex-col gap-4">
        {models.map((data) => <ModelCard key={data.id} data={data} />)}
      </ScrollArea> : <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            You have no models
          </h3>
          <p className="text-sm text-muted-foreground">
            You can talk to the AI after adding a model.
          </p>
          <Button className="mt-4" onClick={() => open()}>Add Model</Button>
        </div>
      </div>}
      <EditModelDialog />
    </main>
  )
}

const SettingsPromptsPage = () => {
  const [prompts] = useStorage('prompts', []);
  const [activePrompt, setActivePrompt] = useStorage('activePrompt', null);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Prompts</h1>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            You have no products
          </h3>
          <p className="text-sm text-muted-foreground">
            You can start selling as soon as you add a product.
          </p>
          <Button className="mt-4">Add Product</Button>
        </div>
      </div>
    </main>
  )
}

const SettingsSuperButtonPage = () => {
  const [superButtons] = useStorage('superButtons', []);
  const [activeSuperButton] = useStorage('activeSuperButton', null);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Super button</h1>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            You have no products
          </h3>
          <p className="text-sm text-muted-foreground">
            You can start selling as soon as you add a product.
          </p>
          <Button className="mt-4">Add Product</Button>
        </div>
      </div>
    </main>
  )
}

const sidebarNavItems = [
  {
    title: chrome.i18n.getMessage("settingsModelsTitle"),
    key: "models",
    icon: <i className="inline-block icon-[ri--database-2-line]" />
  },
  {
    title: chrome.i18n.getMessage("settingsPromptsTitle"),
    key: "prompts",
    icon: <i className="inline-block icon-[ri--braces-fill]" />
  },
  {
    title: chrome.i18n.getMessage("settingsSuperButtonTitle"),
    key: "superButtons",
    icon: <i className="inline-block icon-[material-symbols--allergy]" />
  },
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
  const [key, setKey] = useState("models")

  return (
    <>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <div className="flex items-center gap-1 font-semibold">
                <img src={logoUrl} className="h-6 w-6" alt="" />
                <span className="text-lg">MangoFlow</span>
              </div>
              {/* <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <i className="inline-block icon-[ri--menu-fill]" />
              <span className="sr-only">Toggle notifications</span>
            </Button> */}
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                {sidebarNavItems.map(({ title, key: navItemKey, icon }) => {

                  return (
                    <div
                      className={cn("flex items-center cursor-pointer select-none gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                        "bg-muted": navItemKey === key
                      })}
                      key={navItemKey}
                      onClick={() => {
                        setKey(navItemKey);
                      }}
                    >
                      {icon}
                      {title}
                      {/* <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      4
                    </Badge> */}
                    </div>
                  )
                })}
              </nav>
            </div>
            {/* <div className="mt-auto p-4">
            <Card>
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Upgrade to Pro</CardTitle>
                <CardDescription>
                  Unlock all features and get unlimited access to our support
                  team.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          </div> */}
            <div className="mt-auto p-4 text-sm text-muted-foreground text-center">
              Built by <a href="https://twitter.com/zhanghedev" target="_blank">Henry</a>. Feedback to <a href="https://t.me/mangoflowai" target="_blank"><i className="icon-[ri--telegram-fill] inline-block text-lg align-text-bottom" /></a>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <i className="inline-block icon-[ri--menu-fill]" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-2 text-lg font-medium">
                  <p
                    className="flex items-center gap-2 text-lg font-semibold"
                  >
                    <img src={logoUrl} className="h-6 w-6" alt="" />
                    <span className="text-lg">{chrome.i18n.getMessage("extensionName")}</span>
                  </p>
                  {sidebarNavItems.map(({ title, key: navItemKey, icon }) => {
                    return (
                      <div
                        className={cn("mx-[-0.65rem] flex items-center cursor-pointer gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground", {
                          "bg-muted": navItemKey === key
                        })}
                        key={navItemKey}
                        onClick={() => {
                          setKey(navItemKey)
                        }}
                      >
                        {icon}
                        {title}
                        {/* <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                        4
                      </Badge> */}
                      </div>
                    )
                  })}
                </nav>
                {/* <div className="mt-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Upgrade to Pro</CardTitle>
                    <CardDescription>
                      Unlock all features and get unlimited access to our
                      support team.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full">
                      Upgrade
                    </Button>
                  </CardContent>
                </Card>
              </div> */}
                <div className="mt-auto p-4 text-sm text-muted-foreground text-center">
                  Built by <a href="https://twitter.com/zhanghedev" target="_blank">Henry</a>. Feedback to <a href="https://t.me/mangoflowai" target="_blank"><i className="icon-[ri--telegram-fill] inline-block text-lg align-text-bottom" /></a>
                </div>
              </SheetContent>
            </Sheet>
            {/* <div className="w-full flex-1">
            <form>
              <div className="relative">
                <i className="inline-block icon-[ri--search-2-line] absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <i className=" inline-block icon-[ri--user-6-fill]" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
          </header>
          {key === 'models' && <SettingsModelsPage />}
          {key === 'prompts' && <SettingsPromptsPage />}
          {key === 'superButtons' && <SettingsSuperButtonPage />}
        </div>
      </div>
      <Toaster />
    </>
  )
}

export default IndexOptions
