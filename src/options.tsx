import { useCallback, useEffect, useMemo, useState } from "react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~components/ui/form"
import { Input } from "~components/ui/input"
import { Button } from "~components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "~components/ui/use-toast"
import { Toaster } from "~components/ui/sonner"
import { useStorage } from "@plasmohq/storage/hook"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~components/ui/select"
import { Textarea } from "~components/ui/textarea"
import { DEFAULT_MODEL_CONFIG, DEFAULT_SUMMATY_SYSTEM_PROMPT, DEFAULT_SYSTEM_PROMPT, GET_API_KEY_URL, cn } from "~lib/utils"
import * as z from "zod";
import "./style.css";
import 'animate.css';
import { Badge } from "~components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "~components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~components/ui/dropdown-menu"
import logoUrl from "raw:/assets/icon.png"
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { Storage } from "@plasmohq/storage"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~components/ui/dialog"
import { ScrollArea } from "~components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card"

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

const storage = new Storage();
export type Model = {
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
  deleteModel: Model | null;
}
type ModelActions = {
  update: (model: Model) => void;
  close: () => void;
  open: (model?: Model) => void;
  openDelete: (model?: Model) => void;
}
const useActiveModelStore = create<ModelState & ModelActions>((set) => ({
  activeModel: null,
  deleteModel: null,
  update: (model) => set(() => ({
    activeModel: model,
  })),
  close: () => set({
    activeModel: null
  }),
  open: (model) => set({
    activeModel: model || {}
  }),
  openDelete: (model) => set({
    deleteModel: model || null
  })
}))
export type Prompt = {
  id?: string,
  title?: string,
  system?: string,
}
type PromptState = {
  activePrompt: Prompt | null;
  deletePrompt: Prompt | null;
}
type PromptActions = {
  update: (Prompt: Prompt) => void;
  close: () => void;
  open: (Prompt?: Prompt) => void;
  openDelete: (Prompt?: Prompt) => void;
}
const useActivePromptStore = create<PromptState & PromptActions>((set) => ({
  activePrompt: null,
  deletePrompt: null,
  update: (prompt) => set(() => ({
    activePrompt: prompt,
  })),
  close: () => set({
    activePrompt: null
  }),
  open: (prompt) => set({
    activePrompt: prompt || {}
  }),
  openDelete: (prompt) => set({
    deletePrompt: prompt || null
  })
}))

