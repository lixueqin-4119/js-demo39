var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
    console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
    process.exit(1)
}

var server = http.createServer(function (request, response) {
    var parsedUrl = url.parse(request.url, true)
    var pathWithQuery = request.url
    var queryString = ''
    if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
    var path = parsedUrl.pathname
    var query = parsedUrl.query
    var method = request.method

    /******** 从这里开始看，上面不要看 ************/
    console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)

    if (path === '/sign_in' && method === 'POST') {
        const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
        const array = []
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on('end', () => {
            const string = Buffer.concat(array).toString()
            const obj = JSON.parse(string)
            const user = userArray.find(user => user.name === obj.name && user.password === obj.password)
            if (user === undefined) {
                response.statusCode = 400
                response.setHeader('Content-Type', 'text/json;charset=UTF-8')
                response.end(`{"errorCode":4001}`)
            } else {
                response.statusCode = 200;
                response.setHeader("Set-Cookie", `user_id=${user.id}; HttpOnly`);
                response.end();
            }
        })
    } else if (path === '/home.html') {
        const cookie = request.headers["cookie"]
        console.log(cookie)
        let userId
        try {//没有userId可能会报错
            userId = cookie.split(';').filter(s => s.indexOf('user_id=') >= 0)[0].split('=')[1]
        } catch (error) { }
        if (userId) {
            const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
            const user = userArray.find(user => user.id.toString() === userId)
            const homeHtml = fs.readFileSync('./public/home.html').toString()

            let string
            if (user) {
                string = homeHtml.replace('{{loginStatus}}', '已登陆').replace('{{user.name}}', user.name)
            } else {
            }
            response.write(string)
            response.end()
        } else {
            const homeHtml = fs.readFileSync('./public/home.html').toString()
            const string = homeHtml.replace('{{loginStatus}}', '未登陆').replace('{{user.name}}', '')
            response.write(string)
            response.end()
        }
    } else if (path === '/register' && method === "POST") {
        response.setHeader('Content-Type', 'text/html;charset=UTF-8')
        const userArray = JSON.parse(fs.readFileSync('./db/users.json').toString())
        const array = []
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on('end', () => {
            console.log(array)
            const string = Buffer.concat(array).toString()
            console.log(string)
            const obj = JSON.parse(string) //js、node.js浏览器都有JSON
            console.log(obj.name)
            console.log(obj.password)
            const lastUser = userArray[userArray.length - 1]
            const newUser = {
                //id为最后一个用户的id+1
                id: lastUser ? lastUser.id + 1 : 1,
                name: obj.name,
                password: obj.password
            }
            userArray.push(newUser)
            fs.writeFileSync('./db/users.json', JSON.stringify(userArray))
            response.end()
        })
    } else {
        response.statusCode = 200
        //默认首页
        const filePath = path === '/' ? '/index.html' : path
        console.log(filePath.lastIndexOf('.'))
        const index = filePath.lastIndexOf('.')
        const suffix = filePath.substring(index) //suffix后缀
        const fileType = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg'
        }
        response.setHeader('Content-Type', `${fileType[suffix] || 'text/html'};charset=utf-8`)

        let content
        try {
            content = fs.readFileSync(`./public${filePath}`)
        } catch (error) {
            content = '文件不存在'
            response.statusCode = 404
        }
        response.write(content)
        response.end()
    }
    /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)