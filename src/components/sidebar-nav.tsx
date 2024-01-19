import { cn } from "~lib/utils"
import { buttonVariants } from "./ui/button"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    key: string
    title: string
  }[],
  value?: string,
  onChangeValue?: (value: string) => void
}

export function SidebarNav({ className, items, value, onChangeValue, ...props }: SidebarNavProps) {

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            value === item.key
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent",
            "justify-start cursor-pointer"
          )}
          onClick={() => onChangeValue?.(item.key)}
        >
          {item.title}
        </div>
      ))}
    </nav>
  )
}