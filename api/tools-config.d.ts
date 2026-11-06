export interface ToolSettingsFile {
  version: 1
  overrides: Record<string, boolean>
  customTools: Array<{ id: string; title: string; href: string; icon: string; enabled: boolean }>
}
export default function handler(request: any, response: any, env?: Record<string, string | undefined>): Promise<unknown>
