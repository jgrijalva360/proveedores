export interface Provider {
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
  banks?: Array<Bank> | undefined;
  documentos?: Array<any>;
}

export interface Bank {
  nombre?: string;
  cuenta?: string;
  clabe?: string;
}
