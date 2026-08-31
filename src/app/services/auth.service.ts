import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, map, Observable, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  idUser = '';
  user = {} as any;
  private userCache: Map<string, Observable<any>> = new Map();

  constructor(private afs: AngularFirestore) { }

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
