import { toast } from 'sonner';

/**
 * Show a sonner toast for coin earn/spend events.
 * Called client-side after API responses that include coin data.
 */
export function showCoinToast(amount: number, label: string) {
  if (amount > 0) {
    toast.success(`+${amount} coins`, {
      description: label,
      duration: 3000,
    });
  } else if (amount < 0) {
    toast(`${amount} coins`, {
      description: label,
      duration: 3000,
    });
  }
}
