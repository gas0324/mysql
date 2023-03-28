import { PoolOptions } from "mysql2";

export interface MysqlConfig extends PoolOptions{
  prefix: string;
}


export interface MysqlOpt{
  table: string;
  field: string;
  where: string | WhereObjectOption | Array<WhereObjectOption | string>;
  order: string;
  data: AnyObject;
  limit: number;
  offset: number;
}


export interface WhereObjectOption extends AnyObject {
  name?: string;
  operator?: 'like' | 'in' | '=' | '<' | '<=' | '>' | '>='| '<>';
  value?: any;
  _mode?: 'base' | 'normal';
}

export interface AnyObject {
  [props:string]: any;
}