export interface Provider {
  aprobado: boolean;
  id: string;
  numero?: number;
  rfc?: string;
  persona?: string;
  nacionalidad?: string;
  nombre?: string;
  calle?: string;
  numExt?: number;
  numInt?: number;
  estado?: string;
  ciudad?: string;
  localidad?: string;
  cp?: string;
  regimen?: string;
  telefono?: number;
  movil?: number;
  email?: string;
  nombreBanco?: string;
  cuenta?: string;
  clabe?: string;
  taxId?: string;
  banks?: any;
  empresas?: any;
  archivos?: any;
  archivosRepse?: any;
  repse?: string;
  fechaRegistro: any;
  files: any;
  dealMemos: any[];
  actualizado?: boolean;
}

export interface Bank {
  nombre?: string;
  banco?: string;
  cuenta?: string;
  clabe?: string;
}
