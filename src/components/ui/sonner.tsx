"use client"


import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  let theme: ToasterProps["theme"] | string = "system"

  // Safe client-side theme detection without using next-themes/useTheme hook.
  // Checks localStorage 'theme' first, then document.documentElement.classList for 'dark'/'light'.
  // Falls back to 'system' when unavailable (SSR/no access).
  try {
    if (typeof window === "undefined") {
      theme = "system"
    } else {
      let detected: string | null = null
      try {
        detected = localStorage.getItem("theme")
      } catch (e) {
        detected = null
      }

      if (detected === "light" || detected === "dark" || detected === "system") {
        theme = detected as ToasterProps["theme"]
      } else {
        const htmlClass = document?.documentElement?.classList
        if (htmlClass?.contains && htmlClass.contains("dark")) {
          theme = "dark"
        } else if (htmlClass?.contains && htmlClass.contains("light")) {
          theme = "light"
        } else {
          theme = "system"
        }
      }
    }
  } catch (err) {
    // If detection fails (e.g., strict CSP), fall back to 'system'
    theme = "system"
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
