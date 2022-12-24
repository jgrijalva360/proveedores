import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map } from 'rxjs';

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
      .snapshotChanges()
      .pipe(
        map((actions) => {
          return actions.map((a) => {
            const data = a.payload.doc.data() as any;
            data.id = a.payload.doc.id;
            return data;
          });
        })
      );
  }

  saveUserDB(objUser: any) {
    return this.afs
      .collection('proveedoresExternos')
      .doc(objUser.id)
      .update(objUser);
  }
  updateFilesUserDB(objUser: any) {
    return this.afs
      .collection('proveedoresExternos')
      .doc(objUser.id)
      .update(objUser);
  }
}
