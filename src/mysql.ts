import { unlineToHump } from '@gas0324/util';
import { createPool, OkPacket, Pool, RowDataPacket } from 'mysql2/promise';
import { Base } from './base';
import { MysqlError } from './mysql-error';
import { MysqlConfig } from './type';
import { logger } from './logger';

let pool: Pool, prefix: string;
export class Mysql extends Base{

  constructor(table?: string){
    super(table);
  }


  /**
   * 查询单条
   */
  async find() {
    this.limit(1);
    const { where } = this.opt;
    const data = await this.select();
    if(!data.length)
      throw new MysqlError(`查询的内容不存在, where: ${JSON.stringify(where)}`, '101');

    return data[0];
  }


  /**
   * 查询行数
   */
  async count() {
    let {sql, params} = this.makeSql('count');
    const data = await this.query(sql, params);
    return data.length ? (data[0] as any).total : 0;
  }


  /**
   * 列表查询
   */
  async select() {
    let {sql, params} = this.makeSql();
    return this.query(sql, params);
  }


  /**
   * 插入
   */
  async insert() {
    const { data } = this.opt;
    let keys = Object.keys(data!);
    if(!keys.length){
      throw new MysqlError('插入的数据为空', '102');
    }
    let {sql, params} = this.makeSql('insert');
    const result = await this.execute(sql, params);
    return {
      insertId: (<OkPacket>result).insertId
    };
  }


  /**
   * 更新
   */
  async update(){
    const { data, where } = this.opt;
    let keys = Object.keys(data);
    if(!keys.length){
      throw new MysqlError('更新的数据为空', '103');
    }
    let {sql, params} = this.makeSql('update');
    const result = await this.execute(sql, params) as OkPacket;
    if(result.affectedRows == 0)
      throw new MysqlError(`更新的内容不存在, where: ${JSON.stringify(where)}`, '104');

    return {
      rows: result.affectedRows
    };

  }


  /**
   * 删除
   */
  async delete(){
    const { where } = this.opt;
    let {sql, params} = this.makeSql('delete');
    const result = await this.execute(sql, params) as OkPacket;
    if(result.affectedRows == 0)
      throw new MysqlError(`删除的内容不存在, where: ${JSON.stringify(where)}`, '105');

    return {
      rows: result.affectedRows
    };
  }


  /**
   * 数据库查询
   * @param {string} sql    sql语句
   * @param {array} params =  参数
   */
  async query(sql: string, params: Array<any> = []) {
    const pool = this.getPool();
    sql = this.filterSql(sql);

    if(!sql) return [];
    logger.info(sql, params);
    const [rows, fields] = await pool.query(sql, params);
    const keys = fields.map(fiedlPacket => {
      return {
        name: fiedlPacket.name,
        to: unlineToHump(fiedlPacket.name)
      }
    });

    const result = (<RowDataPacket[]>rows).map(item => {
        const obj: any = {};
        keys.forEach(({ to, name }) => {
          obj[to] = item[name];
        })
        return obj;
      });
    return result

  }


  /**
   * 数据库执行
   * @param {string} sql [description]
   */
  async execute(sql: string, params: Array<any> = []) {
    const pool = this.getPool();
    sql = this.filterSql(sql);
    logger.info(sql, params);
    // const [rows, field] = await pool.execute(sql, params);
    const [rows] = await pool.execute(sql, params);
    return rows
  }


  /**
   * 事务
   * @param {{sql: string, params?: any[]}[]} params sql:SQL语句 params: 参数数组
   */
  async transaction(params: Array<{sql: string, params?: any[]}>){
    const conn = await this.getConnection();
    await conn.beginTransaction();

    try {
      await conn.beginTransaction();
      const queryPromises:unknown[] = [];

      params.forEach((query) => {
        let { sql, params:_params = []} = query;
        logger.info(sql, _params);
        sql = this.filterSql(sql);
        queryPromises.push(conn.execute(sql, _params));
      })
      const results = await Promise.all(queryPromises);
      await conn.commit();
      return results.map(item => item[0])
    } catch (err) {
      await conn.rollback();
      return Promise.reject(err)
    } finally{
      conn.release();
    }

  }


  /**
   * sql过滤
   * @param {string} sql sql语句
   */
  filterSql(sql: string){
    return sql.trim().replace(/{pre}/g, prefix);
  }


  /**
   * 获取连接池
   */
  getPool(){
    if(pool){
      return pool;
    }else{
      throw new MysqlError('未初始化连接', '100')
    }
  }


  /**
   * 获取连接
   */
  getConnection(){
    return this.getPool().getConnection();
  }

}

/**
 * 初始化连接池
 * @type {MysqlConfig} 配置项
 */
export const init = (config: MysqlConfig) => {
  const { prefix: _prefix, ...poolOptions } = config;
  prefix = _prefix;

  pool = createPool(poolOptions);
}

export const mysql = new Mysql();