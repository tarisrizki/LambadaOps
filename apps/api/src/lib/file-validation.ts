/**
 * Verifies if the file buffer matches the expected Magic Numbers (file signatures).
 * This prevents malicious users from uploading executables disguised with safe extensions.
 */
export function validateMagicNumber(buffer: Buffer, declaredMimeType: string): boolean {
  if (buffer.length < 4) {
    return false;
  }

  // Read first 4 bytes as hex
  const hex = buffer.toString('hex', 0, 4).toUpperCase();

  switch (declaredMimeType) {
    case 'image/jpeg':
      // JPEG starts with FF D8 FF
      return hex.startsWith('FFD8FF');
    case 'image/png':
      // PNG starts with 89 50 4E 47
      return hex === '89504E47';
    case 'application/pdf':
      // PDF starts with 25 50 44 46 (%PDF)
      return hex === '25504446';
    default:
      return false;
  }
}

/**
 * Sanitizes a filename to prevent directory traversal and script injection.
 * Replaces non-alphanumeric (and non-safe) characters with underscores.
 */
export function sanitizeFilename(filename: string): string {
  // Extract extension safely
  const parts = filename.split('.');
  const ext = parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : '';
  const base = parts.join('.');
  
  // Replace anything that is not alphanumeric, dash, or underscore
  const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return `${sanitizedBase}${ext}`;
}
