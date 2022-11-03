import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'home-root',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  title = 'Home';

  constructor() {}

  ngOnInit() {}

  regresar() {
    window.history.go(-1);
  }
}
