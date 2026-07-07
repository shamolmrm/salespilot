import { contextBridge, ipcRenderer } from 'electron';

// Strict allowlist — only these channels can be invoked from the renderer
const ALLOWED_CHANNELS = [
  'store-refresh-token',
  'get-refresh-token',
  'clear-refresh-token',
  'store-email-credentials',
  'get-email-credentials',
  'clear-email-credentials',
] as const;

type AllowedChannel = (typeof ALLOWED_CHANNELS)[number];

function isAllowed(channel: string): channel is AllowedChannel {
  return (ALLOWED_CHANNELS as readonly string[]).includes(channel);
}

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    if (!isAllowed(channel)) {
      return Promise.reject(new Error(`IPC channel "${channel}" is not permitted`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },
});
