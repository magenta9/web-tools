/**
 * Clipboard utility functions
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}

export async function pasteFromClipboard(): Promise<string | null> {
  try {
    const text = await navigator.clipboard.readText()
    return text
  } catch (err) {
    console.error('Failed to read from clipboard:', err)
    return null
  }
}
