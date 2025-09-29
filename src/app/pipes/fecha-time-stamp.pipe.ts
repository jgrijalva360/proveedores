import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechaTimeStamp',
})
export class FechaTimeStampPipe implements PipeTransform {
  transform(
    value: any,
    ...args: unknown[]
  ): string | number | Date | null | undefined {
    let fecha: Date;
    if (value.seconds) {
      fecha = new Date(value.seconds * 1000);
    } else {
      fecha = value;
    }
    return fecha;
  }
}