const ConfrimDeleteModal = () => {
  const { deleteModel, openDelete } = useActiveModelStore(state => state);
  const handleDeleteModel = useCallback(async () => {
    const list = await storage.get<Model[]>("models");
    const activeModel = await storage.get<Model>("activeModel");
    const newList = list.filter(({ id }) => id !== deleteModel?.id)
    await storage.set("models", newList);

    if (activeModel?.id && activeModel.id === deleteModel.id) {
      await storage.set("activeModel", null);
    }
    toast({
      title: "删除成功",
    })
  }, [deleteModel])

  return (
    <AlertDialog open={!!deleteModel} onOpenChange={(open) => {
      if (!open) openDelete()
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定删除这个模型？-{">"} {deleteModel?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            <pre className="mt-2 max-w-full py-4 overflow-hidden">
              <code className="max-w-full whitespace-pre-wrap">{JSON.stringify(deleteModel, null, 2)}</code>
            </pre>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteModel}>确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const ConfrimPromptDeleteModal = () => {
  const { deletePrompt, openDelete } = useActivePromptStore(state => state);
  const handleDeletePrompt = useCallback(async () => {
    const list = await storage.get<Model[]>("prompts");
    const activePrompt = await storage.get<Model>("activePrompt");
    const newList = list.filter(({ id }) => id !== deletePrompt?.id)
    await storage.set("prompts", newList);

    if (activePrompt?.id && activePrompt.id === deletePrompt.id) {
      await storage.set("activePrompt", null);
    }
    toast({
      title: "删除成功",
    })
  }, [deletePrompt])

  return (
    <AlertDialog open={!!deletePrompt} onOpenChange={(open) => {
      if (!open) openDelete()
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定删除这个提示词吗？-{">"} {deletePrompt?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            <pre className="mt-2 max-w-full py-4 overflow-hidden">
              <code className="max-w-full whitespace-pre-wrap">{JSON.stringify(deletePrompt, null, 2)}</code>
            </pre>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeletePrompt}>确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const modelFormSchema = z.object({
  title: z
    .string({
      required_error: "请填写模型标题",
      invalid_type_error: "模型标题必须是字符串"
    })
    .min(2, {
      message: "最少 2 个字符"
    })
    .max(16, {
      message: "最大长度为 16 个字符"
    }),
  type: z
    .string({
      required_error: "请选择模型类型",
      invalid_type_error: "模型类型必须是字符串"
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
  const { activeModel, close } = useActiveModelStore(state => state);
  const [ollamaTags, setOllamaTags] = useState<OllamaModeelType[]>([])
  const defaultValues: Partial<ModelFormValuesType> = activeModel
  const form = useForm<ModelFormValuesType>({
    resolver: zodResolver(modelFormSchema),
    defaultValues,
    mode: "onChange",
  })
  const type = form.getValues("type")

  const onSubmit = async (val: ModelFormValuesType) => {
    if (activeModel?.id) {
      const list = await storage.get<Model[]>("models");
      const newList = list?.map((item) => {
        if (item.id === activeModel?.id) {
          return {
            ...item,
            ...val,
          }
        }
        return item;
      })
      await storage.set("models", newList);
      const currentModel = await storage.get<Model>("activeModel");

      if (currentModel?.id && (currentModel?.id === activeModel?.id)) {
        await storage.set("activeModel", { ...currentModel, ...val });
      }
      toast({
        title: chrome.i18n.getMessage("settingsSubmitSuccess"),
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 overflow-hidden">
            <code className="text-white">{JSON.stringify(val, null, 2)}</code>
          </pre>
        ),
      })
    } else {
      const data = {
        id: nanoid(),
        ...val,
      }
      const list = await storage.get("models");
      await storage.set("models", [...(list || []), data])

      if (list?.length === 0) {
        await storage.set("activeModel", data);
      }
      toast({
        title: chrome.i18n.getMessage("settingsSubmitSuccess"),
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 overflow-hidden">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      })
    }
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
    <Dialog open={!!activeModel} onOpenChange={(open) => {
      if (!open) close()
    }}>
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
                    <FormLabel>模型标题</FormLabel>
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
                {/* <Button onClick={close} variant="secondary">Cancel</Button> */}
                <Button variant="default" type="submit">{activeModel?.id ? "Save" : "Add"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const promptFormSchema = z.object({
  title: z
    .string({
      required_error: "请填写模型标题",
      invalid_type_error: "模型标题必须是字符串"
    })
    .min(2, {
      message: "最少 2 个字符"
    })
    .max(16, {
      message: "最大长度为 16 个字符"
    }),
  system: z
    .string({
      required_error: "请填写系统提示词",
      invalid_type_error: "系统提示词必须是字符串"
    })
    .min(2, {
      message: "最少 2 个字符"
    })
    .max(512, {
      message: "最大长度为 512 个字符"
    }),
})

type PromptFormValuesType = z.infer<typeof promptFormSchema>

const EditPromptDialog = () => {
  const { activePrompt, close } = useActivePromptStore(state => state);
  const defaultValues: Partial<PromptFormValuesType> = activePrompt
  const form = useForm<PromptFormValuesType>({
    resolver: zodResolver(promptFormSchema),
    defaultValues,
    mode: "onChange",
  })

  const onSubmit = async (val: PromptFormValuesType) => {
    if (activePrompt?.id) {
      const list = await storage.get<Model[]>("prompts");
      const newList = list?.map((item) => {
        if (item.id === activePrompt?.id) {
          return {
            ...item,
            ...val,
          }
        }
        return item;
      })
      await storage.set("prompts", newList);
      const currentPrompt = await storage.get<Prompt>("activePrompt");

      if (currentPrompt?.id && (currentPrompt?.id === activePrompt?.id)) {
        await storage.set("activePrompt", { ...currentPrompt, ...val });
      }
      toast({
        title: chrome.i18n.getMessage("settingsSubmitSuccess"),
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 overflow-hidden">
            <code className="text-white">{JSON.stringify(val, null, 2)}</code>
          </pre>
        ),
      })
    } else {
      const data = {
        id: nanoid(),
        ...val,
      }
      const list = await storage.get("prompts");
      await storage.set("prompts", [...(list || []), data])

      if (list?.length === 0) {
        await storage.set("activePrompt", data);
      }
      toast({
        title: chrome.i18n.getMessage("settingsSubmitSuccess"),
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 overflow-hidden">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      })
    }
    close()
  }

  useEffect(() => {
    form.reset(defaultValues)
  }, [activePrompt])

  return (
    <Dialog open={!!activePrompt} onOpenChange={(open) => {
      if (!open) close()
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{activePrompt?.id ? "Modifying prompt information" : "Add a prompt"}</DialogTitle>
          <DialogDescription>
            Please fill in the prompt information below
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
                    <FormLabel>系统提示词标题</FormLabel>
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
                name="system"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{chrome.i18n.getMessage("settingsModelType")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder=""
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {chrome.i18n.getMessage("settingsOllamaModelTypeDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                {/* <Button onClick={close} variant="outline" className="mr-auto">Test</Button> */}
                {/* <Button onClick={close} variant="secondary">Cancel</Button> */}
                <Button variant="default" type="submit">{activePrompt?.id ? "Save" : "Add"}</Button>
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
  const { title, type, apikey, name } = data;
  const { update, openDelete } = useActiveModelStore(state => state);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {title}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant="outline" className="uppercase">{type}</Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell transition-transform blur-sm hover:blur-none">{apikey}</TableCell>
      <TableCell className="hidden md:table-cell">
        {name}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-haspopup="true"
              size="icon"
              variant="ghost"
            >
              <i className=" inline-block icon-[ri--more-fill]" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => update(data)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDelete(data)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

const PromptCard = ({ data }: {
  data: Prompt,
}) => {
  const { title, system } = data;
  const { update, openDelete } = useActivePromptStore(state => state);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {title}
      </TableCell>
      <TableCell className="hidden md:table-cell">{system}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-haspopup="true"
              size="icon"
              variant="ghost"
            >
              <i className="inline-block icon-[ri--more-fill]" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => update(data)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDelete(data)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

const SettingsModelsPage = () => {
  const [models] = useStorage<Model[]>('models', []);
  const { open } = useActiveModelStore(state => state);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {!!models.length ? <>
        <div className="flex items-end">
          <div className="">
            <h1 className="text-xl font-bold tracking-tight">Models</h1>
            <p className="text-sm text-muted-foreground">
              管理你的所有模型信息，模型信息只保存在本地。
            </p>
          </div>
          <Button className="ml-auto" onClick={() => open()}>Add Model</Button>
        </div>
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">apikey</TableHead>
                <TableHead className="hidden md:table-cell">
                  Model name
                </TableHead>
                <TableHead>
                  Actions
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((data) => <ModelCard key={data.id} data={data} />)}
            </TableBody>
          </Table>
        </ScrollArea>
      </> : <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-4">
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
      <ConfrimDeleteModal />
    </main>
  )
}

const SettingsPromptsPage = () => {
  const [prompts] = useStorage<Prompt[]>('prompts', []);
  const { open } = useActivePromptStore(state => state);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {!!prompts.length ? <>
        <div className="flex items-end">
          <div className="">
            <h1 className="text-xl font-bold tracking-tight">Prompts</h1>
            <p className="text-sm text-muted-foreground">
              管理你的所有系统提示词。
            </p>
          </div>
          <Button className="ml-auto" onClick={() => open()}>Add Prompt</Button>
        </div>
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">system</TableHead>
                <TableHead>
                  Actions
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prompts.map((data) => <PromptCard key={data.id} data={data} />)}
            </TableBody>
          </Table>
        </ScrollArea>
      </> : <>
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Prompts</h1>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              You have no prompts
            </h3>
            <p className="text-sm text-muted-foreground">
              You can start selling as soon as you add a product.
            </p>
            <Button className="mt-4" onClick={() => open()}>Add Prompt</Button>
          </div>
        </div>
      </>}
      <EditPromptDialog />
      <ConfrimPromptDeleteModal />
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
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
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
