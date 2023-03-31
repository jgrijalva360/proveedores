import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
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

  getUserId(id: string) {
    return this.afs.collection('proveedoresExternos').doc(id).valueChanges();
  }

  getUserDB(idUser: string) {
    return this.afs
      .collection('proveedoresExternos')
      .doc(idUser)
      .valueChanges();
  }

  saveUserDB(objUser: any, idUser: string) {
    return this.afs
      .collection('proveedoresExternos')
      .doc(idUser)
      .update(objUser);
  }
  updateFilesUserDB(objUser: any) {
    return this.afs
      .collection('proveedoresExternos')
      .doc(objUser.id)
      .update(objUser);
  }

  deleteFile(path: any) {
    return this.storage.ref(path).delete();
  }

  updateUserDB(id: string, obj: any) {
    return this.afs.collection('proveedoresExternos').doc(id).update(obj);
  }
}
