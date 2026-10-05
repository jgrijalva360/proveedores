import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { BehaviorSubject, map, Observable, of, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  idUser = '';
  user = {} as any;
  public authState$: Observable<any>;
  private userCache: Map<string, Observable<any>> = new Map();

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
    this.authState$ = this.afAuth.authState;
  }

  loginWithFirebaseAuth(email: string, pass: string) {
    return this.afAuth.signInWithEmailAndPassword(email, pass);
  }

  sendVerificationEmail() {
    return this.afAuth.currentUser.then(u => {
      if (u) {
        return u.sendEmailVerification();
      }
      return Promise.reject('No hay usuario activo');
    });
  }

  sendPasswordReset(email: string) {
    return this.afAuth.sendPasswordResetEmail(email);
  }

  signOut() {
    return this.afAuth.signOut();
  }

  getUser(email: string, pass: string): Observable<any> {
    const cacheKey = `${email}_${pass}`;

    if (!this.userCache.has(cacheKey)) {
      const encodedPass = window.btoa(pass);
      const user$ = this.afs
        .collection('usersPublic', (ref) => ref.where('email', '==', email))
        .snapshotChanges()
        .pipe(
          map((actions) => {
            return actions
              .map((a) => {
                const data = a.payload.doc.data() as any;
                data.id = a.payload.doc.id;
                this.idUser = data.id;
                return data;
              })
              .filter((user) => {
                const userPass = user.pass || user.password || '';
                return userPass === pass || userPass === encodedPass;
              });
          }),
          shareReplay(1)
        );

      this.userCache.set(cacheKey, user$);
    }

    return this.userCache.get(cacheKey)!;
  }
}

