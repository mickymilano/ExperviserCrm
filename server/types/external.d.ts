// Definizioni di tipo per moduli esterni senza tipi propri

declare module 'papaparse' {
  export function parse(csv: string, config?: any): any;
  export function unparse(data: any, config?: any): string;
}