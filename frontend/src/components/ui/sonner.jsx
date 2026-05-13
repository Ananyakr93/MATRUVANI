import { Toaster as SonnerToaster } from "sonner"

function Toaster(props) {
  return (
    <SonnerToaster
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:font-medium",
          description: "group-[.toast]:text-gray-500",
          actionButton:
            "group-[.toast]:bg-green-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500",
          success:
            "group-[.toaster]:!bg-green-50 group-[.toaster]:!text-green-800 group-[.toaster]:!border-green-200",
          error:
            "group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-800 group-[.toaster]:!border-red-200",
          info:
            "group-[.toaster]:!bg-blue-50 group-[.toaster]:!text-blue-800 group-[.toaster]:!border-blue-200",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
