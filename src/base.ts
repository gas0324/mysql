import { MysqlOpt, WhereObjectOption, AnyObject } from "./type";
import { typeOf, humpToUnline } from '@gas0324/utils';
import { toSqlValue, sqlJoin } from './util';
import { MysqlError } from "./mysql-error";

export class Base{

  protected opt: Partial<MysqlOpt> = {
    field: '*',
    data: {},
  };

  constructor(table?: string) {
    this.opt.table = table;
  }


  /**
   * 表名
   * @param {string} table 表名
   */
  table(table: string) {
    this.opt.table = table;
    return this;
  }


  /**
   * 联合查询
   * @param {string}     table 表名
   * @param {'inner' | 'left' | 'right' = 'inner'} way 连接方式
   */
  join(table: string, way: 'inner' | 'left' | 'right' = 'inner') {
    this.opt.table += ` ${way} join ${table}`;
    return this;
  }


  /**
   * 查询字段
   * @param {string} field 查询字段
   */
  field(field: string) {
    this.opt.field = field;
    return this;
  }


  /**
   * 插入/修改数据
   * @param {AnyObject} data 数据
   */
  data(data: AnyObject) {
    this.opt.data = data;
    return this;
  }


  /**
   * where条件
   * @param {string | Array<WhereObjectOption | string> | WhereObjectOption} where 条件
   */
  where(where: string | Array<WhereObjectOption | string> | WhereObjectOption) {
    this.opt.where = where;
    return this;
  }


  /**
   * 排序
   * @param {string} order 排序条件
   */
  order(order: string) {
    this.opt.order = order;
    return this;
  }


  /**
   * 行数
   * @param {number} limit 行数
   */
  limit(limit: number) {
    this.opt.limit = limit;
    return this;
  }


  /**
   * 分页
   * @param {number}    pageIndex 页码
   * @param {number = 0}  pageSize 每页条数
   */
  pager(pageIndex: number, pageSize: number = 0) {
    this.opt.limit = pageSize;
    this.opt.offset = pageIndex * pageSize - pageSize;
    return this;
  }


  /**
   * 获取where
   * @param {string | Array<WhereObjectOption | string> | WhereObjectOption} where [description]
   */
  getWhere(where: string | Array<WhereObjectOption | string> | WhereObjectOption = this.opt.where) {
    const type = typeOf(where);
    let whereStr = '', params: string[] = [];

    function _setWhere(where: WhereObjectOption){

      const { _mode: mode = 'base', ...otherWhere } = where;

      let keys = Object.keys(otherWhere);
      if (keys.length){
        // 基础模式：{xxx:xxx} xxx = xxx
        if(mode == 'base'){
          whereStr += keys.map(key => {
            params.push(toSqlValue(otherWhere[key]));
            return `${humpToUnline(key)} = ?`
          })
          .join(' and ');
        }else{
          //正常模式 {name: 'xxx', value: 'xxx', operator: 'in'} 转换为 xxx in (xxx)
          otherWhere.name = humpToUnline(otherWhere.name);
          if(!otherWhere.value){
            throw new MysqlError(`value不存在，where: ${JSON.stringify(where)}`, '106');
          };
          switch (otherWhere.operator) {
            case 'like':
              whereStr += ` and ${otherWhere.name} like '%?%'`;
              params.push(`%${otherWhere.value}%`);
              break;
            case 'in':
              whereStr += ` and ${otherWhere.name} in (${otherWhere.value.map( (_: any) => '?').join()})`;
              params = params.concat(otherWhere.value);
              otherWhere.value.map(val => toSqlValue(val))
              break;
            default:
              whereStr += ` and ${otherWhere.name} = ?`;
              params.push(toSqlValue(otherWhere.value));
              break;
          }
        }
      }
    }

    if(type == 'string') {
      whereStr += `where ${where}`;
    } else if(type == 'object') {
      whereStr = 'where ';
      _setWhere(where as WhereObjectOption);
    } else if(type == 'array') {
      (where as Array<WhereObjectOption | string>).map(subwhere => {
        whereStr += 'where 1=1';
        if(typeOf(subwhere) == 'string'){
          whereStr += `and ${subwhere}`;
        }else{
          _setWhere(subwhere as WhereObjectOption);
        }
      })
    }

    return {
      whereStr,
      params
    };
  }


  makeSql(type?: string){
    const { table, data, field = '*', where, limit, order, offset } = this.opt;

    this.opt.field = '*';
    this.opt.where = null;
    this.opt.data = {};
    this.opt.order = '';
    this.opt.limit = null;
    this.opt.offset = null;

    let sql: string, { whereStr, params } = this.getWhere(where), keys: string[];

    switch(type){
      case 'insert':
        keys = Object.keys(data);
        let values = keys.map(key => data[key]);
        sql = `insert into ${table} (${keys.map(key => `\`${humpToUnline(key)}\``).join(',')}) values (${sqlJoin(values)})`;
        break;
      case 'delete':
        sql = `delete from ${table} ${whereStr}`;
        break;
      case 'update':
        keys = Object.keys(data);
        sql = `update ${table} set ${keys.map(key => `\`${humpToUnline(key)}\` = ${toSqlValue(data[key])}`)} ${whereStr}`;
        break;
      case 'count':
        sql = `select count(*) as total from ${table} ${whereStr}`;
        break;
      default:
        sql = `select ${field} from ${table} ${whereStr}`;
        if(limit) {
          sql += ` limit ${limit}`;
          if(offset) {
            sql += ` offset ${offset}`
          }
        }
        if(order) {
          sql += ` order by ${order}`;
        }
        break;

    }
    return {
      sql,
      params
    };
  }

}