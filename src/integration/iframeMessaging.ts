export const SURVEY_MESSAGE_SOURCE = 'neck-width-survey' as const;
export const PARENT_MESSAGE_SOURCE = 'parent-survey' as const;

export type SurveyMessage =
  | { source: typeof SURVEY_MESSAGE_SOURCE; type: 'ready' }
  | { source: typeof SURVEY_MESSAGE_SOURCE; type: 'width-change'; value: number }
  | { source: typeof SURVEY_MESSAGE_SOURCE; type: 'value'; value: number };

interface IframeMessagingOptions {
  getWidth: () => number;
}

export interface IframeMessaging {
  sendReady: () => void;
  sendWidthChange: (width: number) => void;
  dispose: () => void;
}

export function clampNormalizedWidth(width: number): number {
  if (!Number.isFinite(width)) return 0;
  return Math.min(1, Math.max(-1, width));
}

function getParentOrigin(): string {
  const configuredOrigin = import.meta.env.VITE_PARENT_ORIGIN?.trim();
  if (configuredOrigin) {
    const parsedOrigin = new URL(configuredOrigin).origin;
    if (parsedOrigin !== configuredOrigin.replace(/\/$/, '')) {
      throw new Error('VITE_PARENT_ORIGIN must contain an origin without a path.');
    }
    return parsedOrigin;
  }

  if (import.meta.env.DEV) {
    // Local embedding tools can run on arbitrary ports. This relaxed fallback is
    // intentionally development-only; production builds require an explicit origin.
    return '*';
  }

  throw new Error('VITE_PARENT_ORIGIN is required for production builds.');
}

/** Connects the survey to its immediate parent without retaining interaction history. */
export function createIframeMessaging({ getWidth }: IframeMessagingOptions): IframeMessaging {
  const parentOrigin = getParentOrigin();
  const parentWindow = window.parent;

  const send = (message: SurveyMessage) => {
    parentWindow.postMessage(message, parentOrigin);
  };

  const onMessage = (event: MessageEvent) => {
    if (event.source !== parentWindow) return;
    if (parentOrigin !== '*' && event.origin !== parentOrigin) return;
    if (
      typeof event.data !== 'object'
      || event.data === null
      || event.data.source !== PARENT_MESSAGE_SOURCE
      || event.data.type !== 'get-value'
    ) return;

    send({ source: SURVEY_MESSAGE_SOURCE, type: 'value', value: clampNormalizedWidth(getWidth()) });
  };

  window.addEventListener('message', onMessage);

  return {
    sendReady: () => send({ source: SURVEY_MESSAGE_SOURCE, type: 'ready' }),
    sendWidthChange: (width) => send({
      source: SURVEY_MESSAGE_SOURCE,
      type: 'width-change',
      value: clampNormalizedWidth(width),
    }),
    dispose: () => window.removeEventListener('message', onMessage),
  };
}
