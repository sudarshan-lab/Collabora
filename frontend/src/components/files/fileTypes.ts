export const SUPPORTED_FILE_TYPES = [
    '.pdf',
    '.docx',
    '.xlsx',
    '.pptx',
    '.txt',
    '.jpg',
    '.jpeg',
    '.png',
  ] as const;
  
  export const FILE_TYPE_ICONS: Record<string, string> = {
    'application/pdf': '📄',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📑',
    'text/plain': '📝',
    'image/jpeg': '🖼️',
    'image/png': '🖼️',
  };
  
  export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB