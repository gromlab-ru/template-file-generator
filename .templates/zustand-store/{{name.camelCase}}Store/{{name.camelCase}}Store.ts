import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { {{name.pascalCase}}State, {{name.pascalCase}}Store } from './{{name.camelCase}}Store.type';

export const defaultInitState: {{name.pascalCase}}State = {
  deviceId: null,
};

const setDeviceId = (state: {{name.pascalCase}}Store, deviceId: string) => {
  state.deviceId = deviceId;
};

export const use{{name.pascalCase}}Store = create<{{name.pascalCase}}Store>()(
  devtools(
    persist(
      immer<{{name.pascalCase}}Store>((set) => ({
        ...defaultInitState,
        setDeviceId: (deviceId) => set((state) => setDeviceId(state, deviceId)),
      })),
      {
        name: '{{name.kebabCase}}-storage',
      }
    ),
    { name: '{{name.pascalCase}}Store' }
  )
);
