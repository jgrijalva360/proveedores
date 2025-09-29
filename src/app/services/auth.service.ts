import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, map, Observable, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  idUser = '';
  user = {} as any;

  constructor(private afs: AngularFirestore) {}

  getUser(email: string, pass: string) {
    return this.afs
      .collection(
        'usersPublic',
        (ref) =>
          ref.where('email', '==', email) && ref.where('pass', '==', pass)
      )
      .snapshotChanges()
      .pipe(
        map((actions) => {
          return actions.map((a) => {
            const data = a.payload.doc.data() as any;
            data.id = a.payload.doc.id;
            this.idUser = data.id;
            return data;
          });
        })
      );
  }
}
