import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, map } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
  user$: Observable<any> | undefined;

  private userCache: Map<string, Observable<any>> = new Map();
  private orderCache: Map<string, Observable<any>> = new Map();

  constructor(
    private afs: AngularFirestore,
    public storage: AngularFireStorage
  ) {}

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
      xml: arrXML,
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
    rfc: string
  ): Observable<any> {
    const cacheKey = `${idCompany}_${idProject}_${rfc}`;

    if (!this.orderCache.has(cacheKey)) {
      // console.log('Fetching orders from Firestore...');
      const orders$ = this.afs
        .collection('empresas')
        .doc(idCompany)
        .collection('proyectos')
        .doc(idProject)
        .collection('purchaseOrder', (ref) => ref.where('rfc', '==', rfc))
        .snapshotChanges()
        .pipe(
          map((actions) =>
            actions.map((a) => {
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
}
