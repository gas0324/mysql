import { logger } from './logger';

export class MysqlError extends Error {

  protected code: string;

  /**
   * 构造函数
   * @param {string} message 错误内容
   * @param {string} code    错误代码
   */
  constructor(message: string, code?: string){
    super(message);
    this.code = code;
    logger.warn(message, code);
  }


  getCode(){
    return this.code;
  }
}