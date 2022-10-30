import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  ngOnInit(): void {}

  // dataUser = {};
  // proyectos = [];
  // isAdmin: boolean | undefined;
  // idCompany: undefined;
  // ruta: undefined;
  // imgProy = [];
  // sinProyectos = false;
  // userType: undefined;
  // subscriberURL: Subscription | undefined;
  // subscriberRoleUser: Subscription | undefined;
  // subscriberGetProjects: Subscription | undefined;
  // subscriberGetDashboard: Subscription | undefined;
  // constructor(
  //   private empresasService: EmpresasService,
  //   private authService: AuthService,
  //   private router: Router,
  //   private route: ActivatedRoute
  // ) {}
  // ngOnInit() {
  //   this.ruta = this.router.parseUrl(this.router.url);
  //   this.subscriberURL = this.route.params.subscribe(params => {
  //     this.idCompany = params['id'];
  //   });
  //   this.authService.isLogin().then(result => {
  //     this.dataUser = result;
  //     this.subscriberRoleUser = this.authService
  //       .roleUser(this.dataUser.uid)
  //       .subscribe(res => {
  //         const idUser = res[0].id;
  //         this.userType = res[0].userType;
  //         if (this.userType === 'Administrador') {
  //           this.subscriberGetProjects = this.empresasService
  //             .getProject(this.idCompany)
  //             .subscribe(proyectos => {
  //               this.sinProyectos = true;
  //               this.proyectos = proyectos;
  //             });
  //         } else {
  //           this.subscriberGetDashboard = this.empresasService
  //             .getProjectFil(this.idCompany, idUser)
  //             .subscribe(proyectos => {
  //               if (proyectos.length === 0) {
  //                 this.sinProyectos = false;
  //               } else {
  //                 this.sinProyectos = true;
  //                 this.proyectos = proyectos;
  //               }
  //             });
  //         }
  //       });
  //   });
  // }
  // toggle() {
  //   $('#sidebar').toggleClass('active');
  //   $('.overlay').toggleClass('active');
  // }
  // ngOnDestroy() {
  //   if (this.subscriberURL) {
  //     this.subscriberURL.unsubscribe();
  //   }
  //   if (this.subscriberRoleUser) {
  //     this.subscriberRoleUser.unsubscribe();
  //   }
  //   if (this.subscriberGetProjects) {
  //     this.subscriberGetProjects.unsubscribe();
  //   }
  //   if (this.subscriberGetDashboard) {
  //     this.subscriberGetDashboard.unsubscribe();
  //   }
  // }
}
