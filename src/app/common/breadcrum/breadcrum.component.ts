import { Component } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

@Component({
  selector: 'app-breadcrum',
  templateUrl: './breadcrum.component.html',
  styleUrls: ['./breadcrum.component.css'],
})
export class BreadcrumComponent {
  breadcrumbs: Array<{ label: string; url: string }> = [];

  constructor(private router: Router) {}

  ngOnInit() {
    // Subscribe to the router events to update breadcrumbs on navigation
    this.router.events.subscribe(() => {
      const root: ActivatedRouteSnapshot =
        this.router.routerState.snapshot.root;
      this.breadcrumbs = this.buildBreadCrumb(root);
    });
  }

  buildBreadCrumb(
    route: ActivatedRouteSnapshot,
    url: string = '',
    breadcrumbs: Array<{ label: string; url: string }> = []
  ): Array<{ label: string; url: string }> {
    const children: ActivatedRouteSnapshot[] = route.children;

    // console.log('breadcrumbs', breadcrumbs);

    if (route.data && route.data['breadcrumb']) {
      if (route.data['breadcrumb'] === 'Proveedor') {
        breadcrumbs.push({
          label: route.params['id'],
          url: url || '/',
        });
      } else {
        breadcrumbs.push({
          label: String(route.data['breadcrumb']),
          url: url || '/',
        });
      }
    }

    if (children.length === 0) {
      return breadcrumbs;
    }

    return this.buildBreadCrumb(
      children[0],
      `${url}/${children[0].url}`,
      breadcrumbs
    );
  }
}
