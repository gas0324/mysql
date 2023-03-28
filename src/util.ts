import { typeOf } from '@gas0324/utils';

/**
 * 根据类型获取value
 * @param {any} value 值
 */
export function toSqlValue(value: any){
  if(typeOf(value) == 'string'){
    return "'" + value + "'";
  }else{
    return value;
  }
}


/**
 * 数组转sql字符串
 * @param {any[]} values [description]
 * @result 1,'2'
 */
export function sqlJoin(values: any[]) {
  return values
          .map(value => toSqlValue(value))
          .join();
}
