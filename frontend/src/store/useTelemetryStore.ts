import { create } from 'zustand';

export interface AssetTelemetry {
  id: string;
  vibration_x: number;
  temperature: number;
  motor_current: number;
  pressure: number;
  rul: number;
  health: "Healthy" | "Warning" | "Critical";
}

export interface TelemetryData {
  timestamp: number;
  assets: AssetTelemetry[];
}

interface TelemetryState {
  data: TelemetryData | null;
  status: 'connected' | 'disconnected' | 'connecting';
  connect: () => void;
  disconnect: () => void;
  getAsset: (id: string) => AssetTelemetry | undefined;
}

let ws: WebSocket | null = null;

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  data: null,
  status: 'disconnected',

  connect: () => {
    if (ws) return; // already connecting/connected
    set({ status: 'connecting' });
    ws = new WebSocket("ws://localhost:8000/ws/telemetry");

    ws.onopen = () => set({ status: 'connected' });
    ws.onclose = () => {
      set({ status: 'disconnected' });
      ws = null;
    };
    ws.onmessage = (event) => {
      set({ data: JSON.parse(event.data) });
    };
  },

  disconnect: () => {
    if (ws) {
      ws.close();
      ws = null;
    }
  },

  getAsset: (id: string) => {
    const data = get().data;
    return data?.assets.find((a) => a.id === id);
  }
}));
