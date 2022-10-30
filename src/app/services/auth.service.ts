import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public userData$: Observable<any> | undefined;
  dataUser = {} as any;

  constructor(
    private afsAuth: AngularFireAuth,
    private router: Router,
    private afs: AngularFirestore,
    private storage: AngularFireStorage
  ) {
    this.userData$ = afsAuth.authState;
    this.userData$.subscribe((res) => {
      this.dataUser = res;
    });
  }
  userCollection: AngularFirestoreCollection | undefined;
  userDocument: AngularFirestoreDocument | undefined;
  userData: any;
  prueba: string | undefined;
  userType = {} as any;

  loginEmailUser(email: string, pass: string) {
    return this.afsAuth.signInWithEmailAndPassword(email, pass);
  }
  isLogin() {
    return new Promise((resultado) => {
      return this.afsAuth.onAuthStateChanged((user) => {
        if (user) {
          resultado(user);
        } else {
          this.router.navigate(['/']);
        }
      });
    });
  }
  roleUser(uidUser: any) {
    return this.afs
      .collection('usuarios', (ref) => ref.where('uid', '==', uidUser))
      .snapshotChanges()
      .pipe(
        map((actions: any) => {
          return actions.map((a: any) => {
            const data = a.payload.doc.data() as any;
            data.id = a.payload.doc.id;
            return data;
          });
        })
      );
  }
  logOutUser() {
    return this.afsAuth.signOut();
  }
  getUser() {
    this.userCollection = this.afs.collection('usuarios');
    this.userData = this.userCollection.snapshotChanges().pipe(
      map((actions) => {
        return actions.map((a) => {
          const data = a.payload.doc.data() as any;
          data.id = a.payload.doc.id;
          return data;
        });
      })
    );
    return this.userData;
  }
  getUser2(uid: any) {
    return this.afs
      .collection('usuarios', (ref) => ref.where('uid', '==', uid))
      .valueChanges();
  }
  // Envio los datos a base de autenticacion FIREBASE
  addUser(email: any, password: any) {
    return this.afsAuth.createUserWithEmailAndPassword(email, password);
  }
  // almaceno los datos en la BD
  addUserDB(user: any) {
    this.userCollection = this.afs.collection('proveedoresExternos');
    return this.userCollection.add(user);
  }
  deleteUser(user: any) {}

  editUserDB(user: any) {
    this.userDocument = this.afs.doc(`usuarios/${user.id}`);
    return this.userDocument.update(user);
  }

  editProfile(user: any) {
    return this.afsAuth.currentUser.then((res: any) => res.updateProfile(user));
  }
  emailVerification() {
    this.afsAuth.currentUser.then((res: any) => {
      res
        .sendEmailVerification()
        .then(function () {
          // Email sent.
          alert('Te enviamos una liga de verificacion a tu correo electronico');
        })
        .catch(function (error: any) {
          // An error happened.
          console.log(error);
        });
    });
  }
  deleteImageUser(user: any) {
    // Create a reference to the file to delete
    this.storage.ref;
    const reference = this.storage.ref(user.pathImageProfile);

    // Delete the file
    reference
      .delete()
      .toPromise()
      .then(function () {
        // File deleted successfully
        console.log('Se elimino la imagen correctamente');
      })
      .catch(function (error) {
        // Uh-oh, an error occurred!
        console.log(
          'Se produjo un error al eliminar la imagen o no existia imagen'
        );
      });
  }
  updateUser(user: any) {
    return this.afs.collection('usuarios').doc(user.id).update(user);
  }

  getPremissions() {
    return this.afs.collection('permisos').doc('permisos').valueChanges();
  }

  addPremissions(obj: any) {
    this.afs.collection('permisos').doc('permisos').set(obj);
  }

  addPerfiles(obj: any) {
    return this.afs.collection('perfiles').add(obj);
  }
  updatePerfiles(perfiles: any, id: any) {
    const obj = Object.assign({}, perfiles);

    return this.afs.collection('perfiles').doc(id).update(obj);
  }

  getPerfiles() {
    return this.afs
      .collection('perfiles')
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

  getPerfil(id: any) {
    return this.afs
      .collection('perfiles', (ref) => ref.where('id', '==', id))
      .valueChanges();
  }

  deletePerfil(idDoc: any) {
    return this.afs.collection('perfiles').doc(idDoc).delete();
  }

  resetPass(email: any) {
    return this.afsAuth.sendPasswordResetEmail(email);
  }

  generateCode() {
    const obj = {
      validado: false,
    };
    return this.afs.collection('codes').add(obj);
  }

  readCode(code: any) {
    return this.afs.collection('codes').doc(code).valueChanges();
  }

  editCode(code: any, obj: any) {
    this.afs.collection('codes').doc(code).update(obj);
  }
}
