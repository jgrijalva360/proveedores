import { Component, OnInit } from '@angular/core';
import * as Notiflix from 'notiflix';
import { GeneralService } from 'src/app/services/general.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { autoTable, applyPlugin } from 'jspdf-autotable';

const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-sobres',
  templateUrl: './sobres.component.html',
  styleUrls: ['./sobres.component.css'],
})
export class SobresComponent {
  sobre = 0;
  userDB = {} as any;
  idUser: any;
  arrSobres: any[] = [];

  constructor(
    private generalService: GeneralService,
    private storage: AngularFireStorage
  ) {}

  ngOnInit(): void {
    // const url = this.router.parseUrl(this.router.url);
    this.idUser = window.sessionStorage.getItem('id') || '';
    this.getUser(this.idUser);
  }

  getUser(idUser: string) {
    // pdfMake.createPdf({}).open();
    this.generalService.getUserId(idUser).subscribe((res: any) => {
      this.userDB = res;
      console.log(this.userDB);
      this.filtrarSobres();
      if (res.sobre) {
        this.sobre = res.sobre + 1;
      } else {
        this.sobre = 1;
      }
    });
  }

  filtrarSobres() {
    const sobresMap: { [key: number]: any[] } = {};

    if (Array.isArray(this.userDB.xml)) {
      this.userDB.xml.forEach((item: any) => {
        const sobreNum = item.sobre || 1;
        if (!sobresMap[sobreNum]) {
          sobresMap[sobreNum] = [];
        }
        sobresMap[sobreNum].push(item);
      });
    } else {
      this.userDB.xml = [];
    }

    this.arrSobres = Object.keys(sobresMap).map(
      (key) => sobresMap[Number(key)]
    );
    console.log(this.arrSobres);
  }

  downloadFile(path: string) {
    console.log(path);
    if (path) {
      const ref = this.storage.ref(path);
      const subscriptionURL = ref.getDownloadURL().subscribe(
        (res: any) => {
          window.open(res, '_blank');
          subscriptionURL.unsubscribe();
        },
        (error: any) => {
          console.error(error);
          switch (error.code) {
            case 'storage/object-not-found':
              // File doesn't exist
              break;
            case 'storage/unauthorized':
              // User doesn't have permission to access the object
              break;
            case 'storage/canceled':
              // User canceled the upload
              break;
            case 'storage/unknown':
              // Unknown error occurred, inspect the server response
              break;
          }
        }
      );
    }
  }

  downloadExcel(arr: any[]) {
    const arrFiltered = arr.map((item: any, index: number) => {
      return {
        No: index + 1,
        PARTIDA: item.partida,
        FECHA: item.fecha,
        PROVEEDOR: item.proveedor,
        CONCEPTO: item.concepto,
        RFC: item.rfc,
        FOLIO: item.folioComprobante,
        INVENTARIO: item.inventario,
        IMPORTE: item.subtotal || 0,
        IVA: item.iva || 0,
        RETENCION_IVA: item.retIVA || 0,
        RETENCION_ISR: item.retISR || 0,
        DESCUENTO: item.descuento || 0,
        TOTAL: item.total || 0,
      };
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(arrFiltered);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.saveAsExcelFile(excelBuffer, 'Sobre ' + this.sobre);
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    saveAs(data, fileName + EXCEL_EXTENSION);
  }

  deleteSobre(numSobre: number) {
    Notiflix.Confirm.show(
      'Eliminar sobre',
      '¿Estas seguro de eliminar el sobre?',
      'Confirmar',
      'Cancelar',
      () => {
        this.userDB.xml.forEach((element: any) => {
          if (element.sobre === numSobre) {
            this.storage.ref(element.pathXML).delete();
          }
        });
        this.userDB.xml = this.userDB.xml.filter(
          (item: any) => item.sobre !== numSobre
        );
        this.generalService
          .updateUser(this.idUser, this.userDB.sobre, this.userDB.xml)
          .then((res) => {
            Notiflix.Notify.success('Se eliminó el sobre correctamente');
            // this.getUser(this.idUser);
          })
          .catch((error) => {
            Notiflix.Notify.failure('Ocurrió un error al eliminar el sobre');
            console.error('Error al eliminar el sobre:', error);
          });
      }
    );
  }

  generatePDF(sobre: any) {
    // console.log(sobre);

    let arrFiltered = sobre.map((item: any, index: number) => {
      return [
        index + 1,
        item.partida,
        new Date(item.fecha).toLocaleString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
        item.proveedor,
        item.concepto,
        item.rfc,
        '...' + item.folioComprobante.slice(-12),
        item.inventario,
        (item.subtotal || 0).toFixed(2),
        (item.iva || 0).toFixed(2),
        (item.retIVA || 0).toFixed(2),
        (item.retISR || 0).toFixed(2),
        (item.descuento || 0).toFixed(2),
        (item.total || 0).toFixed(2),
      ];
    });

    // arrFiltered = arrFiltered.concat(arrFiltered, arrFiltered, arrFiltered);

    console.log(arrFiltered);

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: 'letter',
    });

    doc.setFontSize(14);
    doc.text(`Formato de comprobacion`, 5.5, 0.5, {
      align: 'center',
    });
    doc.setFontSize(12);
    doc.text(`Sobre: ${sobre[0].sobre}`, 0.5, 0.8);

    autoTable(doc, {
      head: [
        [
          '#',
          'Partida',
          'Fecha',
          'Proveedor',
          'Concepto',
          'RFC',
          'Folio',
          'Inventario',
          'Importe',
          'IVA',
          'Retención IVA',
          'Retención ISR',
          'Descuento',
          'Total',
        ],
      ],
      body: arrFiltered,
      headStyles: {
        fillColor: [0, 102, 131],
      },
      foot: [
        [
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          'Total',
          arrFiltered
            .reduce((acc: any, item: any) => acc + parseFloat(item[8]), 0)
            .toFixed(2),
          arrFiltered
            .reduce((acc: any, item: any) => acc + parseFloat(item[9]), 0)
            .toFixed(2),
          arrFiltered
            .reduce((acc: any, item: any) => acc + parseFloat(item[10]), 0)
            .toFixed(2),
          arrFiltered
            .reduce((acc: any, item: any) => acc + parseFloat(item[11]), 0)
            .toFixed(2),
          arrFiltered
            .reduce((acc: any, item: any) => acc + parseFloat(item[12]), 0)
            .toFixed(2),
          arrFiltered
            .reduce((acc: any, item: any) => acc + parseFloat(item[13]), 0)
            .toFixed(2),
        ],
      ],
      footStyles: {
        fillColor: [0, 102, 131],
      },
      startY: 1,
      styles: {
        fontSize: 6,
        halign: 'center',
        valign: 'middle',
        minCellWidth: 0.5,
      },
      margin: { top: 1, left: 0.5, right: 0.5 },
      showFoot: 'lastPage',
    });

    doc.text(`___________________________`, 0.5, 7.8);
    doc.text(`Revisado por`, 1.2, 8);

    doc.text(`___________________________`, 4.3, 7.8);
    doc.text(`Autorizado por`, 5, 8);

    doc.text(`___________________________`, 8, 7.8);
    doc.text(`Revisado por`, 8.8, 8);

    doc.save(`Sobre_${this.sobre}.pdf`);
  }
}
