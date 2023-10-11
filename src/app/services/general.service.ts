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
  updateFilesUserDB(idUser: any, objUser: any) {
    return this.afs
      .collection('proveedoresExternos')
      .doc(idUser)
      .update(objUser);
  }

  deleteFile(path: any) {
    return this.storage.ref(path).delete();
  }

  updateUserDB(id: string, obj: any) {
    return this.afs.collection('proveedoresExternos').doc(id).update(obj);
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
}
