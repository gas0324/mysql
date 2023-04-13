# mysql

>适用于Node.js的MySQL生成器，项目基于[mysql2](https://github.com/sidorares/node-mysql2)，支持链式调用，请注意：本项目自动处理下划线与小驼峰命名方式的转换

__目录__

- [安装](#安装)
- [使用](#使用)
- [方法](#方法)
- [日志](#日志)
- [其他](#其他)
- [反馈](#反馈)
- [赞助](#赞助)
- [参考资料](#参考资料)


## 安装

``` cmd
npm install --save @gas0324/mysql mysql2
```


## 使用

```js
import { init, mysql, Mysql } from '@gas0324/mysql';
init({
  prefix: 'as_',  // 表前缀
  host: 'localhost',
  user: 'root',
  database: 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
  // 其他创建mysql2连接池的参数
});
// 方式一
mysql.table('{pre}menu').filed('id, name, parent_id').select();
// sql: select id, name, parent_id from as_menu

// 方式二
new Mysql('{pre}menu').filed('id, name, parent_id').select();
// sql: select id, name, parent_id from as_menu

// 以上查询返回结果 
[
  {
    id: 1,
    title: '菜单标题',
    parentId: null
  },{
    id: 2,
    title: '子菜单',
    parentId: 1
  }
  // ...
]

// PS: 两种方式结果完全相同, 注意field中的'parent_id' 与查询结果中的'parentId'会自动转换 
```


## 方法

> 使用下面的方法后，可直接链式调用本项目的其它方法

| 方法名        | 说明          | 参数                                                   |
| :-:           | :-:           | :-:                                                    |
| table         | 表名          | (table: string)                                        |
| field         | 查询字段      | (field?: string)                                       |
| join          | 联合查询      | (table: string, way?: 'inner/left/right)               |
| data          | 插入/修改数据 | (data: Object)                                         |
| where         | 条件          | [(where: WhereOptions)](#where参数)                                  |
| order         | 排序          | (order: string)                                        |
| limit         | 行数          | (limit: number)                                        |
| pager         | 分页          | (pageIndex: number, pageSize?: number): 页码、每页条数 |

> 使用下面的方法后，不可以继续使用链式方式调用本项目的其它方法

| 方法名        | 说明             | 参数                                                           |
| :-:           | :-:              | :-:                                                            |
| init          | 初始化数据库链接 | 参考: [使用](#使用)                                            |
| find          | 数据库查询-单条  | -                                                              |
| select        | 数据库查询-列表  | -                                                              |
| count         | 数据库查询-行数  | -                                                              |
| insert        | 数据库执行-插入  | -                                                              |
| update        | 数据库执行-更新  | -                                                              |
| delete        | 数据库执行-删除  | -                                                              |
| makeSql       | 生成sql语句      | (type?: string): type可为：'select/insert/update/delete/count' |
| getPool       | 获取连接池       | -                                                              |
| getConnection | 获取链接         | -                                                              |

### where参数

```js
// string
mysql.table('menu').where('parent_id = 1 or parent_id = 2').select();
// sql: select * from menu where parent_id = 1 or parent_id = 2;

// object: 基础模式
mysql.table('menu').where({parentId: 1, status: true}).select();
// sql: select * from menu where parent_id = 1 and status = true;

// object: 普通模式
mysql.table('menu').where({name: 'parent_id', value: [1,2], operator: 'in', _mode: 'normal'}).select();
// sql: select * from menu where parent_id in (1,2);
 
// 数组：多个条件
mysql.table('menu').where(
  {name: 'parent_id', value: [1,2], operator: 'in', _mode: 'normal'},
  {name: 'name', value: '标题', operator: 'like', _mode: 'normal'}
  ).select();
// sql: select * from menu where parent_id in (1,2) and name like '%标题%';

// 混合
mysql.table('menu').where(
  '(parent_id = 1 or parent_id = 2)',
  {status: true},
  {name: 'name', value: '标题', operator: 'like', _mode: 'normal'}
  ).select();
// sql: select * from menu where (parent_id = 1 and status = true) and status = ture and name like '%标题%';
```


## 日志

```cmd
npm install --save log4js
```
```js
import * as log4js from "log4js";

log4js.configure({
  appenders: {
    mysql: { type: "file", filename: "log/mysql.log" },
    other: { type: "file", filename: "log/other.log" }
  },
  categories: {
    mysql: { appenders: ["mysql"], level: "trace" },
    default: { appenders: ['other'], level: "trace" }
  },
});
```


## 其他

如果你需要更复杂的sql语句，使用本项目无法生成，也可以直接使用[mysql2](https://github.com/sidorares/node-mysql2)
```js
// 使用连接池
import { mysql } from '@gas0324/mysql';
asd
const pool = mysql.getPool();
pool.query("SELECT field FROM atable", function(err, rows, fields) {
   // ...
});

// 或者使用链接
const conn = await mysql.getConnection();
conn.query(
  'SELECT * FROM `table` WHERE `name` = "Page" AND `age` > 45',
  function(err, results, fields) {
    console.log(results); // 结果集
    console.log(fields); // 额外的元数据（如果有的话）
  }
);
```


## 反馈

> 您拥有任何建议或想法，可以通过`issues`进行反馈


## 赞助

<img src="https://github.com/gas0324/mysql/blob/master/static/images/alipay.png" alt="支付宝" width="300px"/><img src="https://github.com/gas0324/mysql/blob/master/static/images/weichat.png" alt="微信" width="300px"/>


## 参考资料

* canphp
* [mysqls](https://github.com/wangweianger/mysqls)