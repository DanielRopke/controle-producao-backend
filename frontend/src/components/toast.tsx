import { toast } from 'sonner'

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
	if (type === 'error') return toast.error(message)
	if (type === 'info') return toast(message)
	return toast.success(message)
}

export default showToast
