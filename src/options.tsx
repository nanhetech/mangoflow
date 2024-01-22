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

const profileFormSchema = z.object({
  domain: z
    .string()
    .url({ message: chrome.i18n.getMessage("settingsDomainError") }),
  apikey: z
    .string()
    // .min(32, { message: chrome.i18n.getMessage("settingsApikeyError") })
    .optional()
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

function SettingsProfilePage() {
  const [config, setConfig] = useStorage("config", {
    domain: "http://localhost:1234/v1/chat/completions",
    apikey: "",
  });
  const defaultValues: Partial<ProfileFormValues> = config
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  })

  function onSubmit(data: ProfileFormValues) {
    setConfig({
      domain: data.domain || "",
      apikey: data.apikey || "",
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
      <div>
        <h3 className="text-lg font-medium">{chrome.i18n.getMessage("settingsProfileTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {chrome.i18n.getMessage("settingsProfileDescription")}
        </p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
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
          />
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
          <Button type="submit">{chrome.i18n.getMessage("settingsUpdateBtn")}</Button>
        </form>
      </Form>
    </div>
  )
}

const sidebarNavItems = [
  {
    title: "Profile",
    key: "profile"
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
  const [key, setKey] = useState("profile")

  return (
    <div className="space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">{chrome.i18n.getMessage("settingsTitle")}{' - '}{chrome.i18n.getMessage("extensionName")}</h2>
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
          {key === "profile" && <SettingsProfilePage />}
        </div>
      </div>
      <Toaster />
    </div>
  )
}

export default IndexOptions
