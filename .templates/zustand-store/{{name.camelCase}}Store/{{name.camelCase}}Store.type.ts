export type {{name.pascalCase}}State = {
  deviceId: string | null;
};

export type {{name.pascalCase}}Actions = {
  setDeviceId: (deviceId: string) => void;
};

export type {{name.pascalCase}}Store = {{name.pascalCase}}State & {{name.pascalCase}}Actions;
