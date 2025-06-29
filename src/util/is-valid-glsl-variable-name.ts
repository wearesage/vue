export function isValidGLSLVariableName(name: string): boolean {
  if (!name || name.length === 0) return false;
  if (!/^[a-zA-Z_]/.test(name)) return false;
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return false;
  return true;
}