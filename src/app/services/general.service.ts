import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, map, of, BehaviorSubject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export interface ResumenPagos {
  numPendientes: number;
  tieneVencidos: boolean;
  tieneProximos: boolean;
  vencidosCount: number;
  proximosCount: number;
  rechazadosCount: number;
}

export interface ResumenArchivosMensuales {
  numPendientes: number;
  tieneRechazados: boolean;
  csfPendiente: boolean;
  d32Pendiente: boolean;
  csfRechazado: boolean;
  d32Rechazado: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class GeneralService {
  user$: Observable<any> | undefined;

  private userCache: Map<string, Observable<any>> = new Map();
  private orderCache: Map<string, Observable<any>> = new Map();

  constructor(
    private afs: AngularFirestore,
    public storage: AngularFireStorage
  ) { }

  getXMLPublic(idCompany: string, idProject: string, RFC: string) {
    return this.afs
      .collection('empresas')
      .doc(idCompany)
      .collection('proyectos')
      .doc(idProject)
      .collection('XMLPublic')
      .doc(RFC)
      .valueChanges();
  }

  getUserId(id: string): Observable<any> {
    if (!id) {
      return of(undefined);
    }
    if (!this.userCache.has(id)) {
      const user$ = this.afs
        .collection('usersPublic')
        .doc(id)
        .valueChanges()
        .pipe(shareReplay(1));

      this.userCache.set(id, user$);
    }
    return this.userCache.get(id)!;
  }

  updateUser(id: string, sobre: number, arrXML: Array<any>) {
    return this.afs.collection('usersPublic').doc(id).update({
      sobre: sobre,
      xml: arrXML
    });
  }

  getUserDB(idUser: string) {
    return this.afs.collection('usersPublic').doc(idUser).valueChanges();
  }

  saveUserDB(objUser: any, idUser: string) {
    return this.afs.collection('usersPublic').doc(idUser).update(objUser);
  }
  updateFilesUserDB(idUser: any, objUser: any) {
    return this.afs.collection('usersPublic').doc(idUser).update(objUser);
  }

  deleteFile(path: any) {
    return this.storage.ref(path).delete();
  }

  updateUserDB(id: string, obj: any) {
    return this.afs.collection('usersPublic').doc(id).update(obj);
  }

  mesATexto(value: number) {
    let letrasMes = '';
    switch (value) {
      case 1:
        letrasMes = 'Enero';
        break;
      case 2:
        letrasMes = 'Febrero';
        break;
      case 3:
        letrasMes = 'Marzo';
        break;
      case 4:
        letrasMes = 'Abril';
        break;
      case 5:
        letrasMes = 'Mayo';
        break;
      case 6:
        letrasMes = 'Junio';
        break;
      case 7:
        letrasMes = 'Julio';
        break;
      case 8:
        letrasMes = 'Agosto';
        break;
      case 9:
        letrasMes = 'Septiembre';
        break;
      case 10:
        letrasMes = 'Octubre';
        break;
      case 11:
        letrasMes = 'Noviembre';
        break;
      case 12:
        letrasMes = 'Diciembre';
        break;
    }
    return letrasMes;
  }

  getOrdenes(
    idCompany: string,
    idProject: string,
    tipo: string,
    propiedad: string
  ): Observable<any> {
    const cacheKey = `${idCompany}_${idProject}_${propiedad}`;

    if (!this.orderCache.has(cacheKey)) {
      // console.log('Fetching orders from Firestore...');
      const orders$ = this.afs
        .collection('empresas')
        .doc(idCompany)
        .collection('proyectos')
        .doc(idProject)
        .collection('purchaseOrder', ref => ref.where(tipo, '==', propiedad))
        .snapshotChanges()
        .pipe(
          map(actions =>
            actions.map(a => {
              const data = a.payload.doc.data();
              data.id = a.payload.doc.id;
              return data;
            })
          ),
          shareReplay(1)
        );

      this.orderCache.set(cacheKey, orders$);
    } else {
      // console.log('Returning cached orders...');
    }
    return this.orderCache.get(cacheKey)!;
  }

  getOrdenesAdmin(idCompany: string, idProject: string): Observable<any> {
    const cacheKey = `${idCompany}_${idProject}_${'admin'}`;

    if (!this.orderCache.has(cacheKey)) {
      // console.log('Fetching orders from Firestore...');
      const orders$ = this.afs
        .collection('empresas')
        .doc(idCompany)
        .collection('proyectos')
        .doc(idProject)
        .collection('purchaseOrder')
        .snapshotChanges()
        .pipe(
          map(actions =>
            actions.map(a => {
              const data = a.payload.doc.data();
              data.id = a.payload.doc.id;
              return data;
            })
          ),
          shareReplay(1)
        );

      this.orderCache.set(cacheKey, orders$);
    } else {
      // console.log('Returning cached orders...');
    }
    return this.orderCache.get(cacheKey)!;
  }

  updateOrden(idCompany: string, idProject: string, idOrder: string, obj: any) {
    console.log(idCompany, idProject, idOrder, obj);
    return this.afs
      .collection('empresas')
      .doc(idCompany)
      .collection('proyectos')
      .doc(idProject)
      .collection('purchaseOrder')
      .doc(idOrder)
      .update(obj);
  }

  getproject(idCompany: string, idProject: string): Observable<any> {
    if (!idCompany || !idProject) return of(null);
    return this.afs
      .collection('empresas')
      .doc(idCompany)
      .collection('proyectos')
      .doc(idProject)
      .valueChanges();
  }

  getPreOrden(idCompany: string, idProject: string, rfc: string) {
    return this.afs
      .collection('empresas')
      .doc(idCompany)
      .collection('proyectos')
      .doc(idProject)
      .collection('preOrder', ref => ref.where('rfc', '==', rfc))
      .valueChanges();
  }

  addPreOrden(idCompany: string, idProject: string, obj: any) {
    return this.afs
      .collection('empresas')
      .doc(idCompany)
      .collection('proyectos')
      .doc(idProject)
      .collection('preOrder')
      .add(obj);
  }

  getCompany(idCompany: string): Observable<any> {
    if (!idCompany) return of(null);
    return this.afs.collection('empresas').doc(idCompany).valueChanges();
  }

  getCompanyProjects(idCompany: string): Observable<any[]> {
    if (!idCompany) return of([]);
    return this.afs
      .collection('empresas')
      .doc(idCompany)
      .collection('proyectos')
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as any;
            data.idProject = a.payload.doc.id;
            data.idC = idCompany;
            return data;
          })
        )
      );
  }

  getSolicitudesGXC(idCompany: string, idProject: string, rfc: string): Observable<any[]> {
    return this.afs
      .collection('empresas')
      .doc(idCompany)
      .collection('proyectos')
      .doc(idProject)
      .collection('solicitudes', ref =>
        ref.where('tipo', '==', 'GXC').where('rfc', '==', rfc)
      )
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as any;
            data.id = a.payload.doc.id;
            return data;
          })
        ),
        shareReplay(1)
      );
  }

  updateSolicitud(idCompany: string, idProject: string, idSol: string, data: any) {
    return this.afs
      .collection('empresas')
      .doc(idCompany)
      .collection('proyectos')
      .doc(idProject)
      .collection('solicitudes')
      .doc(idSol)
      .update(data);
  }

  // Búsqueda de usuario por email o RFC
  getUserByEmail(email: string): Observable<any[]> {
    return this.afs
      .collection('usersPublic', ref => ref.where('email', '==', email))
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as any;
            data.id = a.payload.doc.id;
            return data;
          })
        )
      );
  }

  getUserByRFC(rfc: string): Observable<any[]> {
    return this.afs
      .collection('usersPublic', ref => ref.where('rfc', '==', rfc))
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as any;
            data.id = a.payload.doc.id;
            return data;
          })
        )
      );
  }

  getUsersPublicByRFC(rfc: string): Observable<any[]> {
    return this.getUserByRFC(rfc);
  }

  setUsersPublicDoc(idUser: string, data: any) {
    return this.afs.collection('usersPublic').doc(idUser).set(data, { merge: true });
  }

  // CFDIs Directos / Libres
  getCFDIsDirectos(idCompany: string, idProject: string, rfc: string): Observable<any[]> {
    return this.afs
      .collection('empresas')
      .doc(idCompany)
      .collection('proyectos')
      .doc(idProject)
      .collection('CFDIsDirectos', ref => ref.where('rfc', '==', rfc))
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as any;
            data.id = a.payload.doc.id;
            return data;
          })
        )
      );
  }

  addCFDIDirecto(idCompany: string, idProject: string, cfdiData: any) {
    return this.afs
      .collection('empresas')
      .doc(idCompany)
      .collection('proyectos')
      .doc(idProject)
      .collection('CFDIsDirectos')
      .add(cfdiData);
  }

  deleteCFDIDirecto(idCompany: string, idProject: string, idCFDI: string) {
    return this.afs
      .collection('empresas')
      .doc(idCompany)
      .collection('proyectos')
      .doc(idProject)
      .collection('CFDIsDirectos')
      .doc(idCFDI)
      .delete();
  }

  // Resumen de pagos pendientes y estatus
  private resumenPagosSubject = new BehaviorSubject<ResumenPagos>({
    numPendientes: 0,
    tieneVencidos: false,
    tieneProximos: false,
    vencidosCount: 0,
    proximosCount: 0,
    rechazadosCount: 0
  });
  public resumenPagos$: Observable<ResumenPagos> = this.resumenPagosSubject.asObservable();

  setResumenPagos(resumen: ResumenPagos): void {
    this.resumenPagosSubject.next(resumen);
  }

  getResumenPagosActual(): ResumenPagos {
    return this.resumenPagosSubject.getValue();
  }

  convertirAFecha(fechaString: string): Date {
    return new Date(fechaString);
  }

  ultimoViernes(fecha: string): Date {
    const fechaDate = this.convertirAFecha(fecha);
    const diaSemana = fechaDate.getDay();
    const diasParaViernes = (diaSemana + 2) % 7;
    fechaDate.setDate(fechaDate.getDate() - diasParaViernes);
    return new Date(fechaDate);
  }

  fechaFinal(fecha: string): Date {
    const ultimoViernes = this.ultimoViernes(fecha);
    const tresDiasAntes = new Date(ultimoViernes);
    tresDiasAntes.setDate(ultimoViernes.getDate() - 3);
    const primerDiaDelMes = new Date(
      ultimoViernes.getFullYear(),
      ultimoViernes.getMonth(),
      1
    );

    if (tresDiasAntes.getMonth() !== ultimoViernes.getMonth()) {
      tresDiasAntes.setTime(primerDiaDelMes.getTime());
    }

    tresDiasAntes.setHours(23, 59, 59, 999);
    return tresDiasAntes;
  }

  fechaInicial(fecha: string): Date {
    const ultimoViernes = this.fechaFinal(fecha);
    const onceDiasAntes = new Date(ultimoViernes);
    onceDiasAntes.setDate(ultimoViernes.getDate() - 10);
    const primerDiaDelMes = new Date(
      ultimoViernes.getFullYear(),
      ultimoViernes.getMonth(),
      1
    );
    if (onceDiasAntes.getMonth() !== ultimoViernes.getMonth()) {
      onceDiasAntes.setTime(primerDiaDelMes.getTime());
    }

    onceDiasAntes.setHours(0, 0, 0, 0);
    return onceDiasAntes;
  }

  estatusPago(pago: any, today: Date = new Date()): string {
    if (
      today > this.fechaFinal(pago.fechaFin) &&
      (!pago.xml || !pago.pathPDF)
    ) {
      return 'VENCIDO';
    }

    if (
      pago.xml &&
      pago.pathPDF &&
      (pago.aprobadoXML === undefined || pago.aprobadoPDF === undefined)
    ) {
      return 'EN REVISION';
    }

    if (pago.aprobadoXML && pago.aprobadoPDF && pago.estatus === 'Pagado') {
      return 'PAGADO';
    }

    if (pago.aprobadoXML && pago.aprobadoPDF) {
      return 'EN PROCESO DE PAGO';
    }

    if ((!pago.aprobadoXML || !pago.aprobadoPDF) && pago.xml && pago.pathPDF) {
      return 'RECHAZADO';
    }

    if (
      (!pago.xml || !pago.pathPDF) &&
      today >= this.fechaInicial(pago.fechaFin)
    ) {
      return 'PENDIENTE';
    }

    if (
      !pago.xml &&
      !pago.pathPDF &&
      today <= this.fechaInicial(pago.fechaFin)
    ) {
      return 'PRÓXIMO';
    }
    return '';
  }

  calcularResumenPagos(ordenes: any[], today: Date = new Date()): ResumenPagos {
    let vencidosCount = 0;
    let proximosCount = 0;
    let rechazadosCount = 0;

    if (ordenes && Array.isArray(ordenes)) {
      ordenes.forEach((orden: any) => {
        if (orden && orden.comprometidos && Array.isArray(orden.comprometidos)) {
          orden.comprometidos.forEach((pago: any) => {
            const st = this.estatusPago(pago, today);
            if (st === 'VENCIDO') {
              vencidosCount++;
            } else if (st === 'RECHAZADO') {
              rechazadosCount++;
            } else if (st === 'PENDIENTE' || st === 'PRÓXIMO') {
              proximosCount++;
            }
          });
        }
      });
    }

    const tieneVencidos = vencidosCount > 0 || rechazadosCount > 0;
    const tieneProximos = proximosCount > 0;
    const numPendientes = vencidosCount + rechazadosCount + proximosCount;

    const resumen: ResumenPagos = {
      numPendientes,
      tieneVencidos,
      tieneProximos,
      vencidosCount,
      proximosCount,
      rechazadosCount
    };

    this.setResumenPagos(resumen);
    return resumen;
  }

  // Resumen de archivos mensuales (CSF y 32D)
  private resumenArchivosSubject = new BehaviorSubject<ResumenArchivosMensuales>({
    numPendientes: 0,
    tieneRechazados: false,
    csfPendiente: false,
    d32Pendiente: false,
    csfRechazado: false,
    d32Rechazado: false
  });
  public resumenArchivos$: Observable<ResumenArchivosMensuales> = this.resumenArchivosSubject.asObservable();

  setResumenArchivos(resumen: ResumenArchivosMensuales): void {
    this.resumenArchivosSubject.next(resumen);
  }

  getResumenArchivosActual(): ResumenArchivosMensuales {
    return this.resumenArchivosSubject.getValue();
  }

  calcularResumenArchivos(user: any, ordenes?: any[], today: Date = new Date()): ResumenArchivosMensuales {
    const mesActualNombre = today.toLocaleString('es-MX', { month: 'long' }).toLowerCase();
    const archivosUser = user?.archivosMensuales || user?.archivos || {};

    let csfData = archivosUser?.CSF?.[mesActualNombre];
    let d32Data = archivosUser?.['32D']?.[mesActualNombre];

    // Si no está en el usuario, buscar también en las órdenes activas del proveedor
    if ((!csfData?.pathPDF || !d32Data?.pathPDF) && ordenes && Array.isArray(ordenes)) {
      for (const order of ordenes) {
        if (!csfData?.pathPDF && order.archivos?.CSF?.[mesActualNombre]?.pathPDF) {
          csfData = order.archivos.CSF[mesActualNombre];
        }
        if (!d32Data?.pathPDF && order.archivos?.['32D']?.[mesActualNombre]?.pathPDF) {
          d32Data = order.archivos['32D'][mesActualNombre];
        }
        if (csfData?.pathPDF && d32Data?.pathPDF) break;
      }
    }

    const csfSubido = !!(csfData && csfData.pathPDF && csfData.estatus !== 'RECHAZADO');
    const csfRechazado = !!(csfData && csfData.estatus === 'RECHAZADO');
    const csfPendiente = !csfSubido;

    const d32Subido = !!(d32Data && d32Data.pathPDF && d32Data.estatus !== 'RECHAZADO');
    const d32Rechazado = !!(d32Data && d32Data.estatus === 'RECHAZADO');
    const d32Pendiente = !d32Subido;

    let numPendientes = 0;
    if (csfPendiente) numPendientes++;
    if (d32Pendiente) numPendientes++;

    const tieneRechazados = csfRechazado || d32Rechazado;

    const resumen: ResumenArchivosMensuales = {
      numPendientes,
      tieneRechazados,
      csfPendiente,
      d32Pendiente,
      csfRechazado,
      d32Rechazado
    };

    this.setResumenArchivos(resumen);
    return resumen;
  }
}

