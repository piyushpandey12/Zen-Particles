import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
  FunctionDeclaration,
  Tool
} from '@google/genai';

// Types for callback
type TensionCallback = (tension: number) => void;

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private videoInterval: number | null = null;
  private onTensionUpdate: TensionCallback | null = null;
  private lastTension: number = 0;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public setTensionCallback(callback: TensionCallback) {
    this.onTensionUpdate = callback;
  }

  public async connect() {
    // Define the tool for the model to call
    const setTensionTool: FunctionDeclaration = {
      name: 'setHandTension',
      description: 'Set the current visual tension level based on the user\'s hand openness. 0 is closed (fist), 1 is fully open.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          level: {
            type: Type.NUMBER,
            description: 'The tension level from 0.0 to 1.0',
          },
        },
        required: ['level'],
      },
    };

    const tools: Tool[] = [{ functionDeclarations: [setTensionTool] }];

    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log('Gemini Live Session Opened');
        },
        onmessage: (message: LiveServerMessage) => {
          // Handle Tool Calls
          if (message.toolCall) {
            this.handleToolCall(message.toolCall);
          }
        },
        onclose: () => {
          console.log('Gemini Live Session Closed');
        },
        onerror: (err) => {
          console.error('Gemini Live Error:', err);
        }
      },
      config: {
        responseModalities: [Modality.AUDIO], // We mostly want the tool calls, but audio is required
        tools: tools,
        systemInstruction: `
          You are a visual meditation assistant. 
          Your task is to watch the video stream.
          If you see a hand, analyze how "open" it is.
          - Closed Fist = 0.0
          - Fully Open Palm = 1.0
          - Partial = in between.
          Continuously call the 'setHandTension' function with the estimated value.
          Be responsive. If no hand is visible, set it to 0.5.
          Do not speak much, just focus on calling the function to update the visualizer.
        `,
      }
    });

    await this.sessionPromise;
  }

  private handleToolCall(toolCall: any) {
    for (const fc of toolCall.functionCalls) {
      if (fc.name === 'setHandTension') {
        const level = fc.args.level;
        // console.log('Tension Update:', level);
        if (typeof level === 'number') {
          this.lastTension = Math.max(0, Math.min(1, level));
          if (this.onTensionUpdate) {
            this.onTensionUpdate(this.lastTension);
          }
        }

        // Must respond to the tool call
        this.sessionPromise?.then(session => {
            session.sendToolResponse({
                functionResponses: {
                    id: fc.id,
                    name: fc.name,
                    response: { result: 'ok' }
                }
            });
        });
      }
    }
  }

  public startVideoStream(videoElement: HTMLVideoElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const FPS = 2; // Low FPS is enough for this interaction and saves bandwidth/tokens
    const JPEG_QUALITY = 0.5;

    this.videoInterval = window.setInterval(async () => {
      if (!ctx || !videoElement.videoWidth) return;

      canvas.width = videoElement.videoWidth * 0.5; // Downscale
      canvas.height = videoElement.videoHeight * 0.5;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];

      if (this.sessionPromise) {
        this.sessionPromise.then((session) => {
          session.sendRealtimeInput({
            media: {
              mimeType: 'image/jpeg',
              data: base64
            }
          });
        });
      }
    }, 1000 / FPS);
  }

  public stop() {
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }
    // No explicit close method on session object in the provided snippet,
    // usually we just stop sending data.
  }
}

export const geminiLiveService = new GeminiLiveService();
