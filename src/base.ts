import { MysqlOpt, WhereObjectOption, AnyObject, WhereOptions } from "./type";
import { typeOf, humpToUnline, isEmpty } from '@gas0324/util';

export class Base{

  protected opt: Partial<MysqlOpt> = {
    field: '*',
    data: {},
  }

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
  field(field: string = '*') {
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
  where(where: WhereOptions) {
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
   * @param {WhereOptions} where [description]
   */
  getWhere(where: WhereOptions = this.opt.where) {

    let andArr: string[] = [], params: any[] = [];

    (function _setWhere(where: WhereOptions){
      const type = typeOf(where);
      if(type == 'string') {
        andArr.push(where as string);
      } else if(type == 'object') {
        const { _mode: mode = 'base', ...otherWhere } = where as WhereObjectOption;

        let keys = Object.keys(otherWhere);
        if (keys.length){
          // 基础模式：{xxx:xxx} xxx = xxx
          if(mode == 'base'){
            keys.forEach(key => {
              if(isEmpty(otherWhere[key])){
                return;
              }
              andArr.push(`${humpToUnline(key)} = ?`);
              params.push(otherWhere[key]);
            });
          }else{
            //正常模式 {name: 'xxx', value: 'xxx', operator: 'in'} 转换为 xxx in (xxx)
            if(isEmpty(otherWhere.value)){
              return;
            }
            if(typeOf(otherWhere.name) == 'array'){
              let _orArr: string[] = [], _orParams: any[] = [];
              (<string[]>otherWhere.name).forEach( name => {
                const { where: _whereStr, params: _params} = _getNormalWhere({
                  name: name,
                  operator: otherWhere.operator,
                  value: otherWhere.value
                });
                _orArr.push(_whereStr);
                _orParams.push(..._params);
              })
              andArr.push(`(${_orArr.join(' or ')})`);
              params.push(..._orParams);
            }else{
              const { where: _whereStr, params: _params} = _getNormalWhere({
                name: otherWhere.name as string,
                operator: otherWhere.operator,
                value: otherWhere.value
              });
              andArr.push(_whereStr);
              params.push(..._params);
            }
          }
        }
      } else if(type == 'array') {
        (where as Array<WhereOptions>).map(subwhere => {
          _setWhere(subwhere as WhereObjectOption);
        })
      }
    })(where);

    function _getNormalWhere({name, value, operator}: {name: string, value: any, operator: string}){
      name = humpToUnline(name);
      let where: string, params: any[];
      switch (operator) {
        case 'like':
          where = `${name} like ?`;
          params = [`%${value}%`];
          break;
        case 'in':
          where = `${name} in (${value.map( _ => '?').join()})`;
          params = value;
          break;
        default:
          where = `${name} = ?`;
          params = [value];
          break;
      }
      return {
        where,
        params
      };
    }

    let whereStr = '';

    if(andArr.length){
      whereStr = 'where ' + andArr.join(' and ');
    }

    return {
      whereStr,
      params
    }
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
        sql = `insert into ${table} (${keys.map(key => `\`${humpToUnline(key)}\``).join(',')}) values (${keys.map(_ => '?').join()})`;
        params = params.concat(values);
        break;
      case 'delete':
        sql = `delete from ${table} ${whereStr}`;
        break;
      case 'update':
        keys = Object.keys(data);
        sql = `update ${table} set ${keys.map(key => `\`${humpToUnline(key)}\` = ?`)} ${whereStr}`;
        params =  keys.map( key =>  data[key]).concat(params);
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
    }
  }

}