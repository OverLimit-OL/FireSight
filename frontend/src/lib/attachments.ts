const accepted: Record<string, string[]> = {
  pdf: ['application/pdf'],
  csv: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
  txt: ['text/plain'],
  json: ['application/json', 'text/json', 'text/plain'],
}
export function validateFile(file: Pick<File, 'name' | 'type' | 'size'>): string | null {
  const ext = file.name.split('.').at(-1)?.toLowerCase() ?? ''
  if (!accepted[ext] || (file.type && !accepted[ext].includes(file.type)))
    return 'Choose PDF, CSV, TXT or JSON files with a matching file type.'
  if (file.size > 10 * 1024 * 1024) return 'Each file must be 10 MiB or smaller.'
  return null
}
