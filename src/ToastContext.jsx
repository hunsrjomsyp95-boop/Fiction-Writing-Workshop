import { createContext, useContext } from 'react'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)
export { ToastCtx }
