import { PoolOptions } from "mysql2";

export interface MysqlConfig extends PoolOptions{
  prefix: string;
}


export interface MysqlOpt{
  table: string;
  field: string;
  where: WhereOptions;
  order: string;
  data: AnyObject;
  limit: number;
  offset: number;
}

export interface AnyObject {
  [props:string]: any;
}

export interface WhereObjectOption extends AnyObject {
  name?: string | string[];
  operator?: string;
  value?: any;
  _mode?: string;
}

export type WhereOptions = string | WhereObjectOption | Array<WhereOptions>;