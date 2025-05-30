
import * as React from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast> & { id: string }
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      if (toastId) {
        toastTimeouts.set(
          toastId,
          setTimeout(() => {
            toastTimeouts.delete(toastId)
          }, TOAST_REMOVE_DELAY)
        )
      } else {
        for (const [, timeout] of toastTimeouts) {
          clearTimeout(timeout)
        }
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
              }
            : t
        ),
      }
    }

    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

// Create a singleton instance that can be imported directly
const useToast = () => {
  const [state, dispatch] = React.useReducer(reducer, {
    toasts: [],
  })

  React.useEffect(() => {
    return () => {
      for (const [, timeout] of toastTimeouts) {
        clearTimeout(timeout)
      }
    }
  }, [])

  const toast = React.useMemo(
    () => ({
      ...state,
      toast: (props: Omit<ToasterToast, "id">) => {
        const id = genId()

        dispatch({
          type: actionTypes.ADD_TOAST,
          toast: {
            id,
            ...props,
          },
        })

        return id
      },
      update: (props: Partial<ToasterToast> & { id: string }) => {
        dispatch({
          type: actionTypes.UPDATE_TOAST,
          toast: props,
        })
      },
      dismiss: (toastId?: string) => {
        dispatch({
          type: actionTypes.DISMISS_TOAST,
          toastId,
        })
      },
      remove: (toastId?: string) => {
        dispatch({
          type: actionTypes.REMOVE_TOAST,
          toastId,
        })
      },
    }),
    [state]
  )

  return toast
}

// Create a singleton instance for direct imports
const toast = (props: Omit<ToasterToast, "id">) => {
  const { toast: toastFunction } = useToast()
  return toastFunction(props)
}

// Export both the hook and the singleton function
export { useToast, toast }
export type { ToasterToast }
