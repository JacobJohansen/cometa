import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'log'
})
export class LogPipe implements PipeTransform {

  transform(value: unknown): unknown {
    console.log('LogPipe:', JSON.parse(JSON.stringify(value)))
    return value;
  }

}
