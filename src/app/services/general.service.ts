import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
  constructor(private afs: AngularFirestore) {}

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

  getUserDB(uid: string) {
    return this.afs
      .collection('proveedoresExternos', (ref) => ref.where('uid', '==', uid))
      .valueChanges();
  }
}
