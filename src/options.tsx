import { useEffect, useState } from "react"
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
import "./style.css"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~components/ui/select"

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

type ProfileFormValues = z.infer<typeof profileFormSchema>

function SettingsModelPage() {
  const [config, setConfig] = useStorage("modelConfig", {
    type: "openai",
    domain: "http://localhost:1234/v1/chat/completions",
    apikey: "",
    model: "",
  });
  const defaultValues: Partial<ProfileFormValues> = config
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })

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
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  useEffect(() => {
    form.reset(defaultValues)
  }, [config])

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
          {form.getValues("type") === 'openai' && <FormField
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
          <FormField
            control={form.control}
            name="apikey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{chrome.i18n.getMessage("settingsApikey")}</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormDescription>
                  {chrome.i18n.getMessage("settingsApikeyDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.getValues("type") === 'gemini' && <div>
            <a href="https://aistudio.google.com/app/apikey" className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs" target="_blank" rel="noreferrer">
              {chrome.i18n.getMessage("settingsGetGeminiApikey")}
            </a>
          </div>}
          {form.getValues("type") === 'openai' && <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{chrome.i18n.getMessage("settingsModel")}</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormDescription>
                  {chrome.i18n.getMessage("settingsModelDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />}
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
          <i className="inline-block icon-[fluent-emoji--smiling-face-with-sunglasses] text-3xl mr-2 align-text-bottom" />
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
